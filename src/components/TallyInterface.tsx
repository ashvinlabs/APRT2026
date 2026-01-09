'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, XCircle, Loader2, History, Vote, AlertTriangle, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Candidate {
    id: string;
    name: string;
    photo_url: string | null;
}

export default function TallyInterface() {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [recording, setRecording] = useState<string | null>(null);
    const [lastVote, setLastVote] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchCandidates();
    }, []);

    async function fetchCandidates() {
        try {
            setLoading(true);
            const { data, error } = await supabase.from('candidates').select('*').order('display_order', { ascending: true });
            if (error) throw error;
            setCandidates(data || []);
        } catch (err) {
            console.error('Tally fetch error:', err);
        } finally {
            setLoading(false);
        }
    }

    async function recordVote(candidateId: string | null, isValid: boolean = true) {
        setRecording(candidateId || 'invalid');
        const { error } = await supabase.from('votes').insert({
            candidate_id: candidateId,
            is_valid: isValid
        });

        if (error) {
            console.error('Gagal mencatat suara:', error.message);
        } else {
            const candidateName = candidateId ? candidates.find(c => c.id === candidateId)?.name : 'Suara Tidak Sah';
            setLastVote(candidateName || 'Suara Tidak Sah');
            setTimeout(() => setLastVote(null), 3000);
        }
        setRecording(null);
    }

    if (!mounted) return null;

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
            <Loader2 className="animate-spin text-primary" size={48} />
            <p className="text-slate-400 font-black tracking-widest uppercase">Loading Interface...</p>
        </div>
    );

    return (
        <div className="p-8 max-w-4xl mx-auto animate-fade-in relative">
            {/* Header Section */}
            <header className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-black tracking-widest uppercase mb-4">
                    <Vote size={14} /> Operator Console
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Penghitungan <span className="text-primary">Suara</span></h1>
                <p className="text-slate-500 font-medium max-w-lg mx-auto italic">
                    Masukkan hasil setiap surat suara sesuai instruksi dari saksi dan ketua KPPS.
                </p>
            </header>

            {/* Last Action Notification */}
            <div className="h-20 mb-8 overflow-hidden">
                {lastVote ? (
                    <div className="animate-fade-in bg-emerald-50 border border-emerald-100 px-6 py-4 rounded-3xl flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                                <CheckCircle2 size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Terakhir Dicatat</p>
                                <p className="text-lg font-black text-emerald-900 leading-none">{lastVote}</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-white">Berhasil disimpan</Badge>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-300 font-bold text-sm bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                        Menunggu input suara berikutnya...
                    </div>
                )}
            </div>

            {/* Main Interface Grid */}
            <div className="grid gap-4">
                {candidates.map((candidate, idx) => (
                    <Button
                        key={candidate.id}
                        onClick={() => recordVote(candidate.id)}
                        disabled={recording !== null}
                        variant="outline"
                        className={cn(
                            "group h-32 p-0 flex items-stretch border-none shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden transition-all duration-300",
                            "hover:scale-[1.02] active:scale-95 bg-white ring-1 ring-slate-100",
                            recording === candidate.id && "ring-4 ring-primary ring-offset-2 scale-[1.03]"
                        )}
                    >
                        <div className="w-24 bg-slate-50 flex items-center justify-center overflow-hidden border-r border-slate-100 transition-colors group-hover:bg-primary/5">
                            {candidate.photo_url ? (
                                <img src={candidate.photo_url} alt={candidate.name} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500" />
                            ) : (
                                <Fingerprint size={40} className="text-slate-200 group-hover:text-primary transition-colors" />
                            )}
                        </div>

                        <div className="flex-1 px-8 flex flex-col justify-center text-left">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 opacity-70">Calon No. {idx + 1}</span>
                            <h2 className="text-2xl font-black text-slate-900 group-hover:text-primary transition-colors">{candidate.name}</h2>
                            <p className="text-slate-400 font-medium text-xs mt-1">Klik untuk mencatat 1 suara sah</p>
                        </div>

                        <div className="px-8 flex items-center border-l border-slate-50 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                            {recording === candidate.id ? (
                                <Loader2 className="animate-spin" size={32} />
                            ) : (
                                <CheckCircle2 size={32} className="text-slate-200 group-hover:text-white transition-colors" />
                            )}
                        </div>
                    </Button>
                ))}

                <Separator className="my-6 opacity-30" />

                <Button
                    onClick={() => recordVote(null, false)}
                    disabled={recording !== null}
                    variant="outline"
                    className={cn(
                        "group h-24 p-0 flex items-stretch border-none shadow-lg shadow-rose-100 rounded-[2rem] overflow-hidden transition-all duration-300",
                        "hover:scale-[1.02] active:scale-95 bg-rose-50 ring-1 ring-rose-100",
                        recording === 'invalid' && "ring-4 ring-rose-500 ring-offset-2 scale-[1.03]"
                    )}
                >
                    <div className="w-24 bg-rose-100 flex items-center justify-center text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                        <AlertTriangle size={32} />
                    </div>

                    <div className="flex-1 px-8 flex flex-col justify-center text-left">
                        <h2 className="text-xl font-black text-rose-900">Suara Tidak Sah</h2>
                        <p className="text-rose-400 font-black text-xs uppercase tracking-widest mt-0.5">Surat suara batal / tidak jelas</p>
                    </div>

                    <div className="px-8 flex items-center group-hover:bg-rose-600 group-hover:text-white transition-all duration-300">
                        {recording === 'invalid' ? (
                            <Loader2 className="animate-spin" size={28} />
                        ) : (
                            <XCircle size={28} className="text-rose-200 group-hover:text-white transition-colors" />
                        )}
                    </div>
                </Button>
            </div>

            <div className="mt-12 flex justify-center">
                <Button variant="ghost" className="h-12 px-6 rounded-2xl gap-2 font-black text-slate-400 hover:text-primary hover:bg-primary/5 group transition-all">
                    <History size={18} className="transition-transform group-hover:-rotate-45" />
                    <span>LIHAT RIWAYAT TERAKHIR</span>
                </Button>
            </div>
        </div>
    );
}

// Minimal Separator inline since we only need it here
function Separator({ className }: { className?: string }) {
    return <div className={cn("h-px bg-slate-200", className)} />;
}
