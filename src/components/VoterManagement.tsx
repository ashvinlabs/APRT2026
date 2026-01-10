'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    Users,
    Search,
    UserPlus,
    FileUp,
    CheckCircle2,
    XCircle,
    Loader2,
    Filter,
    UserCircle,
    Printer,
    MapPin,
    CreditCard,
    Info,
    Download,
    Trash2,
    Cloud,
    ExternalLink,
    Pencil
} from 'lucide-react';
import VoterImport from './VoterImport';
import GoogleSyncModal from './GoogleSyncModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useUser } from './UserContext';

interface Voter {
    id: string;
    name: string;
    nik: string;
    address: string;
    is_present: boolean;
    invitation_code: string;
}

export default function VoterManagement() {
    const router = useRouter();
    const { user, hasPermission, isLoading: userLoading } = useUser();
    const [voters, setVoters] = useState<Voter[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [newVoter, setNewVoter] = useState({ name: '', nik: '', address: '' });
    const [editingVoter, setEditingVoter] = useState<Voter | null>(null);
    const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);

    // Determine if user can see full data (for privacy masking)
    const canSeeFullData = user ? hasPermission('manage_voters') : false;

    useEffect(() => {
        setMounted(true);
        fetchVoters();
        fetchSettings();

        // Real-time listener for settings
        const sub = supabase
            .channel('voters_settings')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: 'id=eq.election_config' }, (payload: any) => {
                if (payload.new?.value) {
                    setIsRegistrationOpen(payload.new.value.is_registration_open !== false);
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(sub); };
    }, []);

    async function fetchSettings() {
        const { data } = await supabase
            .from('settings')
            .select('value')
            .eq('id', 'election_config')
            .single();

        if (data?.value) {
            setIsRegistrationOpen(data.value.is_registration_open !== false);
        }
    }

    async function fetchVoters() {
        setLoading(true);
        const { data, error } = await supabase
            .from('voters')
            .select('*')
            .order('display_order', { ascending: true });

        if (!error) {
            setVoters(data || []);
        }
        setLoading(false);
    }

    async function deleteVoter(voterId: string, name: string) {
        if (!confirm(`Apakah Anda yakin ingin menghapus data warga "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return;

        const { error } = await supabase
            .from('voters')
            .delete()
            .eq('id', voterId);

        if (error) {
            alert('Gagal menghapus data: ' + error.message);
        } else {
            setVoters(voters.filter(v => v.id !== voterId));
        }
    }

    async function togglePresence(voterId: string, currentStatus: boolean) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('voters')
            .update({ is_present: !currentStatus })
            .eq('id', voterId);

        if (!error) {
            // Update local state
            setVoters(voters.map(v => v.id === voterId ? { ...v, is_present: !currentStatus } : v));

            // Audit log
            await supabase.from('audit_logs').insert({
                action: !currentStatus ? 'check-in' : 'uncheck-in',
                staff_id: user.id,
                voter_id: voterId
            });
        }
    }

    async function handleAddVoter(e: React.FormEvent) {
        e.preventDefault();
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { error } = await supabase.from('voters').insert([{
            ...newVoter,
            invitation_code: code
        }]);

        if (!error) {
            setIsAddModalOpen(false);
            setNewVoter({ name: '', nik: '', address: '' });
            fetchVoters();
        }
    }

    async function handleEditVoter(e: React.FormEvent) {
        e.preventDefault();
        if (!editingVoter) return;

        const { error } = await supabase
            .from('voters')
            .update({
                name: editingVoter.name,
                address: editingVoter.address
            })
            .eq('id', editingVoter.id);

        if (error) {
            alert('Gagal mengupdate data: ' + error.message);
        } else {
            setIsEditModalOpen(false);
            setEditingVoter(null);
            fetchVoters();
        }
    }

    const exportToCSV = () => {
        const headers = ['Nama', 'NIK', 'Alamat', 'Kode Undangan', 'Kehadiran', 'Waktu Hadir'];
        const csvContent = [
            headers.join(','),
            ...voters.map(v => [
                `"${v.name}"`,
                `"${v.nik || ''}"`,
                `"${v.address || ''}"`,
                `"${v.invitation_code}"`,
                v.is_present ? 'Hadir' : 'Belum Hadir',
                v.is_present ? (v as any).present_at : ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `daftar_pemilih_aprt2026_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatNIK = (nik: string | undefined) => {
        if (!nik) return 'NIK tidak terdaftar';
        if (canSeeFullData) return nik;
        if (nik.length < 5) return '***';
        return `${nik.slice(0, 3)}********${nik.slice(-2)}`;
    };

    const filteredVoters = voters.filter(v =>
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.nik?.includes(search) ||
        v.invitation_code?.toLowerCase().includes(search.toLowerCase())
    );

    // Only wait for user loading if we're actually checking authentication
    // For public access, we can render immediately
    if (!mounted) return null;

    return (
        <div className="p-8 max-w-[1400px] mx-auto animate-fade-in" suppressHydrationWarning>
            {/* Page Header */}
            <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 pb-8 border-b border-slate-200">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        {user ? 'Manajemen ' : 'Daftar '}
                        <span className="text-primary">Pemilih</span>
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">
                        {user
                            ? 'Kelola data DPT, verifikasi kehadiran, dan cetak undangan warga.'
                            : 'Lihat Daftar Pemilih Tetap (DPT) Pemilu RT 12 Pelem Kidul.'}
                    </p>
                </div>
                <div className="flex gap-3">
                    {user && (
                        <Button variant="outline" onClick={() => setIsSyncModalOpen(true)} className="rounded-2xl h-12 px-6 font-bold shadow-sm hover:bg-slate-50 transition-all border-slate-200">
                            <Cloud className="mr-2 h-5 w-5 text-blue-500" />
                            Google Sheets
                        </Button>
                    )}
                    {user && (
                        <Button variant="outline" onClick={exportToCSV} className="rounded-2xl h-12 px-6 font-bold shadow-sm hover:bg-slate-50 transition-all border-slate-200">
                            <Download className="mr-2 h-5 w-5 text-emerald-500" />
                            Export CSV
                        </Button>
                    )}
                    {user && (hasPermission('manage_voters') || hasPermission('edit_voters')) && (
                        <>
                            <Button variant="outline" onClick={() => setIsImportModalOpen(true)} className="rounded-2xl h-12 px-6 font-bold shadow-sm hover:bg-slate-50 transition-all border-slate-200">
                                <FileUp className="mr-2 h-5 w-5 text-indigo-500" />
                                Import CSV
                            </Button>
                            <Button onClick={() => setIsAddModalOpen(true)} className="rounded-2xl h-12 px-6 font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
                                <UserPlus className="mr-2 h-5 w-5" />
                                Tambah Manual
                            </Button>
                        </>
                    )}
                </div>
            </header>

            {/* Quick Stats & Search */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
                <Card className="lg:col-span-3 border-none bg-white shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden ring-1 ring-slate-100">
                    <CardContent className="p-4">
                        <div className="relative flex items-center group">
                            <Search className="absolute left-4 text-slate-400 group-focus-within:text-primary transition-colors" size={24} />
                            <Input
                                placeholder="Cari nama, NIK, atau kode undangan..."
                                className="pl-14 h-16 text-lg font-medium border-none focus-visible:ring-0 bg-transparent placeholder:text-slate-300"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <div className="absolute right-4 flex items-center gap-2">
                                <Badge variant="secondary" className="px-3 py-1 bg-slate-100 text-slate-500 font-bold border-none">
                                    {filteredVoters.length} Hasil
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none bg-primary text-white shadow-xl shadow-primary/20 rounded-3xl group transition-all hover:scale-[1.02]">
                    <CardContent className="p-6 flex flex-col justify-center h-full">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">Kehadiran (Check-in)</p>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-black leading-none">{voters.filter(v => v.is_present).length}</span>
                            <span className="text-lg font-black opacity-50 mb-0.5">/ {voters.length}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Voters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="animate-spin text-primary" size={48} />
                        <p className="text-slate-400 font-black tracking-widest uppercase text-sm">Loading Voter Data...</p>
                    </div>
                ) : filteredVoters.map((voter) => (
                    <Card key={voter.id} className={cn(
                        "group border-none shadow-xl shadow-slate-200/30 rounded-3xl overflow-hidden transition-all duration-400 hover-premium bg-white ring-1 ring-slate-100",
                        voter.is_present && "ring-2 ring-emerald-500/10 shadow-emerald-100"
                    )}>
                        <CardContent className="p-0">
                            {/* Card Top Border Accent */}
                            <div className={cn(
                                "h-2 w-full",
                                voter.is_present ? "bg-gradient-to-r from-emerald-400 to-teal-500" : "bg-slate-100"
                            )} />

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                                            voter.is_present ? "bg-emerald-50 text-emerald-600 rotate-6 scale-110" : "bg-slate-50 text-slate-300 group-hover:bg-primary/5 group-hover:text-primary"
                                        )}>
                                            <UserCircle size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 leading-tight mb-1">{voter.name}</h3>
                                            <div className="flex items-center gap-2 text-primary font-black text-xs tracking-wider uppercase">
                                                <CreditCard size={12} />
                                                <span>{voter.invitation_code}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {user && hasPermission('manage_voters') && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setEditingVoter(voter);
                                                        setIsEditModalOpen(true);
                                                    }}
                                                    className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Edit Warga"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => deleteVoter(voter.id, voter.name)}
                                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                    title="Hapus Warga"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                        <Badge className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ml-1",
                                            voter.is_present
                                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none animate-pulse"
                                                : "bg-slate-100 text-slate-400 hover:bg-slate-200 border-none"
                                        )}>
                                            {voter.is_present ? 'Hadir' : 'Belum Hadir'}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center gap-3 text-slate-500 text-sm font-bold">
                                        <span className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                            <Info size={14} />
                                        </span>
                                        <span className="font-mono tracking-tighter">{formatNIK(voter.nik)}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-400 text-xs font-bold italic">
                                        <span className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300">
                                            <MapPin size={14} />
                                        </span>
                                        <span>{canSeeFullData ? (voter.address || 'Alamat tidak tersedia') : '[Alamat Dirahasiakan]'}</span>
                                    </div>
                                </div>

                                {user && (
                                    <div className="grid grid-cols-2 gap-3">
                                        {isRegistrationOpen && (
                                            <Button
                                                variant={voter.is_present ? "outline" : "default"}
                                                disabled={voter.is_present && !hasPermission('manage_voters')} // Officers can't uncheck
                                                onClick={() => togglePresence(voter.id, voter.is_present)}
                                                className={cn(
                                                    "rounded-2xl font-black text-xs uppercase tracking-widest h-12 transition-all",
                                                    voter.is_present
                                                        ? "border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                                                        : "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 hover:scale-105",
                                                    voter.is_present && !hasPermission('manage_voters') && "opacity-50 cursor-not-allowed group-hover:opacity-50 grayscale"
                                                )}
                                            >
                                                {voter.is_present ? (
                                                    <><XCircle className="mr-2 h-4 w-4" /> Hadir</>
                                                ) : (
                                                    <><CheckCircle2 className="mr-2 h-4 w-4" /> Tandai Hadir</>
                                                )}
                                            </Button>
                                        )}
                                        {hasPermission('manage_invitations') ? (
                                            <Button
                                                variant="secondary"
                                                onClick={() => {
                                                    // Set search to exactly this NIK and redirect
                                                    router.push(`/panitia/invitations?nik=${voter.nik}`);
                                                }}
                                                className={cn(
                                                    "rounded-2xl border-none bg-slate-50 text-slate-500 font-black text-xs uppercase tracking-widest h-12 hover:bg-primary/10 hover:text-primary transition-all",
                                                    !isRegistrationOpen && "col-span-2"
                                                )}
                                            >
                                                <Printer className="mr-2 h-4 w-4" /> Undangan
                                            </Button>
                                        ) : (
                                            !voter.is_present && !isRegistrationOpen && (
                                                <div className="col-span-2 text-center text-[10px] font-bold text-slate-400 uppercase">Input ditutup</div>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {!loading && filteredVoters.length === 0 && (
                    <div className="col-span-full py-20 bg-white/50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-center">
                        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                            <Search size={40} />
                        </div>
                        <div>
                            <p className="text-xl font-black text-slate-700">Warga tidak ditemukan</p>
                            <p className="text-slate-400 font-medium">Coba gunakan kata kunci pencarian lain.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {isImportModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="w-full max-w-xl">
                        <VoterImport onComplete={() => { setIsImportModalOpen(false); fetchVoters(); }} />
                    </div>
                </div>
            )}

            {isEditModalOpen && editingVoter && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <Card className="w-full max-w-lg border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                        <header className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                <Pencil size={100} />
                            </div>
                            <h2 className="text-3xl font-black tracking-tight mb-1">Edit <span className="text-blue-200">Warga</span></h2>
                            <p className="text-blue-100/60 font-bold uppercase tracking-widest text-xs">Pembaruan Data DPT</p>
                        </header>
                        <form onSubmit={handleEditVoter} className="p-8 space-y-6 bg-white">
                            <div className="space-y-2">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nama Lengkap</p>
                                <Input
                                    required
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-bold text-lg focus-visible:ring-primary/20"
                                    value={editingVoter.name}
                                    onChange={e => setEditingVoter({ ...editingVoter, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2 opacity-60">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    NIK (Terkunci) <Info size={12} />
                                </p>
                                <Input
                                    disabled
                                    className="h-14 rounded-2xl bg-slate-100 border-slate-200 font-bold text-lg cursor-not-allowed"
                                    value={editingVoter.nik}
                                />
                                <p className="text-[10px] text-slate-400 italic">Untuk mengubah NIK, silakan hapus dan tambah ulang warga.</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Alamat Lengkap</p>
                                <Input
                                    required
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-bold text-lg focus-visible:ring-primary/20"
                                    value={editingVoter.address}
                                    onChange={e => setEditingVoter({ ...editingVoter, address: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <Button type="button" variant="ghost" onClick={() => { setIsEditModalOpen(false); setEditingVoter(null); }} className="flex-1 h-16 rounded-2xl font-black text-slate-400 hover:text-slate-600 transition-all">
                                    Batal
                                </Button>
                                <Button type="submit" className="flex-1 h-16 rounded-2xl font-black text-lg bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 hover:scale-[1.02] transition-all">
                                    Update Data
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <Card className="w-full max-w-lg border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                        <header className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                <UserPlus size={100} />
                            </div>
                            <h2 className="text-3xl font-black tracking-tight mb-1">Tambah <span className="text-blue-400">Manual</span></h2>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Pendaftaran Warga Baru</p>
                        </header>
                        <form onSubmit={handleAddVoter} className="p-8 space-y-6 bg-white">
                            <div className="space-y-2">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nama Lengkap</p>
                                <Input
                                    required
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-bold text-lg focus-visible:ring-primary/20"
                                    value={newVoter.name}
                                    onChange={e => setNewVoter({ ...newVoter, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nomor Induk Kependudukan (NIK)</p>
                                <Input
                                    required
                                    placeholder="16 digit angka"
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-bold text-lg focus-visible:ring-primary/20"
                                    value={newVoter.nik}
                                    onChange={e => setNewVoter({ ...newVoter, nik: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Alamat Lengkap</p>
                                <Input
                                    required
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-bold text-lg focus-visible:ring-primary/20"
                                    value={newVoter.address}
                                    onChange={e => setNewVoter({ ...newVoter, address: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)} className="flex-1 h-16 rounded-2xl font-black text-slate-400 hover:text-slate-600 transition-all">
                                    Batal
                                </Button>
                                <Button type="submit" className="flex-1 h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/25 hover:scale-[1.02] transition-all">
                                    Simpan Data
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
            {isSyncModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 py-8 md:py-20 overflow-y-auto animate-fade-in">
                    <GoogleSyncModal
                        voters={voters}
                        onClose={() => setIsSyncModalOpen(false)}
                    />
                </div>
            )}
        </div>
    );
}
