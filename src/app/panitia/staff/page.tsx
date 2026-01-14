'use client';

import UserManager from '@/components/UserManager';
import StaffActivity from '@/components/StaffActivity';
import RoleManager from '@/components/RoleManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, History, Shield } from 'lucide-react';
import PermissionGuard from '@/components/PermissionGuard';

import { useUser } from '@/components/UserContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StaffPage() {
    const { user, hasPermission, isLoading } = useUser();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push('/login');
                return;
            }

            // Determine first accessible tab
            if (hasPermission('manage_staff')) {
                setActiveTab('staff');
            } else if (hasPermission('manage_roles')) {
                setActiveTab('roles');
            } else if (hasPermission('view_logs')) {
                setActiveTab('activity');
            } else {
                // No access to any tabs on this page
                router.push('/panitia/voters');
            }
        }
    }, [isLoading, user, hasPermission, router]);

    if (isLoading || !activeTab) return null;

    return (
        <main className="px-2 py-8 md:p-8 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Manajemen <span className="text-primary">Tim & Roles</span></h1>
                <p className="text-slate-500 font-medium mt-2">Kelola persetujuan petugas baru, pengaturan role, dan pantau log aktivitas sistem.</p>
            </div>

            <Tabs defaultValue={activeTab} className="space-y-6">
                <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
                    <TabsList className="bg-slate-100 p-1 rounded-2xl h-14 inline-flex min-w-full md:min-w-0 md:w-auto">
                        {hasPermission('manage_staff') && (
                            <TabsTrigger value="staff" className="rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg gap-2 whitespace-nowrap">
                                <Users size={16} />
                                Daftar Petugas
                            </TabsTrigger>
                        )}
                        {hasPermission('manage_roles') && (
                            <TabsTrigger value="roles" className="rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg gap-2 whitespace-nowrap">
                                <Shield size={16} />
                                Kelola Peran
                            </TabsTrigger>
                        )}
                        {hasPermission('view_logs') && (
                            <TabsTrigger value="activity" className="rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg gap-2 whitespace-nowrap">
                                <History size={16} />
                                Log Aktivitas
                            </TabsTrigger>
                        )}
                    </TabsList>
                </div>

                {hasPermission('manage_staff') && (
                    <TabsContent value="staff">
                        <UserManager />
                    </TabsContent>
                )}

                {hasPermission('manage_roles') && (
                    <TabsContent value="roles">
                        <RoleManager />
                    </TabsContent>
                )}

                {hasPermission('view_logs') && (
                    <TabsContent value="activity">
                        <StaffActivity />
                    </TabsContent>
                )}
            </Tabs>
        </main>
    );
}
