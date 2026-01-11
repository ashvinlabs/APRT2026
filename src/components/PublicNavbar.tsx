'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@/components/UserContext';
import { cn } from '@/lib/utils';

interface PublicNavbarProps {
    variant?: 'light' | 'dark';
}

export default function PublicNavbar({ variant = 'light' }: PublicNavbarProps) {
    const { user } = useUser();
    const isDark = variant === 'dark';

    return (
        <nav className={cn(
            "fixed top-0 left-0 w-full z-50 px-6 h-20 flex items-center justify-between backdrop-blur-xl border-b",
            isDark
                ? "bg-slate-900/50 border-white/5"
                : "bg-white/80 border-slate-200/60"
        )}>
            <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-3 no-underline group">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg italic shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">A</div>
                    <span className={cn(
                        "text-sm font-black italic tracking-tighter uppercase hidden sm:block",
                        isDark ? "text-white" : "text-slate-900"
                    )}>
                        APRT<span className="text-blue-600 italic">26</span>
                    </span>
                </Link>
            </div>

            <div className={cn(
                "hidden md:flex items-center gap-1 p-1 rounded-2xl border",
                isDark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200/60"
            )}>
                <Link href="/">
                    <Button variant="ghost" size="sm" className={cn(
                        "rounded-xl font-bold transition-all h-9 px-4",
                        isDark ? "text-white hover:bg-white/10" : "text-slate-600 hover:text-blue-600 hover:bg-white"
                    )}>Beranda</Button>
                </Link>
                <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className={cn(
                        "rounded-xl font-bold transition-all h-9 px-4",
                        isDark ? "text-white/70 hover:text-white hover:bg-white/10" : "text-slate-600 hover:text-blue-600 hover:bg-white"
                    )}>Dashboard</Button>
                </Link>
                <Link href="/check-dpt">
                    <Button variant="ghost" size="sm" className={cn(
                        "rounded-xl font-bold transition-all h-9 px-4",
                        isDark ? "text-white/70 hover:text-white hover:bg-white/10" : "text-slate-600 hover:text-blue-600 hover:bg-white"
                    )}>Cek DPT</Button>
                </Link>
                <Link href="/about">
                    <Button variant="ghost" size="sm" className={cn(
                        "rounded-xl font-bold transition-all h-9 px-4",
                        isDark ? "text-white/70 hover:text-white hover:bg-white/10" : "text-slate-600 hover:text-blue-600 hover:bg-white"
                    )}>Tentang</Button>
                </Link>
            </div>

            <div className="flex items-center gap-3">
                {user ? (
                    <div className={cn(
                        "flex items-center gap-3 px-3 py-1.5 rounded-xl border",
                        isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"
                    )}>
                        <Avatar className="h-8 w-8 border border-blue-500/20">
                            <AvatarImage src={user.photo_url || ''} className="object-cover" />
                            <AvatarFallback className="bg-blue-600 text-white font-bold text-xs uppercase">
                                {(user.name || 'U')[0]}
                            </AvatarFallback>
                        </Avatar>
                        <span className={cn(
                            "text-xs font-bold hidden lg:block",
                            isDark ? "text-white" : "text-slate-900"
                        )}>{user.name}</span>
                    </div>
                ) : (
                    <Link href="/login">
                        <Button size="sm" className="px-5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20">
                            Login
                        </Button>
                    </Link>
                )}
            </div>
        </nav>
    );
}
