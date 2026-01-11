'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, UserCheck, XCircle, Loader2, Info, MapPin, CreditCard, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface VoterResult {
    id: string;
    name: string;
    nik: string;
    address: string;
    is_present: boolean;
    has_voted: boolean;
    voted_at: string | null;
}

export default function PublicVoterCheck() {
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<VoterResult[] | null>(null);
    const [hasChecked, setHasChecked] = useState(false);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!search.trim()) return;

        setLoading(true);
        setHasChecked(true);

        try {
            const { data, error } = await supabase.rpc('search_voter_public', {
                p_search: search.trim()
            });

            if (error) throw error;
            setResults(data || []);
        } catch (err) {
            console.error('Search error:', err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 md:p-8 animate-fade-in">
            <div className="w-full max-w-2xl space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 text-primary mb-2">
                        <UserCheck size={40} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                        Check <span className="text-primary">DPT</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-lg max-w-md mx-auto">
                        Masukkan NIK atau Nama Lengkap Anda untuk mengecek status pendaftaran pemilih.
                    </p>
                </div>

                {/* Search Box */}
                <Card className="border-none shadow-2xl shadow-slate-200/60 rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
                    <CardContent className="p-8">
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={24} />
                                <Input
                                    placeholder="Masukkan NIK atau Nama..."
                                    className="pl-16 h-16 text-xl font-bold rounded-2xl border-slate-100 bg-slate-50/50 focus-visible:ring-primary/20 focus-visible:bg-white transition-all"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <Button
                                type="submit"
                                size="lg"
                                disabled={loading || !search.trim()}
                                className="h-16 px-10 rounded-2xl font-black text-lg gap-2 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <Search size={24} />}
                                CARI DATA
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Info Note */}
                {!hasChecked && (
                    <div className="flex items-center gap-3 justify-center text-slate-400 bg-slate-50 py-3 px-6 rounded-2xl border border-slate-100">
                        <ShieldCheck size={18} className="text-emerald-500" />
                        <p className="text-xs font-bold uppercase tracking-widest">Data NIK disensor demi keamanan privasi warga.</p>
                    </div>
                )}

                {/* Results Section */}
                <div className="space-y-6">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <div className="relative w-16 h-16">
                                <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                                <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin" />
                            </div>
                            <p className="text-slate-400 font-black tracking-widest uppercase text-xs">Mencari di Database...</p>
                        </div>
                    )}

                    {!loading && hasChecked && results && results.length > 0 && (
                        <div className="grid gap-4 animate-in slide-in-from-bottom-4 duration-500">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Hasil Pencarian ({results.length})</p>
                            {results.map((voter) => (
                                <Card key={voter.id} className="border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden hover:scale-[1.01] transition-all group">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-3">
                                                <div>
                                                    <h3 className="text-2xl font-black text-slate-900 leading-tight mb-1">{voter.name}</h3>
                                                    <div className="flex items-center gap-2 text-primary font-black text-xs tracking-wider uppercase">
                                                        <CreditCard size={14} />
                                                        <span className="font-mono tracking-tighter">{voter.nik}</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-4 pt-2">
                                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold italic">
                                                        <MapPin size={14} className="text-slate-300" />
                                                        <span>{voter.address}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right flex flex-col items-end gap-2">
                                                <Badge className={cn(
                                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest",
                                                    voter.is_present
                                                        ? "bg-emerald-100 text-emerald-700 border-none"
                                                        : "bg-amber-100 text-amber-700 border-none"
                                                )}>
                                                    {voter.is_present ? 'SUDAH HADIR' : 'BELUM HADIR'}
                                                </Badge>
                                                {voter.has_voted && (
                                                    <Badge className="bg-indigo-100 text-indigo-700 border-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                                        SUDAH MEMILIH
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {!loading && hasChecked && results && results.length === 0 && (
                        <div className="bg-rose-50 border-2 border-dashed border-rose-200 rounded-[2.5rem] p-12 text-center space-y-4 animate-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 mx-auto">
                                <XCircle size={40} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-rose-900 leading-none mb-2">TIDAK DITEMUKAN</h3>
                                <p className="text-rose-700/60 font-medium">Data warga dengan kata kunci tersebut tidak ada dalam DPT.</p>
                            </div>
                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest pt-4">Pastikan penulisan nama atau NIK sudah benar.</p>
                        </div>
                    )}
                </div>

                {/* Support Card */}
                <div className="pt-12 border-t border-slate-100">
                    <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                            <Info size={20} />
                        </div>
                        <div>
                            <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">Punya Kendala?</h4>
                            <p className="text-slate-500 text-xs font-medium leading-relaxed mt-1">
                                Jika Nama Anda belum terdaftar atau terdapat ketidaksesuaian data, silakan hubungi Panitia Pemilihan di lokasi Sekretariat RT 12.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
