'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, UserCheck, CheckCircle2, AlertCircle, Loader2, TrendingUp, Calendar, Info, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { useUser } from './UserContext';

interface Stats {
    total_voters: number;
    present_voters: number;
    voted_voters: number;
    votes: {
        candidate_id: string | null;
        count: number;
    }[];
    total_valid_votes: number;
    total_invalid_votes: number;
    config: {
        title: string;
        location: string;
        location_detail?: string;
        date?: string;
        start_time?: string;
        end_time?: string;
    };
}

interface Candidate {
    id: string;
    name: string;
    photo_url: string | null;
    display_order: number;
}

export default function LiveDashboard() {
    const { user } = useUser();
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

            // Subscribe to settings changes
            supabase
                .channel('settings_dashboard')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: 'id=eq.election_config' }, () => refreshStats())
                .subscribe();

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
        const { count: votedVoters } = await supabase.from('voters').select('*', { count: 'exact', head: true }).eq('status', 'voted');

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

        const { data: configData } = await supabase
            .from('settings')
            .select('value')
            .eq('id', 'election_config')
            .single();

        setStats({
            total_voters: totalVoters || 0,
            present_voters: presentVoters || 0,
            voted_voters: votedVoters || 0,
            votes: Object.entries(voteCounts)
                .map(([id, count]) => ({ candidate_id: id, count }))
                .sort((a, b) => b.count - a.count), // Sort by count descending
            total_valid_votes: valid,
            total_invalid_votes: invalid,
            config: configData?.value || {
                title: 'REKAPITULASI LIVE',
                location: 'Pemilihan Ketua RT',
                location_detail: 'Pelem Kidul',
                date: new Date().toISOString().split('T')[0],
                start_time: '08:00',
                end_time: '12:00'
            }
        });
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
            <Loader2 className="animate-spin text-primary" size={64} />
            <p className="text-xl font-black text-slate-400 animate-pulse tracking-widest uppercase">Initializing Tally...</p>
        </div>
    );

    return (
        <div className="p-4 max-w-[1600px] mx-auto animate-fade-in space-y-6 flex flex-col justify-between min-h-[calc(100vh-40px)]">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-200 shrink-0">
                <div className="text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black tracking-widest uppercase mb-2">
                        <TrendingUp size={12} /> Real-time Monitoring
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight uppercase">
                        {stats?.config.title.split(' ').map((word, i, arr) =>
                            i === arr.length - 1 ? <span key={i} className="text-primary ml-2">{word}</span> : word + ' '
                        )}
                    </h1>
                    <p className="text-base text-slate-500 font-medium mt-1">
                        {stats?.config.location_detail || stats?.config.location}
                    </p>
                </div>

                <div className="flex gap-4 no-print scale-90 origin-right">
                    {user && (
                        <Button
                            onClick={() => window.print()}
                            variant="outline"
                            className="rounded-2xl h-14 px-8 font-black gap-2 shadow-sm border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
                        >
                            <Printer size={20} className="text-primary" />
                            Cetak Laporan
                        </Button>
                    )}
                    <div className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 ring-1 ring-slate-200/5 hover-premium">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
                            <Calendar size={24} />
                        </div>
                        <div className="pr-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hari & Waktu</p>
                            <p className="text-sm font-black text-slate-900 leading-tight">
                                {stats?.config.date ? new Date(stats.config.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Setting Tanggal...'}
                            </p>
                            <p className="text-[10px] font-bold text-primary">
                                {stats?.config.start_time && stats?.config.end_time ? `${stats.config.start_time} - ${stats.config.end_time} WIB` : 'Setting Jam...'}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    aside { display: none !important; }
                    main { padding: 0 !important; margin: 0 !important; width: 100% !important; }
                    body { background: white !important; }
                    .animate-fade-in { animation: none !important; }
                    .shadow-xl, .shadow-2xl { box-shadow: none !important; border: 1px solid #e2e8f0 !important; }
                    .rounded-[2.5rem] { border-radius: 1rem !important; }
                }
            `}</style>


            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 shrink-0">
                {[
                    { label: 'Total DPT', value: stats?.total_voters, icon: Users, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
                    { label: 'Hadir / Sign-in', value: stats?.present_voters, icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
                    { label: 'Sudah Mencoblos', value: stats?.voted_voters, icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
                    { label: 'Suara Sah', value: stats?.total_valid_votes, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                    { label: 'Tidak Sah / Batal', value: stats?.total_invalid_votes, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' }
                ].map((item, i) => (
                    <Card key={i} className={cn("border-none shadow-xl shadow-slate-200/40 overflow-hidden transition-all duration-300 hover-premium", item.bg)}>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm shrink-0", item.color, "bg-white")}>
                                    <item.icon size={24} />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-3xl font-black tracking-tight text-slate-900 leading-none">{item.value}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">{item.label}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Candidate Results Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {candidates
                    .sort((a, b) => {
                        const votesA = stats?.votes.find(v => v.candidate_id === a.id)?.count || 0;
                        const votesB = stats?.votes.find(v => v.candidate_id === b.id)?.count || 0;
                        return votesB - votesA; // Sort by vote count descending
                    })
                    .map((candidate, idx) => {
                        const voteData = stats?.votes.find(v => v.candidate_id === candidate.id);
                        const voteCount = voteData?.count || 0;
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

                                <Card className="relative h-full border-none shadow-2xl bg-white overflow-hidden p-0 rounded-[2rem]">
                                    <div className="p-6 flex flex-col items-center">
                                        <div className="relative mb-6 group/photo">
                                            <div className="absolute -inset-3 bg-gradient-to-tr from-slate-100 to-white rounded-[2.5rem] -z-10 group-hover/photo:scale-105 transition-transform duration-500" />
                                            <div className="w-32 h-44 rounded-[2rem] bg-slate-50 overflow-hidden shadow-xl border-2 border-white transition-all duration-500 group-hover/photo:-translate-y-1">
                                                {candidate.photo_url ? (
                                                    <img src={candidate.photo_url} alt={candidate.name} className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <Users size={40} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg border-2 border-slate-50">
                                                <span className="text-lg font-black text-slate-900">{candidate.display_order || idx + 1}</span>
                                            </div>
                                        </div>

                                        <h2 className="text-xl font-black text-slate-900 text-center mb-6 leading-tight h-14 flex items-center">
                                            {candidate.name}
                                        </h2>

                                        <div className="w-full space-y-2">
                                            <div className="flex items-end justify-between px-1">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Perolehan</span>
                                                    <span className="text-4xl font-black text-slate-900 leading-none">{voteCount}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xl font-black text-primary leading-none">{percentage}%</span>
                                                </div>
                                            </div>

                                            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 shadow-inner">
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
            <footer className="pt-6 pb-2 flex flex-col md:flex-row items-center justify-center gap-6 shrink-0 border-t border-slate-100">
                <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm animate-fade-in group hover-premium">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgb(16,185,129)]" />
                    <span className="text-[10px] font-black tracking-widest uppercase">Koneksi Real-time Aktif</span>
                </div>

                <div className="flex items-center gap-6 text-slate-300 font-bold text-[8px] tracking-[0.2em] uppercase">
                    <span className="hover:text-primary transition-colors cursor-default">Inklusif</span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                    <span className="hover:text-primary transition-colors cursor-default">Transparan</span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                    <span className="hover:text-primary transition-colors cursor-default">Akuntabel</span>
                </div>
            </footer>
        </div>
    );
}
