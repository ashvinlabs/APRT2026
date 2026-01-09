'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function VoterImport({ onComplete }: { onComplete: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setMessage(null);
        }
    };

    const processCSV = async () => {
        if (!file) return;
        setImporting(true);
        setMessage(null);

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

            const voters = lines.slice(1).filter(line => line.trim()).map(line => {
                const values = line.split(',').map(v => v.trim());
                return {
                    name: values[headers.indexOf('nama')] || values[headers.indexOf('name')] || values[0],
                    nik: values[headers.indexOf('nik')] || values[headers.indexOf('nik_nasional')] || '',
                    address: values[headers.indexOf('alamat')] || values[headers.indexOf('address')] || values[1],
                    invitation_code: values[headers.indexOf('kode')] || values[headers.indexOf('code')] || `RT12-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                };
            });

            const { error } = await supabase.from('voters').insert(voters);

            if (error) {
                setMessage({ type: 'error', text: 'Gagal mengimpor data: ' + error.message });
            } else {
                setMessage({ type: 'success', text: `Berhasil mengimpor ${voters.length} pemilih!` });
                setFile(null);
                setTimeout(onComplete, 1500);
            }
            setImporting(false);
        };
        reader.readAsText(file);
    };

    return (
        <div className="card animate-fade-in" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 className="heading-m" style={{ margin: 0 }}>Import Data Pemilih</h2>
                <button onClick={onComplete} style={{ color: 'var(--secondary)' }}><X /></button>
            </div>

            <p style={{ marginBottom: '1.5rem', color: 'var(--secondary)' }}>
                Unggah file CSV dengan kolom minimal: <strong>nama, nik, alamat, kode</strong>.
            </p>

            <div
                style={{
                    border: '2px dashed var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '3rem',
                    textAlign: 'center',
                    background: file ? 'var(--accent)' : 'transparent',
                    position: 'relative'
                }}
            >
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                />
                <Upload size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                <p className="text-senior">
                    {file ? file.name : 'Klik atau seret file CSV ke sini'}
                </p>
            </div>

            {message && (
                <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    borderRadius: 'var(--radius)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
                    color: message.type === 'success' ? 'var(--success)' : 'var(--error)',
                    border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`
                }}>
                    {message.type === 'success' ? <CheckCircle2 /> : <AlertCircle />}
                    <span>{message.text}</span>
                </div>
            )}

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button className="btn btn-secondary" onClick={onComplete}>Batal</button>
                <button
                    className="btn btn-primary"
                    onClick={processCSV}
                    disabled={!file || importing}
                    style={{ minWidth: '150px' }}
                >
                    {importing ? <Loader2 className="animate-spin" /> : 'Proses Import'}
                </button>
            </div>
        </div>
    );
}
