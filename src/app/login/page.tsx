'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LogIn, Loader2, ShieldAlert, CheckCircle2 } from 'lucide-react';

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
            // Don't switch back automatically to allow user to read message
        }
        setLoading(false);
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--accent)',
            padding: '2rem'
        }}>
            <div className="card animate-fade-in" style={{
                width: '100%',
                maxWidth: '400px',
                padding: '2.5rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'var(--primary)',
                        borderRadius: '50%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1rem',
                        color: 'white'
                    }}>
                        <LogIn size={32} />
                    </div>
                    <h1 className="heading-m">{recoveryMode ? 'Pulihkan Password' : 'Login Panitia'}</h1>
                    <p style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>
                        {recoveryMode
                            ? 'Masukkan email untuk menerima link reset password.'
                            : 'Akses sistem manajemen Pemilu RT 12'}
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: '#fee2e2',
                        color: '#b91c1c',
                        padding: '1rem',
                        borderRadius: 'var(--radius)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '1.5rem',
                        fontSize: '0.875rem',
                        border: '1px solid #fecaca'
                    }}>
                        <ShieldAlert size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {message && (
                    <div style={{
                        background: '#f0fdf4',
                        color: '#15803d',
                        padding: '1rem',
                        borderRadius: 'var(--radius)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '1.5rem',
                        fontSize: '0.875rem',
                        border: '1px solid #bbf7d0'
                    }}>
                        <CheckCircle2 size={20} />
                        <span>{message}</span>
                    </div>
                )}

                {!recoveryMode ? (
                    <form onSubmit={handleLogin} style={{ display: 'grid', gap: '1.25rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                Email Panitia
                            </label>
                            <input
                                type="email"
                                required
                                placeholder="nama@email.com"
                                className="text-senior"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                                    Password
                                </label>
                                <button
                                    type="button"
                                    onClick={() => { setRecoveryMode(true); setError(null); setMessage(null); }}
                                    style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    Lupa password?
                                </button>
                            </div>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                className="text-senior"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{ width: '100%', padding: '1rem', marginTop: '1rem' }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    <span>Memproses...</span>
                                </>
                            ) : (
                                <span>Masuk Sekarang</span>
                            )}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRecovery} style={{ display: 'grid', gap: '1.25rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                Email Terdaftar
                            </label>
                            <input
                                type="email"
                                required
                                placeholder="nama@email.com"
                                className="text-senior"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{ width: '100%', padding: '1rem', marginTop: '1rem' }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    <span>Mengirim...</span>
                                </>
                            ) : (
                                <span>Kirim Link Pemulihan</span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => { setRecoveryMode(false); setError(null); setMessage(null); }}
                            style={{ width: '100%', background: 'none', border: 'none', padding: '0.5rem', color: 'var(--secondary)', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 600 }}
                        >
                            Kembali ke Login
                        </button>
                    </form>
                )}

                <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.75rem', color: 'var(--secondary)' }}>
                    Masalah login? Hubungi Admin Utama RT 12.
                </p>
            </div>
        </div>
    );
}
