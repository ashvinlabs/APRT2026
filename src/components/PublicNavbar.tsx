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
                ? "bg-background/80 border-white/5"
                : "bg-background/80 border-border"
        )}>
            <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-3 no-underline group">
                    <div className="relative w-32 h-12 transition-transform group-hover:scale-105">
                        <img
                            src="/images/logo.png"
                            alt="APRT26 Logo"
                            className="object-contain w-full h-full"
                        />
                    </div>
                </Link>
            </div>

            <div className={cn(
                "hidden md:flex items-center gap-1 p-1 rounded-2xl border",
                "bg-secondary/50 border-border"
            )}>
                <Link href="/">
                    <Button variant="ghost" size="sm" className={cn(
                        "rounded-xl font-bold transition-all h-9 px-4",
                        "text-muted-foreground hover:text-primary hover:bg-background/50"
                    )}>Beranda</Button>
                </Link>
                <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className={cn(
                        "rounded-xl font-bold transition-all h-9 px-4",
                        "text-muted-foreground hover:text-primary hover:bg-background/50"
                    )}>Dashboard</Button>
                </Link>
                <Link href="/check-dpt">
                    <Button variant="ghost" size="sm" className={cn(
                        "rounded-xl font-bold transition-all h-9 px-4",
                        "text-muted-foreground hover:text-primary hover:bg-background/50"
                    )}>Cek DPT</Button>
                </Link>
                <Link href="/about">
                    <Button variant="ghost" size="sm" className={cn(
                        "rounded-xl font-bold transition-all h-9 px-4",
                        "text-muted-foreground hover:text-primary hover:bg-background/50"
                    )}>Tentang</Button>
                </Link>
            </div>

            <div className="flex items-center gap-3">
                {user ? (
                    <div className={cn(
                        "flex items-center gap-3 px-3 py-1.5 rounded-xl border",
                        "bg-card border-border shadow-sm"
                    )}>
                        <Avatar className="h-8 w-8 border border-primary/20">
                            <AvatarImage src={user.photo_url || ''} className="object-cover" />
                            <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs uppercase">
                                {(user.name || 'U')[0]}
                            </AvatarFallback>
                        </Avatar>
                        <span className={cn(
                            "text-xs font-bold hidden lg:block",
                            "text-foreground"
                        )}>{user.name}</span>
                    </div>
                ) : (
                    <Link href="/login">
                        <Button size="sm" className="px-5 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                            Login
                        </Button>
                    </Link>
                )}
            </div>
        </nav>
    );
}
