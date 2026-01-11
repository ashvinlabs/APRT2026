'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, QrCode, Search, User, Home, Download, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function DigitalInvitationPortal() {
    const [nik, setNik] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [voter, setVoter] = useState<any | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nik) return;

        setLoading(true);
        setError(null);
        setVoter(null);

        try {
            const { data, error: queryError } = await supabase
                .from('voters')
                .select('*')
                .eq('nik', nik)
                .maybeSingle();

            if (queryError) throw queryError;

            if (!data) {
                setError('Data NIK tidak ditemukan. Silakan hubungi panitia jika Anda merasa sudah terdaftar.');
            } else {
                setVoter(data);
            }
        } catch (err) {
            console.error('Lookup error:', err);
            setError('Terjadi kesalahan saat mencari data.');
        } finally {
            setLoading(false);
        }
    };

    const downloadQR = () => {
        const svg = document.querySelector("#voter-qr");
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = `Undangan_${voter?.name || 'Voter'}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-slate-900 mb-2">APRT 2026</h1>
                    <p className="text-slate-500 font-medium">Portal Undangan Digital Pemilihan Ketua RT</p>
                </div>

                {!voter ? (
                    <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
                        <div className="h-2 bg-primary w-full" />
                        <CardHeader>
                            <CardTitle>Cari Undangan</CardTitle>
                            <CardDescription>Masukkan NIK Anda untuk melihat undangan digital.</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSearch}>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nik">NIK (16 Digit)</Label>
                                    <div className="relative">
                                        <Input
                                            id="nik"
                                            placeholder="3471xxxxxxxxxxxx"
                                            value={nik}
                                            onChange={(e) => setNik(e.target.value)}
                                            className="pl-10 h-12 text-lg tracking-wider"
                                            maxLength={16}
                                        />
                                        <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-rose-700">
                                        <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                        <p className="text-sm font-medium">{error}</p>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button
                                    type="submit"
                                    className="w-full h-12 text-lg font-bold"
                                    disabled={loading || nik.length < 10}
                                >
                                    {loading ? <Loader2 className="animate-spin mr-2" /> : <QrCode className="mr-2" />}
                                    Tampilkan Undangan
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                ) : (
                    <Card className="border-none shadow-2xl shadow-indigo-200/50 overflow-hidden bg-white">
                        <div className="h-3 bg-gradient-to-r from-indigo-500 to-purple-500" />
                        <CardContent className="p-8 space-y-8">
                            <div className="text-center space-y-4">
                                <div className="inline-flex p-4 bg-indigo-50 rounded-3xl border-4 border-white shadow-sm mb-2">
                                    <QRCodeSVG
                                        id="voter-qr"
                                        value={voter.invitation_code}
                                        size={200}
                                        level="H"
                                        includeMargin={false}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 uppercase">{voter.name}</h2>
                                    <p className="text-slate-500 font-bold tracking-widest text-xs uppercase mt-1">Status: Pemilih Terverifikasi</p>
                                </div>
                            </div>

                            <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                        <User size={18} className="text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">NIK</p>
                                        <p className="text-slate-700 font-bold">{voter.nik}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                        <Home size={18} className="text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text_slate-400 uppercase tracking-tighter">Alamat</p>
                                        <p className="text-slate-700 font-bold">{voter.address}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center p-4 bg-indigo-600 rounded-2xl text-white">
                                <p className="text-xs font-medium opacity-80 uppercase tracking-widest mb-1">Kode Undangan</p>
                                <p className="text-2xl font-mono font-black tracking-[0.5em]">{voter.invitation_code}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="outline"
                                    className="h-12 font-bold border-2"
                                    onClick={() => setVoter(null)}
                                >
                                    Cari Lagi
                                </Button>
                                <Button
                                    className="h-12 font-bold bg-slate-900 border-2 border-slate-900 hover:bg-slate-800"
                                    onClick={downloadQR}
                                >
                                    <Download size={18} className="mr-2" />
                                    Simpan PNG
                                </Button>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50 border-t border-slate-100 p-4 justify-center">
                            <p className="text-[10px] text-slate-400 font-medium text-center uppercase tracking-widest">
                                Tunjukkan QR Code ini di TPS untuk memberikan suara
                            </p>
                        </CardFooter>
                    </Card>
                )}
            </div>
        </div>
    );
}
