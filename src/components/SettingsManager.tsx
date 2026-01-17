'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Settings,
    Save,
    Lock,
    Unlock,
    Globe,
    MapPin,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    UserPlus,
    UserX,
    Calendar,
    Users,
    Trash2,
    Image as ImageIcon,
    Plus
} from 'lucide-react';
import { logActivity } from '@/lib/logger';

interface Candidate {
    id: string;
    name: string;
    photo_url: string | null;
    display_order: number;
}
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ElectionConfig {
    title: string;
    location: string;
    location_detail: string;
    date: string;
    start_time: string;
    end_time: string;
    is_voting_open: boolean;
    is_registration_open?: boolean;
}

export default function SettingsManager() {
    const [config, setConfig] = useState<ElectionConfig>({
        title: 'Pemilihan Ketua RT 12',
        location: 'Pelem Kidul - Baturetno',
        location_detail: 'Balai RT 12 (Rumah Bapak Ketua RT)',
        date: new Date().toISOString().split('T')[0],
        start_time: '08:00',
        end_time: '12:00',
        is_voting_open: true,
        is_registration_open: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [draggedItem, setDraggedItem] = useState<number | null>(null);

    useEffect(() => {
        fetchSettings();
        fetchCandidates();
    }, []);

    async function fetchCandidates() {
        const { data, error } = await supabase
            .from('candidates')
            .select('*')
            .order('display_order', { ascending: true });

        if (!error) setCandidates(data || []);
    }

    async function addCandidate() {
        const newCandidate = {
            name: 'Kandidat Baru',
            display_order: candidates.length + 1
        };
        const { data, error } = await supabase.from('candidates').insert(newCandidate).select();
        if (error) setMessage({ type: 'error', text: 'Gagal menambah kandidat: ' + error.message });
        else if (data) {
            setCandidates([...candidates, data[0]]);
            logActivity('add_candidate', 'manage_candidates', { detail: `Tambah Kandidat: ${newCandidate.name}` });
        }
    }

    async function updateCandidate(id: string, updates: Partial<Candidate>) {
        const { error } = await supabase.from('candidates').update(updates).eq('id', id);
        if (error) setMessage({ type: 'error', text: 'Gagal update kandidat: ' + error.message });
        else {
            setCandidates(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
            if (updates.name) {
                logActivity('update_candidate', 'manage_candidates', { detail: `Update Nama Kandidat: ${updates.name}` });
            }
        }
    }

    async function deleteCandidate(id: string) {
        if (!confirm('Hapus kandidat ini?')) return;
        const candidateName = candidates.find(c => c.id === id)?.name || 'Unknown';
        const { error } = await supabase.from('candidates').delete().eq('id', id);
        if (error) setMessage({ type: 'error', text: 'Gagal hapus kandidat: ' + error.message });
        else {
            setCandidates(candidates.filter(c => c.id !== id));
            logActivity('delete_candidate', 'manage_candidates', { detail: `Hapus Kandidat: ${candidateName}` });
        }
    }

    async function handlePhotoUpload(candidateId: string, file: File) {
        if (!file.type.startsWith('image/')) {
            alert('File harus berupa gambar.');
            return;
        }
        setSaving(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${candidateId}-${Math.random()}.${fileExt}`;
        const filePath = `photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('candidates')
            .upload(filePath, file);

        if (uploadError) {
            setMessage({ type: 'error', text: 'Gagal upload foto: ' + uploadError.message });
            setSaving(false);
            return;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('candidates')
            .getPublicUrl(filePath);

        await updateCandidate(candidateId, { photo_url: publicUrl + '?t=' + Date.now() });
        logActivity('upload_candidate_photo', 'manage_candidates', { detail: `Upload Foto Kandidat ID: ${candidateId}` });
        setSaving(false);
        fetchCandidates(); // Refresh to ensure everything is synced
    }

    // Drag & Drop Handling
    function handleDragStart(e: React.DragEvent, index: number) {
        setDraggedItem(index);
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragOver(e: React.DragEvent, index: number) {
        e.preventDefault();
        if (draggedItem === null || draggedItem === index) return;

        const items = [...candidates];
        const itemToMove = items[draggedItem];
        items.splice(draggedItem, 1);
        items.splice(index, 0, itemToMove);

        // Update display_order locally
        const updatedItems = items.map((item, idx) => ({
            ...item,
            display_order: idx + 1
        }));

        setCandidates(updatedItems);
        setDraggedItem(index);
    }

    async function handleDragEnd() {
        setDraggedItem(null);
        setSaving(true);
        // Persist all orders to database
        const updates = candidates.map((c, idx) =>
            supabase.from('candidates').update({ display_order: idx + 1 }).eq('id', c.id)
        );
        await Promise.all(updates);
        setSaving(false);
        setMessage({ type: 'success', text: 'Urutan kandidat disimpan!' });
        setTimeout(() => setMessage(null), 2000);
    }

    async function fetchSettings() {
        setLoading(true);
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .eq('id', 'election_config')
            .single();

        if (data && !error) {
            setConfig(data.value);
        }
        setLoading(false);
    }

    async function handleSave() {
        setSaving(true);
        setMessage(null);

        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase
            .from('settings')
            .upsert({
                id: 'election_config',
                value: config,
                updated_at: new Date().toISOString(),
                updated_by: user?.id
            });

        if (error) {
            setMessage({ type: 'error', text: 'Gagal menyimpan pengaturan: ' + error.message });
        } else {
            setMessage({ type: 'success', text: 'Pengaturan berhasil diperbarui!' });
            await logActivity('update_settings', 'manage_settings', { detail: 'Update Konfigurasi Pemilihan' });
            setTimeout(() => setMessage(null), 3000);
        }
        setSaving(false);
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <Loader2 className="animate-spin text-primary" size={48} />
            <p className="text-slate-400 font-black tracking-widest uppercase text-xs">Loading Settings...</p>
        </div>
    );

    return (
        <div className="p-8 max-w-4xl mx-auto animate-fade-in space-y-8 pb-20">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-200">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black tracking-widest uppercase mb-3">
                        <Settings size={12} /> System Configuration
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Pengaturan <span className="text-primary">Sistem</span></h1>
                    <p className="text-slate-500 font-medium mt-1">Sesuaikan informasi pemilihan dan kontrol akses voting.</p>
                </div>
                <Button
                    onClick={handleSave}
                    className="rounded-2xl h-14 px-8 font-black gap-2 shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                    disabled={saving}
                >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Simpan Perubahan
                </Button>
            </header>

            {message && (
                <div className={cn(
                    "p-4 rounded-[1.5rem] flex items-center gap-3 animate-fade-in border shadow-sm",
                    message.type === 'success'
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-rose-50 text-rose-700 border-rose-100"
                )}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                    <span className="font-bold">{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* General Info */}
                <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
                    <CardHeader className="p-8 border-b border-slate-50">
                        <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <Globe size={20} className="text-primary" />
                            Informasi Umum
                        </CardTitle>
                        <CardDescription>Nama pemilihan yang tampil di Dashboard.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Judul Pemilihan</label>
                            <Input
                                value={config.title}
                                onChange={e => setConfig({ ...config, title: e.target.value })}
                                className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold focus-visible:ring-primary/20"
                                placeholder="E.g. Pemilihan Ketua RT 12"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Lokasi / Wilayah</label>
                            <div className="relative">
                                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                <Input
                                    value={config.location}
                                    onChange={e => setConfig({ ...config, location: e.target.value })}
                                    className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-100 font-bold focus-visible:ring-primary/20"
                                    placeholder="E.g. Pelem Kidul - Baturetno"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tempat / Ruangan Detail</label>
                            <div className="relative">
                                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                <Input
                                    value={config.location_detail}
                                    onChange={e => setConfig({ ...config, location_detail: e.target.value })}
                                    className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-100 font-bold focus-visible:ring-primary/20"
                                    placeholder="E.g. Balai RT 12 (Rumah Bapak RT)"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tanggal Pemilihan</label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                <Input
                                    type="date"
                                    value={config.date}
                                    onChange={e => setConfig({ ...config, date: e.target.value })}
                                    className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-100 font-bold focus-visible:ring-primary/20"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Jam Mulai</label>
                                <Input
                                    type="time"
                                    value={config.start_time}
                                    onChange={e => setConfig({ ...config, start_time: e.target.value })}
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold focus-visible:ring-primary/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Jam Selesai</label>
                                <Input
                                    type="time"
                                    value={config.end_time}
                                    onChange={e => setConfig({ ...config, end_time: e.target.value })}
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold focus-visible:ring-primary/20"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Registration Control */}
                <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
                    <CardHeader className="p-8 border-b border-slate-50">
                        <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <UserPlus size={20} className="text-blue-500" />
                            Kontrol Pendaftaran
                        </CardTitle>
                        <CardDescription>Buka atau tutup meja pendaftaran/check-in.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 flex flex-col items-center justify-center gap-6 text-center">
                        <div className={cn(
                            "w-24 h-24 rounded-[2rem] flex items-center justify-center transition-all duration-500 shadow-2xl shadow-slate-200/50",
                            config.is_registration_open ? "bg-blue-50 text-blue-500" : "bg-slate-100 text-slate-400"
                        )}>
                            {config.is_registration_open ? <UserPlus size={48} /> : <UserX size={48} />}
                        </div>

                        <div>
                            <Badge variant="outline" className={cn(
                                "px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest border-2 mb-2",
                                config.is_registration_open ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-50 text-slate-500 border-slate-200"
                            )}>
                                Status: {config.is_registration_open ? 'Check-in Dibuka' : 'Check-in Ditutup'}
                            </Badge>
                            <p className="text-xs text-slate-400 font-medium max-w-[200px]">
                                {config.is_registration_open
                                    ? 'Pemilih dapat melakukan scanning QR Code untuk hadir.'
                                    : 'Scanning QR Code akan dinonaktifkan.'}
                            </p>
                        </div>

                        <Button
                            variant={config.is_registration_open ? "outline" : "default"}
                            onClick={() => setConfig({ ...config, is_registration_open: !config.is_registration_open })}
                            className={cn(
                                "w-full rounded-2xl h-14 font-black transition-all shadow-lg active:scale-95",
                                config.is_registration_open
                                    ? "bg-white text-slate-600 border-2 border-slate-100 hover:bg-slate-50 hover:border-slate-200"
                                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-100 text-white"
                            )}
                        >
                            {config.is_registration_open ? 'TUTUP PENDAFTARAN' : 'BUKA PENDAFTARAN'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Voting Control */}
                <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
                    <CardHeader className="p-8 border-b border-slate-50">
                        <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <Lock size={20} className="text-rose-500" />
                            Kontrol Voting
                        </CardTitle>
                        <CardDescription>Buka atau tutup akses input suara secara global.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 flex flex-col items-center justify-center gap-6 text-center">
                        <div className={cn(
                            "w-24 h-24 rounded-[2rem] flex items-center justify-center transition-all duration-500 shadow-2xl shadow-slate-200/50",
                            config.is_voting_open ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
                        )}>
                            {config.is_voting_open ? <Unlock size={48} /> : <Lock size={48} />}
                        </div>

                        <div>
                            <Badge variant="outline" className={cn(
                                "px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest border-2 mb-2",
                                config.is_voting_open ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                            )}>
                                Status: {config.is_voting_open ? 'Pemilihan Berjalan (Tally Terkunci)' : 'Tally Dibuka (Pemilihan Selesai)'}
                            </Badge>
                            <p className="text-xs text-slate-400 font-medium max-w-[200px]">
                                {config.is_voting_open
                                    ? 'Proses pemilihan sedang berlangsung. Input suara di halaman Tally dikunci.'
                                    : 'Halaman Tally dibuka. Panitia dapat mulai menghitung surat suara.'}
                            </p>
                        </div>

                        <Button
                            variant={config.is_voting_open ? "destructive" : "default"}
                            onClick={() => setConfig({ ...config, is_voting_open: !config.is_voting_open })}
                            className={cn(
                                "w-full rounded-2xl h-14 font-black transition-all shadow-lg active:scale-95",
                                config.is_voting_open
                                    ? "bg-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white shadow-rose-100"
                                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
                            )}
                        >
                            {config.is_voting_open ? 'TUTUP VOTING SEKARANG' : 'BUKA AKSES VOTING'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Candidate Management Section */}
                <Card className="col-span-full border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
                    <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                <Users size={28} className="text-indigo-500" />
                                Manajemen Kandidat
                            </CardTitle>
                            <CardDescription>Tambah, edit, atau hapus kandidat pemilihan.</CardDescription>
                        </div>
                        <Button onClick={addCandidate} className="rounded-xl font-bold gap-2">
                            <Plus size={18} />
                            Tambah Kandidat
                        </Button>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {candidates.map((candidate, index) => (
                                <div
                                    key={candidate.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                    className={cn(
                                        "relative group p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-primary/20 hover:bg-white hover:shadow-xl transition-all duration-300 cursor-move",
                                        draggedItem === index && "opacity-40 scale-95 border-primary border-2 dashed"
                                    )}
                                >
                                    <button
                                        onClick={() => deleteCandidate(candidate.id)}
                                        className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 transition-colors z-10"
                                    >
                                        <Trash2 size={20} />
                                    </button>

                                    <div className="flex flex-col items-center gap-6">
                                        <div className="relative w-32 h-44 rounded-2xl overflow-hidden shadow-lg border-4 border-white ring-1 ring-slate-200 group-hover:scale-105 transition-transform">
                                            {candidate.photo_url ? (
                                                <img src={candidate.photo_url} alt={candidate.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-300">
                                                    <ImageIcon size={32} />
                                                    <span className="text-[10px] font-black uppercase tracking-tighter mt-2">No Photo</span>
                                                </div>
                                            )}
                                            <label className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    hidden
                                                    onChange={(e) => e.target.files?.[0] && handlePhotoUpload(candidate.id, e.target.files[0])}
                                                />
                                                <span className="text-white text-[10px] font-black uppercase tracking-widest">Ganti Foto</span>
                                            </label>
                                        </div>

                                        <div className="w-full space-y-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                                                <Input
                                                    value={candidate.name}
                                                    onChange={(e) => {
                                                        const newName = e.target.value;
                                                        setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, name: newName } : c));
                                                    }}
                                                    onBlur={(e) => updateCandidate(candidate.id, { name: e.target.value })}
                                                    className="h-11 rounded-xl bg-white border-slate-200 font-bold focus-visible:ring-primary/20"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Urutan Tampil (No. Urut)</label>
                                                <Input
                                                    type="number"
                                                    value={candidate.display_order}
                                                    onChange={(e) => {
                                                        const newOrder = parseInt(e.target.value);
                                                        setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, display_order: newOrder } : c));
                                                    }}
                                                    onBlur={(e) => updateCandidate(candidate.id, { display_order: parseInt(e.target.value) })}
                                                    className="h-11 rounded-xl bg-white border-slate-200 font-bold focus-visible:ring-primary/20"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {candidates.length === 0 && (
                                <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">
                                    <Users size={48} className="opacity-20 mb-4" />
                                    <p className="font-bold">Belum ada kandidat yang terdaftar</p>
                                    <p className="text-xs">Klik "Tambah Kandidat" untuk mulai menjaring calon.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Warning Card */}
            {!config.is_voting_open && (
                <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-6 flex items-start gap-4 animate-in slide-in-from-bottom-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h4 className="font-black text-amber-900 uppercase text-xs tracking-widest mb-1">Peringatan Keamanan</h4>
                        <p className="text-sm text-amber-700 font-medium">
                            Menutup voting akan mencegah SEMUA input suara baru di seluruh terminal panitia.
                            Gunakan kontrol ini hanya jika waktu pemilihan telah resmi berakhir.
                        </p>
                    </div>
                </div>
            )}

            {/* DANGER ZONE - Only visible to Super Admin logically (secured by RPC) */}
            <Card className="border-none shadow-xl shadow-rose-100/50 rounded-[2.5rem] overflow-hidden bg-rose-50/50 ring-1 ring-rose-100 mt-12">
                <CardHeader className="p-8 border-b border-rose-100">
                    <CardTitle className="text-xl font-black text-rose-900 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-rose-600" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription className="text-rose-700/80">Tindakan destruktif yang tidak dapat dibatalkan.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-rose-100 shadow-sm">
                        <div>
                            <h4 className="font-bold text-slate-900 mb-1">Reset Data Pemilihan</h4>
                            <p className="text-sm text-slate-500 max-w-md">
                                Menghapus SEMUA Log Aktivitas, Riwayat Voting, dan Reset Status Kehadiran Pemilih.
                                Data kandidat dan akun petugas TIDAK akan dihapus.
                            </p>
                        </div>
                        <Button
                            variant="destructive"
                            onClick={async () => {
                                if (confirm('⚠️ PERINGATAN KERAS: Aksi ini akan MENGHAPUS SEMUA SUARA dan LOG AKTIVITAS.\n\nApakah Anda YAKIN ingin mereset data pemilihan?')) {
                                    if (confirm('Konfirmasi terakhir: Data yang dihapus TIDAK DAPAT DIKEMBALIKAN. Lanjutkan?')) {
                                        setSaving(true);
                                        const { error } = await supabase.rpc('reset_election_data');
                                        setSaving(false);
                                        if (error) {
                                            setMessage({ type: 'error', text: 'Gagal reset data: ' + error.message });
                                        } else {
                                            setMessage({ type: 'success', text: 'Data pemilihan berhasil di-reset!' });
                                            // Optional: reload page to clear any cached states
                                            window.location.reload();
                                        }
                                    }
                                }
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-12 px-6 font-bold shadow-lg shadow-rose-200"
                        >
                            <Trash2 size={18} className="mr-2" />
                            Reset Data Pemilihan
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
