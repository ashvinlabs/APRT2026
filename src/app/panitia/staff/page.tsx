'use client';

import UserManager from '@/components/UserManager';
import StaffActivity from '@/components/StaffActivity';
import RoleManager from '@/components/RoleManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, History, Shield } from 'lucide-react';
import PermissionGuard from '@/components/PermissionGuard';

export default function StaffPage() {
    return (
        <PermissionGuard permission="view_logs">
            <main className="p-2 md:p-8 max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Manajemen <span className="text-primary">Tim & Roles</span></h1>
                    <p className="text-slate-500 font-medium mt-2">Kelola persetujuan petugas baru, pengaturan role, dan pantau log aktivitas sistem.</p>
                </div>

                <Tabs defaultValue="staff" className="space-y-6">
                    <TabsList className="bg-slate-100 p-1 rounded-2xl h-14 w-full md:w-auto">
                        <TabsTrigger value="staff" className="rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg gap-2">
                            <Users size={16} />
                            Daftar Petugas
                        </TabsTrigger>
                        <TabsTrigger value="roles" className="rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg gap-2">
                            <Shield size={16} />
                            Kelola Peran
                        </TabsTrigger>
                        <TabsTrigger value="activity" className="rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg gap-2">
                            <History size={16} />
                            Log Aktivitas
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="staff">
                        <UserManager />
                    </TabsContent>

                    <TabsContent value="roles">
                        <RoleManager />
                    </TabsContent>

                    <TabsContent value="activity">
                        <StaffActivity />
                    </TabsContent>
                </Tabs>
            </main>
        </PermissionGuard>
    );
}
