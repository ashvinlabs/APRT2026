'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Cloud,
    X,
    Settings,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Copy,
    Check,
    ChevronRight,
    ExternalLink,
    Loader2,
    Link2Off,
    DownloadCloud
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface GoogleSyncModalProps {
    voters: any[];
    onClose: () => void;
}

export default function GoogleSyncModal({ voters, onClose }: GoogleSyncModalProps) {
    const [webhookUrl, setWebhookUrl] = useState('');
    const [isActive, setIsActive] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isPulling, setIsPulling] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const [step, setStep] = useState(1);

    useEffect(() => {
        fetchSettings();
    }, []);

    async function fetchSettings() {
        const { data } = await supabase
            .from('settings')
            .select('value')
            .eq('id', 'google_sync_config')
            .single();

        if (data?.value) {
            const url = data.value.webhook_url || '';
            setWebhookUrl(url);
            setIsActive(data.value.is_active || false);
            if (url) {
                setStep(2);
            }
        }
    }

    async function saveSettings() {
        setIsSaving(true);
        const { error } = await supabase
            .from('settings')
            .upsert({
                id: 'google_sync_config',
                value: {
                    webhook_url: webhookUrl,
                    is_active: true,
                    updated_at: new Date().toISOString()
                }
            });

        setIsSaving(false);
        if (error) {
            setStatus({ type: 'error', text: 'Gagal menyimpan konfigurasi: ' + error.message });
        } else {
            setIsActive(true);
            setStatus({ type: 'success', text: 'Konfigurasi berhasil disimpan!' });
            setTimeout(() => setStatus(null), 3000);
            setStep(2);
        }
    }

    async function disconnect() {
        if (!confirm('Apakah Anda yakin ingin memutuskan koneksi ke Google Sheets? Data konfigurasi akan dihapus.')) return;

        setIsSaving(true);
        const { error } = await supabase
            .from('settings')
            .upsert({
                id: 'google_sync_config',
                value: null
            });

        setIsSaving(false);
        if (error) {
            setStatus({ type: 'error', text: 'Gagal memutuskan koneksi: ' + error.message });
        } else {
            setWebhookUrl('');
            setIsActive(false);
            setStep(1);
            setStatus({ type: 'success', text: 'Koneksi berhasil diputuskan.' });
            setTimeout(() => setStatus(null), 3000);
        }
    }

    async function handleSync() {
        if (!webhookUrl) return;
        setIsSyncing(true);
        setStatus(null);

        try {
            await fetch(webhookUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'sync_voters',
                    timestamp: new Date().toISOString(),
                    data: voters.map(v => ({
                        nama: v.name,
                        nik: v.nik,
                        alamat: v.address,
                        kode: v.invitation_code,
                        status: v.is_present ? 'Hadir' : 'Belum Hadir'
                    }))
                })
            });
            setStatus({ type: 'success', text: 'Data berhasil dikirim ke Google Sheets!' });
        } catch (err: any) {
            setStatus({ type: 'error', text: 'Terjadi kesalahan saat sinkronisasi.' });
        } finally {
            setIsSyncing(false);
        }
    }

    async function handlePull() {
        if (!webhookUrl) return;
        setIsPulling(true);
        setStatus(null);

        try {
            const response = await fetch(webhookUrl + '?action=get_voters');
            const data = await response.json();

            if (!Array.isArray(data)) throw new Error('Invalid data format from Sheets');

            const formattedVoters = data.map(v => ({
                name: v.name || v.nama,
                nik: v.nik?.toString() || '',
                address: v.address || v.alamat || '',
                invitation_code: v.invitation_code || v.kode || `RT12-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                is_present: v.is_present ?? false // Default to false if not specified
            }));

            const { error } = await supabase.from('voters').upsert(formattedVoters, {
                onConflict: 'nik' // Upsert based on NIK
            });

            if (error) throw error;

            setStatus({ type: 'success', text: `Berhasil menarik ${data.length} data dari Google Sheets!` });
            // Optional: trigger a global refresh or local update
            window.location.reload();
        } catch (err: any) {
            console.error('Pull error:', err);
            setStatus({ type: 'error', text: 'Gagal menarik data. Pastikan Apps Script sudah di-deploy dengan doGet.' });
        } finally {
            setIsPulling(false);
        }
    }

    const appsScriptCode = `function doGet(e) {
  const action = e.parameter.action;
  if (action === 'get_voters') {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => h.toString().toLowerCase());
    
    const json = data.slice(1).map(row => {
      let obj = {};
      headers.forEach((h, i) => {
        // Map common headers
        if (h === 'nama' || h === 'name') obj.name = row[i];
        if (h === 'nik') obj.nik = row[i]?.toString() || '';
        if (h === 'alamat' || h === 'address') obj.address = row[i];
        if (h === 'kode' || h === 'code') obj.invitation_code = row[i]?.toString() || '';
        if (h === 'status') obj.is_present = (row[i]?.toString().toLowerCase() === 'hadir');
      });
      return obj;
    });
    
    return ContentService.createTextOutput(JSON.stringify(json)).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const contents = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  if (contents.action === 'sync_voters') {
    const rows = contents.data.map(v => [
      v.nama, v.nik, v.alamat, v.kode, v.status, contents.timestamp
    ]);
    
    sheet.getRange(1, 1, 1, 6).setValues([["Nama", "NIK", "Alamat", "Kode", "Status", "Last Sync"]]);
    sheet.getRange(1, 1, 1, 6).setFontWeight("bold");
    sheet.getRange(2, 1, rows.length, 6).setValues(rows);
    
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  }
}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(appsScriptCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="w-full max-w-2xl border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white my-auto">
            <header className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    <X size={24} />
                </button>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                        <Cloud size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight leading-none">Google Sheets</h2>
                        <p className="text-white/60 font-medium text-sm mt-1">Sinkronisasi Dua Arah</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Badge className={cn(
                        "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                        isActive ? "bg-emerald-400 text-emerald-950" : "bg-white/10 text-white/50"
                    )}>
                        {isActive ? 'Terhubung' : 'Belum Konfigurasi'}
                    </Badge>
                </div>
            </header>

            <CardContent className="p-8 space-y-8">
                <div className="flex items-center justify-between px-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all",
                                step === i ? "bg-primary text-white scale-110 shadow-lg" : "bg-slate-100 text-slate-400"
                            )}>
                                {i}
                            </div>
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest",
                                step === i ? "text-slate-800" : "text-slate-300"
                            )}>
                                {i === 1 ? 'Konfigurasi' : 'Sinkronisasi'}
                            </span>
                            {i === 1 && <ChevronRight size={14} className="text-slate-200 mx-4" />}
                        </div>
                    ))}
                </div>

                {step === 1 ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="p-6 rounded-3xl bg-blue-50/50 border border-blue-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                <Settings size={80} />
                            </div>
                            <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <ExternalLink size={14} /> Cara Setup (2-Way):
                            </h3>
                            <ol className="text-xs text-blue-800/80 space-y-2 font-medium list-decimal ml-4">
                                <li>Buka Google Sheet anda, klik <strong>Extensions {'>'} Apps Script</strong>.</li>
                                <li>Copy-paste kode di bawah ini ke editor.</li>
                                <li>Klik **Deploy {'>'} New Deployment**.</li>
                                <li>Pilih type **Web App**, set "Who has access" ke **Anyone**.</li>
                                <li>Konfirmasi izin Google (Klik Advanced {'>'} Go to... if requested).</li>
                                <li>Copy Web App URL dan paste di bawah ini.</li>
                            </ol>
                        </div>

                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute top-4 right-4 z-10">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCopy}
                                        className="rounded-xl h-8 text-[10px] font-black px-3 border-slate-200 bg-white"
                                    >
                                        {copied ? <Check className="w-3 h-3 mr-1 text-emerald-500" /> : <Copy className="w-3 h-3 mr-1" />}
                                        {copied ? 'Copied' : 'Copy Code'}
                                    </Button>
                                </div>
                                <pre className="p-4 rounded-2xl bg-slate-900 text-slate-300 text-[10px] font-mono overflow-x-auto h-32 scrollbar-thin scrollbar-thumb-slate-700">
                                    {appsScriptCode}
                                </pre>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">App Script Webhook URL</label>
                                <Input
                                    placeholder="https://script.google.com/macros/s/.../exec"
                                    value={webhookUrl}
                                    onChange={(e) => setWebhookUrl(e.target.value)}
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-bold focus-visible:ring-primary/20"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={saveSettings}
                                disabled={!webhookUrl || isSaving}
                                className="flex-1 h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 transition-all active:scale-95"
                            >
                                {isSaving ? <Loader2 className="animate-spin mr-2" /> : 'Hubungkan Google Sheets'}
                            </Button>
                            {isActive && (
                                <Button
                                    variant="ghost"
                                    onClick={disconnect}
                                    className="h-14 w-14 rounded-2xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 border border-slate-100"
                                    title="Putuskan Link"
                                >
                                    <Link2Off size={24} />
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 py-4">
                        <div className="flex flex-col items-center justify-center text-center p-8 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200">
                            <div className={cn(
                                "w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all duration-500 shadow-xl mb-4",
                                (isSyncing || isPulling) ? "bg-blue-600 text-white animate-pulse" : "bg-emerald-50 text-emerald-500"
                            )}>
                                {(isSyncing || isPulling) ? <RefreshCw size={32} className="animate-spin" /> : <CheckCircle2 size={32} />}
                            </div>
                            <h3 className="text-xl font-black text-slate-900 leading-tight">
                                {isPulling ? 'Menarik Data...' : isSyncing ? 'Mengirim Data...' : 'Siap Sinkronisasi'}
                            </h3>
                            <p className="text-sm text-slate-500 font-medium max-w-[280px] mt-1">
                                {isPulling
                                    ? 'Mengambil data terbaru dari Google Sheets anda...'
                                    : `Pilih arah sinkronisasi untuk ${voters.length} data pemilih.`}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <Button
                                onClick={handleSync}
                                disabled={isSyncing || isPulling}
                                className="h-14 rounded-2xl font-black text-lg bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 w-full"
                            >
                                {isSyncing ? 'Sedang Sinkron...' : 'Kirim ke Google Sheets (Push)'}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={handlePull}
                                disabled={isSyncing || isPulling}
                                className="h-14 rounded-2xl font-black text-lg border-slate-200 text-slate-600 hover:bg-slate-50 w-full"
                            >
                                {isPulling ? 'Sedang Menarik...' : (
                                    <span className="flex items-center gap-2">
                                        <DownloadCloud size={20} /> Tarik dari Sheets (Pull)
                                    </span>
                                )}
                            </Button>

                            <div className="flex gap-3 mt-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => setStep(1)}
                                    className="flex-1 h-12 rounded-xl text-slate-400 font-bold text-xs uppercase tracking-widest"
                                >
                                    <Settings size={16} className="mr-2" /> Pengaturan
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={disconnect}
                                    className="flex-1 h-12 rounded-xl text-rose-400 font-bold text-xs uppercase tracking-widest hover:text-rose-600"
                                >
                                    <Link2Off size={16} className="mr-2" /> Putuskan Link
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {status && (
                    <div className={cn(
                        "p-4 rounded-2xl flex items-center gap-3 animate-slide-in-up border",
                        status.type === 'success' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
                    )}>
                        {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        <span className="text-sm font-bold">{status.text}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
