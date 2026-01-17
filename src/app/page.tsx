'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  LayoutDashboard,
  Printer,
  Vote,
  Settings,
  ShieldCheck,
  Info,
  ArrowRight,
  Loader2,
  Calendar,
  MapPin,
  Clock,
  Smartphone
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useUser } from '@/components/UserContext';
import LogoutButton from '@/components/LogoutButton';
import PublicNavbar from '@/components/PublicNavbar';

export default function HomePage() {
  const { user, hasPermission, isLoading } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isLoading || !mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm font-bold text-muted-foreground animate-pulse uppercase tracking-widest">Memuat Portal...</p>
        </div>
      </div>
    );
  }

  const allFeatures = [
    {
      title: 'Dashboard Hasil',
      description: 'Pantau perolehan suara secara langsung dan transparan.',
      icon: LayoutDashboard,
      href: '/dashboard',
      color: 'bg-primary',
      lightColor: 'bg-primary/10'
    },
    {
      title: 'Daftar Pemilih',
      description: user ? 'Kelola data pemilih, verifikasi, dan ekspor data.' : 'Cek status pendaftaran Anda dalam DPT.',
      icon: Users,
      href: user ? '/panitia/voters' : '/check-dpt',
      permission: 'manage_voters',
      color: 'bg-indigo-500',
      lightColor: 'bg-indigo-50'
    },
    {
      title: 'Meja Check-In',
      description: 'Verifikasi kehadiran pemilih di lokasi pemungutan.',
      icon: UserCheck,
      href: '/panitia/check-in',
      permission: 'check_in',
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50'
    },
    {
      title: 'Cetak Undangan',
      description: 'Generate QR Code dan cetak kartu undangan fisik.',
      icon: Printer,
      href: '/panitia/invitations',
      permission: 'manage_invitations',
      color: 'bg-orange-500',
      lightColor: 'bg-orange-50'
    },
    {
      title: 'Input Suara',
      description: 'Catat hasil penghitungan suara dari kotak fisik.',
      icon: Vote,
      href: '/panitia/tally',
      permission: 'manage_votes',
      color: 'bg-rose-500',
      lightColor: 'bg-rose-50'
    },
    {
      title: 'Manajemen Tim',
      description: 'Kelola akses petugas dan pantau aktivitas sistem.',
      icon: ShieldCheck,
      href: '/panitia/staff',
      permission: 'view_logs',
      color: 'bg-slate-700',
      lightColor: 'bg-slate-100'
    },
    {
      title: 'Pengaturan',
      description: 'Konfigurasi parameter sistem dan jadwal pemilihan.',
      icon: Settings,
      href: '/panitia/settings',
      permission: 'manage_settings',
      color: 'bg-violet-500',
      lightColor: 'bg-violet-50'
    },
    {
      title: 'Tentang Sistem',
      description: 'Informasi mengenai aplikasi e-voting APRT 26.',
      icon: Info,
      href: '/about',
      color: 'bg-teal-500',
      lightColor: 'bg-teal-50'
    },
  ];

  const features = allFeatures.filter(feature => {
    if (!user) {
      return feature.href === '/dashboard' || feature.href === '/check-dpt' || feature.href === '/about';
    }
    if (feature.permission) {
      const hasPerm = hasPermission(feature.permission as any);
      return hasPerm;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNavbar variant="dark" />

      {/* Hero Section */}
      <div className="relative bg-[#052e16] pt-32 pb-32 md:pt-48 md:pb-48">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] rounded-full bg-primary/10 blur-[120px]" />
        </div>

        <div className="container relative z-10 px-6 mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Sistem E-Voting Terpadu</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 tracking-tighter leading-[0.9]">
            APRT<span className="text-primary italic">26</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-white/60 font-medium leading-relaxed mb-10">
            Platform pemilihan elektronik RT 12 Pelem Kidul yang modern, aman, dan transparan untuk masa depan lingkungan kita.
          </p>

          {user && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-4 p-2 pl-2 pr-6 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-xl shrink-0">
                  <AvatarImage src={user.photo_url || ''} className="object-cover" />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                    {(user.name || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary leading-none mb-1">Selamat Datang</p>
                  <p className="text-lg font-black text-white leading-none">{user.name}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Event Highlights - Floating */}
        <div className="absolute bottom-0 left-0 w-full translate-y-1/2 px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Calendar, label: 'Hari/Tanggal Pemilihan', value: 'Minggu, 18 Januari 2026' },
              { icon: Clock, label: 'Waktu', value: '08:00 - 14:00 WIB' },
              { icon: MapPin, label: 'Lokasi', value: 'Balai Warga RT 12' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-5 rounded-[1.5rem] bg-card border border-border shadow-xl shadow-black/50">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-primary shrink-0">
                  <item.icon size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground leading-none mb-1">{item.label}</p>
                  <p className="text-sm font-black text-foreground leading-none">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Portal Content */}
      <div className="container mx-auto px-6 pt-32 pb-20 flex-1">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-2 uppercase">Layanan <span className="text-primary italic">Portal Utama</span></h2>
          <p className="text-muted-foreground font-bold">Pilih layanan yang ingin Anda akses hari ini.</p>
        </div>

        <div className={cn(
          "grid gap-6 mx-auto",
          features.length < 4
            ? (features.length === 1 ? "max-w-md grid-cols-1" : features.length === 2 ? "max-w-xl grid-cols-1 sm:grid-cols-2" : "max-w-4xl grid-cols-1 sm:grid-cols-3")
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        )}>
          {features.map((feature, idx) => (
            <Link key={idx} href={feature.href} className="group">
              <Card className="h-full border-none bg-card shadow-sm shadow-black/20 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 rounded-[2.5rem] overflow-hidden group-hover:-translate-y-2 relative border border-border hover:border-primary/20">
                <div className={cn("absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500", feature.color)} />

                <CardHeader className="p-8 flex flex-col items-center text-center relative z-10">
                  <div className={cn(
                    "w-20 h-20 rounded-[1.75rem] flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 mb-6",
                    feature.lightColor,
                  )}>
                    <feature.icon size={36} className={cn("transition-colors duration-500", feature.color.replace('bg-', 'text-'))} />
                    <div className={cn("absolute inset-0 rounded-[1.75rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10", feature.color)} />
                  </div>

                  <CardTitle className="text-xl font-black text-foreground mb-3 tracking-tight group-hover:text-primary transition-colors uppercase italic">{feature.title}</CardTitle>
                  <CardDescription className="text-sm font-bold text-muted-foreground leading-relaxed min-h-[48px]">
                    {feature.description}
                  </CardDescription>
                </CardHeader>

                <div className="px-8 pb-8 flex justify-center mt-auto">
                  <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                    Masuk Sekarang <ArrowRight size={14} />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {!user && (
        <div className="container mx-auto px-6 pb-20">
          <div className="mt-20 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="max-w-md mx-auto p-8 rounded-[2.5rem] bg-card border border-border shadow-xl shadow-black/50">
              <h3 className="text-xl font-black text-foreground mb-2 uppercase italic">Akses <span className="text-primary font-black italic">Khusus Panitia</span></h3>
              <p className="text-sm font-bold text-muted-foreground mb-8 leading-relaxed">Silakan login untuk mengakses fitur manajemen dan administrasi pemilu.</p>
              <div className="flex flex-col gap-3">
                <Link href="/login" className="w-full no-underline">
                  <Button size="lg" className="h-14 w-full rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 transition-all active:scale-95">
                    Login Sekarang
                  </Button>
                </Link>
                <Link href="/register" className="w-full no-underline">
                  <Button variant="ghost" size="lg" className="h-14 w-full rounded-2xl font-black text-lg text-muted-foreground hover:text-primary hover:bg-primary/10">
                    Daftar Petugas Baru
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-border flex flex-col md:flex-row items-center justify-between gap-8 mt-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center text-primary font-black text-xl italic border border-border">A</div>
          <div>
            <p className="text-sm font-black text-foreground leading-none italic uppercase">APRT<span className="text-primary italic">26</span></p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">E-Voting Solution</p>
          </div>
        </div>

        <div className="text-center md:text-right hidden sm:block">
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1">Designed and developed by</p>
          <p className="text-sm font-black text-foreground tracking-tight italic">ASHVIN <span className="text-primary italic">LABS</span></p>
        </div>

        {user && (
          <div className="flex items-center bg-card p-1 rounded-2xl border border-border shadow-sm">
            <LogoutButton />
          </div>
        )}
      </footer>
    </div>
  );
}
