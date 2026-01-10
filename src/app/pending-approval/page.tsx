'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PendingApprovalPage() {
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="max-w-md w-full shadow-lg border-primary/10">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                        <Clock size={32} />
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-slate-900">Pendaftaran Menunggu Persetujuan</CardTitle>
                        <CardDescription className="text-slate-500">
                            Akun Anda telah berhasil dibuat dan sedang menunggu verifikasi dari Administrator.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-2">
                    <div className="bg-slate-100 rounded-lg p-4 text-sm text-slate-600 leading-relaxed border border-slate-200">
                        <p>
                            Mohon tunggu hingga Administrator menyetujui akun Anda. Anda akan menerima notifikasi email setelah akun diaktifkan.
                            <strong> Sementara itu, silakan konfirmasi email Anda melalui email yang telah kami kirimkan ke alamat email yang Anda gunakan untuk mendaftar.</strong>
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
                        onClick={handleLogout}
                    >
                        <LogOut size={18} />
                        Keluar
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
