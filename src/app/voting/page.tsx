'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import QRScanner from '@/components/QRScanner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, User, AlertTriangle, Loader2, Camera, ShieldCheck, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/components/UserContext';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

type VotingState = 'standby' | 'selecting' | 'confirming' | 'processing' | 'success';

export default function VotingTerminal() {
    const { toast } = useToast();
    const router = useRouter();
    const { user, hasPermission, isLoading: userLoading } = useUser();
    const [state, setState] = useState<VotingState>('standby');
    const [voter, setVoter] = useState<any | null>(null);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isElectionOpen, setIsElectionOpen] = useState<boolean | null>(null);
    const [auditId, setAuditId] = useState<string | null>(null);
    const [scannerKey, setScannerKey] = useState(0);

    // Video Recording Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadCandidates();
        checkElectionStatus();
    }, []);

    async function checkElectionStatus() {
        const { data } = await supabase.from('settings').select('value').eq('id', 'election_config').single();
        if (data?.value) {
            setIsElectionOpen(data.value.is_voting_open !== false);
        } else {
            setIsElectionOpen(true); // Fallback
        }
    }

    // Real-time listener for election status
    useEffect(() => {
        const channel = supabase
            .channel('settings_changes')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'settings',
                filter: 'id=eq.election_config'
            }, (payload) => {
                if (payload.new && (payload.new as any).value) {
                    setIsElectionOpen((payload.new as any).value.is_voting_open !== false);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    async function loadCandidates() {
        const { data } = await supabase
            .from('candidates')
            .select('*')
            .order('display_order', { ascending: true });
        if (data) setCandidates(data);
    }

    // Permission Check
    useEffect(() => {
        if (!userLoading && !user) {
            router.push('/login?redirect=/voting');
        } else if (!userLoading && user && !hasPermission('access_voting_terminal')) {
            toast({
                title: "Akses Ditolak",
                description: "Anda tidak memiliki izin untuk membuka Bilik Suara.",
                variant: "destructive"
            });
            router.push('/');
        }
    }, [user, userLoading, hasPermission, router, toast]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            streamRef.current = stream;
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.start();
            console.log("Recording started");
        } catch (err) {
            console.error("Camera access denied or error:", err);
            // We proceed even if camera fails, but log error
            toast({
                title: "Peringatan Kamera",
                description: "Gagal memulai perekaman audit. Pemilihan dilanjutkan.",
                variant: "destructive"
            });
        }
    };

    const uploadSnapshot = async (voterId: string, dataUrl: string): Promise<string | null> => {
        try {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const fileName = `snapshot_${voterId}_${Date.now()}.jpg`;

            const { data, error } = await supabase.storage
                .from('voting-audits')
                .upload(fileName, blob, { contentType: 'image/jpeg' });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('voting-audits')
                .getPublicUrl(data.path);

            return publicUrl;
        } catch (err) {
            console.error("Snapshot upload failed:", err);
            return null;
        }
    };

    const stopAndUploadVideo = async (voterId: string): Promise<string | null> => {
        return new Promise((resolve) => {
            if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
                resolve(null);
                return;
            }

            mediaRecorderRef.current.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const fileName = `audit_${voterId}_${Date.now()}.webm`;

                try {
                    const { data, error } = await supabase.storage
                        .from('voting-audits')
                        .upload(fileName, blob);

                    if (error) throw error;

                    const { data: { publicUrl } } = supabase.storage
                        .from('voting-audits')
                        .getPublicUrl(data.path);

                    resolve(publicUrl);
                } catch (err) {
                    console.error("Video upload failed:", err);
                    resolve(null);
                } finally {
                    // Cleanup stream
                    if (streamRef.current) {
                        streamRef.current.getTracks().forEach(track => track.stop());
                    }
                }
            };

            mediaRecorderRef.current.stop();
        });
    };

    const handleScanSuccess = async (invitationCode: string, snapshotDataUrl?: string) => {
        if (!isElectionOpen) {
            toast({ title: "Pemilihan Ditutup", description: "Saat ini pemilihan sedang tidak aktif.", variant: "destructive" });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Verify Voter
            const { data: voterData, error: vError } = await supabase
                .from('voters')
                .select('*')
                .eq('invitation_code', invitationCode)
                .single();

            if (vError || !voterData) {
                setError("Kode Undangan Tidak Valid");
                setTimeout(resetTerminal, 3000);
                return;
            }

            // 2. Check if already voted
            if (voterData.has_voted) {
                setError("Anda sudah menggunakan hak pilih Anda.");
                setTimeout(resetTerminal, 5000);
                return;
            }

            // 3. Check if checked-in (is_present)
            if (!voterData.is_present) {
                setError("Anda belum melakukan registrasi/check-in di meja pendaftaran.");
                setTimeout(resetTerminal, 5000);
                return;
            }

            // Success validation - START AUDIT RECORDING
            setVoter(voterData);
            setState('selecting');

            // Upload snapshot and create audit record early
            let currentAuditId = null;
            if (snapshotDataUrl) {
                const snapshotUrl = await uploadSnapshot(voterData.id, snapshotDataUrl);
                if (snapshotUrl) {
                    const { data: auditData } = await supabase.from('voting_audits').insert({
                        voter_id: voterData.id,
                        snapshot_url: snapshotUrl
                    }).select().single();
                    if (auditData) setAuditId(auditData.id);
                }
            }

            // Delay recording to ensure scanner has released the camera
            setTimeout(() => {
                startRecording();
            }, 800);

        } catch (err) {
            setError("Terjadi kesalahan sistem.");
        } finally {
            setLoading(false);
        }
    };

    const handleVoteSubmit = async () => {
        if (!selectedCandidate || !voter) return;

        setState('processing');
        setLoading(true);

        try {
            // 1. Record Vote (Anonymized)
            const { error: vError } = await supabase
                .from('votes')
                .insert({
                    candidate_id: selectedCandidate.id,
                    is_valid: true,
                    recorded_by: user?.user_id // Record which terminal did this
                });

            if (vError) throw vError;

            // 2. Mark Voter as Done
            const { error: uError } = await supabase
                .from('voters')
                .update({
                    has_voted: true,
                    voted_at: new Date().toISOString()
                })
                .eq('id', voter.id);

            if (uError) throw uError;

            // 3. Upload Audit Video and Update link
            // We do this in background to avoid blocking the user
            stopAndUploadVideo(voter.id).then(async (videoUrl) => {
                if (videoUrl) {
                    if (auditId) {
                        await supabase.from('voting_audits')
                            .update({ video_url: videoUrl })
                            .eq('id', auditId);
                    } else {
                        await supabase.from('voting_audits').insert({
                            voter_id: voter.id,
                            video_url: videoUrl
                        });
                    }
                }
            });

            // 4. Success state
            setState('success');

            // Reset terminal after success
            setTimeout(() => {
                resetTerminal();
            }, 3000);

        } catch (err: any) {
            console.error("Vote submission error:", err);
            setError(`Gagal merekam suara: ${err.message || "Unknown error"}. Hubungi panitia.`);
            // Don't go back to selecting immediately if it's a critical error
            // But let's keep it for now so they can retry if it's a connection issue
            setState('selecting');
        } finally {
            setLoading(false);
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = direction === 'left' ? -400 : 400;
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const resetTerminal = () => {
        setState('standby');
        setVoter(null);
        setSelectedCandidate(null);
        setAuditId(null);
        setError(null);
        setLoading(false);
        setScannerKey(prev => prev + 1);

        // Ensure recorder stops if it was running and cleanup stream
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            try { mediaRecorderRef.current.stop(); } catch (e) { }
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    if (isElectionOpen === null || (userLoading)) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-white">
                <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
                <p className="text-slate-400 font-bold uppercase tracking-widest animate-pulse">Menghubungkan ke Sistem...</p>
            </div>
        );
    }

    if (!isElectionOpen && state === 'standby') {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-white overflow-hidden relative">
                {/* Background Decorations */}
                <div className="absolute inset-0 z-0 opacity-20">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-600 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600 rounded-full blur-[120px]" />
                </div>

                <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
                    <div className="w-24 h-24 bg-rose-500/10 border border-rose-500/20 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-rose-500/10">
                        <AlertTriangle size={48} className="text-rose-500" />
                    </div>
                    <h1 className="text-5xl font-black mb-4 uppercase italic tracking-tighter">Bilik Suara <span className="text-rose-500">Ditutup</span></h1>
                    <p className="text-slate-400 font-medium text-lg leading-relaxed mb-10">
                        Pemungutan suara saat ini sedang tidak aktif atau sudah berakhir. Silakan hubungi petugas panitia untuk informasi lebih lanjut.
                    </p>
                    <div className="flex flex-col w-full gap-4">
                        <Button
                            className="h-14 rounded-2xl bg-white text-slate-900 font-black text-lg hover:bg-slate-100 transition-all active:scale-95"
                            onClick={() => window.location.reload()}
                        >
                            REFRESH HALAMAN
                        </Button>
                        <Button
                            variant="ghost"
                            className="text-slate-500 hover:text-white font-bold"
                            onClick={() => router.push('/')}
                        >
                            KEMBALI KE BERANDA
                        </Button>
                    </div>
                </div>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-700 uppercase tracking-[0.4em]">
                    APRT 2026 • E-VOTING SYSTEM
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 font-sans selection:bg-indigo-500 selection:text-white">
            {/* Background Decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-8 h-screen flex flex-col">
                {/* Slim Top Bar */}
                <header className="fixed top-0 inset-x-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-white/5">
                    <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                                <ShieldCheck size={18} className="text-indigo-400" />
                            </div>
                            <h2 className="text-sm font-black text-white italic tracking-tighter uppercase">
                                Terminal Suara <span className="text-indigo-500">Digital</span>
                            </h2>
                        </div>

                        <div className="flex items-center gap-4">
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 py-0.5 px-3 text-[10px]">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
                                SISTEM AKTIF
                            </Badge>
                            <span className="text-white/30 text-[10px] font-black uppercase tracking-widest">APRT 2026</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto flex flex-col items-center justify-center py-8">
                    {state === 'standby' && (
                        <div className="w-full max-w-2xl animate-in fade-in zoom-in duration-500">
                            <Card className="bg-white/5 backdrop-blur-2xl border-white/10 border-2 overflow-hidden shadow-2xl">
                                <CardContent className="p-0">
                                    <div className="aspect-square md:aspect-[16/10] bg-slate-900 relative">
                                        <QRScanner
                                            key={scannerKey}
                                            onScanSuccess={handleScanSuccess}
                                            onScanError={(err) => console.error(err)}
                                            autoStart={true}
                                            compact={true}
                                        />
                                        <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none">
                                            <div className="flex items-center gap-4 text-white">
                                                <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                                                    <Camera size={24} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-2xl uppercase italic tracking-tighter">Scan Undangan</p>
                                                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Arahkan QR Code ke Kamera</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {error && (
                                <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-4 text-rose-400 animate-pulse">
                                    <AlertTriangle size={24} className="shrink-0" />
                                    <div>
                                        <p className="font-bold">{error}</p>
                                        <p className="text-[10px] uppercase tracking-widest font-black opacity-50 mt-1">Terminal akan reset otomatis dalam beberapa detik...</p>
                                    </div>
                                    <Button size="sm" variant="ghost" className="ml-auto hover:bg-rose-500/20" onClick={() => resetTerminal()}>Reset</Button>
                                </div>
                            )}

                            <div className="mt-8 grid grid-cols-3 gap-4">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                                    <div className="text-white/40 mb-1"><Info size={16} className="mx-auto" /></div>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Langkah 1</p>
                                    <p className="text-xs text-white/70 font-bold">Scan Undangan</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                                    <div className="text-white/40 mb-1"><User size={16} className="mx-auto" /></div>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Langkah 2</p>
                                    <p className="text-xs text-white/70 font-bold">Pilih Kandidat</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                                    <div className="text-white/40 mb-1"><CheckCircle2 size={16} className="mx-auto" /></div>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Langkah 3</p>
                                    <p className="text-xs text-white/70 font-bold">Selesai</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {state === 'selecting' && (
                        <div className="w-full h-full flex flex-col animate-in slide-in-from-bottom-10 duration-500 overflow-hidden pt-10">
                            <div className="text-center mb-0 shrink-0">
                                <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-0.5">Pilih <span className="text-indigo-500">Kandidat</span></h1>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] flex items-center justify-center gap-2">
                                    <User size={12} className="text-indigo-400" />
                                    {voter?.name} • Geser untuk melihat semua
                                </p>
                            </div>

                            {/* Netflix-style Slider Container */}
                            <div className="relative flex-1 flex items-center group min-h-0 w-full overflow-hidden">
                                {candidates.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => scroll('left')}
                                            className="absolute left-2 z-20 w-12 h-12 bg-slate-900/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-all rounded-full hover:bg-indigo-600 shadow-xl"
                                        >
                                            <ChevronLeft size={24} />
                                        </button>
                                        <button
                                            onClick={() => scroll('right')}
                                            className="absolute right-2 z-20 w-12 h-12 bg-slate-900/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-all rounded-full hover:bg-indigo-600 shadow-xl"
                                        >
                                            <ChevronRight size={24} />
                                        </button>
                                    </>
                                )}

                                <div
                                    ref={scrollContainerRef}
                                    className={cn(
                                        "flex gap-8 overflow-x-auto px-16 pb-12 pt-20 no-scrollbar items-center h-full w-full",
                                        candidates.length <= 2 ? "justify-center" : "justify-start"
                                    )}
                                    style={{ scrollSnapType: 'x mandatory' }}
                                >
                                    {candidates.map((candidate) => (
                                        <Card
                                            key={candidate.id}
                                            className={cn(
                                                "w-[260px] md:w-[300px] aspect-[3/4] bg-slate-900 border-4 transition-all duration-300 cursor-pointer group/card shrink-0 scroll-snap-align-start flex flex-col relative",
                                                selectedCandidate?.id === candidate.id
                                                    ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_50px_rgba(99,102,241,0.3)] scale-[1.02]'
                                                    : 'border-white/10 bg-white/5 hover:border-white/30'
                                            )}
                                            style={{ overflow: 'visible' }}
                                            onClick={() => setSelectedCandidate(candidate)}
                                        >
                                            <div className="flex-1 relative bg-slate-800 overflow-hidden rounded-t-xl">
                                                {candidate.photo_url ? (
                                                    <img
                                                        src={candidate.photo_url}
                                                        alt={candidate.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-white/10">
                                                        <User size={100} />
                                                    </div>
                                                )}

                                                {/* Selection Marker */}
                                                {selectedCandidate?.id === candidate.id && (
                                                    <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center backdrop-blur-[2px]">
                                                        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl animate-in zoom-in duration-300">
                                                            <CheckCircle2 size={56} className="text-indigo-600" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Number Overlay moved outside the overflow-hidden div */}
                                            <div className="absolute top-[-15px] left-[-15px] w-12 h-12 rounded-full bg-slate-950/90 backdrop-blur-md flex items-center justify-center border-2 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] z-30">
                                                <span className="text-2xl font-black text-white">{candidate.display_order + 1}</span>
                                            </div>

                                            <CardContent className="p-5 text-center shrink-0 bg-slate-900/50 backdrop-blur-sm border-t border-white/5 rounded-b-xl">
                                                <h3 className="text-2xl font-black text-white uppercase tracking-tight truncate leading-tight">{candidate.name}</h3>
                                                <p className="text-indigo-400 font-bold text-xs mt-1 tracking-[0.2em]">KANDIDAT #{candidate.display_order + 1}</p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-4 flex flex-col items-center pb-8 shrink-0">
                                {error && (
                                    <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2">
                                        <AlertTriangle size={16} className="text-rose-500" />
                                        <p className="text-rose-500 text-xs font-bold uppercase">{error}</p>
                                    </div>
                                )}
                                <Button
                                    size="lg"
                                    className={`h-16 px-12 text-xl font-black rounded-3xl transition-all duration-500 ${selectedCandidate
                                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)] px-16 scale-105'
                                        : 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed'
                                        }`}
                                    disabled={!selectedCandidate || loading}
                                    onClick={() => setState('confirming')}
                                >
                                    {selectedCandidate ? 'LANJUTKAN KONFIRMASI' : 'SILAKAN PILIH KANDIDAT'}
                                </Button>
                            </div>

                            <style jsx global>{`
                                .no-scrollbar::-webkit-scrollbar { display: none; }
                                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                                .scroll-snap-align-start { scroll-snap-align: start; }
                            `}</style>
                        </div>
                    )}

                    {state === 'confirming' && (
                        <div className="w-full max-w-lg animate-in zoom-in duration-300 flex flex-col justify-center">
                            <Card className="bg-slate-900 border-2 border-indigo-500/30 overflow-hidden shadow-[0_0_100px_rgba(99,102,241,0.2)]">
                                <CardHeader className="text-center p-6 bg-indigo-500/5 border-b border-white/10">
                                    <CardTitle className="text-2xl font-black text-white uppercase italic tracking-tighter">Konfirmasi Suara</CardTitle>
                                    <CardDescription className="text-slate-400 font-bold text-xs">Pastikan pilihan Anda sudah benar.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="flex items-center gap-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-800 border-2 border-indigo-500 shrink-0 shadow-lg">
                                            {selectedCandidate?.photo_url ? (
                                                <img src={selectedCandidate.photo_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white/10"><User size={30} /></div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">Pilihan Anda</p>
                                            <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none mb-1">{selectedCandidate?.name}</h3>
                                            <p className="text-slate-400 font-bold italic text-xs">Nomor Urut {selectedCandidate?.display_order + 1}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <Button
                                            className="w-full h-16 text-2xl font-black bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-500/20"
                                            onClick={handleVoteSubmit}
                                            disabled={loading}
                                        >
                                            {loading ? <Loader2 className="animate-spin mr-3" size={24} /> : null}
                                            OK, SIMPAN SUARA
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="w-full h-12 text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5"
                                            onClick={() => setState('selecting')}
                                            disabled={loading}
                                        >
                                            UBAH PILIHAN
                                        </Button>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-white/5 p-3 flex justify-center border-t border-white/10">
                                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                                        AUDIT AKTIF
                                    </p>
                                </CardFooter>
                            </Card>
                        </div>
                    )}

                    {state === 'processing' && (
                        <div className="text-center animate-pulse">
                            <div className="relative w-32 h-32 mx-auto mb-8">
                                <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
                                <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin" />
                                <ShieldCheck className="absolute inset-0 m-auto text-indigo-500" size={48} />
                            </div>
                            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">MEREKAM SUARA ANDA</h2>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Harap tunggu sebentar, data sedang diamankan...</p>
                        </div>
                    )}

                    {state === 'success' && (
                        <div className="w-full max-w-2xl animate-in fade-in zoom-in duration-700">
                            <div className="text-center space-y-8">
                                <div className="relative w-48 h-48 mx-auto">
                                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
                                    <div className="relative w-full h-full bg-slate-900 rounded-[2.5rem] border-2 border-emerald-500/30 flex items-center justify-center shadow-2xl">
                                        <CheckCircle2 size={80} className="text-emerald-500 animate-in zoom-in duration-500 delay-300" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h1 className="text-6xl font-black text-white uppercase tracking-tighter italic">TERIMA KASIH!</h1>
                                    <p className="text-2xl font-bold text-slate-400 uppercase tracking-widest">Suara Anda telah berhasil direkam dengan aman.</p>
                                </div>
                                <div className="pt-8 flex flex-col items-center gap-4">
                                    <div className="h-1.5 w-64 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 animate-progress" style={{ animationDuration: '3s' }} />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Mereset Terminal dalam beberapa detik...</p>
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* Footer Info */}
                <footer className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center text-white/40 font-bold text-[10px] uppercase tracking-widest shrink-0">
                    <div>© 2026 PANITIA PEMILIHAN RT 12</div>
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-emerald-500" /> ANONYMOUS ENCRYPTION</span>
                        <span className="flex items-center gap-1.5"><Camera size={12} className="text-indigo-500" /> VIDEO AUDIT ACTIVE</span>
                    </div>
                </footer>
            </div>

            {/* Transition Screens overlay */}
            {state === 'standby' && loading && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="animate-spin text-indigo-500 mx-auto mb-4" size={48} />
                        <p className="text-white font-black uppercase italic tracking-widest">Memproses Undangan...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
