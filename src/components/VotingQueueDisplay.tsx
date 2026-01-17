'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Clock, Volume2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';


interface Voter {
    id: string;
    name: string;
    invitation_code: string;
    status: 'registered' | 'checked_in' | 'called' | 'voted';
    queue_timestamp: string;
    called_at?: string;
    gender?: 'L' | 'P';
}

export default function VotingQueueDisplay() {
    const [calledQueue, setCalledQueue] = useState<Voter[]>([]);
    const [nextQueue, setNextQueue] = useState<Voter[]>([]);
    const [page, setPage] = useState(0);
    const ITEMS_PER_PAGE = 5;
    const MAX_ITEMS = 25; // Fetch up to 25 items (5 pages max)

    const totalPages = Math.ceil(nextQueue.length / ITEMS_PER_PAGE) || 1;

    const [tickerQueue, setTickerQueue] = useState<Voter[]>([]);
    const [tickerPage, setTickerPage] = useState(0);
    const TICKER_ITEMS_PER_PAGE = 5;
    const TICKER_TOTAL_PAGES = Math.ceil(tickerQueue.length / TICKER_ITEMS_PER_PAGE) || 1;

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

    useEffect(() => {
        const interval = setInterval(() => {
            setPage(prev => (prev + 1) % totalPages);
        }, 5000); // 5 seconds
        return () => clearInterval(interval);
    }, [totalPages]);

    // Ticker Rotation
    useEffect(() => {
        if (TICKER_TOTAL_PAGES <= 1) return;
        const interval = setInterval(() => {
            setTickerPage(prev => (prev + 1) % TICKER_TOTAL_PAGES);
        }, 5000); // 5 seconds per ticker slide
        return () => clearInterval(interval);
    }, [TICKER_TOTAL_PAGES]);

    // TTS Logic Removed as per request (Only Staff Controller triggers TTS)

    async function fetchQueues() {
        // Fetch Active Calls (Limit 3 newest)
        const { data: called } = await supabase
            .from('voters')
            .select('*')
            .eq('status', 'called')
            .order('called_at', { ascending: false }) // Newest first
            .limit(3);

        // Fetch Next Up (Limit 25 for 5 pages)
        const { data: waiting } = await supabase
            .from('voters')
            .select('*')
            .eq('status', 'checked_in')
            .order('queue_timestamp', { ascending: true }) // Oldest checked-in first
            .limit(MAX_ITEMS);

        // Fetch Ticker (Limit 12 newest check-ins to make 3 even pages of 4)
        const { data: recent } = await supabase
            .from('voters')
            .select('*')
            .neq('status', 'registered') // Include checked_in, called, voted
            .not('queue_timestamp', 'is', null)
            .order('queue_timestamp', { ascending: false })
            .limit(15);

        setCalledQueue(called || []);
        setNextQueue(waiting || []);
        setTickerQueue(recent || []);
    }

    return (
        <div className="min-h-screen bg-slate-950 p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden relative">
            {/* Audio Button Removed */}

            {/* MAIN STAGE (Called) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
                <header className="flex items-center gap-4 mb-4">
                    <div className="w-4 h-12 bg-amber-500 rounded-full animate-pulse" />
                    <h1 className="text-5xl font-black text-white tracking-tight uppercase">Panggilan <span className="text-amber-500">Voting</span></h1>
                </header>

                <div className="flex-1 grid grid-rows-3 gap-4">
                    <AnimatePresence mode="popLayout">
                        {calledQueue.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="row-span-3 rounded-[3rem] bg-slate-900/50 border-4 border-dashed border-slate-800 flex items-center justify-center p-12"
                            >
                                <div className="text-center opacity-30">
                                    <Volume2 size={64} className="text-white mx-auto mb-4" />
                                    <p className="text-2xl font-black text-white uppercase tracking-widest">Menunggu Panggilan...</p>
                                </div>
                            </motion.div>
                        ) : (
                            calledQueue.map((voter) => (
                                <motion.div
                                    key={voter.id}
                                    layout
                                    initial={{ opacity: 0, x: -50, scale: 0.9 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.8, ease: "easeInOut" } }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 30
                                    }}
                                    className="relative overflow-hidden rounded-[2rem] shadow-xl bg-gradient-to-r from-amber-500 to-orange-600 flex items-center px-8 sm:px-12"
                                >
                                    <div className="absolute top-0 right-0 p-4 text-white/10 pointer-events-none">
                                        <Volume2 size={100} />
                                    </div>
                                    <div className="relative z-10 w-full flex items-center justify-between gap-6">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <Badge className="bg-black/20 text-white border-none font-bold uppercase tracking-wider">
                                                    Sedang Dipanggil
                                                </Badge>
                                                <span className="font-mono text-white/60 font-bold">#{voter.invitation_code}</span>
                                            </div>
                                            <h2 className="font-black text-white text-4xl sm:text-5xl md:text-6xl truncate leading-tight">
                                                {voter.name}
                                            </h2>
                                        </div>
                                        <div className="shrink-0 hidden sm:block">
                                            <p className="text-white/80 font-bold text-lg text-right leading-tight">
                                                Silahkan ke<br />Bilik Suara
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* CHECK-IN TICKER */}
            <div className="absolute bottom-0 left-0 right-0 bg-emerald-900/90 border-t-2 border-emerald-500/50 backdrop-blur-md z-40 overflow-hidden h-16 flex items-center">
                <div className="bg-emerald-600 h-full px-6 flex items-center justify-center shrink-0 shadow-xl z-10 relative">
                    <span className="font-black text-white uppercase tracking-widest text-sm flex items-center gap-2">
                        <Users size={18} />
                        Terakhir Check-in
                    </span>
                    <div className="absolute -right-4 top-0 bottom-0 w-8 bg-gradient-to-r from-emerald-600 to-transparent" />
                </div>

                <div className="flex-1 flex items-center overflow-hidden relative h-full">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {tickerQueue.length > 0 ? (
                            <motion.div
                                key={tickerPage}
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -50, opacity: 0 }}
                                transition={{ duration: 0.5, ease: "backOut" }}
                                className="absolute inset-0 flex items-center justify-center gap-8"
                            >
                                {tickerQueue.slice(tickerPage * TICKER_ITEMS_PER_PAGE, (tickerPage + 1) * TICKER_ITEMS_PER_PAGE).map((voter) => (
                                    <div key={voter.id} className="flex items-center gap-3 min-w-[200px]">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                                        <div className="flex flex-col leading-none">
                                            <span className="text-white font-bold text-lg truncate max-w-[150px]">{voter.name}</span>
                                            <span className="text-emerald-300 text-xs font-mono opacity-80 flex items-center gap-1 mt-0.5">
                                                <Clock size={10} />
                                                {new Date(voter.queue_timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="text-white/50 italic px-4"
                            >
                                Belum ada pemilih yang check-in baru-baru ini...
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* UP NEXT (Waiting) */}
            <div className="lg:col-span-4 bg-slate-900 rounded-[3rem] p-8 border border-white/5 flex flex-col shadow-2xl mb-16">
                <header className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <Clock className="text-blue-500" />
                        Akan Dipanggil
                    </h2>
                    <div className="flex flex-col items-end">
                        <Badge variant="outline" className="border-white/20 text-white/50 mb-1">{nextQueue.length} Antrian</Badge>
                        <span className="text-[10px] text-white/30 font-mono">Halaman {page + 1}/{totalPages}</span>
                    </div>
                </header>

                <div className="flex-1 space-y-4 relative min-h-[420px]">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {nextQueue.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE).map((voter, idx) => (
                            <motion.div
                                key={voter.id}
                                layout
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.8, delay: idx * 0.1 }}
                            >
                                <Card className="bg-white/5 border-none text-white hover:bg-white/10 transition-colors">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-sm">
                                            {(page * ITEMS_PER_PAGE) + idx + 1}
                                        </div>
                                        <div className="overflow-hidden">
                                            <h3 className="font-bold text-lg truncate">{voter.name}</h3>
                                            <p className="text-xs text-white/40 font-mono tracking-wider">{voter.invitation_code}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {nextQueue.length === 0 && (
                        <div className="text-center text-white/20 py-10 italic">
                            Tidak ada antrian berikutnya
                        </div>
                    )}
                </div>

                <div className="mt-4 flex justify-center gap-2 mb-4">
                    {Array.from({ length: totalPages }).map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full overflow-hidden relative transition-all duration-300 ${i === page ? 'w-8 bg-blue-500/30' : 'w-1.5 bg-white/20'}`}
                        >
                            {i === page && (
                                <motion.div
                                    className="absolute inset-0 bg-blue-500"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 5, ease: "linear" }}
                                />
                            )}
                        </div>
                    ))}
                </div>

                <div className="p-6 bg-blue-900/20 rounded-2xl border border-blue-500/20 text-center">
                    <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Status Antrian</p>
                    <p className="text-white font-medium text-sm">Mohon persiapkan kartu undangan Anda saat dipanggil.</p>
                </div>
            </div>
        </div>
    );
}
