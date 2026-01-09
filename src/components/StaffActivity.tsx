'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Shield, User, Loader2 } from 'lucide-react';

interface AuditLog {
    id: string;
    action: string;
    created_at: string;
    voters: { name: string } | null;
    staff: { name: string } | null;
}

export default function StaffActivity() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchLogs();
    }, []);

    if (!mounted) return null;

    async function fetchLogs() {
        setLoading(true);
        // Note: This query assumes relationships are set in Supabase
        const { data, error } = await supabase
            .from('audit_logs')
            .select(`
        id, action, created_at,
        voters(name),
        staff(name)
      `)
            .order('created_at', { ascending: false })
            .limit(50);

        if (!error) {
            setLogs(data as any || []);
        }
        setLoading(false);
    }

    return (
        <div style={{ padding: '2rem' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 className="heading-m">Log Aktivitas Panitia</h1>
                <p style={{ color: 'var(--secondary)' }}>Rekaman riwayat pendaftaran dan aktivitas sistem.</p>
            </header>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <Loader2 className="animate-spin" size={48} color="var(--primary)" />
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'var(--accent)', borderBottom: '1px solid var(--border)' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Waktu</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Panitia</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Aktivitas</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Target Warga</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                        {new Date(log.created_at).toLocaleString('id-ID')}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Shield size={16} color="var(--primary)" />
                                            <span>{log.staff?.name || 'Sistem/Unknown'}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '99px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            background: log.action === 'check-in' ? '#dcfce7' : '#fee2e2',
                                            color: log.action === 'check-in' ? '#166534' : '#991b1b'
                                        }}>
                                            {log.action === 'check-in' ? 'Check-in' : 'Batal Check-in'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <User size={16} color="var(--secondary)" />
                                            <span>{log.voters?.name || 'N/A'}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--secondary)' }}>
                                        Belum ada aktivitas yang tercatat.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
