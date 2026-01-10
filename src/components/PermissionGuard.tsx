'use client';

import { useUser } from './UserContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Permissions } from '@/lib/permissions';

interface BetterPermissionGuardProps {
    children: React.ReactNode;
    permission?: keyof Permissions;
    redirectTo?: string;
}

export default function PermissionGuard({ children, permission, redirectTo = '/panitia/voters' }: BetterPermissionGuardProps) {
    const { hasPermission, isLoading, user } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push('/login');
                return;
            }
            if (permission && !hasPermission(permission)) {
                router.push(redirectTo);
            }
        }
    }, [isLoading, user, permission, hasPermission, router, redirectTo]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) return null;
    if (permission && !hasPermission(permission)) return null;

    return <>{children}</>;
}
