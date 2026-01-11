'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    UserCheck,
    Vote,
    Printer,
    History,
    Home,
    Settings,
    UserPlus,
    Info,
    Edit3,
    LogOut,
    ChevronDown,
    ChevronLeft,
    Menu,
    UserCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from './SidebarContext';
import { Button } from '@/components/ui/button';
import { useUser } from './UserContext';
import { Permissions } from '@/lib/permissions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ProfileEditModal from './ProfileEditModal';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface MenuItem {
    name: string;
    icon: any;
    href: string;
    permission?: keyof Permissions;
}

const menuItems: MenuItem[] = [
    { name: 'Beranda', icon: Home, href: '/' },
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Check-In', icon: UserCheck, href: '/panitia/check-in', permission: 'check_in' },
    { name: 'Data Pemilih', icon: Users, href: '/panitia/voters', permission: 'manage_voters' },
    { name: 'Hitung Suara', icon: Vote, href: '/panitia/tally', permission: 'manage_votes' },
    { name: 'Cetak Undangan', icon: Printer, href: '/panitia/invitations', permission: 'manage_invitations' },
    { name: 'Manajemen Tim', icon: Users, href: '/panitia/staff', permission: 'view_logs' },
    { name: 'Pengaturan', icon: Settings, href: '/panitia/settings', permission: 'manage_settings' },
];

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const { isOpen, toggle } = useSidebar();
    const { user, hasPermission, isLoading } = useUser();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isMenuExpended, setIsMenuExpended] = useState(false); // For mobile push-down

    if (isLoading) return null;

    async function handleLogout() {
        if (!confirm('Apakah Anda yakin ingin keluar dari sistem?')) return;
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    }

    // Non-logged in users only see Home and Dashboard
    const filteredItems = menuItems.filter(item => {
        if (!user) {
            return item.href === '/' || item.name === 'Dashboard' || item.name === 'Data Pemilih';
        }
        if (item.permission) {
            return hasPermission(item.permission);
        }
        return true;
    });

    // Show sidebar for everyone so guests can switch between Dashboard and Data Pemilih
    if (!user && pathname === '/login') return null;

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-300"
                    onClick={toggle}
                />
            )}

            <aside className={cn(
                "no-print flex flex-col h-screen sticky top-0 z-40 bg-[#f9f9fb] border-r border-slate-200/60 shadow-[1px_0_0_0_rgba(0,0,0,0.02)] transition-all duration-300",
                // Mobile: hidden by default, show when open
                "fixed md:sticky -left-[280px] md:left-0",
                isOpen ? "left-0 md:w-[280px]" : "md:w-[80px]",
                // Always full width on mobile when open
                isOpen && "w-[280px]"
            )}>
                {/* Header */}
                <div className={cn(
                    "flex items-center justify-center min-h-[80px] px-6 border-b border-slate-200/60"
                )}>
                    {isOpen ? (
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
                                    A
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-900 leading-tight">
                                        APRT <span className="text-primary">26</span>
                                    </h2>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                        E-Voting System
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggle}
                                className="hover:bg-slate-100"
                            >
                                <ChevronLeft size={20} />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggle}
                            className="hover:bg-slate-100"
                        >
                            <Menu size={20} />
                        </Button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 overflow-y-auto">
                    {filteredItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={!isOpen ? item.name : ''}
                                className={cn(
                                    "flex flex-row items-center gap-3 px-3 py-2.5 mb-1 rounded-lg text-sm font-medium transition-all no-underline",
                                    isActive
                                        ? "bg-primary text-white shadow-md"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                                    !isOpen && "justify-center"
                                )}
                            >
                                <Icon size={20} className="flex-shrink-0" />
                                {isOpen && <span className="whitespace-nowrap">{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* About Link - Before Footer */}
                <div className="px-3 pb-3">
                    <Link
                        href="/about"
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all no-underline",
                            pathname === '/about'
                                ? "bg-primary text-white shadow-md"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                            !isOpen && "justify-center"
                        )}
                        title={!isOpen ? 'Tentang' : ''}
                    >
                        <Info size={20} className="flex-shrink-0" />
                        {isOpen && <span className="whitespace-nowrap">Tentang</span>}
                    </Link>
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-slate-200/60 transition-all duration-300">
                    {user ? (
                        <div className="flex flex-col gap-1">
                            {/* Desktop Dropdown Wrapper */}
                            <div className="hidden md:block">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className={cn(
                                            "w-full flex items-center gap-3 p-2 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all duration-300 hover:ring-2 hover:ring-primary/10 active:scale-[0.98]",
                                            !isOpen && "justify-center border-none bg-transparent shadow-none p-0 h-10 w-10 mx-auto"
                                        )}>
                                            <Avatar className="h-8 w-8 border border-slate-100 shadow-sm shrink-0">
                                                <AvatarImage src={user.photo_url || ''} className="object-cover" />
                                                <AvatarFallback className="bg-indigo-50 text-primary font-bold text-xs shrink-0 border border-primary/10">
                                                    {(user.name || 'U')[0].toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            {isOpen && (
                                                <>
                                                    <div className="flex-1 text-left min-w-0">
                                                        <p className="text-[11px] font-black text-slate-800 truncate leading-none mb-1 uppercase tracking-tight">
                                                            {user.name}
                                                        </p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate leading-none">
                                                            {user.roles?.[0]?.name || 'Petugas'}
                                                        </p>
                                                    </div>
                                                    <ChevronDown size={14} className="text-slate-300 shrink-0" />
                                                </>
                                            )}
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent side="right" align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-slate-100 animate-in slide-in-from-left-2 duration-200">
                                        <DropdownMenuLabel className="px-3 py-2">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Akun Saya</p>
                                            <p className="text-sm font-black text-slate-900 truncate tracking-tight">{user.name}</p>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator className="bg-slate-50" />
                                        <DropdownMenuItem onClick={() => setIsProfileModalOpen(true)} className="rounded-xl px-3 py-2.5 flex items-center gap-3 font-bold text-slate-600 focus:bg-slate-50 focus:text-primary cursor-pointer">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 transition-colors">
                                                <Edit3 size={16} />
                                            </div>
                                            <span>Edit Profil</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-slate-50" />
                                        <DropdownMenuItem onClick={handleLogout} className="rounded-xl px-3 py-2.5 flex items-center gap-3 font-bold text-rose-600 focus:bg-rose-50 focus:text-rose-700 cursor-pointer">
                                            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 transition-colors">
                                                <LogOut size={16} />
                                            </div>
                                            <span>Logout Akun</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Mobile Push-down Menu */}
                            <div className="md:hidden flex flex-col gap-1">
                                <button
                                    onClick={() => setIsMenuExpended(!isMenuExpended)}
                                    className="w-full flex items-center gap-3 p-2 rounded-2xl bg-white border border-slate-100 shadow-sm active:bg-slate-50"
                                >
                                    <Avatar className="h-8 w-8 border border-slate-100 shadow-sm shrink-0">
                                        <AvatarImage src={user.photo_url || ''} className="object-cover" />
                                        <AvatarFallback className="bg-indigo-50 text-primary font-bold text-xs shrink-0 border border-primary/10">
                                            {(user.name || 'U')[0].toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-left min-w-0">
                                        <p className="text-[11px] font-black text-slate-800 truncate leading-none mb-1 uppercase tracking-tight">
                                            {user.name}
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate leading-none">
                                            {user.roles?.[0]?.name || 'Petugas'}
                                        </p>
                                    </div>
                                    <ChevronDown size={14} className={cn("text-slate-300 transition-transform duration-300", isMenuExpended && "rotate-180")} />
                                </button>

                                {isMenuExpended && (
                                    <div className="flex flex-col gap-1 mt-1 p-1 bg-white border border-slate-100 rounded-2xl animate-in slide-in-from-top-2 duration-300 overflow-hidden">
                                        <Button
                                            variant="ghost"
                                            onClick={() => { setIsProfileModalOpen(true); setIsMenuExpended(false); }}
                                            className="h-12 justify-start gap-4 rounded-xl font-bold bg-white text-slate-600 hover:bg-slate-50 px-4"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                                <Edit3 size={16} />
                                            </div>
                                            Edit Profil
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={handleLogout}
                                            className="h-12 justify-start gap-4 rounded-xl font-bold bg-white text-rose-600 hover:bg-rose-50 px-4"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500">
                                                <LogOut size={16} />
                                            </div>
                                            Logout
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-slate-500 hover:bg-white hover:text-primary transition-all no-underline",
                                !isOpen && "justify-center"
                            )}
                        >
                            <UserCircle size={20} />
                            {isOpen && <span>Masuk Panitia</span>}
                        </Link>
                    )}
                </div>

                {/* Profile Edit Modal */}
                <ProfileEditModal
                    isOpen={isProfileModalOpen}
                    onClose={() => setIsProfileModalOpen(false)}
                />
            </aside>
        </>
    );
}
