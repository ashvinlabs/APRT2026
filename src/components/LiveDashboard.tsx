'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, UserCheck, CheckCircle2, AlertCircle, Loader2, TrendingUp, Calendar, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Stats {
    total_voters: number;
    present_voters: number;
    votes: {
        candidate_id: string | null;
        count: number;
    }[];
    total_valid_votes: number;
    total_invalid_votes: number;
}

interface Candidate {
    id: string;
    name: string;
    photo_url: string | null;
    display_order: number;
}

export default function LiveDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInitialData();

        // Real-time subscriptions
        const votersSub = supabase
            .channel('voters_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'voters' }, () => refreshStats())
            .subscribe();

        const votesSub = supabase
            .channel('votes_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => refreshStats())
            .subscribe();

        return () => {
            supabase.removeChannel(votersSub);
            supabase.removeChannel(votesSub);
        };
    }, []);

    async function fetchInitialData() {
        try {
            setLoading(true);
            const { data: candData, error: candError } = await supabase.from('candidates').select('*').order('display_order', { ascending: true });
            if (candError) throw candError;
            setCandidates(candData || []);
            await refreshStats();
        } catch (err) {
            console.error('Dashboard Error:', err);
        } finally {
            setLoading(false);
        }
    }

    async function refreshStats() {
        const { count: totalVoters } = await supabase.from('voters').select('*', { count: 'exact', head: true });
        const { count: presentVoters } = await supabase.from('voters').select('*', { count: 'exact', head: true }).eq('is_present', true);

        const { data: voteData } = await supabase.from('votes').select('candidate_id, is_valid');

        const voteCounts: Record<string, number> = {};
        let valid = 0;
        let invalid = 0;

        voteData?.forEach(v => {
            if (v.is_valid && v.candidate_id) {
                voteCounts[v.candidate_id] = (voteCounts[v.candidate_id] || 0) + 1;
                valid++;
            } else {
                invalid++;
            }
        });

        setStats({
            total_voters: totalVoters || 0,
            present_voters: presentVoters || 0,
            votes: Object.entries(voteCounts).map(([id, count]) => ({ candidate_id: id, count })),
            total_valid_votes: valid,
            total_invalid_votes: invalid
        });
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
            <Loader2 className="animate-spin text-primary" size={64} />
            <p className="text-xl font-black text-slate-400 animate-pulse tracking-widest uppercase">Initializing Tally...</p>
        </div>
    );

    return (
        <div className="p-8 max-w-[1600px] mx-auto animate-fade-in space-y-12">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row items-center justify-between gap-8 pb-12 border-b border-slate-200">
                <div className="text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-black tracking-widest uppercase mb-4">
                        <TrendingUp size={14} /> Real-time Monitoring
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight">
                        REKAPITULASI <span className="text-primary">LIVE</span>
                    </h1>
                    <p className="text-xl text-slate-500 font-medium mt-2">Pemilihan Ketua RT 12 • Pelem Kidul - Baturetno</p>
                </div>

                <div className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 ring-1 ring-slate-200/5 hover-premium">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
                        <Calendar size={24} />
                    </div>
                    <div className="pr-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hari Pemilihan</p>
                        <p className="text-lg font-black text-slate-900 leading-tight">10 Januari 2026</p>
                    </div>
                </div>
            </header>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total DPT', value: stats?.total_voters, icon: Users, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
                    { label: 'Hadir / Sign-in', value: stats?.present_voters, icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
                    { label: 'Suara Sah', value: stats?.total_valid_votes, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                    { label: 'Tidak Sah / Batal', value: stats?.total_invalid_votes, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' }
                ].map((item, i) => (
                    <Card key={i} className={cn("border-none shadow-xl shadow-slate-200/40 relative overflow-hidden transition-all duration-300 group hover-premium", item.bg)}>
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500 pointer-events-none">
                            <item.icon size={120} className="w-[120px] h-[120px]" />
                        </div>
                        <CardContent className="p-8 relative z-10">
                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm", item.color, "bg-white")}>
                                <item.icon size={28} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-4xl font-black tracking-tight text-slate-900">{item.value}</p>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{item.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Candidate Results Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {candidates.map((candidate, idx) => {
                    const voteCount = stats?.votes.find(v => v.candidate_id === candidate.id)?.count || 0;
                    const percentage = stats?.total_valid_votes ? Math.round((voteCount / stats.total_valid_votes) * 100) : 0;
                    const colors = [
                        'from-blue-500 to-indigo-600 shadow-blue-200/50',
                        'from-purple-500 to-fuchsia-600 shadow-purple-200/50',
                        'from-emerald-500 to-teal-600 shadow-emerald-200/50'
                    ];

                    return (
                        <div key={candidate.id} className="group relative">
                            <div className={cn(
                                "absolute -inset-0.5 bg-gradient-to-r blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200",
                                idx === 0 ? "from-blue-600 to-cyan-400" : idx === 1 ? "from-purple-600 to-pink-400" : "from-emerald-600 to-teal-400"
                            )} />

                            <Card className="relative h-full border-none shadow-2xl bg-white overflow-hidden p-0 rounded-[2.5rem]">
                                <div className="p-8 flex flex-col items-center">
                                    <div className="relative mb-8 group/photo">
                                        <div className="absolute -inset-4 bg-gradient-to-tr from-slate-100 to-white rounded-[3rem] -z-10 group-hover/photo:scale-105 transition-transform duration-500" />
                                        <div className="w-56 h-72 rounded-[2.5rem] bg-slate-50 overflow-hidden shadow-2xl border-4 border-white transition-all duration-500 group-hover/photo:-translate-y-2">
                                            {candidate.photo_url ? (
                                                <img src={candidate.photo_url} alt={candidate.name} className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <Users size={64} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute -bottom-3 -right-3 w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-xl border-4 border-slate-50">
                                            <span className="text-2xl font-black text-slate-900">{idx + 1}</span>
                                        </div>
                                    </div>

                                    <h2 className="text-3xl font-black text-slate-900 text-center mb-10 leading-tight">
                                        {candidate.name}
                                    </h2>

                                    <div className="w-full space-y-4">
                                        <div className="flex items-end justify-between px-2">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Perolehan</span>
                                                <span className="text-6xl font-black text-slate-900 leading-none">{voteCount}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-3xl font-black text-primary leading-none">{percentage}%</span>
                                            </div>
                                        </div>

                                        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner">
                                            <div
                                                className={cn("h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r shadow-lg", colors[idx % 3])}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    );
                })}
            </div>

            {/* Footer Status */}
            <footer className="pt-12 flex flex-col md:flex-row items-center justify-center gap-10">
                <div className="flex items-center gap-3 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm animate-fade-in group hover-premium">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgb(16,185,129)]" />
                    <span className="text-sm font-black tracking-widest uppercase">Koneksi Real-time Aktif</span>
                </div>

                <div className="flex items-center gap-8 text-slate-400 font-bold text-[10px] tracking-[0.3em] uppercase">
                    <span className="hover:text-primary transition-colors cursor-default">Inklusif</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span className="hover:text-primary transition-colors cursor-default">Transparan</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span className="hover:text-primary transition-colors cursor-default">Akuntabel</span>
                </div>
            </footer>
        </div>
    );
}
