'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, UserCheck, BarChart3, Printer } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import LogoutButton from '@/components/LogoutButton';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { useUser } from '@/components/UserContext';

export default function HomePage() {
  const { user, hasPermission, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const allFeatures = [
    { title: 'Live Dashboard', description: 'Tampilan real-time hasil suara untuk monitor/TV.', icon: BarChart3, href: '/dashboard' },
    { title: 'Manajemen Pemilih', description: 'Pendaftaran, import data, dan verifikasi undangan.', icon: Users, href: '/panitia/voters', permission: 'manage_voters' },
    { title: 'Penghitungan Suara', description: 'Input manual perolehan suara dari kotak suara.', icon: UserCheck, href: '/panitia/tally', permission: 'manage_votes' },
    { title: 'Cetak Undangan', description: 'Generate QR Code dan cetak kartu undangan warga.', icon: Printer, href: '/panitia/invitations', permission: 'manage_invitations' },
  ];

  // If not logged in, show only Live Dashboard.
  // If logged in, filter by permissions.
  const features = allFeatures.filter(feature => {
    if (!user) {
      return feature.href === '/dashboard';
    }
    if ((feature as any).permission) {
      return hasPermission((feature as any).permission);
    }
    return true;
  });

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {features.map((feature, idx) => (
            <Link key={idx} href={feature.href} className="group">
              <Card className="h-full hover:shadow-lg transition-all duration-300 border-primary/5">
                <CardHeader className="text-center p-8">
                  <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 group-hover:rotate-3">
                    <feature.icon size={40} />
                  </div>
                  <CardTitle className="mb-3 text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        <footer className="flex flex-col items-center gap-8">
          <div className="w-full max-w-md">
            <Card className="border-primary/10 shadow-sm overflow-hidden">
              <CardHeader className="text-center bg-white">
                {!user ? (
                  <>
                    <CardTitle className="text-base font-bold text-slate-700 mb-4">Akses Panitia</CardTitle>
                    <div className="flex flex-col gap-3">
                      <Link href="/login">
                        <Button size="lg" className="w-full font-bold">
                          Login Panitia
                        </Button>
                      </Link>
                      <Link href="/register">
                        <Button variant="outline" size="lg" className="w-full font-bold">
                          Daftar Petugas
                        </Button>
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-2xl shadow-inner">
                        {user.name?.[0].toUpperCase() || user.user_id?.[0].toUpperCase()}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">Terverifikasi</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{user.roles?.[0]?.name || 'Petugas'}</span>
                        </div>
                        <p className="text-lg font-black text-slate-900 leading-none mt-1">{user.name}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <LogoutButton />
                    </div>
                  </div>
                )}
              </CardHeader>
            </Card>
          </div>

          <div className="text-center space-y-1">
            <p className="text-sm text-slate-400 font-bold">
              &copy; 2026 Panitia Pemilu RT 12 Baturetno.
            </p>
            <p className="text-[10px] text-slate-300 font-medium uppercase tracking-[0.2em]">Sistem E-Voting Terintegrasi</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

// Add Loader2 import from lucide-react if not already there
import { Loader2 } from 'lucide-react';
