'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Shield, User, Loader2, History, RefreshCw, Clock, Camera, Download, Search, X, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

interface AuditLog {
    id: string;
    action: string;
    created_at: string;
    voters: { name: string } | null;
    staff_id: string;
    permission_group: string;
    metadata: any;
    staff?: { name: string };
}

export default function StaffActivity() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [totalCount, setTotalCount] = useState(0);

    // Search & Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterGroup, setFilterGroup] = useState<string>('all');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            fetchLogs();
        }
    }, [mounted, currentPage, itemsPerPage, filterGroup, dateStart, dateEnd]);

    // Debounce search
    useEffect(() => {
        if (!mounted) return;
        const timer = setTimeout(() => {
            if (currentPage !== 1) setCurrentPage(1);
            else fetchLogs();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    async function fetchLogs() {
        setLoading(true);

        // Build query
        let query = supabase
            .from('audit_logs')
            .select(`
                id, 
                action, 
                created_at,
                staff_id,
                permission_group,
                metadata,
                voters(name)
            `, { count: 'exact' });

        // Apply filters
        if (filterGroup !== 'all') {
            query = query.eq('permission_group', filterGroup);
        }

        if (dateStart) {
            query = query.gte('created_at', new Date(dateStart).toISOString());
        }

        if (dateEnd) {
            const endDate = new Date(dateEnd);
            endDate.setHours(23, 59, 59, 999);
            query = query.lte('created_at', endDate.toISOString());
        }

        // Apply pagination
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (count !== null) {
            setTotalCount(count);
        }

        // Get staff names
        const staffIds = [...new Set(data?.map(log => log.staff_id) || [])];
        const { data: staffData } = await supabase
            .from('staff')
            .select('user_id, name')
            .in('user_id', staffIds);

        let logsWithStaff = data?.map(log => ({
            ...log,
            staff: staffData?.find(s => s.user_id === log.staff_id) || { name: log.staff_id.split('-')[0] }
        })) || [];

        // Client-side search filter (for staff name and detail)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            logsWithStaff = logsWithStaff.filter(log =>
                log.staff?.name?.toLowerCase().includes(query) ||
                log.metadata?.detail?.toLowerCase().includes(query) ||
                log.action.toLowerCase().includes(query)
            );
        }

        if (!error) {
            setLogs(logsWithStaff as any);
        }
        setLoading(false);
    }

    function resetFilters() {
        setSearchQuery('');
        setFilterGroup('all');
        setDateStart('');
        setDateEnd('');
        setCurrentPage(1);
    }

    function exportToCSV() {
        const headers = ['Waktu', 'Petugas', 'Permission', 'Detail'];
        const csvContent = [
            headers.join(','),
            ...logs.map(log => [
                `"${new Date(log.created_at).toLocaleString('id-ID')}"`,
                `"${log.staff?.name || 'System'}"`,
                `"${log.permission_group || ''}"`,
                `"${log.metadata?.detail || log.action.replace(/_/g, ' ')}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `activity_log_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const hasFilters = searchQuery || filterGroup !== 'all' || dateStart || dateEnd;

    if (!mounted) return null;

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in space-y-8">
            {/* Page Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-200">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black tracking-widest uppercase mb-3">
                        <History size={12} /> System Transparency
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Log <span className="text-primary">Aktivitas</span></h1>
                    <p className="text-slate-500 font-medium mt-1">Pantau riwayat check-in dan aktivitas sistem secara real-time.</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={exportToCSV}
                        variant="outline"
                        className="rounded-2xl font-bold gap-2 shadow-sm border-slate-200 hover:bg-slate-50 transition-all"
                        disabled={logs.length === 0}
                    >
                        <Download size={18} className="text-emerald-500" />
                        Export CSV
                    </Button>
                    <Button
                        onClick={fetchLogs}
                        variant="outline"
                        className="rounded-2xl font-bold gap-2 shadow-sm border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
                        disabled={loading}
                    >
                        <RefreshCw size={18} className={cn("text-primary", loading && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </header>

            {/* Filters & Search */}
            <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden bg-white ring-1 ring-slate-100">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="lg:col-span-2 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <Input
                                placeholder="Cari nama staff, aksi, atau detail..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-12 rounded-2xl border-slate-200 font-medium"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Permission Group Filter */}
                        <Select value={filterGroup} onValueChange={setFilterGroup}>
                            <SelectTrigger className="h-12 rounded-2xl border-slate-200 font-medium">
                                <SelectValue placeholder="Permission Group" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Permission</SelectItem>
                                <SelectItem value="system">System</SelectItem>
                                <SelectItem value="manage_staff">Manage Staff</SelectItem>
                                <SelectItem value="manage_settings">Manage Settings</SelectItem>
                                <SelectItem value="manage_candidates">Manage Candidates</SelectItem>
                                <SelectItem value="add_voters">Add Voters</SelectItem>
                                <SelectItem value="edit_voters">Edit Voters</SelectItem>
                                <SelectItem value="delete_voters">Delete Voters</SelectItem>
                                <SelectItem value="mark_presence">Mark Presence</SelectItem>
                                <SelectItem value="uncheck_in">Uncheck In</SelectItem>
                                <SelectItem value="manage_votes">Manage Votes</SelectItem>
                                <SelectItem value="undo_vote">Undo Vote</SelectItem>
                                <SelectItem value="export_data">Export Data</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Date Range */}
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                            <Input
                                type="date"
                                value={dateStart}
                                onChange={(e) => setDateStart(e.target.value)}
                                className="pl-10 h-12 rounded-2xl border-slate-200 font-medium"
                                placeholder="Dari Tanggal"
                            />
                        </div>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                            <Input
                                type="date"
                                value={dateEnd}
                                onChange={(e) => setDateEnd(e.target.value)}
                                className="pl-10 h-12 rounded-2xl border-slate-200 font-medium"
                                placeholder="Sampai Tanggal"
                            />
                        </div>
                    </div>

                    {hasFilters && (
                        <div className="mt-4 flex items-center gap-3">
                            <Badge variant="secondary" className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 font-bold">
                                {totalCount} hasil ditemukan
                            </Badge>
                            <Button
                                onClick={resetFilters}
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-600"
                            >
                                <X size={14} className="mr-1" />
                                Reset Filter
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Main Content */}
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
                <CardHeader className="p-8 border-b border-slate-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-black text-slate-900">Riwayat Aktivitas</CardTitle>
                            <CardDescription>
                                Menampilkan {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} dari {totalCount} entri
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 uppercase">Per Halaman:</span>
                            {[25, 50, 100, 200].map(num => (
                                <button
                                    key={num}
                                    onClick={() => { setItemsPerPage(num); setCurrentPage(1); }}
                                    className={cn(
                                        "w-10 h-10 rounded-xl text-xs font-black transition-all",
                                        itemsPerPage === num
                                            ? "bg-slate-900 text-white shadow-lg"
                                            : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                    )}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
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
                                    <TableHead className="w-[180px] h-14 font-black uppercase text-[10px] tracking-widest text-slate-400 pl-8">Waktu Aktivitas</TableHead>
                                    <TableHead className="w-[200px] h-14 font-black uppercase text-[10px] tracking-widest text-slate-400">Petugas / Staff</TableHead>
                                    <TableHead className="w-[180px] h-14 font-black uppercase text-[10px] tracking-widest text-slate-400">Permission</TableHead>
                                    <TableHead className="h-14 font-black uppercase text-[10px] tracking-widest text-slate-400 pr-8">Detail Aktivitas</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log: any) => (
                                    <TableRow key={log.id} className="group border-slate-50 hover:bg-slate-50/50 transition-colors text-sm font-medium">
                                        <TableCell className="pl-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">{new Date(log.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                                                    <Clock size={10} />
                                                    {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-100 transition-colors">
                                                    <User size={14} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800">{log.staff?.name || 'System'}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium">ID: {log.staff_id.substring(0, 8)}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="px-3 py-0.5 rounded-lg border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-tight bg-slate-50">
                                                {log.permission_group?.replace(/_/g, ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="pr-8">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-700 font-bold leading-tight">
                                                        {log.metadata?.detail || log.action.replace(/_/g, ' ')}
                                                    </span>
                                                    {log.voters?.name && !log.metadata?.detail && (
                                                        <span className="text-[10px] text-slate-400 font-medium">Target: {log.voters.name}</span>
                                                    )}
                                                </div>
                                                {log.metadata?.image_url && (
                                                    <a
                                                        href={log.metadata.image_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all shrink-0"
                                                    >
                                                        <Camera size={12} />
                                                        Lihat Capture
                                                    </a>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {logs.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3 opacity-30">
                                                <History size={48} />
                                                <p className="font-black uppercase tracking-widest text-xs">
                                                    {hasFilters ? 'Tidak ada hasil yang cocok' : 'Belum ada aktivitas tercatat'}
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className="rounded-xl h-10 px-4 font-bold border-slate-200"
                    >
                        Sebelumnya
                    </Button>

                    <div className="flex items-center gap-1">
                        {[...Array(totalPages)].map((_, i) => {
                            const pageNum = i + 1;
                            if (
                                pageNum === 1 ||
                                pageNum === totalPages ||
                                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                            ) {
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={cn(
                                            "w-10 h-10 rounded-xl font-black",
                                            currentPage === pageNum ? "shadow-lg shadow-primary/20" : "text-slate-400"
                                        )}
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            } else if (
                                pageNum === currentPage - 2 ||
                                pageNum === currentPage + 2
                            ) {
                                return <span key={pageNum} className="text-slate-300">...</span>;
                            }
                            return null;
                        })}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className="rounded-xl h-10 px-4 font-bold border-slate-200"
                    >
                        Selanjutnya
                    </Button>
                </div>
            )}

            {/* Hint Footer */}
            <div className="flex items-center justify-center gap-2 text-slate-300">
                <Shield size={14} />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Data ini bersifat permanen dan tidak dapat diubah</p>
            </div>
        </div>
    );
}
