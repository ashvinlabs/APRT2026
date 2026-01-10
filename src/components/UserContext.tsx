'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/lib/auth-utils';
import { Permissions, aggregatePermissions, Role } from '@/lib/permissions';

interface UserContextType {
    user: UserProfile | null;
    isLoading: boolean;
    hasPermission: (permission: keyof Permissions) => boolean;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUserProfile = async (userId: string) => {
        // Fetch staff profile
        const { data: staff, error: staffError } = await supabase
            .from('staff')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (staffError || !staff) {
            setUser(null);
            setIsLoading(false);
            return;
        }

        // Fetch roles
        const { data: roles } = await supabase
            .from('staff_roles')
            .select(`
                role:roles (
                    id,
                    name,
                    permissions,
                    priority,
                    color
                )
            `)
            .eq('staff_id', staff.id);

        const mappedRoles: Role[] = roles?.map((r: any) => r.role) || [];
        const permissions = aggregatePermissions(mappedRoles);

        setUser({
            ...staff,
            roles: mappedRoles,
            permissions
        });
        setIsLoading(false);
    };

    const refreshUser = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
            await fetchUserProfile(authUser.id);
        } else {
            setUser(null);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                fetchUserProfile(session.user.id);
            } else {
                setUser(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const hasPermission = (permission: keyof Permissions) => {
        if (!user) return false;
        if (user.permissions.all) return true;
        return !!(user.permissions as any)[permission];
    };

    return (
        <UserContext.Provider value={{ user, isLoading, hasPermission, refreshUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
