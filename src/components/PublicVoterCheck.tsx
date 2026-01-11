'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Loader2, CheckCircle2, User, MapPin, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PublicVoterCheck() {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (search.length < 3) return;

        setSearching(true);
        setHasSearched(true);

        const { data, error } = await supabase.rpc('search_voter_public', {
            p_search: search
        });

        if (!error) {
            setResults(data || []);
        } else {
            console.error('Search error:', error);
            setResults([]);
        }
        setSearching(false);
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary">
                    <Search size={40} />
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Cek <span className="text-primary">DPT Online</span></h1>
                <p className="text-slate-500 font-medium">Masukkan Nama atau Alamat Anda untuk verifikasi data pemilih.</p>
            </div>

            <form onSubmit={handleSearch} className="relative group mb-12">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <Search size={24} />
                </div>
                <Input
                    required
                    minLength={3}
                    placeholder="Contoh: Budi atau Gg. Elang"
                    className="pl-16 pr-32 h-20 text-xl font-bold rounded-[1.5rem] border-none bg-white shadow-2xl shadow-slate-200/50 focus-visible:ring-primary/20"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Button
                    type="submit"
                    disabled={searching || search.length < 3}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-14 rounded-2xl px-8 font-black shadow-xl shadow-primary/20"
                >
                    {searching ? <Loader2 className="animate-spin" /> : 'Cek Sekarang'}
                </Button>
            </form>

            <div className="space-y-6">
                {searching ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Loader2 className="animate-spin text-primary" size={32} />
                        <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Mencari di Database...</p>
                    </div>
                ) : hasSearched && results.length === 0 ? (
                    <Card className="border-none bg-rose-50 rounded-[2rem] p-8 text-center ring-1 ring-rose-100">
                        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-4">
                            <Info size={32} />
                        </div>
                        <h3 className="text-xl font-black text-rose-900 mb-2">Data Tidak Ditemukan</h3>
                        <p className="text-rose-700/70 font-medium">Mohon periksa kembali ejaan nama Anda atau hubungi panitia jika Anda belum terdaftar.</p>
                    </Card>
                ) : results.map((voter) => (
                    <Card key={voter.id} className="border-none bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/40 border border-slate-50 hover:scale-[1.02] transition-all">
                        <CardContent className="p-0 flex items-center justify-between gap-6">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 shadow-none hover:bg-emerald-50 pointer-events-none">
                                        <CheckCircle2 size={12} className="mr-1" /> TERDAFTAR
                                    </Badge>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {voter.invitation_code}</span>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight truncate">{voter.name}</h3>
                                <div className="flex items-center gap-4 mt-3">
                                    <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                                        <MapPin size={16} className="text-slate-300" />
                                        {voter.address}
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 font-bold text-sm border-l pl-4 border-slate-100">
                                        <User size={16} className="text-slate-300" />
                                        {voter.is_present ? (
                                            <span className="text-emerald-600">Terverifikasi Hadir</span>
                                        ) : (
                                            <span className="text-slate-400">Belum Hadir</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="hidden md:flex flex-col items-end gap-1 shrink-0">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Status Privacy</p>
                                <p className="text-xs font-black text-slate-400">NIK DISEMBUNYIKAN</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="mt-12 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-center">
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    <strong>Penting:</strong> Demi privasi, kami menyembunyikan NIK dan sebagian detail alamat warga.
                    Gunakan <strong>Kode Undangan</strong> atau <strong>KTP</strong> Anda saat datang ke TPS untuk check-in.
                </p>
            </div>
        </div>
    );
}
