'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Clock, Volume2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { speak } from '@/lib/audio';

interface Voter {
    id: string;
    name: string;
    invitation_code: string;
    status: 'registered' | 'checked_in' | 'called' | 'voted';
    called_at?: string;
    gender?: 'L' | 'P';
}

export default function VotingQueueDisplay() {
    const [calledQueue, setCalledQueue] = useState<Voter[]>([]);
    const [nextQueue, setNextQueue] = useState<Voter[]>([]);
    const [announcedIds, setAnnouncedIds] = useState<Set<string>>(new Set());
    const [audioEnabled, setAudioEnabled] = useState(false);

    useEffect(() => {
        fetchQueues();

        const channel = supabase
            .channel('queue_display')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'voters' }, () => {
                fetchQueues();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    // TTS Effect
    useEffect(() => {
        if (calledQueue.length > 0 && audioEnabled) {
            // Find voters who haven't been announced yet
            // Find voters who haven't been announced yet (checking ID + Timestamp)
            const newCalls = calledQueue.filter(v => {
                const key = `${v.id}-${v.called_at}`;
                return !announcedIds.has(key);
            });

            if (newCalls.length > 0) {
                // Add to announced set immediately to prevent double-trigger
                setAnnouncedIds(prev => {
                    const next = new Set(prev);
                    newCalls.forEach(v => next.add(`${v.id}-${v.called_at}`));
                    return next;
                });

                // Speak as a batch
                const names = newCalls.map(v => {
                    const prefix = v.gender ? (v.gender === 'P' ? 'Ibu' : 'Bapak') : 'Saudara';
                    return `${prefix} ${v.name}`;
                }).join(', ');

                // "Monggo, kagem {nama 1}, {nama 2}, {nama3}, sumangga tumuju bilik suara"
                const text = `Monggo, kagem ${names}, sumangga tumuju bilik suara.`;

                speak(text);
            }
        }
    }, [calledQueue, audioEnabled]); // removed announcedIds dependency (managed inside) but actually need to be careful. 
    // Wait, if I use setAnnouncedIds(prev => ...), I don't need announcedIds in dependency array if I don't read it outside.
    // But I DO read it in the filter: !announcedIds.has(v.id)
    // So I need it in deps. But setting it triggers effect again.
    // However, newCalls will be empty next time. So it's safe.

    // Actually, to be pure:
    // useEffect depends on [calledQueue, audioEnabled, announcedIds]

    function announceVoter(voter: Voter) {
        // "Monggo, Silahkan {Bapak/Ibu} {nama} untuk mencoblos"
        const prefix = voter.gender ? (voter.gender === 'P' ? 'Ibu' : 'Bapak') : 'Saudara';
        const text = `Panggilan untuk, ${prefix} ${voter.name}, silahkan menuju bilik suara.`;

        // Import dynamically or use global if audio.ts is simple. 
        // Since we are in the same file, let's assume we imported speak.
        // But wait, I need to add the import first.

        // Using the imported utility (will add import)
        speak(text);
    }

    async function fetchQueues() {
        // Fetch Active Calls (Limit 3 newest)
        const { data: called } = await supabase
            .from('voters')
            .select('*')
            .eq('status', 'called')
            .order('called_at', { ascending: false }) // Newest first
            .limit(3);

        // Fetch Next Up (Limit 5)
        const { data: waiting } = await supabase
            .from('voters')
            .select('*')
            .eq('status', 'checked_in')
            .order('queue_timestamp', { ascending: true }) // Oldest checked-in first
            .limit(5);

        setCalledQueue(called || []);
        setNextQueue(waiting || []);
    }

    return (
        <div className="min-h-screen bg-slate-950 p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden relative">
            {/* Audio Enable Overlay/Button */}
            {!audioEnabled && (
                <div className="absolute top-4 right-4 z-50">
                    <Button
                        onClick={() => {
                            setAudioEnabled(true);
                            speak("Audio diaktifkan");
                        }}
                        variant="destructive"
                        className="animate-pulse font-bold shadow-xl"
                    >
                        <Volume2 className="mr-2" />
                        KLIK UNTUK AKTIFKAN SUARA
                    </Button>
                </div>
            )}

            {/* MAIN STAGE (Called) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
                <header className="flex items-center gap-4 mb-4">
                    <div className="w-4 h-12 bg-amber-500 rounded-full animate-pulse" />
                    <h1 className="text-5xl font-black text-white tracking-tight uppercase">Panggilan <span className="text-amber-500">Voting</span></h1>
                </header>

                <div className="flex-1 flex flex-col gap-6">
                    <AnimatePresence mode="popLayout">
                        {calledQueue.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="flex-1 rounded-[3rem] bg-slate-900/50 border-4 border-dashed border-slate-800 flex items-center justify-center"
                            >
                                <div className="text-center opacity-30">
                                    <Volume2 size={64} className="text-white mx-auto mb-4" />
                                    <p className="text-2xl font-black text-white uppercase tracking-widest">Menunggu Panggilan...</p>
                                </div>
                            </motion.div>
                        ) : (
                            calledQueue.map((voter, idx) => (
                                <motion.div
                                    key={voter.id}
                                    layout
                                    initial={{ opacity: 0, x: -50, scale: 0.9 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className={cn(
                                        "relative overflow-hidden rounded-[2.5rem] shadow-2xl",
                                        idx === 0
                                            ? "bg-gradient-to-r from-amber-500 to-orange-600 flex-1 min-h-[300px]" // Top card bigger
                                            : "bg-slate-800 h-[140px] opacity-80"
                                    )}
                                >
                                    <div className="absolute top-0 right-0 p-8 text-white/10 pointer-events-none">
                                        <Volume2 size={120} />
                                    </div>
                                    <div className="relative z-10 p-8 h-full flex flex-col justify-center">
                                        <div className="flex items-start justify-between">
                                            <Badge className={cn(
                                                "text-lg px-4 py-1.5 font-bold uppercase tracking-widest border-none mb-4",
                                                idx === 0 ? "bg-black/20 text-white" : "bg-white/10 text-white/50"
                                            )}>
                                                {idx === 0 ? 'Sedang Dipanggil' : 'Antrian Panggilan'}
                                            </Badge>
                                            <span className="font-mono text-white/40 font-bold text-xl">#{voter.invitation_code}</span>
                                        </div>
                                        <h2 className={cn(
                                            "font-black text-white leading-none truncate",
                                            idx === 0 ? "text-7xl md:text-8xl" : "text-4xl"
                                        )}>
                                            {voter.name}
                                        </h2>
                                        {idx === 0 && (
                                            <p className="text-white/80 font-bold text-2xl mt-4 animate-pulse">
                                                Silahkan menuju bilik suara...
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* UP NEXT (Waiting) */}
            <div className="lg:col-span-4 bg-slate-900 rounded-[3rem] p-8 border border-white/5 flex flex-col shadow-2xl">
                <header className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <Clock className="text-blue-500" />
                        Akan Dipanggil
                    </h2>
                    <Badge variant="outline" className="border-white/20 text-white/50">{nextQueue.length} Next</Badge>
                </header>

                <div className="flex-1 space-y-4">
                    {nextQueue.map((voter, idx) => (
                        <Card key={voter.id} className="bg-white/5 border-none text-white hover:bg-white/10 transition-colors">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-sm">
                                    {idx + 1}
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="font-bold text-lg truncate">{voter.name}</h3>
                                    <p className="text-xs text-white/40 font-mono tracking-wider">{voter.invitation_code}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {nextQueue.length === 0 && (
                        <div className="text-center text-white/20 py-10 italic">
                            Tidak ada antrian berikutnya
                        </div>
                    )}
                </div>

                <div className="mt-8 p-6 bg-blue-900/20 rounded-2xl border border-blue-500/20 text-center">
                    <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Status Antrian</p>
                    <p className="text-white font-medium text-sm">Mohon persiapkan kartu undangan Anda saat dipanggil.</p>
                </div>
            </div>
        </div>
    );
}
