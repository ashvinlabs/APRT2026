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
    Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ElectionConfig {
    title: string;
    location: string;
    date: string;
    is_voting_open: boolean;
    is_registration_open?: boolean;
}

export default function SettingsManager() {
    const [config, setConfig] = useState<ElectionConfig>({
        title: 'Pemilihan Ketua RT 12',
        location: 'Pelem Kidul - Baturetno',
        date: new Date().toISOString().split('T')[0],
        is_voting_open: true,
        is_registration_open: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

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
                                Status: {config.is_voting_open ? 'Terbuka' : 'Tertutup'}
                            </Badge>
                            <p className="text-xs text-slate-400 font-medium max-w-[200px]">
                                {config.is_voting_open
                                    ? 'Panitia dapat menginput suara di halaman Hitung Suara.'
                                    : 'Semua tombol input suara akan dinonaktifkan di sistem.'}
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
        </div>
    );
}
