'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Shield,
    Plus,
    Edit2,
    Trash2,
    Save,
    X,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Users as UsersIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Permissions } from '@/lib/permissions';
import { useToast } from '@/hooks/use-toast';

interface Role {
    id: string;
    name: string;
    permissions: Permissions;
    color: string;
    priority: number;
    staff_count?: number;
}

// All available permissions grouped by category
const PERMISSION_GROUPS = [
    {
        name: 'Core System',
        permissions: [
            { key: 'all' as keyof Permissions, label: 'Full Access', description: 'Akses penuh ke seluruh sistem (Super Admin)' },
            { key: 'manage_settings' as keyof Permissions, label: 'Manage Settings', description: 'Buka/Tutup Voting & Ubah Konfigurasi' },
            { key: 'view_logs' as keyof Permissions, label: 'View Logs', description: 'Melihat Audit Trail & Aktivitas' },
        ]
    },
    {
        name: 'User Management',
        permissions: [
            { key: 'manage_staff' as keyof Permissions, label: 'Manage Staff', description: 'Approve & Edit User/Staff' },
            { key: 'manage_roles' as keyof Permissions, label: 'Manage Roles', description: 'Mengubah struktur Role & Permission' },
        ]
    },
    {
        name: 'Voter & Data',
        permissions: [
            { key: 'view_voter_details' as keyof Permissions, label: 'View Details', description: 'Lihat Alamat & Detail Warga' },
            { key: 'add_voters' as keyof Permissions, label: 'Add Voters', description: 'Tambah warga baru manual' },
            { key: 'edit_voters' as keyof Permissions, label: 'Edit Voters', description: 'Edit Nama & Alamat warga' },
            { key: 'delete_voters' as keyof Permissions, label: 'Delete Voters', description: 'Hapus data warga dari DPT' },
            { key: 'import_voters' as keyof Permissions, label: 'Import Data', description: 'Import CSV & Google Sheets' },
            { key: 'export_data' as keyof Permissions, label: 'Export Data', description: 'Download CSV hasil pemilihan' },
        ]
    },
    {
        name: 'Election Operations',
        permissions: [
            { key: 'check_in' as keyof Permissions, label: 'Check-In Access', description: 'Scan QR Code di pintu masuk' },
            { key: 'mark_presence' as keyof Permissions, label: 'Mark Presence', description: 'Tandai hadir manual di tabel' },
            { key: 'uncheck_in' as keyof Permissions, label: 'Undo Presence', description: 'Membatalkan tanda kehadiran' },
            { key: 'print_invitation' as keyof Permissions, label: 'Print Invitation', description: 'Cetak undangan satu persatu' },
            { key: 'bulk_print_invitations' as keyof Permissions, label: 'Bulk Print', description: 'Cetak undangan masal (Bulk)' },
        ]
    },
    {
        name: 'Voting (Tally)',
        permissions: [
            { key: 'manage_votes' as keyof Permissions, label: 'Input Votes', description: 'Hak akses input suara (Tombol 1-9)' },
            { key: 'undo_vote' as keyof Permissions, label: 'Undo Vote', description: 'Hak akses menghapus suara terakhir' },
            { key: 'view_dashboard' as keyof Permissions, label: 'View Results', description: 'Melihat hasil perhitungan real-time' },
        ]
    }
];

// Protected system roles that cannot be deleted
const PROTECTED_ROLES = ['Super Admin', 'Administrator', 'Supervisor', 'Tally Officer', 'Officer'];

export default function RoleManager() {
    const { toast } = useToast();
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        color: '#94a3b8',
        priority: 0,
        permissions: {} as Permissions,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchRoles();
    }, []);

    async function fetchRoles() {
        setLoading(true);
        const { data, error } = await supabase
            .from('roles')
            .select(`
                id,
                name,
                permissions,
                color,
                priority,
                staff_roles (count)
            `)
            .order('priority', { ascending: false });

        if (!error && data) {
            const rolesWithCount = data.map((role: any) => ({
                ...role,
                staff_count: role.staff_roles?.[0]?.count || 0,
            }));
            setRoles(rolesWithCount);
        }
        setLoading(false);
    }

    function openCreateDialog() {
        setEditingRole(null);
        setFormData({
            name: '',
            color: '#94a3b8',
            priority: 0,
            permissions: {},
        });
        setDialogOpen(true);
    }

    function openEditDialog(role: Role) {
        setEditingRole(role);
        setFormData({
            name: role.name,
            color: role.color,
            priority: role.priority,
            permissions: role.permissions || {},
        });
        setDialogOpen(true);
    }

    function togglePermission(key: keyof Permissions) {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [key]: !prev.permissions[key],
            },
        }));
    }

    async function handleSave() {
        if (!formData.name.trim()) {
            toast({
                title: 'Error',
                description: 'Nama role tidak boleh kosong',
                variant: 'destructive',
            });
            return;
        }

        setSaving(true);

        if (editingRole) {
            // Update existing role
            const { error } = await supabase
                .from('roles')
                .update({
                    name: formData.name,
                    color: formData.color,
                    priority: formData.priority,
                    permissions: formData.permissions,
                })
                .eq('id', editingRole.id);

            if (error) {
                toast({
                    title: 'Error',
                    description: `Gagal update role: ${error.message}`,
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Berhasil',
                    description: `Role "${formData.name}" berhasil diupdate`,
                });
                fetchRoles();
                setDialogOpen(false);
            }
        } else {
            // Create new role
            const { error } = await supabase.from('roles').insert({
                name: formData.name,
                color: formData.color,
                priority: formData.priority,
                permissions: formData.permissions,
            });

            if (error) {
                toast({
                    title: 'Error',
                    description: `Gagal membuat role: ${error.message}`,
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Berhasil',
                    description: `Role "${formData.name}" berhasil dibuat`,
                });
                fetchRoles();
                setDialogOpen(false);
            }
        }

        setSaving(false);
    }

    async function handleDelete(role: Role) {
        if (PROTECTED_ROLES.includes(role.name)) {
            toast({
                title: 'Tidak Diizinkan',
                description: 'Role sistem tidak dapat dihapus',
                variant: 'destructive',
            });
            return;
        }

        if ((role.staff_count || 0) > 0) {
            toast({
                title: 'Tidak Diizinkan',
                description: `Role "${role.name}" masih digunakan oleh ${role.staff_count} petugas`,
                variant: 'destructive',
            });
            return;
        }

        if (!confirm(`Hapus role "${role.name}"? Tindakan ini tidak dapat dibatalkan.`)) return;

        const { error } = await supabase.from('roles').delete().eq('id', role.id);

        if (error) {
            toast({
                title: 'Error',
                description: `Gagal menghapus role: ${error.message}`,
                variant: 'destructive',
            });
        } else {
            toast({
                title: 'Berhasil',
                description: `Role "${role.name}" berhasil dihapus`,
            });
            fetchRoles();
        }
    }

    const permissionCount = (perms: Permissions) => {
        if (perms.all) return 'Full Access';
        const count = Object.values(perms).filter(v => v === true).length;
        return `${count} Permission${count !== 1 ? 's' : ''}`;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-slate-400 font-bold">Memuat Data Roles...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <Card className="border-none shadow-xl bg-gradient-to-br from-primary to-primary/80 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Shield size={100} />
                </div>
                <CardHeader className="relative z-10">
                    <CardTitle className="text-2xl font-black flex items-center gap-3">
                        <Shield size={28} />
                        Role Management
                    </CardTitle>
                    <CardDescription className="text-white/80 font-medium">
                        Buat, edit, dan kelola role dengan permissions, colors, dan hierarchy
                    </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                    <Button
                        onClick={openCreateDialog}
                        className="bg-white text-primary hover:bg-white/90 rounded-full gap-2 font-black shadow-lg"
                    >
                        <Plus size={18} />
                        Buat Role Baru
                    </Button>
                </CardContent>
            </Card>

            {/* Role List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roles.map((role) => (
                    <Card
                        key={role.id}
                        className={cn(
                            'border-none shadow-lg hover:shadow-xl transition-all overflow-hidden',
                            PROTECTED_ROLES.includes(role.name) && 'ring-2 ring-primary/20'
                        )}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-4 h-4 rounded-full shadow-md"
                                        style={{ backgroundColor: role.color }}
                                    />
                                    <div>
                                        <CardTitle className="text-lg font-black flex items-center gap-2">
                                            {role.name}
                                            {PROTECTED_ROLES.includes(role.name) && (
                                                <Badge variant="outline" className="text-[9px] font-bold">
                                                    SISTEM
                                                </Badge>
                                            )}
                                        </CardTitle>
                                        <CardDescription className="text-xs font-medium">
                                            Priority: {role.priority} • {permissionCount(role.permissions)}
                                        </CardDescription>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openEditDialog(role)}
                                        className="h-8 w-8 rounded-full hover:bg-slate-100"
                                    >
                                        <Edit2 size={14} className="text-slate-600" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(role)}
                                        disabled={PROTECTED_ROLES.includes(role.name)}
                                        className="h-8 w-8 rounded-full hover:bg-rose-50 disabled:opacity-30"
                                    >
                                        <Trash2 size={14} className="text-rose-500" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <UsersIcon size={14} />
                                <span className="font-bold">{role.staff_count || 0} Petugas</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">
                            {editingRole ? 'Edit Role' : 'Buat Role Baru'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingRole
                                ? 'Update nama, warna, priority, dan permissions role'
                                : 'Tentukan nama, warna, priority, dan permissions untuk role baru'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="font-bold">Nama Role</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Koordinator TPS"
                                className="rounded-lg"
                            />
                        </div>

                        {/* Color & Priority */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="color" className="font-bold">Warna Badge</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="color"
                                        type="color"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        className="w-16 h-10 rounded-lg cursor-pointer"
                                    />
                                    <Input
                                        type="text"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        placeholder="#94a3b8"
                                        className="flex-1 rounded-lg font-mono"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="priority" className="font-bold">Priority (Hierarki)</Label>
                                <Input
                                    id="priority"
                                    type="number"
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                                    placeholder="0-100"
                                    className="rounded-lg"
                                />
                            </div>
                        </div>

                        {/* Permissions */}
                        <div className="space-y-4">
                            <Label className="font-bold text-base">Permissions & Accessibility</Label>
                            <div className="space-y-6 max-h-[400px] overflow-y-auto border rounded-2xl p-6 bg-slate-50/50">
                                {PERMISSION_GROUPS.map((group) => (
                                    <div key={group.name} className="space-y-3">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 border-b border-primary/10 pb-1">{group.name}</h4>
                                        <div className="grid grid-cols-1 gap-2">
                                            {group.permissions.map((perm) => (
                                                <div key={perm.key} className="flex items-start gap-4 p-3 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100 hover:shadow-sm">
                                                    <Checkbox
                                                        id={perm.key}
                                                        checked={!!formData.permissions[perm.key]}
                                                        onCheckedChange={() => togglePermission(perm.key)}
                                                        className="mt-1"
                                                    />
                                                    <div className="flex-1">
                                                        <Label htmlFor={perm.key} className="font-bold cursor-pointer text-slate-700 block text-sm">
                                                            {perm.label}
                                                        </Label>
                                                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{perm.description}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            disabled={saving}
                            className="rounded-full"
                        >
                            <X size={16} />
                            Batal
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="rounded-full gap-2"
                        >
                            {saving ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            {editingRole ? 'Update Role' : 'Buat Role'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
