'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Loader2, Mail, Lock, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // 1. Sign up user via Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Gagal membuat akun.');

            // 2. Create staff record (is_approved defaults to false)
            const { error: staffError } = await supabase
                .from('staff')
                .insert([
                    {
                        user_id: authData.user.id,
                        name: name,
                    },
                ]);

            if (staffError) throw staffError;

            // 3. Success! Redirect to pending page
            router.push('/pending-approval');
        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.message || 'Terjadi kesalahan saat pendaftaran.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-xl border-primary/5 bg-white/80 backdrop-blur-sm">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-2">
                        <UserPlus size={28} />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Daftar Akun Baru</CardTitle>
                    <CardDescription className="text-slate-500">
                        Buat akun petugas untuk mengakses sistem e-voting.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleRegister}>
                    <CardContent className="space-y-4 pt-4">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium animate-shake">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-slate-700">Nama Lengkap</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    id="name"
                                    placeholder="Masukkan nama lengkap"
                                    className="pl-10"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-700">Alamat Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nama@email.com"
                                    className="pl-10"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password text-slate-700">Kata Sandi</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 pt-4 pb-8">
                        <Button
                            type="submit"
                            className="w-full h-11 text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                'Daftar Sekarang'
                            )}
                        </Button>
                        <p className="text-sm text-center text-slate-500">
                            Sudah punya akun?{' '}
                            <Link href="/login" className="text-primary font-bold hover:underline">
                                Masuk di sini
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
