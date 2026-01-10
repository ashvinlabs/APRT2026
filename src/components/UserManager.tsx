'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Users,
    Shield,
    CheckCircle2,
    XCircle,
    Trash2,
    BadgeCheck,
    Clock,
    MoreVertical,
    UserPlus,
    Loader2,
    Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useUser } from '@/components/UserContext';

interface Role {
    id: string;
    name: string;
    color: string;
}

interface StaffMember {
    id: string;
    name: string;
    is_approved: boolean;
    created_at: string;
    roles: Role[];
}

export default function UserManager() {
    const { user, hasPermission } = useUser();
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        const [staffRes, rolesRes] = await Promise.all([
            fetchStaff(),
            fetchRoles()
        ]);
        setStaff(staffRes || []);
        setRoles(rolesRes || []);
        setLoading(false);
    }

    async function fetchStaff() {
        const { data, error } = await supabase
            .from('staff')
            .select(`
                id,
                name,
                is_approved,
                created_at,
                staff_roles (
                    role_id,
                    roles (id, name, color)
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Fetch staff error:', error);
            return [];
        }

        return data.map((s: any) => ({
            ...s,
            roles: s.staff_roles.map((sr: any) => sr.roles)
        }));
    }

    async function fetchRoles() {
        const { data } = await supabase.from('roles').select('id, name, color').order('priority', { ascending: false });
        return data || [];
    }

    async function toggleApproval(member: StaffMember) {
        setUpdating(member.id);

        console.log('toggleApproval called', { member, currentUser: user });

        const { data, error } = await supabase
            .from('staff')
            .update({
                is_approved: !member.is_approved,
                approved_by: user?.user_id, // Use user_id (auth ID), not id (staff ID)
                approved_at: !member.is_approved ? new Date().toISOString() : null
            })
            .eq('id', member.id)
            .select();

        console.log('Update result:', { data, error });

        if (error) {
            console.error('Update failed:', error);
            alert(`Gagal update status: ${error.message}`);
        } else {
            console.log('Update successful!', data);
            setStaff(prev => prev.map(s => s.id === member.id ? { ...s, is_approved: !s.is_approved } : s));
        }
        setUpdating(null);
    }

    async function toggleRole(member: StaffMember, roleId: string) {
        setUpdating(member.id);
        const hasRole = member.roles.some(r => r.id === roleId);

        if (hasRole) {
            // Remove role
            await supabase.from('staff_roles').delete().match({ staff_id: member.id, role_id: roleId });
        } else {
            // Add role
            await supabase.from('staff_roles').insert({ staff_id: member.id, role_id: roleId });
        }

        // Refresh specific member
        const updatedRes = await fetchStaff();
        setStaff(updatedRes);
        setUpdating(null);
    }

    async function deleteStaff(member: StaffMember) {
        if (!confirm(`Hapus petugas "${member.name}"? Tindakan ini tidak dapat dibatalkan.`)) return;

        setUpdating(member.id);
        const { error } = await supabase.from('staff').delete().eq('id', member.id);

        if (!error) {
            setStaff(prev => prev.filter(s => s.id !== member.id));
        }
        setUpdating(null);
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-slate-400 font-bold">Memuat Data Petugas...</p>
            </div>
        );
    }

    const pendingCount = staff.filter(s => !s.is_approved).length;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-xl bg-primary text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <Users size={80} />
                    </div>
                    <CardContent className="p-6 relative z-10">
                        <p className="text-white/60 font-black uppercase tracking-widest text-xs">Total Petugas</p>
                        <p className="text-4xl font-black">{staff.length}</p>
                    </CardContent>
                </Card>

                <Card className={cn(
                    "border-none shadow-xl overflow-hidden relative transition-colors",
                    pendingCount > 0 ? "bg-amber-500 text-white" : "bg-white text-slate-900"
                )}>
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <Clock size={80} />
                    </div>
                    <CardContent className="p-6 relative z-10">
                        <p className={cn("font-black uppercase tracking-widest text-xs", pendingCount > 0 ? "text-white/60" : "text-slate-400")}>Menunggu Persetujuan</p>
                        <p className="text-4xl font-black">{pendingCount}</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-white text-slate-900 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <Shield size={80} />
                    </div>
                    <CardContent className="p-6 relative z-10">
                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Hak Akses Tersedia</p>
                        <p className="text-4xl font-black">{roles.length}</p>
                    </CardContent>
                </Card>
            </div>

            {/* List Table */}
            <Card className="border-none shadow-2xl rounded-[1.5rem] overflow-hidden bg-white">
                <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-xl font-black flex items-center gap-2">
                                <BadgeCheck className="text-primary" />
                                Manajemen & Approval Petugas
                            </CardTitle>
                            <CardDescription className="font-medium">Kelola hak akses dan persetujuan akun petugas baru.</CardDescription>
                        </div>
                        <Button className="rounded-full gap-2 border-2 border-primary/20 hover:bg-primary/5" variant="outline">
                            <UserPlus size={18} />
                            Tambah Manual
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="w-[250px] font-black uppercase text-[10px] tracking-widest pl-8">Nama Petugas</TableHead>
                                <TableHead className="w-[150px] font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest">Peran / Roles</TableHead>
                                <TableHead className="w-[100px] text-right pr-8 font-black uppercase text-[10px] tracking-widest">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {staff.map((member) => (
                                <TableRow key={member.id} className="group border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="pl-8">
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-800">{member.name}</span>
                                            <span className="text-[10px] font-bold text-slate-400">Ditinjau pada {new Date(member.created_at).toLocaleDateString('id-ID')}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={member.is_approved ? "default" : "secondary"}
                                            className={cn(
                                                "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider",
                                                member.is_approved ? "bg-emerald-500 hover:bg-emerald-600" : "bg-slate-100 text-slate-400"
                                            )}
                                        >
                                            {member.is_approved ? "Approved" : "Not Approved"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-2">
                                            {member.roles.map(role => (
                                                <Badge
                                                    key={role.id}
                                                    style={{ backgroundColor: role.color + '20', color: role.color, border: `1px solid ${role.color}40` }}
                                                    className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                                                >
                                                    {role.name}
                                                </Badge>
                                            ))}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full bg-slate-100 hover:bg-slate-200">
                                                        <UserPlus size={12} className="text-slate-500" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="w-56 rounded-xl shadow-2xl border-slate-100">
                                                    <DropdownMenuLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pilih Peran</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    {roles.map(role => (
                                                        <DropdownMenuItem
                                                            key={role.id}
                                                            onClick={() => toggleRole(member, role.id)}
                                                            className="flex justify-between items-center py-2 px-3 rounded-lg cursor-pointer"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: role.color }} />
                                                                <span className="font-bold text-sm text-slate-700">{role.name}</span>
                                                            </div>
                                                            {member.roles.some(r => r.id === role.id) && (
                                                                <Check size={14} className="text-emerald-500" />
                                                            )}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-8">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="hover:bg-white hover:shadow-md rounded-full">
                                                    <MoreVertical size={18} className="text-slate-400" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-2xl border-slate-100">
                                                <DropdownMenuItem
                                                    onClick={() => toggleApproval(member)}
                                                    className={cn(
                                                        "flex items-center gap-2 font-bold py-2.5 rounded-lg cursor-pointer",
                                                        member.is_approved ? "text-rose-500" : "text-emerald-600"
                                                    )}
                                                >
                                                    {member.is_approved ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                                                    {member.is_approved ? "Batalkan Persetujuan" : "Setujui Petugas"}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => deleteStaff(member)}
                                                    className="flex items-center gap-2 text-rose-500 font-bold py-2.5 rounded-lg cursor-pointer"
                                                >
                                                    <Trash2 size={16} />
                                                    Hapus Petugas
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {staff.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <p className="text-slate-400 font-bold italic">Belum ada petugas yang mendaftar.</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
