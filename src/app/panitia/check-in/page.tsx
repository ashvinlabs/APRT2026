'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import QRScanner from '@/components/QRScanner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, User, Clock, AlertTriangle, QrCode } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Lock } from 'lucide-react';

interface Voter {
    id: string;
    name: string;
    nik: string;
    address: string;
    is_present: boolean;
}

interface CheckInResult {
    success: boolean;
    message: string;
    voter?: Voter;
}

interface RecentCheckIn {
    id: string;
    name: string;
    time: string;
    success: boolean;
}

import PermissionGuard from '@/components/PermissionGuard';

export default function CheckInInterface() {
    const [result, setResult] = useState<CheckInResult | null>(null);
    const [processing, setProcessing] = useState(false);
    const [recentCheckIns, setRecentCheckIns] = useState<RecentCheckIn[]>([]);
    const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);

    // Initial check for registration status
    useState(() => {
        supabase
            .from('settings')
            .select('value')
            .eq('id', 'election_config')
            .single()
            .then(({ data }) => {
                if (data?.value) {
                    // Default to true if undefined to prevent lockout on legacy config
                    setIsRegistrationOpen(data.value.is_registration_open !== false);
                }
            });

        // Real-time listener for settings
        const sub = supabase
            .channel('checkin_settings')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: 'id=eq.election_config' }, (payload: any) => {
                if (payload.new?.value) {
                    setIsRegistrationOpen(payload.new.value.is_registration_open !== false);
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(sub); };
    });

    async function handleScan(voterId: string) {
        if (processing) return;

        if (!isRegistrationOpen) {
            setResult({
                success: false,
                message: 'Pendaftaran Check-in telah DITUTUP oleh panitia.'
            });
            playErrorSound();
            setTimeout(() => setResult(null), 3000);
            return;
        }

        setProcessing(true);
        setResult(null);

        try {
            // Query voter by invitation code (scanned value)
            const { data: voter, error } = await supabase
                .from('voters')
                .select('*')
                .eq('invitation_code', voterId)
                .single();

            if (error || !voter) {
                setResult({
                    success: false,
                    message: 'Kode undangan tidak valid'
                });
                addRecentCheckIn(voterId, 'Tidak Ditemukan', false);
                playErrorSound();
                return;
            }

            // Check if already present
            if (voter.is_present) {
                setResult({
                    success: false,
                    message: 'Pemilih sudah melakukan check-in sebelumnya',
                    voter
                });
                addRecentCheckIn(voter.id, voter.name, false);
                playErrorSound();
                return;
            }

            // Mark as present
            const { error: updateError } = await supabase
                .from('voters')
                .update({ is_present: true })
                .eq('id', voter.id);

            if (updateError) {
                setResult({
                    success: false,
                    message: 'Gagal mencatat kehadiran'
                });
                playErrorSound();
                return;
            }

            // Success!
            setResult({
                success: true,
                message: 'Check-in berhasil! Pemilih dapat mengambil surat suara.',
                voter: { ...voter, is_present: true }
            });
            addRecentCheckIn(voter.id, voter.name, true);
            playSuccessSound();

            // Auto-clear after 3 seconds
            setTimeout(() => setResult(null), 3000);

        } catch (err) {
            console.error('Check-in error:', err);
            setResult({
                success: false,
                message: 'Terjadi kesalahan sistem'
            });
            playErrorSound();
        } finally {
            setProcessing(false);
        }
    }

    function addRecentCheckIn(id: string, name: string, success: boolean) {
        const newCheckIn: RecentCheckIn = {
            id,
            name,
            time: new Date().toLocaleTimeString('id-ID'),
            success
        };
        setRecentCheckIns(prev => [newCheckIn, ...prev].slice(0, 10));
    }

    function playSuccessSound() {
        // Simple beep for success
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE=');
        audio.play().catch(() => { });
    }

    function playErrorSound() {
        // Simple beep for error
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE=');
        audio.play().catch(() => { });
    }

    return (
        <PermissionGuard permission="mark_presence">
            <div className="p-8 max-w-6xl mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <QrCode size={24} className="text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900">Check-In Pemilih</h1>
                            <p className="text-slate-500 font-medium">Scan QR code untuk verifikasi kehadiran</p>
                        </div>
                    </div>
                </header>

                {!isRegistrationOpen && (
                    <div className="mb-8 p-6 bg-rose-50 border-2 border-dashed border-rose-200 rounded-[2rem] flex items-center justify-center gap-4 animate-pulse">
                        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-500">
                            <Lock size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-rose-900 uppercase tracking-widest">Pendaftaran Ditutup</h3>
                            <p className="text-rose-700 font-medium">Scanning QR Code tidak akan diproses saat ini.</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Scanner Section */}
                    <div className="lg:col-span-2">
                        <QRScanner
                            onScanSuccess={handleScan}
                            onScanError={(error) => console.error('Scanner error:', error)}
                            disabled={!isRegistrationOpen}
                        />

                        {/* Result Display */}
                        {result && (
                            <Card className={`mt-6 ${result.success ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${result.success ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                            {result.success ? <CheckCircle2 size={24} className="text-white" /> : <XCircle size={24} className="text-white" />}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`text-lg font-bold mb-1 ${result.success ? 'text-emerald-900' : 'text-rose-900'}`}>
                                                {result.success ? 'Berhasil!' : 'Gagal'}
                                            </h3>
                                            <p className={`font-medium mb-3 ${result.success ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                {result.message}
                                            </p>
                                            {result.voter && (
                                                <div className="bg-white rounded-lg p-4 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <User size={16} className="text-slate-400" />
                                                        <span className="font-bold text-slate-900">{result.voter.name}</span>
                                                    </div>
                                                    <div className="text-sm text-slate-600">
                                                        <p>NIK: {result.voter.nik}</p>
                                                        <p>Alamat: {result.voter.address}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Recent Check-ins */}
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Clock size={20} />
                                    Riwayat Terakhir
                                </CardTitle>
                                <CardDescription>10 check-in terbaru</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {recentCheckIns.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400">
                                        <AlertTriangle size={32} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Belum ada check-in</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {recentCheckIns.map((checkIn, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm text-slate-900 truncate">{checkIn.name}</p>
                                                    <p className="text-xs text-slate-500">{checkIn.time}</p>
                                                </div>
                                                <Badge variant={checkIn.success ? "default" : "destructive"} className="ml-2">
                                                    {checkIn.success ? '✓' : '✗'}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </PermissionGuard>
    );
}
