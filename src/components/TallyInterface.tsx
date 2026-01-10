'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, XCircle, Loader2, History, Vote, AlertTriangle, Fingerprint, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Candidate {
    id: string;
    name: string;
    photo_url: string | null;
    display_order?: number;
}

export default function TallyInterface() {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [recording, setRecording] = useState<string | null>(null);
    const [lastVote, setLastVote] = useState<{ name: string, type: 'valid' | 'invalid' | 'undo' } | null>(null);

    // Election State
    const [isVotingOpen, setIsVotingOpen] = useState(true);
    const [totalPresent, setTotalPresent] = useState(0);
    const [totalVotes, setTotalVotes] = useState(0);
    const [candidateVotes, setCandidateVotes] = useState<Record<string, number>>({});
    const [invalidVotes, setInvalidVotes] = useState(0);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchInitialData();

        // Real-time Subscriptions
        const channels = [
            // 1. Settings
            supabase.channel('settings_tally')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: 'id=eq.election_config' }, (payload: any) => {
                    if (payload.new?.value) setIsVotingOpen(payload.new.value.is_voting_open);
                })
                .subscribe(),

            // 2. Voters (Presence Count)
            supabase.channel('voters_tally')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'voters' }, () => {
                    fetchPresenceCount();
                })
                .subscribe(),

            // 3. Votes (Live Tally)
            supabase.channel('votes_tally')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => {
                    fetchVoteCounts();
                })
                .subscribe()
        ];

        return () => {
            channels.forEach(ch => supabase.removeChannel(ch));
        };
    }, []);

    async function fetchInitialData() {
        setLoading(true);
        await Promise.all([
            fetchCandidates(),
            fetchSettings(),
            fetchPresenceCount(),
            fetchVoteCounts()
        ]);
        setLoading(false);
    }

    async function fetchSettings() {
        const { data } = await supabase.from('settings').select('value').eq('id', 'election_config').single();
        if (data?.value) setIsVotingOpen(data.value.is_voting_open);
    }

    async function fetchCandidates() {
        const { data } = await supabase.from('candidates').select('*').order('display_order', { ascending: true });
        setCandidates(data || []);
    }

    async function fetchPresenceCount() {
        const { count } = await supabase.from('voters').select('*', { count: 'exact', head: true }).eq('is_present', true);
        setTotalPresent(count || 0);
    }

    async function fetchVoteCounts() {
        const { data: votes } = await supabase.from('votes').select('candidate_id, is_valid');

        if (votes) {
            const counts: Record<string, number> = {};
            let invalid = 0;
            let total = 0;

            votes.forEach(v => {
                total++;
                if (!v.is_valid) {
                    invalid++;
                } else if (v.candidate_id) {
                    counts[v.candidate_id] = (counts[v.candidate_id] || 0) + 1;
                }
            });

            setCandidateVotes(counts);
            setInvalidVotes(invalid);
            setTotalVotes(total);
        }
    }

    async function recordVote(candidateId: string | null, isValid: boolean = true) {
        if (!isVotingOpen) return;

        setRecording(candidateId || 'invalid');

        const { error } = await supabase.from('votes').insert({
            candidate_id: candidateId,
            is_valid: isValid
        });

        if (error) {
            console.error('Save failed:', error);
        } else {
            const name = candidateId ? candidates.find(c => c.id === candidateId)?.name || 'Kandidat' : 'Suara Tidak Sah';
            showNotification(name, isValid ? 'valid' : 'invalid');
        }
        setRecording(null);
    }

    async function undoLastVote() {
        if (!confirm('Apakah anda yakin ingin membatalkan (menghapus) 1 suara terakhir yang masuk?')) return;

        // Find the absolute last vote
        const { data: last, error } = await supabase
            .from('votes')
            .select('id')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (last && !error) {
            await supabase.from('votes').delete().eq('id', last.id);
            showNotification('Pembatalan Suara', 'undo');
        }
    }

    function showNotification(name: string, type: 'valid' | 'invalid' | 'undo') {
        setLastVote({ name, type });
        setTimeout(() => setLastVote(null), 3000);
    }

    const isLimitReached = totalVotes >= totalPresent && totalPresent > 0;
    const isGlobalDisabled = !isVotingOpen || isLimitReached;

    if (!mounted) return null;

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
            <Loader2 className="animate-spin text-primary" size={48} />
            <p className="text-slate-400 font-black tracking-widest uppercase">Memuat Data...</p>
        </div>
    );

    return (
        <div className="p-8 max-w-5xl mx-auto animate-fade-in relative pb-32">
            {/* Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <Card className="border-none bg-slate-900 text-white shadow-2xl rounded-[2rem] overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Vote size={100} />
                    </div>
                    <CardContent className="p-8 flex flex-col justify-between h-full relative z-10">
                        <div>
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs mb-1">Total Suara Masuk</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black tracking-tighter">{totalVotes}</span>
                                <span className="text-2xl font-bold text-slate-500">/ {totalPresent}</span>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-500 ease-out"
                                    style={{ width: `${totalPresent > 0 ? (totalVotes / totalPresent) * 100 : 0}%` }}
                                />
                            </div>
                            <p className="text-right text-xs font-bold text-slate-400 mt-2">
                                {totalPresent > 0 ? Math.round((totalVotes / totalPresent) * 100) : 0}% Terpenuhi
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none bg-rose-50 border-2 border-rose-100 shadow-xl shadow-rose-100/50 rounded-[2rem]">
                    <CardContent className="p-8 flex items-center gap-6 h-full">
                        <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-500">
                            <AlertTriangle size={32} />
                        </div>
                        <div>
                            <p className="text-rose-400 font-black uppercase tracking-widest text-xs">Suara Tidak Sah</p>
                            <p className="text-4xl font-black text-rose-900">{invalidVotes}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none bg-white ring-1 ring-slate-100 shadow-xl shadow-slate-200/50 rounded-[2rem] flex flex-col justify-center">
                    <CardContent className="p-8 text-center">
                        {isLimitReached ? (
                            <div className="space-y-2">
                                <div className="inline-flex p-3 rounded-full bg-emerald-100 text-emerald-600 mb-2">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900">Penghitungan Selesai</h3>
                                <p className="text-slate-400 text-xs font-bold">Semua pemilih hadir telah memberikan suara.</p>
                            </div>
                        ) : !isVotingOpen ? (
                            <div className="space-y-2">
                                <div className="inline-flex p-3 rounded-full bg-slate-100 text-slate-500 mb-2">
                                    <Lock size={32} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900">Akses Ditutup</h3>
                                <p className="text-slate-400 text-xs font-bold">Menunggu panitia membuka akses voting.</p>
                            </div>
                        ) : (
                            <div className="space-y-2 animate-pulse">
                                <div className="inline-flex p-3 rounded-full bg-blue-100 text-blue-600 mb-2">
                                    <Loader2 className="animate-spin" size={32} />
                                </div>
                                <h3 className="text-xl font-black text-blue-900">Sedang Berlangsung</h3>
                                <p className="text-blue-400 text-xs font-bold">Silahkan input suara dari surat suara.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Notification Toast */}
            {lastVote && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
                    <Badge
                        className={cn(
                            "pl-4 pr-6 py-3 rounded-full text-sm font-black shadow-2xl border-2 gap-3",
                            lastVote.type === 'valid' && "bg-emerald-500 hover:bg-emerald-500 border-emerald-400 text-white",
                            lastVote.type === 'invalid' && "bg-rose-500 hover:bg-rose-500 border-rose-400 text-white",
                            lastVote.type === 'undo' && "bg-slate-700 hover:bg-slate-700 border-slate-600 text-white"
                        )}
                    >
                        {lastVote.type === 'undo' ? <History size={20} /> : <CheckCircle2 size={20} />}
                        {lastVote.type === 'undo' ? 'SUARA TERAKHIR DIBATALKAN' : `SUARA MASUK: ${lastVote.name.toUpperCase()}`}
                    </Badge>
                </div>
            )}

            {/* Voting Grid */}
            <div className="grid gap-6">
                {candidates.map((candidate, idx) => (
                    <Button
                        key={candidate.id}
                        onClick={() => recordVote(candidate.id)}
                        disabled={recording !== null || isGlobalDisabled}
                        variant="ghost"
                        className={cn(
                            "group h-36 p-0 flex items-stretch border-none shadow-xl shadow-slate-200/40 rounded-[2.5rem] overflow-hidden transition-all duration-300",
                            "bg-white ring-1 ring-slate-100",
                            !isGlobalDisabled && "hover:scale-[1.02] active:scale-95 hover:ring-primary/50",
                            recording === candidate.id && "ring-4 ring-primary ring-offset-2 scale-[1.03]"
                        )}
                    >
                        {/* Photo & Number */}
                        <div className="w-32 bg-slate-50 flex flex-col items-center justify-center border-r border-slate-100 relative group-hover:bg-primary/5 transition-colors">
                            <span className="absolute top-4 left-4 text-[10px] font-black text-slate-300 group-hover:text-primary/50">NO. {candidate.display_order || idx + 1}</span>
                            {candidate.photo_url ? (
                                <img src={candidate.photo_url} alt={candidate.name} className="w-20 h-20 rounded-full object-cover shadow-sm group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                                <Fingerprint size={48} className="text-slate-300 group-hover:text-primary transition-colors" />
                            )}
                        </div>

                        {/* Name & Action */}
                        <div className="flex-1 px-8 flex flex-col justify-center text-left">
                            <h2 className="text-3xl font-black text-slate-900 group-hover:text-primary transition-colors line-clamp-1">{candidate.name}</h2>
                            <p className="text-slate-400 font-bold text-xs mt-1 group-hover:text-primary/60">Klik untuk tambah +1 suara sah</p>
                        </div>

                        {/* Live Count for this Candidate */}
                        <div className="w-40 bg-slate-50 flex flex-col items-center justify-center border-l border-slate-100 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Perolehan</p>
                            <p className="text-5xl font-black leading-none">{candidateVotes[candidate.id] || 0}</p>
                        </div>
                    </Button>
                ))}

                <Separator className="my-2 opacity-50" />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Button
                        onClick={() => recordVote(null, false)}
                        disabled={recording !== null || isGlobalDisabled}
                        variant="ghost"
                        className={cn(
                            "md:col-span-3 h-28 rounded-[2.5rem] bg-rose-50 text-rose-900 ring-2 ring-rose-100 shadow-xl shadow-rose-100/30 hover:bg-rose-100 hover:scale-[1.01] active:scale-95 transition-all text-left flex items-center px-8 gap-6",
                            isGlobalDisabled && "opacity-50 grayscale"
                        )}
                    >
                        <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-rose-500 shadow-sm shrink-0">
                            <XCircle size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black">Suara Tidak Sah</h3>
                            <p className="text-rose-500/70 font-bold text-xs">Klik disini jika surat suara rusak atau tidak sah.</p>
                        </div>
                    </Button>

                    <Button
                        onClick={undoLastVote}
                        disabled={isLimitReached && totalVotes === 0}
                        // Allow undo even if locked, unless count is 0
                        variant="ghost"
                        className="h-28 rounded-[2.5rem] bg-slate-800 text-slate-200 ring-4 ring-slate-100 shadow-2xl hover:bg-slate-700 hover:text-white hover:scale-[1.02] active:scale-95 transition-all flex flex-col gap-2"
                    >
                        <History size={32} className="text-amber-400" />
                        <span className="font-black text-xs uppercase tracking-widest">Batalkan Terakhir</span>
                    </Button>
                </div>
            </div>

            {/* Limit Warning */}
            {isLimitReached && (
                <div className="fixed bottom-0 left-0 w-full p-4 bg-emerald-500/90 backdrop-blur-md text-white z-40 flex items-center justify-center gap-4 animate-in slide-in-from-bottom-full duration-500">
                    <CheckCircle2 size={32} className="text-white animate-bounce" />
                    <div>
                        <p className="font-black uppercase tracking-widest text-sm">Penghitungan Selesai</p>
                        <p className="text-xs font-medium opacity-90">Jumlah suara masuk ({totalVotes}) telah mencapai jumlah kehadiran ({totalPresent}).</p>
                    </div>
                </div>
            )}
        </div>
    );
}

function Separator({ className }: { className?: string }) {
    return <div className={cn("h-px bg-slate-200", className)} />;
}
