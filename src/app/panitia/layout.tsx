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
            <div style={{ display: 'flex', minHeight: '100vh' }}>
                <Sidebar />
                <main style={{ flex: 1, backgroundColor: 'var(--background)', overflowX: 'hidden' }}>
                    {children}
                </main>
            </div>
        </SidebarProvider>
    );
}
