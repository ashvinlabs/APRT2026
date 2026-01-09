'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, UserCheck, BarChart3, Printer } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import LogoutButton from '@/components/LogoutButton';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  const features = [
    { title: 'Live Dashboard', description: 'Tampilan real-time hasil suara untuk monitor/TV.', icon: BarChart3, href: '/dashboard' },
    { title: 'Manajemen Pemilih', description: 'Pendaftaran, import data, dan verifikasi undangan.', icon: Users, href: '/panitia/voters' },
    { title: 'Penghitungan Suara', description: 'Input manual perolehan suara dari kotak suara.', icon: UserCheck, href: '/panitia/tally' },
    { title: 'Cetak Undangan', description: 'Generate QR Code dan cetak kartu undangan warga.', icon: Printer, href: '/panitia/invitations' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-16 mt-8">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-4 tracking-tight">
            <span className="text-primary">APRT</span> 2026
          </h1>
          <p className="text-xl text-slate-600 font-medium">
            Aplikasi Pemilu RT 12 Pelem Kidul
          </p>
        </header>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '5rem'
        }}>
          {features.map((feature, idx) => (
            <Link key={idx} href={feature.href} className="group">
              <Card className="h-full">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <feature.icon size={32} />
                  </div>
                  <CardTitle className="mb-2">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        <footer className="flex flex-col items-center gap-6">
          <div className="w-full max-w-md">
            <Card>
              <CardHeader className="text-center">
                {!user ? (
                  <>
                    <CardTitle className="text-lg mb-4">Akses Panitia</CardTitle>
                    <Link href="/login">
                      <Button size="lg" className="w-full">
                        Login Panitia
                      </Button>
                    </Link>
                  </>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl">
                        {user.email?.[0].toUpperCase()}
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-slate-500 font-semibold uppercase">Login Berhasil</p>
                        <p className="text-sm font-bold">{user.email}</p>
                      </div>
                    </div>
                    <LogoutButton />
                  </div>
                )}
              </CardHeader>
            </Card>
          </div>

          <p className="text-sm text-slate-400 font-medium">
            &copy; 2026 Panitia Pemilu RT 12 Baturetno.
          </p>
        </footer>
      </div>
    </div>
  );
}
