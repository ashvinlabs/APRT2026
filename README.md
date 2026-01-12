# APRT2026 - Aplikasi Pemilu RT 12

> Sistem E-Voting Terintegrasi untuk Pemilihan Ketua RT 12 Pelem Kidul, Baturetno, Bantul

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8)](https://tailwindcss.com/)

## 📋 Tentang

**APRT2026** adalah platform digital untuk pelaksanaan pemilihan Ketua RT yang transparan, efisien, dan modern. Aplikasi ini beroperasi dalam model **Semi-Digital**, mengombinasikan verifikasi digital yang kuat dengan proses pemungutan suara fisik yang tetap terjaga integritasnya.

## ✨ Fitur Utama

### 🗳️ Manajemen Pemilih (DPT) - Privacy First
- **Composite Identity**: Identitas unik berdasarkan kombinasi Nama & Alamat (Tanpa NIK untuk privasi maksimal).
- **Import/Export**: Dukungan CSV dan integrasi dua arah dengan Google Sheets.
- **Privacy Masking**: Alamat dan kode undangan disamarkan untuk akses publik.
- **Auto-Generate Code**: Kode undangan unik 6-karakter yang dihasilkan secara deterministik.

### 📄 Sistem Undangan
- **Cetak Formal**: Layout 3 undangan per lembar A4 dengan Kop Surat resmi.
- **QR Code Integration**: Setiap undangan memiliki QR code unik untuk verifikasi cepat.
- **Dynamic Content**: Otomatis mengambil data tanggal, waktu, dan lokasi dari pengaturan sistem.

### ✅ Check-In Pemilih & Validasi
- **QR Scanner**: Verifikasi kehadiran instan dengan native camera access.
- **Audio Feedback**: Feedback visual dan suara untuk status scan (Berhasil/Gagal/Duplikat).
- **Lock System**: Admin dapat mengunci registrasi secara real-time untuk mencegah entri setelah batas waktu.

### 📊 Penghitungan Suara (Tally) & Safeguards
- **Voting Safeguards**: Mencegah input suara melebihi jumlah kehadiran (Check-in) yang tercatat.
- **Counter Mode**: Mode input cepat menggunakan keyboard (Tombol angka 1-9 untuk kandidat).
- **Real-time Sync**: Hasil input langsung muncul di Live Dashboard tanpa refresh.
- **Undo Logic**: Fitur pembatalan suara terakhir untuk koreksi kesalahan input.

### 📺 Live Dashboard
- **Public Display**: Layout khusus TV/Monitor untuk transparansi publik.
- **Presence Tracking**: Monitoring jumlah kehadiran vs total DPT secara real-time.
- **Winner Prediction**: Visualisasi perolehan suara tertinggi secara dinamis.

### 👥 Manajemen Tim & Staff
- **Approval Workflow**: Setiap pendaftaran staff baru memerlukan persetujuan Administrator.
- **Profile Photos**: Dukungan foto profil staff (Upload & Crop) untuk identifikasi petugas.
- **Role-Based Access**: 4 tingkat akses (Super Admin, Admin, Controller, Officer).

### ⚙️ Settings & Configuration
- **Global Config**: Pengaturan sentral untuk lokasi, waktu, dan status pemungutan suara.
- **Sync Control**: Kendali atas integrasi Google Sheets.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase Account

### Installation

```bash
# Clone repository
git clone https://github.com/ashvinlabs/APRT2026.git
cd APRT2026

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local dengan Supabase credentials Anda
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup

1. Buat project di [Supabase](https://supabase.com)
2. Jalankan `schema.sql` di SQL Editor
3. Verify tables & RLS policies

### Development

```bash
# Run development server
npm run dev

# Open http://localhost:3000
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📱 Mobile Optimization

Aplikasi fully responsive dengan optimasi khusus mobile:
- Sidebar off-screen di mobile dengan floating menu button
- Padding optimal (8px horizontal, 2rem vertical)
- Touch-friendly interface
- QR Scanner dengan native camera access

## 🔐 Role & Permissions

| Role | Permissions |
|------|------------|
| **Super Admin** | Full system access |
| **Administrator** | Manage staff, voters, votes, settings |
| **Controller** | Manage voters, votes, invitations, check-in |
| **Officer** | Check-in only |

## 📚 Dokumentasi

Untuk dokumentasi lengkap, lihat:
- [DOCUMENTATION.md](./DOCUMENTATION.md) - Panduan lengkap aplikasi
- [clean_database.sql](./clean_database.sql) - Script cleanup database

## 🛠 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Lucide React
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Deployment**: Vercel

## 📞 Support

**Developer**: Ashvin Labs  
**Project**: APRT2026  
**Year**: 2026

## 📄 License

© 2026 Panitia Pemilu RT 12 Pelem Kidul - Baturetno  
Designed and developed by **Ashvin Labs**

---

Made with ❤️ for transparent and efficient elections
