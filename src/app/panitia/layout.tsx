'use client';

import Sidebar from '@/components/Sidebar';
import MobileMenuButton from '@/components/MobileMenuButton';
import { SidebarProvider } from '@/components/SidebarContext';

export default function PanitiaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen bg-[#fcfcfc]" suppressHydrationWarning>
                <Sidebar />
                <MobileMenuButton />
                <main className="flex-1 overflow-x-hidden md:ml-0">
                    {children}
                </main>
            </div>
        </SidebarProvider>
    );
}
