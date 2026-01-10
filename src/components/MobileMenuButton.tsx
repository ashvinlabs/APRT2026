'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from './SidebarContext';

export default function MobileMenuButton() {
    const { toggle } = useSidebar();

    return (
        <Button
            onClick={toggle}
            size="icon"
            className="fixed bottom-6 right-6 z-50 md:hidden rounded-full shadow-lg bg-primary hover:bg-primary/90 text-white"
            aria-label="Toggle Menu"
        >
            <Menu size={20} />
        </Button>
    );
}
