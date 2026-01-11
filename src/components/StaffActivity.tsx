'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Shield, User, Loader2, History, Filter, RefreshCw, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from '@/lib/utils';

interface AuditLog {
    id: string;
    action: string;
    created_at: string;
    voters: { name: string } | null;
    staff_id: string;
    permission_group: string;
    metadata: any;
}

// Target UI logic: We need to handle the staff name display. 
// Since staff name might be in a separate table or just stay as ID if joined incorrectly.
// Let's assume the schema from earlier.

export default function StaffActivity() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchLogs();
    }, []);

    async function fetchLogs() {
        setLoading(true);
        const { data, error } = await supabase
            .from('audit_logs')
            .select(`
                id, 
                action, 
                created_at,
                staff_id,
                permission_group,
                metadata,
                voters(name)
            `)
            .order('created_at', { ascending: false })
            .limit(50);

        // Post-process to get staff names if join is tricky with auth.users
        const staffIds = [...new Set(data?.map(log => log.staff_id) || [])];
        const { data: staffData } = await supabase
            .from('staff')
            .select('user_id, name')
            .in('user_id', staffIds);

        const logsWithStaff = data?.map(log => ({
            ...log,
            staff: staffData?.find(s => s.user_id === log.staff_id) || { name: log.staff_id.split('-')[0] }
        })) || [];

        if (!error) {
            setLogs(logsWithStaff as any);
        }
        setLoading(false);
    }

    if (!mounted) return null;

    return (
        <div className="p-8 max-w-6xl mx-auto animate-fade-in space-y-8">
            {/* Page Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-200">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black tracking-widest uppercase mb-3">
                        <History size={12} /> System Transparency
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Log <span className="text-primary">Aktivitas</span></h1>
                    <p className="text-slate-500 font-medium mt-1">Pantau riwayat check-in dan aktivitas sistem secara real-time.</p>
                </div>
                <Button
                    onClick={fetchLogs}
                    variant="outline"
                    className="rounded-2xl font-bold gap-2 shadow-sm border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
                    disabled={loading}
                >
                    <RefreshCw size={18} className={cn("text-primary", loading && "animate-spin")} />
                    Refresh Data
                </Button>
            </header>

            {/* Main Content */}
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
                <CardHeader className="p-8 border-b border-slate-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-black text-slate-900">Riwayat Terakhir</CardTitle>
                            <CardDescription>Menampilkan 50 aktivitas terbaru dalam sistem.</CardDescription>
                        </div>
                        <Badge variant="secondary" className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-500 font-black uppercase text-[10px] tracking-widest border-none">
                            {logs.length} Entri
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading && logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="animate-spin text-primary" size={48} />
                            <p className="text-slate-400 font-black tracking-widest uppercase text-xs">Fetching Logs...</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="w-[200px] h-14 font-black uppercase text-[10px] tracking-widest text-slate-400 pl-8">Waktu Aktivitias</TableHead>
                                    <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400">Aktivitas</TableHead>
                                    <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400">Target Warga</TableHead>
                                    <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400 pr-8">Petugas/Staff</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.id} className="group border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="pl-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">{new Date(log.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                                                <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                                                    <Clock size={10} />
                                                    {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <Badge className={cn(
                                                    "w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-none shadow-sm",
                                                    log.action === 'check-in' || log.action === 'add_voter' || log.action === 'approve_staff'
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : log.action === 'undo_vote' || log.action === 'reject_staff' || log.action === 'delete_voter'
                                                            ? "bg-rose-100 text-rose-700"
                                                            : "bg-blue-100 text-blue-700"
                                                )}>
                                                    {log.action.replace(/_/g, ' ')}
                                                </Badge>
                                                <span className="text-[9px] font-bold text-slate-400 pl-1 uppercase tracking-tighter">
                                                    Area: {log.permission_group?.replace(/_/g, ' ') || 'General'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                                                    <User size={14} />
                                                </div>
                                                <span className="font-bold text-slate-700 tracking-tight">{log.voters?.name || '---'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="pr-8">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                                                    <Shield size={12} className="text-slate-500" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-400 italic">ID: {log.staff_id.substring(0, 8)}...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {logs.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3 opacity-30">
                                                <History size={48} />
                                                <p className="font-black uppercase tracking-widest text-xs">Belum ada aktivitas tercatat</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Hint Footer */}
            <div className="flex items-center justify-center gap-2 text-slate-300">
                <Shield size={14} />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Data ini bersifat permanen dan tidak dapat diubah</p>
            </div>
        </div>
    );
}

