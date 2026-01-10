'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { KeyRound, Loader2, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [sessionValid, setSessionValid] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // 1. Listen for auth state changes (most robust way)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('ResetPasswordPage: Auth event:', event, session ? 'Session exists' : 'No session');
            if (session) {
                setSessionValid(true);
                setCheckingSession(false);
                setError(null);
            }
        });

        // 2. Initial check
        const checkRecoverySession = async () => {
            try {
                const { data: { session: existingSession } } = await supabase.auth.getSession();

                if (existingSession) {
                    console.log('ResetPasswordPage: Session found immediately');
                    setSessionValid(true);
                    setCheckingSession(false);
                    return;
                }

                // Check URL for access_token or recovery markers
                const hash = window.location.hash || '';
                const searchParams = new URLSearchParams(window.location.search);
                const hasToken = hash.includes('access_token=') || searchParams.has('code');
                const isRecovery = hash.includes('type=recovery') || hash.includes('type=invite') || searchParams.get('type') === 'recovery';

                if (hasToken || isRecovery) {
                    console.log('ResetPasswordPage: Recovery token detected, waiting for session...');

                    // Give Supabase some time to process the token (up to ~6 seconds)
                    for (let i = 0; i < 8; i++) {
                        await new Promise(resolve => setTimeout(resolve, 800));
                        const { data: { session: retrySession } } = await supabase.auth.getSession();

                        if (retrySession) {
                            console.log('ResetPasswordPage: Session obtained after retry', i + 1);
                            setSessionValid(true);
                            setError(null);
                            setCheckingSession(false);
                            return;
                        }
                    }

                    // If still no session after retries
                    setError('Sesi pemulihan tidak ditemukan. Pastikan anda menggunakan link terbaru dari email.');
                } else {
                    setError('Link pemulihan tidak valid atau sudah kadaluarsa. Silakan minta link baru.');
                }
            } catch (err: any) {
                console.error('ResetPasswordPage: Session check error:', err);
                setError('Terjadi kesalahan teknis. Silakan coba lagi.');
            } finally {
                setCheckingSession(false);
            }
        };

        checkRecoverySession();

        return () => subscription.unsubscribe();
    }, [sessionValid]);

    async function handleResetPassword(e: React.FormEvent) {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Konfirmasi password tidak cocok.');
            return;
        }

        if (password.length < 6) {
            setError('Password minimal 6 karakter.');
            return;
        }

        setLoading(true);
        setError(null);

        const { error: updateError } = await supabase.auth.updateUser({ password });

        if (updateError) {
            setError(updateError.message);
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        }
    }

    if (checkingSession) {
        return (
            <div className="relative min-h-screen w-full flex items-center justify-center p-6 overflow-hidden bg-[#fcfcfc]">
                {/* Soft Ambient Light-Leak Background */}
                <div className="absolute inset-0 z-0 opacity-40">
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-100 blur-[120px]" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-blue-50 blur-[150px]" />
                    <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] rounded-full bg-violet-50 blur-[100px]" />
                </div>

                <div className="relative z-10 flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-primary" size={40} />
                    <p className="text-slate-600 font-bold">Memverifikasi sesi...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center p-6 overflow-hidden bg-[#fcfcfc]">
            {/* Soft Ambient Light-Leak Background */}
            <div className="absolute inset-0 z-0 opacity-40">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-100 blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-blue-50 blur-[150px]" />
                <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] rounded-full bg-violet-50 blur-[100px]" />
            </div>

            {/* Content Wrap */}
            <div className="relative z-10 w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <Card className="border-white bg-white/70 backdrop-blur-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="text-center pb-2 pt-10">
                        <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-primary/10 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                            <KeyRound className="text-white w-8 h-8" />
                        </div>
                        <CardTitle className="text-3xl font-black tracking-tight text-slate-900 mb-2">
                            Atur Password Baru
                        </CardTitle>
                        <CardDescription className="text-slate-500 font-medium px-4">
                            Buat password baru untuk akun panitia anda.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-6 px-8 pb-10">
                        {error && (
                            <div className="mb-6 p-4 rounded-2xl bg-red-50 text-red-600 text-sm flex items-center gap-3 border border-red-100 animate-in fade-in zoom-in duration-300">
                                <ShieldAlert size={18} className="shrink-0" />
                                <p className="font-semibold">{error}</p>
                            </div>
                        )}

                        {success ? (
                            <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-100 animate-in fade-in zoom-in duration-300">
                                <div className="flex flex-col items-center gap-4 text-center">
                                    <CheckCircle2 size={56} className="text-emerald-500" />
                                    <div>
                                        <p className="font-black text-emerald-600 text-lg mb-1">
                                            Password Berhasil Diubah!
                                        </p>
                                        <p className="text-sm text-emerald-600 font-medium">
                                            Mengalihkan ke halaman login...
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleResetPassword} className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-slate-400 font-bold ml-1 text-[10px] uppercase tracking-[0.2em]">
                                        Password Baru
                                    </Label>
                                    <Input
                                        type="password"
                                        required
                                        minLength={6}
                                        placeholder="••••••••"
                                        disabled={!sessionValid}
                                        className="h-14 bg-slate-50/50 border-slate-200 text-slate-900 placeholder:text-slate-300 focus:ring-primary focus:border-primary rounded-2xl transition-all text-base disabled:opacity-50"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-400 font-bold ml-1 text-[10px] uppercase tracking-[0.2em]">
                                        Konfirmasi Password
                                    </Label>
                                    <Input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        disabled={!sessionValid}
                                        className="h-14 bg-slate-50/50 border-slate-200 text-slate-900 placeholder:text-slate-300 focus:ring-primary focus:border-primary rounded-2xl transition-all text-base disabled:opacity-50"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading || !sessionValid}
                                    className="w-full h-15 py-7 rounded-2xl font-black text-lg shadow-2xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98] bg-primary hover:bg-primary/90 text-white disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="animate-spin" size={20} />
                                            <span>MEMPERBARUI...</span>
                                        </div>
                                    ) : (
                                        "SIMPAN PASSWORD BARU"
                                    )}
                                </Button>
                            </form>
                        )}

                        <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
                            <button
                                type="button"
                                onClick={() => router.push('/login')}
                                className="text-xs font-bold text-slate-400 hover:text-primary transition-colors flex items-center gap-2"
                            >
                                <span className="text-base">←</span> Kembali ke Login
                            </button>
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">
                                APRT2026 • E-VOTING SYSTEM
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
