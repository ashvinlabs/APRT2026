'use client';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function LogoutButton({ hideText = false }: { hideText?: boolean }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleLogout() {
        if (!confirm('Apakah Anda yakin ingin keluar dari sistem?')) return;
        setLoading(true);
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    }

    return (
        <Button
            variant="ghost"
            onClick={handleLogout}
            disabled={loading}
            title={hideText ? 'Keluar' : ''}
            className={cn(
                "w-full flex items-center gap-3 transition-all duration-300 group",
                "rounded-2xl font-bold h-12",
                hideText
                    ? "justify-center p-0"
                    : "justify-start px-4 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
            )}
        >
            <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-sm",
                loading ? "animate-spin" : "",
                hideText
                    ? "bg-slate-100 text-slate-400 group-hover:bg-rose-500 group-hover:text-white"
                    : "bg-slate-100 text-slate-400 group-hover:bg-rose-100 group-hover:text-rose-600"
            )}>
                {loading ? <Loader2 size={16} /> : <LogOut size={16} />}
            </div>
            {!hideText && <span className="text-sm tracking-tight">{loading ? 'Keluar...' : 'Logout Akun'}</span>}
        </Button>
    );
}
