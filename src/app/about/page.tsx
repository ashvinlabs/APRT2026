'use client';

import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Users, QrCode, BarChart3, Shield, Smartphone, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import PublicNavbar from '@/components/PublicNavbar';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <PublicNavbar />

            <div className="px-2 pt-28 pb-8 md:p-8 md:pt-32 max-w-5xl mx-auto">
                {/* Header */}
                <header className="text-center mb-12">
                    <div className="inline-block px-6 py-2 bg-primary/10 rounded-full mb-4">
                        <p className="text-sm font-bold text-primary uppercase tracking-wider">Tentang Aplikasi</p>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
                        Sistem E-Voting <span className="text-primary">RT 12</span>
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Platform digital untuk pelaksanaan pemilihan Ketua RT yang transparan, efisien, dan modern
                    </p>
                </header>

                {/* Apa itu APRT2026 */}
                <Card className="mb-8 border-none shadow-xl">
                    <CardContent className="p-8">
                        <h2 className="text-2xl font-black text-slate-900 mb-4">Apa itu APRT2026?</h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            APRT2026 adalah aplikasi pemilihan umum berbasis web yang dirancang khusus untuk memudahkan pelaksanaan pemilihan Ketua RT 12 di Pelem Kidul, Baturetno, Bantul.
                        </p>
                        <p className="text-slate-600 leading-relaxed">
                            Dengan aplikasi ini, seluruh proses pemilihan—mulai dari pendaftaran pemilih, verifikasi kehadiran, hingga penghitungan suara—dapat dilakukan secara digital, cepat, dan akurat.
                        </p>
                    </CardContent>
                </Card>

                {/* Fitur Utama */}
                <div className="mb-8">
                    <h2 className="text-2xl font-black text-slate-900 mb-6 text-center">Fitur Utama</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                            <CardContent className="p-6">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                                    <Users className="text-blue-600" size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Daftar Pemilih Digital</h3>
                                <p className="text-sm text-slate-600">
                                    Kelola data pemilih dengan mudah. Import dari Excel/Google Sheets, edit data, dan cetak undangan otomatis.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                            <CardContent className="p-6">
                                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                                    <QrCode className="text-emerald-600" size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Check-In dengan QR Code</h3>
                                <p className="text-sm text-slate-600">
                                    Verifikasi kehadiran pemilih cukup dengan scan QR code dari undangan. Cepat, akurat, dan anti-duplikasi.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                            <CardContent className="p-6">
                                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                                    <BarChart3 className="text-purple-600" size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Dashboard Real-Time</h3>
                                <p className="text-sm text-slate-600">
                                    Pantau hasil penghitungan suara secara langsung. Dashboard update otomatis tanpa perlu refresh.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                            <CardContent className="p-6">
                                <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center mb-4">
                                    <Shield className="text-rose-600" size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Aman & Transparan</h3>
                                <p className="text-sm text-slate-600">
                                    Data tersimpan aman dengan enkripsi. Semua aktivitas tercatat untuk transparansi dan akuntabilitas.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Keunggulan */}
                <Card className="mb-8 border-none shadow-xl bg-gradient-to-br from-primary to-blue-600 text-white">
                    <CardContent className="p-8">
                        <h2 className="text-2xl font-black mb-6">Mengapa Menggunakan APRT2026?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="flex-shrink-0 mt-1" size={20} />
                                <div>
                                    <h4 className="font-bold mb-1">Hemat Waktu</h4>
                                    <p className="text-sm text-white/80">Proses check-in dan penghitungan suara lebih cepat</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="flex-shrink-0 mt-1" size={20} />
                                <div>
                                    <h4 className="font-bold mb-1">Akurat</h4>
                                    <p className="text-sm text-white/80">Minim kesalahan manual, data tercatat otomatis</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="flex-shrink-0 mt-1" size={20} />
                                <div>
                                    <h4 className="font-bold mb-1">Transparan</h4>
                                    <p className="text-sm text-white/80">Hasil dapat dipantau langsung oleh semua pihak</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="flex-shrink-0 mt-1" size={20} />
                                <div>
                                    <h4 className="font-bold mb-1">Mudah Digunakan</h4>
                                    <p className="text-sm text-white/80">Interface sederhana, bisa diakses dari HP/laptop</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Mobile Friendly */}
                <Card className="mb-8 border-none shadow-xl">
                    <CardContent className="p-8">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                                <Smartphone className="text-indigo-600" size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">Akses dari Mana Saja</h2>
                                <p className="text-slate-600">Bisa dibuka di HP, tablet, atau komputer</p>
                            </div>
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                            Aplikasi ini dirancang responsif dan mobile-friendly. Panitia dapat mengakses dari HP untuk check-in di lapangan,
                            sementara dashboard bisa ditampilkan di TV/monitor untuk dipantau warga.
                        </p>
                    </CardContent>
                </Card>

                {/* Support & License */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Card className="border-none shadow-lg">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-3">Dukungan Teknis</h3>
                            <p className="text-sm text-slate-600 mb-2">
                                Untuk bantuan teknis atau pertanyaan seputar aplikasi, hubungi:
                            </p>
                            <p className="text-sm font-bold text-primary">Ashvin Labs</p>
                            <p className="text-xs text-slate-500 mt-1">Developer & Technical Support</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-3">Lisensi</h3>
                            <p className="text-sm text-slate-600 mb-2">
                                © 2026 Panitia Pemilu RT 12 Pelem Kidul - Baturetno
                            </p>
                            <p className="text-xs text-slate-500">
                                Designed and developed by <span className="font-bold text-primary">Ashvin Labs</span>
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Footer CTA */}
                <div className="text-center bg-slate-100 rounded-3xl p-8">
                    <h3 className="text-xl font-black text-slate-900 mb-2">Siap Menggunakan APRT2026?</h3>
                    <p className="text-slate-600 mb-4">
                        Lihat daftar pemilih atau pantau hasil penghitungan suara secara real-time
                    </p>
                    <div className="flex gap-3 justify-center flex-wrap">
                        <a
                            href="/panitia/voters"
                            className="px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-colors"
                        >
                            Lihat Daftar Pemilih
                        </a>
                        <a
                            href="/dashboard"
                            className="px-6 py-3 bg-white text-slate-900 rounded-2xl font-bold border-2 border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                            Lihat Dashboard
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
