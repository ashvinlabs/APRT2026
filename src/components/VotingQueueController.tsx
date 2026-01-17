'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Users,
    Mic,
    CheckCircle2,
    XCircle,
    Loader2,
    Clock,
    Megaphone,
    AlertTriangle,
    SkipForward,
    UserCheck,
    Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { logActivity } from '@/lib/logger';
import { speak } from '@/lib/audio';

interface Voter {
    id: string;
    name: string;
    invitation_code: string;
    status: 'registered' | 'checked_in' | 'called' | 'voted';
    queue_timestamp: string;
    called_at?: string;
    skip_count: number;
    gender?: string;
}

export default function VotingQueueController() {
    const [waitingQueue, setWaitingQueue] = useState<Voter[]>([]);
    const [calledQueue, setCalledQueue] = useState<Voter[]>([]);
    const [loading, setLoading] = useState(true);
    const [calling, setCalling] = useState(false);

    // Stats
    const [stats, setStats] = useState({
        checkedIn: 0,
        called: 0,
        voted: 0
    });

    useEffect(() => {
        fetchQueues();

        // Real-time subscription
        const channel = supabase
            .channel('queue_controller')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'voters' }, () => {
                fetchQueues();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    async function fetchQueues() {
        // Fetch Waiting List (checked_in)
        const { data: waiting } = await supabase
            .from('voters')
            .select('*')
            .eq('status', 'checked_in')
            .order('queue_timestamp', { ascending: true });

        // Fetch Called List (called)
        const { data: called } = await supabase
            .from('voters')
            .select('*')
            .eq('status', 'called')
            .order('called_at', { ascending: true }); // Oldest called first

        // Fetch Stats
        const { count: votedCount } = await supabase.from('voters').select('*', { count: 'exact', head: true }).eq('status', 'voted');

        setWaitingQueue(waiting || []);
        setCalledQueue(called || []);
        setStats({
            checkedIn: waiting?.length || 0,
            called: called?.length || 0,
            voted: votedCount || 0
        });
        setLoading(false);
    }

    // ... existing imports

    // ... existing imports

    async function callNextBatch(size: number = 3) {
        if (waitingQueue.length === 0) return;
        setCalling(true);

        const batch = waitingQueue.slice(0, size);

        // Audio Feedback for Staff
        const names = batch.map(v => v.name).join(', ');
        speak(`Monggo, kagem ${names}, sumangga tumuju bilik suara.`);

        const updates = batch.map(v => ({
            id: v.id,
            status: 'called',
            called_at: new Date().toISOString()
        }));

        for (const update of updates) {
            await supabase.from('voters').update({
                status: 'called',
                called_at: update.called_at
            }).eq('id', update.id);
        }

        // Trigger Log
        await logActivity('call_voter', 'manage_queue', {
            detail: `Panggil Antrian: ${batch.map(v => v.name).join(', ')}`
        });

        // Trigger TTS locally for staff feedback (optional) or just rely on IDs
        setCalling(false);
    }

    async function markVoted(voterId: string, name: string) {
        if (!confirm(`Konfirmasi: ${name} sudah selesai mencoblos?`)) return;

        await supabase.from('voters').update({ status: 'voted' }).eq('id', voterId);
        await logActivity('mark_voted', 'manage_queue', { detail: `Selesai Mencoblos: ${name}` });
    }

    async function handleSkip(voter: Voter) {
        // Logic: 
        // 1. Increment skip_count
        // 2. If skip_count < 3: Bump back by ~9 positions (3 groups of 3)
        // 3. If skip_count >= 3: Bump to VERY END of queue
        // 4. Set status back to 'checked_in'

        const newSkipCount = (voter.skip_count || 0) + 1;
        let newTimestamp = new Date().toISOString();

        if (newSkipCount < 3 && waitingQueue.length > 0) {
            // Find the 9th person in line (or last if <9) to insert after
            // Actually, we manipulate the timestamp to be slightly after the 9th person
            // If we just use NOW, they go to end. 
            // So we need to find the timestamp of the 9th person and add 1 second.
            // Queue is sorted by timestamp ASC.
            const bumpIndex = Math.min(waitingQueue.length - 1, 8);
            const targetVoter = waitingQueue[bumpIndex];
            if (targetVoter && targetVoter.queue_timestamp) {
                const t = new Date(targetVoter.queue_timestamp).getTime();
                newTimestamp = new Date(t + 1000).toISOString(); // +1s after them
            }
        }

        const { error } = await supabase.from('voters').update({
            status: 'checked_in',
            skip_count: newSkipCount,
            queue_timestamp: newTimestamp,
            called_at: null
        }).eq('id', voter.id);

        if (!error) {
            await logActivity('skip_voter', 'manage_queue', {
                detail: `Skip/No-Show: ${voter.name} (Skip #${newSkipCount})`
            });
        }
    }

    async function handleRecall(voter: Voter) {
        // Update called_at to NOW to trigger re-announcement on Display
        const now = new Date().toISOString();

        // Local feedback
        speak(`Monggo, kagem ${voter.name}, sumangga tumuju bilik suara.`);

        await supabase.from('voters').update({
            called_at: now
        }).eq('id', voter.id);

        await logActivity('recall_voter', 'manage_queue', {
            detail: `Panggil Ulang: ${voter.name}`
        });
    }

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="p-6 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-100px)]">
            {/* Stats Bar */}
            {/* Stats Bar */}
            <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <Card className="bg-slate-900 text-white border-none min-h-[160px] flex flex-col items-center justify-center p-6 shadow-xl rounded-[2rem]">
                    <div className="flex items-center gap-2 mb-2 opacity-50">
                        <Users size={16} />
                        <span className="text-xs font-black uppercase tracking-widest">Menunggu</span>
                    </div>
                    <span className="text-7xl font-black tracking-tighter">{stats.checkedIn}</span>
                </Card>

                <Card className="bg-amber-500 text-white border-none min-h-[160px] flex flex-col items-center justify-center p-6 shadow-xl shadow-amber-500/20 rounded-[2rem]">
                    <div className="flex items-center gap-2 mb-2 opacity-80">
                        <Megaphone size={16} />
                        <span className="text-xs font-black uppercase tracking-widest">Dipanggil</span>
                    </div>
                    <span className="text-7xl font-black tracking-tighter">{stats.called}</span>
                </Card>

                <Card className="bg-emerald-600 text-white border-none min-h-[160px] flex flex-col items-center justify-center p-6 shadow-xl shadow-emerald-600/20 rounded-[2rem]">
                    <div className="flex items-center gap-2 mb-2 opacity-80">
                        <UserCheck size={16} />
                        <span className="text-xs font-black uppercase tracking-widest">Sudah Mencoblos</span>
                    </div>
                    <span className="text-7xl font-black tracking-tighter">{stats.voted}</span>
                </Card>

                <Button
                    onClick={() => callNextBatch(3)}
                    disabled={waitingQueue.length === 0 || calling}
                    className="h-full min-h-[160px] bg-blue-600 hover:bg-blue-700 text-white border-none flex flex-col items-center justify-center p-6 shadow-xl shadow-blue-600/20 rounded-[2rem] transition-all hover:scale-[1.02] active:scale-95"
                >
                    {calling ? <Loader2 className="animate-spin mb-4" size={40} /> : <Mic className="mb-4" size={40} />}
                    <span className="font-black text-xs uppercase tracking-widest text-center leading-tight">
                        Panggil 3<br />Berikutnya
                    </span>
                </Button>
            </div>

            {/* WAITING QUEUE (Left Column) */}
            <div className="lg:col-span-7 flex flex-col gap-4 overflow-hidden h-full">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Clock className="text-slate-400" />
                        Antrian Menunggu
                    </h2>
                    <Badge variant="outline" className="font-bold">{waitingQueue.length} Orang</Badge>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-20">
                    {waitingQueue.length === 0 ? (
                        <div className="h-40 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                            <Users size={32} className="mb-2 opacity-50" />
                            <p className="font-bold">Antrian Kosong</p>
                        </div>
                    ) : (
                        waitingQueue.map((voter, idx) => (
                            <Card key={voter.id} className={cn(
                                "border-none shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all",
                                idx < 3 ? "bg-blue-50/50 ring-blue-100" : "bg-white"
                            )}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center font-black text-sm",
                                            idx < 3 ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-slate-100 text-slate-500"
                                        )}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">{voter.name}</h3>
                                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                                <Badge variant="secondary" className="px-1.5 h-5 text-[10px] tracking-wide">{voter.invitation_code}</Badge>
                                                {voter.skip_count > 0 && (
                                                    <span className="text-rose-500 flex items-center gap-1 font-bold">
                                                        <AlertTriangle size={10} />
                                                        Skip x{voter.skip_count}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right text-xs text-slate-400 font-medium">
                                        {new Date(voter.queue_timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* CALLED QUEUE (Right Column) */}
            <div className="lg:col-span-5 flex flex-col gap-4 overflow-hidden h-full bg-amber-50 rounded-3xl p-6 border border-amber-100">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-amber-900 flex items-center gap-2">
                        <Megaphone className="text-amber-600" />
                        Sedang Dipanggil
                    </h2>
                    <Badge className="bg-amber-200 text-amber-800 hover:bg-amber-300 border-none font-bold">{calledQueue.length} Active</Badge>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pb-20">
                    {calledQueue.length === 0 ? (
                        <div className="h-40 flex flex-col items-center justify-center text-amber-400/50 border-2 border-dashed border-amber-200 rounded-xl">
                            <Volume2 size={32} className="mb-2" />
                            <p className="font-bold">Tidak ada panggilan aktif</p>
                        </div>
                    ) : (
                        calledQueue.map((voter) => (
                            <Card key={voter.id} className="border-none shadow-lg shadow-amber-200/50 bg-white ring-1 ring-amber-100 animate-in slide-in-from-right-4">
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 mb-1">{voter.name}</h3>
                                            <Badge variant="outline" className="text-xs bg-slate-50">{voter.invitation_code}</Badge>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-black w-full block text-slate-300 uppercase tracking-widest mb-1">Waktu Panggil</span>
                                            <span className="font-mono font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                                                {voter.called_at ? new Date(voter.called_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                {/* <span className="text-[10px] ml-1 opacity-50">WIB</span> */}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => handleRecall(voter)}
                                            className="col-span-2 border-amber-200 text-amber-700 hover:bg-amber-50 font-bold"
                                        >
                                            <Megaphone size={16} className="mr-2" />
                                            PANGGIL ULANG
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleSkip(voter)}
                                            className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold"
                                        >
                                            <SkipForward size={16} className="mr-2" />
                                            LEWATI
                                        </Button>
                                        <Button
                                            onClick={() => markVoted(voter.id, voter.name)}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-200"
                                        >
                                            <CheckCircle2 size={16} className="mr-2" />
                                            SUDAH VOTE
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
