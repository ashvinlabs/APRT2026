'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { KeyRound, Loader2, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Supabase will automatically handle the recovery session from the URL hash
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError('Sesi pemulihan tidak valid atau kadaluarsa. Silakan minta link baru.');
            }
        };
        checkSession();
    }, []);

    async function handleReset(e: React.FormEvent) {
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

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        }
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
                        <KeyRound size={32} />
                    </div>
                    <h1 className="heading-m">Atur Ulang Password</h1>
                    <p style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>
                        Buat password baru untuk akun anda.
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

                {success ? (
                    <div style={{
                        background: '#f0fdf4',
                        color: '#15803d',
                        padding: '1rem',
                        borderRadius: 'var(--radius)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem',
                        textAlign: 'center'
                    }}>
                        <CheckCircle2 size={48} />
                        <div>
                            <p className="font-bold">Password Berhasil Diubah!</p>
                            <p className="text-sm mt-1">Mengalihkan ke halaman login...</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleReset} style={{ display: 'grid', gap: '1.25rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                Password Baru
                            </label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                placeholder="••••••••"
                                className="text-senior"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                Konfirmasi Password
                            </label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                className="text-senior"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || !!error && error.includes('Sesi')}
                            style={{ width: '100%', padding: '1rem', marginTop: '1rem' }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    <span>Memperbarui...</span>
                                </>
                            ) : (
                                <span>Simpan Password Baru</span>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
