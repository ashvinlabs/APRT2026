'use client';

import Sidebar from '@/components/Sidebar';
import { SidebarProvider } from '@/components/SidebarContext';

export default function PanitiaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen bg-[#fcfcfc]">
                <Sidebar />
                <main className="flex-1 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </SidebarProvider>
    );
}
