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
    Check,
    Pencil,
    Key,
    UserCog,
    Camera,
    User
} from 'lucide-react';
import ImageCropModal from './ImageCropModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
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
    user_id: string;
    name: string;
    email: string;
    photo_url?: string;
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
    const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '' });
    const [isCreating, setIsCreating] = useState(false);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

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
                user_id,
                name,
                email,
                photo_url,
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
        const { data, error } = await supabase
            .from('roles')
            .select('*')
            .order('priority', { ascending: false });
        return data || [];
    }

    // Helper: Check if staff member is Super Admin
    function isSuperAdmin(member: StaffMember): boolean {
        return member.roles.some(role => role.name === 'Super Admin');
    }

    // Helper: Check if current user can modify this staff member
    function canModifyStaff(member: StaffMember): boolean {
        // Super Admin can only be modified by themselves
        if (isSuperAdmin(member)) {
            return member.user_id === user?.user_id;
        }
        // Others can be modified by anyone with manage_staff permission
        return hasPermission('manage_staff') || member.user_id === user?.user_id;
    }

    async function toggleApproval(member: StaffMember) {
        // Protect Super Admin
        if (isSuperAdmin(member) && member.user_id !== user?.user_id) {
            alert('Super Admin tidak dapat diubah oleh admin lain!');
            return;
        }

        setUpdating(member.id);
        const { error } = await supabase
            .from('staff')
            .update({ is_approved: !member.is_approved })
            .eq('id', member.id);

        if (error) {
            alert('Gagal mengubah status: ' + error.message);
        } else {
            await fetchData();
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
        // Protect Super Admin
        if (isSuperAdmin(member)) {
            alert('Super Admin tidak dapat dihapus!');
            return;
        }

        if (!confirm(`Hapus petugas "${member.name}"? Tindakan ini tidak dapat dibatalkan.`)) return;

        setUpdating(member.id);
        const { error } = await supabase.from('staff').delete().eq('id', member.id);

        if (!error) {
            setStaff(prev => prev.filter(s => s.id !== member.id));
        }
        setUpdating(member.id);
    }

    async function handlePhotoCrop(blob: Blob) {
        if (!editingMember || !user) return;

        setIsUploadingPhoto(true);
        try {
            const fileName = `staff-${editingMember.id}-${Date.now()}.jpg`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('staff-photos')
                .upload(fileName, blob, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('staff-photos')
                .getPublicUrl(fileName);

            // Update database
            const { error: dbError } = await supabase
                .from('staff')
                .update({ photo_url: publicUrl })
                .eq('id', editingMember.id);

            if (dbError) throw dbError;

            // Update local state
            setEditingMember(prev => prev ? { ...prev, photo_url: publicUrl } : null);
            setStaff(prev => prev.map(s => s.id === editingMember.id ? { ...s, photo_url: publicUrl } : s));

            alert('Foto profil berhasil diperbarui!');
        } catch (error: any) {
            console.error('Error uploading photo:', error);
            alert('Gagal mengunggah foto: ' + error.message);
        } finally {
            setIsUploadingPhoto(false);
        }
    }

    async function handleEditStaff(e: React.FormEvent) {
        e.preventDefault();
        if (!editingMember) return;

        // Protect Super Admin from other admins
        if (isSuperAdmin(editingMember) && editingMember.user_id !== user?.user_id) {
            alert('Super Admin hanya dapat diedit oleh dirinya sendiri!');
            return;
        }

        setUpdating(editingMember.id);
        const { error } = await supabase
            .from('staff')
            .update({ name: editingMember.name })
            .eq('id', editingMember.id);

        if (!error) {
            setStaff(prev => prev.map(s => s.id === editingMember.id ? { ...s, name: editingMember.name } : s));
            setIsEditModalOpen(false);
            setEditingMember(null);
        } else {
            alert('Gagal mengupdate profiling: ' + error.message);
        }
        setUpdating(null);
    }

    async function handleResetPassword(member: StaffMember) {
        if (!confirm(`Kirim email reset password ke ${member.email}?`)) return;

        const { error } = await supabase.auth.resetPasswordForEmail(member.email, {
            redirectTo: window.location.origin + '/reset-password',
        });

        if (error) {
            alert('Gagal mengirim email reset: ' + error.message);
        } else {
            alert('Email reset password telah dikirim ke ' + member.email);
        }
    }

    async function handleAddStaff() {
        if (!newStaff.name || !newStaff.email || !newStaff.password) {
            alert('Semua field harus diisi!');
            return;
        }

        if (newStaff.password.length < 6) {
            alert('Password minimal 6 karakter!');
            return;
        }

        setIsCreating(true);

        try {
            // Create auth user with email confirmation
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: newStaff.email,
                password: newStaff.password,
                options: {
                    data: {
                        full_name: newStaff.name
                    },
                    emailRedirectTo: window.location.origin + '/reset-password'
                }
            });

            if (authError) throw authError;

            if (!authData.user) {
                throw new Error('Gagal membuat akun');
            }

            // The trigger will automatically create the staff record
            alert(`Akun berhasil dibuat! Email verifikasi telah dikirim ke ${newStaff.email}`);

            // Reset form and close modal
            setNewStaff({ name: '', email: '', password: '' });
            setIsAddModalOpen(false);

            // Refresh staff list
            await fetchData();

        } catch (error: any) {
            console.error('Error creating staff:', error);
            alert('Gagal membuat akun: ' + error.message);
        } finally {
            setIsCreating(false);
        }
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
                        <Button
                            onClick={() => setIsAddModalOpen(true)}
                            className="rounded-full gap-2 border-2 border-primary/20 hover:bg-primary/5"
                            variant="outline"
                        >
                            <UserPlus size={18} />
                            Tambah Manual
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="w-[180px] font-black uppercase text-[10px] tracking-widest pl-8">Nama Petugas</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest">Email</TableHead>
                                <TableHead className="w-[130px] font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest">Peran / Roles</TableHead>
                                <TableHead className="w-[100px] text-right pr-8 font-black uppercase text-[10px] tracking-widest">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {staff.map((member) => (
                                <TableRow key={member.id} className="group border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="pl-8">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border-2 border-slate-100 shadow-sm">
                                                <AvatarImage src={member.photo_url || ''} className="object-cover" />
                                                <AvatarFallback className="bg-slate-100 text-slate-500 font-black text-xs">
                                                    {member.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-800">{member.name}</span>
                                                <span className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">#{member.id.substring(0, 8)}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-medium text-slate-600">{member.email || '-'}</span>
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
                                            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-2xl border-slate-100 p-2">
                                                <DropdownMenuLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-1">Akun Saya</DropdownMenuLabel>

                                                {/* Show Super Admin badge */}
                                                {isSuperAdmin(member) && (
                                                    <div className="px-2 py-2 mb-2">
                                                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[10px]">
                                                            🔒 SUPER ADMIN
                                                        </Badge>
                                                    </div>
                                                )}

                                                {canModifyStaff(member) && (
                                                    <DropdownMenuItem
                                                        onClick={() => { setEditingMember(member); setIsEditModalOpen(true); }}
                                                        className="flex items-center gap-2 font-bold py-2.5 rounded-lg cursor-pointer text-slate-700"
                                                    >
                                                        <Pencil size={16} className="text-blue-500" />
                                                        Edit Profil
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem
                                                    onClick={() => handleResetPassword(member)}
                                                    className="flex items-center gap-2 font-bold py-2.5 rounded-lg cursor-pointer text-slate-700"
                                                >
                                                    <Key size={16} className="text-amber-500" />
                                                    Reset Password
                                                </DropdownMenuItem>

                                                {hasPermission('manage_staff') && !isSuperAdmin(member) && (
                                                    <>
                                                        <DropdownMenuSeparator className="my-2" />
                                                        <DropdownMenuLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-1">Administrasi</DropdownMenuLabel>
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
                                                        <DropdownMenuItem
                                                            onClick={() => deleteStaff(member)}
                                                            className="flex items-center gap-2 text-rose-500 font-bold py-2.5 rounded-lg cursor-pointer"
                                                        >
                                                            <Trash2 size={16} />
                                                            Hapus Petugas
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
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

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="p-8 bg-slate-900 text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <UserCog size={100} />
                        </div>
                        <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase">Edit <span className="text-blue-400">Profil</span></DialogTitle>
                        <DialogDescription className="text-slate-400 font-bold">Perbarui data diri petugas.</DialogDescription>
                    </DialogHeader>
                    <div className="p-8 pb-4 flex flex-col items-center justify-center bg-slate-50 border-b border-slate-100">
                        <div className="relative group">
                            <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                                <AvatarImage src={editingMember?.photo_url || ''} className="object-cover" />
                                <AvatarFallback className="bg-slate-200 text-slate-400">
                                    <User size={40} />
                                </AvatarFallback>
                            </Avatar>
                            <Button
                                type="button"
                                size="icon"
                                onClick={() => setIsCropModalOpen(true)}
                                className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-primary hover:bg-primary/90 text-white shadow-lg border-2 border-white scale-110 active:scale-95 transition-transform"
                                disabled={isUploadingPhoto}
                            >
                                {isUploadingPhoto ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                            </Button>
                        </div>
                        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Foto Profil Petugas</p>
                    </div>

                    <form onSubmit={handleEditStaff} className="p-8 space-y-6 bg-white">
                        <div className="space-y-2">
                            <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nama Lengkap</Label>
                            <Input
                                value={editingMember?.name || ''}
                                onChange={e => setEditingMember(prev => prev ? { ...prev, name: e.target.value } : null)}
                                className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-bold text-lg focus-visible:ring-primary/20"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Email (ID)</Label>
                            <Input
                                value={editingMember?.email || ''}
                                disabled
                                className="h-14 rounded-2xl bg-slate-100 border-slate-200 font-mono text-sm cursor-not-allowed"
                            />
                        </div>
                        <DialogFooter className="pt-4 flex gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsEditModalOpen(false)}
                                className="flex-1 h-14 rounded-2xl font-black text-slate-400"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={updating === editingMember?.id}
                                className="flex-1 h-14 rounded-2xl font-black bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100"
                            >
                                {updating ? <Loader2 className="animate-spin" /> : 'Simpan Perubahan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Add Staff Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="p-8 bg-gradient-to-br from-primary to-blue-600 text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <UserPlus size={100} />
                        </div>
                        <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase">Tambah <span className="text-blue-200">Petugas</span></DialogTitle>
                        <DialogDescription className="text-white/80 font-bold">Buat akun petugas baru dengan email dan password.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); handleAddStaff(); }} className="p-8 space-y-6 bg-white">
                        <div className="space-y-2">
                            <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nama Lengkap</Label>
                            <Input
                                value={newStaff.name}
                                onChange={e => setNewStaff(prev => ({ ...prev, name: e.target.value }))}
                                className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-bold text-lg focus-visible:ring-primary/20"
                                placeholder="Contoh: Ahmad Santoso"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Email</Label>
                            <Input
                                type="email"
                                value={newStaff.email}
                                onChange={e => setNewStaff(prev => ({ ...prev, email: e.target.value }))}
                                className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-mono text-sm focus-visible:ring-primary/20"
                                placeholder="email@example.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Password</Label>
                            <Input
                                type="password"
                                value={newStaff.password}
                                onChange={e => setNewStaff(prev => ({ ...prev, password: e.target.value }))}
                                className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-mono text-sm focus-visible:ring-primary/20"
                                placeholder="Minimal 6 karakter"
                                required
                                minLength={6}
                            />
                            <p className="text-xs text-slate-400 font-medium">Password akan dikirim via email verifikasi</p>
                        </div>
                        <DialogFooter className="pt-4 flex gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsAddModalOpen(false)}
                                disabled={isCreating}
                                className="flex-1 h-14 rounded-2xl font-black text-slate-400"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isCreating}
                                className="flex-1 h-14 rounded-2xl font-black bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20"
                            >
                                {isCreating ? <Loader2 className="animate-spin" /> : 'Buat Akun'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Photo Crop Modal */}
            <ImageCropModal
                isOpen={isCropModalOpen}
                onClose={() => setIsCropModalOpen(false)}
                onCropComplete={handlePhotoCrop}
            />
        </div>
    );
}
