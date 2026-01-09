'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
    isOpen: boolean;
    toggle: () => void;
    setOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(true);

    // Responsive: auto-close on mobile/small screens
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsOpen(false);
            } else {
                setIsOpen(true);
            }
        };
        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggle = () => setIsOpen(!isOpen);
    const setOpen = (open: boolean) => setIsOpen(open);

    return (
        <SidebarContext.Provider value={{ isOpen, toggle, setOpen }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
}
