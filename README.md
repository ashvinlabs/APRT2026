# APRT2026 - Aplikasi Pemilu RT 12

> Sistem E-Voting Terintegrasi untuk Pemilihan Ketua RT 12 Pelem Kidul, Baturetno, Bantul

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8)](https://tailwindcss.com/)

## 📋 Tentang

**APRT2026** adalah platform digital untuk pelaksanaan pemilihan Ketua RT yang transparan, efisien, dan modern. Aplikasi ini menyediakan solusi end-to-end untuk manajemen pemilihan, mulai dari pendaftaran pemilih, verifikasi kehadiran, hingga penghitungan suara secara real-time.

## ✨ Fitur Utama

### 🗳️ Manajemen Pemilih (DPT)
- Import/Export data dari CSV atau Google Sheets
- Smart Sync dua arah dengan Google Sheets
- Privacy mode (NIK & alamat disamarkan untuk publik)
- Public access untuk transparansi
- Auto-generate kode undangan unik

### 📄 Sistem Undangan
- Cetak undangan formal (3 per A4)
- QR Code integration untuk setiap pemilih
- Dynamic content (tanggal, waktu, lokasi)
- Bulk print & single print

### ✅ Check-In Pemilih
- QR Code scanner untuk verifikasi
- Real-time validation dengan feedback audio
- Duplicate prevention
- Recent check-in history
- Lock/unlock check-in oleh admin

### 📊 Penghitungan Suara
- Manual input perolehan suara
- Tracking suara sah/tidak sah
- Real-time dashboard update
- Audit trail lengkap

### 📺 Live Dashboard
- Public display untuk monitor/TV
- Real-time stats tanpa refresh
- Responsive design
- Print-ready layout

### 👥 Manajemen Tim & Roles
- User registration dengan approval workflow
- Role-Based Access Control (4 roles)
- Staff approval system
- Self-edit profile
- Password reset via email
- Activity logs

### ⚙️ Settings & Configuration
- Election config (tanggal, waktu, lokasi)
- Registration toggle
- Candidate management
- Real-time sync

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
