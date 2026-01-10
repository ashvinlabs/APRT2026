'use client';

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
    ChevronLeft,
    Menu,
    UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import LogoutButton from './LogoutButton';
import { useSidebar } from './SidebarContext';
import { Button } from '@/components/ui/button';
import { useUser } from './UserContext';
import { Permissions } from '@/lib/permissions';

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
    const pathname = usePathname();
    const { isOpen, toggle } = useSidebar();
    const { user, hasPermission, isLoading } = useUser();

    if (isLoading) return null;

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
        <aside className={cn(
            "no-print flex flex-col h-screen sticky top-0 z-40 bg-[#f9f9fb] border-r border-slate-200/60 shadow-[1px_0_0_0_rgba(0,0,0,0.02)] transition-all duration-300",
            isOpen ? "w-[280px]" : "w-[80px]"
        )}>
            {/* Header */}
            <div className={cn(
                "flex items-center min-h-[80px] px-6 border-b border-slate-200/60",
                isOpen ? "justify-between" : "justify-center"
            )}>
                {isOpen ? (
                    <>
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
                    </>
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

            {/* Footer */}
            <div className="p-3 border-t border-slate-200/60">
                {user ? (
                    <LogoutButton hideText={!isOpen} />
                ) : (
                    <Link
                        href="/login"
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-slate-500 hover:bg-white hover:text-primary transition-all no-underline",
                            !isOpen && "justify-center"
                        )}
                    >
                        <UserPlus size={20} />
                        {isOpen && <span>Masuk Panitia</span>}
                    </Link>
                )}
            </div>
        </aside>
    );
}
