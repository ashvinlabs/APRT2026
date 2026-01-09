'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserPlus, Save, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';

interface Candidate {
    id: string;
    name: string;
    photo_url: string | null;
    display_order: number;
}

export default function CandidateManagement() {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [dragActive, setDragActive] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        fetchCandidates();

        // Mencegah browser membuka file jika di-drop di luar area yang ditentukan
        const preventDefault = (e: DragEvent) => e.preventDefault();
        window.addEventListener('dragover', preventDefault);
        window.addEventListener('drop', preventDefault);

        return () => {
            window.removeEventListener('dragover', preventDefault);
            window.removeEventListener('drop', preventDefault);
        };
    }, []);

    if (!mounted) return null;

    async function fetchCandidates() {
        setLoading(true);
        const { data, error } = await supabase
            .from('candidates')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) console.error('Error:', error);
        else setCandidates(data || []);
        setLoading(false);
    }

    async function addCandidate() {
        if (candidates.length >= 3) {
            alert('Maksimal hanya 3 kandidat sesuai ketentuan.');
            return;
        }
        const newCandidate = {
            name: 'Kandidat Baru',
            display_order: candidates.length + 1
        };
        const { data, error } = await supabase.from('candidates').insert(newCandidate).select();
        if (error) alert(error.message);
        else if (data) setCandidates([...candidates, data[0]]);
    }

    async function updateCandidate(id: string, updates: Partial<Candidate>) {
        setSaving(true);
        const { error } = await supabase.from('candidates').update(updates).eq('id', id);
        if (error) alert(error.message);
        else setCandidates(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
        setSaving(false);
    }

    async function deleteCandidate(id: string) {
        if (!confirm('Hapus kandidat ini?')) return;
        const { error } = await supabase.from('candidates').delete().eq('id', id);
        if (error) alert(error.message);
        else setCandidates(candidates.filter(c => c.id !== id));
    }

    async function handlePhotoUpload(candidateId: string, file: File) {
        if (!file.type.startsWith('image/')) {
            alert('File harus berupa gambar.');
            return;
        }
        setSaving(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${candidateId}-${Math.random()}.${fileExt}`;
        const filePath = `photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('candidates')
            .upload(filePath, file);

        if (uploadError) {
            alert('Gagal upload: ' + uploadError.message);
            setSaving(false);
            return;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('candidates')
            .getPublicUrl(filePath);

        await updateCandidate(candidateId, { photo_url: publicUrl });
        setSaving(false);
    }



    const handleDrag = (e: React.DragEvent, id: string | null) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(id);
        } else if (e.type === "dragleave") {
            setDragActive(null);
        }
    };

    const handleDrop = (e: React.DragEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(null);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handlePhotoUpload(id, e.dataTransfer.files[0]);
        }
    };

    if (loading) return <div className="container" style={{ textAlign: 'center', padding: '5rem' }}><Loader2 className="animate-spin" size={48} /></div>;

    return (
        <div style={{ padding: '2rem' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="heading-m">Manajemen Kandidat</h1>
                    <p style={{ color: 'var(--secondary)' }}>Atur 3 kandidat calon pengurus RT 12.</p>
                </div>
                {candidates.length < 3 && (
                    <button className="btn btn-primary" onClick={addCandidate} style={{ gap: '0.5rem' }}>
                        <UserPlus size={20} />
                        <span>Tambah Kandidat</span>
                    </button>
                )}
            </header>

            <div style={{ display: 'grid', gap: '2rem' }}>
                {candidates.map((candidate) => (
                    <div key={candidate.id} className="card" style={{ display: 'grid', gridTemplateColumns: '150px 1fr auto', gap: '2rem', alignItems: 'start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                            <div
                                style={{
                                    position: 'relative',
                                    width: '150px',
                                    height: '200px',
                                    background: dragActive === candidate.id ? 'var(--accent)' : 'var(--accent)',
                                    borderRadius: 'var(--radius)',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: dragActive === candidate.id ? '2px dashed var(--primary)' : '1px solid var(--border)',
                                    transition: 'all 0.2s',
                                    cursor: 'pointer'
                                }}
                                onDragEnter={(e) => handleDrag(e, candidate.id)}
                                onDragOver={(e) => handleDrag(e, candidate.id)}
                                onDragLeave={(e) => handleDrag(e, null)}
                                onDrop={(e) => handleDrop(e, candidate.id)}
                            >
                                {candidate.photo_url ? (
                                    <img src={candidate.photo_url} alt={candidate.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: dragActive === candidate.id ? 0.5 : 1 }} />
                                ) : (
                                    <div style={{ textAlign: 'center', color: 'var(--secondary)' }}>
                                        <ImageIcon size={48} />
                                        <p style={{ fontSize: '0.7rem', marginTop: '0.5rem' }}>Drag foto ke sini</p>
                                    </div>
                                )}
                                {saving && (
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Loader2 className="animate-spin" color="var(--primary)" />
                                    </div>
                                )}
                                {dragActive === candidate.id && !saving && (
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(var(--primary-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <p style={{ color: 'var(--primary)', fontWeight: 600 }}>Lepas Foto</p>
                                    </div>
                                )}
                            </div>
                            <label className="btn btn-secondary" style={{ width: '100%', fontSize: '0.75rem', cursor: 'pointer' }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={(e) => e.target.files?.[0] && handlePhotoUpload(candidate.id, e.target.files[0])}
                                />
                                Ganti Foto
                            </label>
                        </div>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--secondary)', marginBottom: '0.5rem' }}>Nama Kandidat</label>
                                <input
                                    type="text"
                                    className="text-senior"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontWeight: 600 }}
                                    value={candidate.name}
                                    onChange={(e) => {
                                        const newName = e.target.value;
                                        setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, name: newName } : c));
                                    }}
                                    onBlur={(e) => updateCandidate(candidate.id, { name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--secondary)', marginBottom: '0.5rem' }}>URL Foto (Opsional)</label>
                                <input
                                    type="text"
                                    placeholder="https://..."
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
                                    value={candidate.photo_url || ''}
                                    onChange={(e) => updateCandidate(candidate.id, { photo_url: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <button onClick={() => deleteCandidate(candidate.id)} style={{ color: 'var(--error)', padding: '0.5rem' }}>
                                <Trash2 size={24} />
                            </button>
                        </div>
                    </div>
                ))}

                {candidates.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--secondary)' }}>
                        Belum ada kandidat. Klik "Tambah Kandidat" untuk memulai.
                    </div>
                )}
            </div>
        </div>
    );
}
