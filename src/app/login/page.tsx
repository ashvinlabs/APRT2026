'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { logActivity } from '@/lib/logger';
import { LogIn, Loader2, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recoveryMode, setRecoveryMode] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const router = useRouter();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(authError.message === 'Invalid login credentials'
                ? 'Email atau password salah.'
                : authError.message
            );
            setLoading(false);
        } else {
            await logActivity('login', 'system', {
                detail: `Petugas Login (${email})`
            });
            router.push('/panitia/voters');
            router.refresh();
        }
    }

    async function handleRecovery(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            setError(error.message);
        } else {
            setMessage('Link pemulihan telah dikirim ke email anda.');
        }
        setLoading(false);
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
                            <LogIn className="text-white w-8 h-8" />
                        </div>
                        <CardTitle className="text-3xl font-black tracking-tight text-slate-900 mb-2">
                            {recoveryMode ? 'Pulihkan Akun' : 'Login Panitia'}
                        </CardTitle>
                        <CardDescription className="text-slate-500 font-medium px-4">
                            {recoveryMode
                                ? 'Masukkan email terdaftar untuk menerima link pemulihan password.'
                                : 'Selamat datang kembali di sistem manajemen Pemilu RT 12'}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-6 px-8 pb-10">
                        {error && (
                            <div className="mb-6 p-4 rounded-2xl bg-red-50 text-red-600 text-sm flex items-center gap-3 border border-red-100 animate-in fade-in zoom-in duration-300">
                                <ShieldAlert size={18} className="shrink-0" />
                                <p className="font-semibold">{error}</p>
                            </div>
                        )}

                        {message && (
                            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 text-emerald-600 text-sm flex items-center gap-3 border border-emerald-100 animate-in fade-in zoom-in duration-300">
                                <CheckCircle2 size={18} className="shrink-0" />
                                <p className="font-semibold">{message}</p>
                            </div>
                        )}

                        {!recoveryMode ? (
                            <form onSubmit={handleLogin} className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-slate-400 font-bold ml-1 text-[10px] uppercase tracking-[0.2em]">Email Panitia</Label>
                                    <Input
                                        type="email"
                                        required
                                        placeholder="nama@email.com"
                                        className="h-14 bg-slate-50/50 border-slate-200 text-slate-900 placeholder:text-slate-300 focus:ring-primary focus:border-primary rounded-2xl transition-all text-base"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center ml-1">
                                        <Label className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Password</Label>
                                        <button
                                            type="button"
                                            onClick={() => { setRecoveryMode(true); setError(null); setMessage(null); }}
                                            className="text-[11px] font-black text-primary hover:text-primary/70 transition-colors uppercase tracking-tight"
                                        >
                                            Lupa password?
                                        </button>
                                    </div>
                                    <Input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        className="h-14 bg-slate-50/50 border-slate-200 text-slate-900 placeholder:text-slate-300 focus:ring-primary focus:border-primary rounded-2xl transition-all text-base"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-15 py-7 rounded-2xl font-black text-lg shadow-2xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98] bg-primary hover:bg-primary/90 text-white"
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="animate-spin" size={20} />
                                            <span>MEMPROSES...</span>
                                        </div>
                                    ) : (
                                        "MASUK SEKARANG"
                                    )}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleRecovery} className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-slate-400 font-bold ml-1 text-[10px] uppercase tracking-[0.2em]">Email Terdaftar</Label>
                                    <Input
                                        type="email"
                                        required
                                        placeholder="nama@email.com"
                                        className="h-14 bg-slate-50/50 border-slate-200 text-slate-900 placeholder:text-slate-300 focus:ring-primary focus:border-primary rounded-2xl text-base"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-15 py-7 rounded-2xl font-black text-lg shadow-2xl shadow-primary/20 transition-all bg-primary hover:bg-primary/90 text-white"
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="animate-spin" size={20} />
                                            <span>MENGIRIM...</span>
                                        </div>
                                    ) : (
                                        "KIRIM LINK PEMULIHAN"
                                    )}
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => { setRecoveryMode(false); setError(null); setMessage(null); }}
                                    className="w-full text-center py-2 text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors"
                                >
                                    Kembali ke Halaman Login
                                </button>
                            </form>
                        )}

                        <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
                            <button
                                type="button"
                                onClick={() => router.push('/')}
                                className="text-xs font-bold text-slate-400 hover:text-primary transition-colors flex items-center gap-2"
                            >
                                <span className="text-base">←</span> Kembali ke Beranda
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
