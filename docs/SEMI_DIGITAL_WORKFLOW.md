# Panduan Operasional Pemilihan Semi-Digital RT 12 (V.2026)

## 1. Definisi & Konsep
- **DPT (Daftar Pemilih Tetap)**: Seluruh warga yang terdaftar dan berhak memilih.
- **Kehadiran (Attendance)**: Pemilih DPT yang hadir, melakukan check-in, dan mendapatkan hak suara.
- **Suara Masuk (Actual Votes)**: Jumlah surat suara yang berada di dalam kotak suara (pemilih yang hadir DAN mencoblos).

> **PENTING**:
> *   Hanya yang **Check-In** yang bisa memilih.
> *   Tidak semua yang Check-In pasti memilih (bisa pulang sebelum dipanggil/no-show).
> *   Hanya surat suara di dalam kotak yang dihitung.

## 2. Alur Pelaksanaan (Timeline)

### 08:00 - Pendaftaran Dibuka (Registration OPEN)
1.  **Setting**: `Registration = OPEN`, `Voting/Tally = CLOSED`.
2.  **Aktivitas**:
    -   Pemilih datang, scanning QR Code / Check-in manual.
    -   Sistem mencatat `is_present = true`.
    -   **Display Utama**: Menampilkan **Daftar Antrian** (Voting Queue) secara real-time.

### 08:30 - Pemungutan Suara Dimulai (Casting Votes)
1.  **Setting**: `Registration = OPEN`, `Voting/Tally = CLOSED`.
2.  **Sistem Antrian (Queue)**:
    -   Pemilih dipanggil dalam **Kelompok 3 Orang** (sesuai jumlah bilik).
    -   Pem panggilan berdasarkan urutan kedatangan (Check-in time).
3.  **Proses**:
    -   Dipanggil -> Ambil Surat Suara -> Bilik -> Kotak Suara -> Tinta -> Pulang.
4.  **Penanganan Ketidakhadiran (No-Show)**:
    -   Jika dipanggil tapi tidak ada:
        -   **Sanksi 1-2**: Dipindahkan mundur **3 Kelompok** (approx. 9 antrian).
        -   **Sanksi 3**: Dipindahkan ke **Urutan Terakhir** (setelah semua yang hadir selesai).

### 10:30 (atau Selesai) - Penutupan & Penghitungan (Counting Phase)
1.  **Syarat**: Semua pemilih yang hadir sudah dipanggil.
2.  **Transisi**:
    -   Petugas merubah status: **TUTUP PENDAFTARAN**.
    -   Petugas merubah status: **BUKA VOTING (TALLY)**.
3.  **Display Utama**: Otomatis berubah menampilkan **Live Tally / Hasil Perhitungan**.
4.  **Proses Penghitungan**:
    -   Buka kotak suara.
    -   Baca surat suara satu per satu.
    -   Input ke sistem (Operator) & Catat di Plano (Manual).
    -   Validasi saksi.

## 3. Logika Dashboard (Public Display)
Dashboard utama (`/dashboard`) akan beradaptasi otomatis:
1.  **Mode Antrian**: Saat `Registration OPEN` (Pagi - Siang).
    -   Menampilkan antrian berjalan.
    -   Status pemanggilan.
2.  **Mode Hasil (Tally)**: Saat `Registration CLOSED` & `Voting OPEN` (Siang).
    -   Menampilkan grafik perolehan suara.
    -   Statistik DPT vs Kehadiran vs Suara Sah.

---

## 4. Keamanan & Kontrol (Safeguards)
Untuk menjamin integritas "Semi-Digital", sistem menerapkan:
1. **Pencegahan Over-vote**: Sistem akan menolak input suara jika jumlah total suara masuk sudah mencapai jumlah warga yang Check-In.
2. **Kunci Voting (Lock)**: Input suara hanya aktif jika Admin telah menutup status "Voting Open" di Pengaturan (mencegah input sebelum kotak suara resmi dibuka).
3. **Undo Satu-Langkah**: Fitur untuk menghapus 1 entri terakhir jika terjadi kesalahan ketik oleh petugas operator.
4. **Audit Log**: Setiap input suara dicatat siapa petugasnya dan kapan waktunya.

---

## 5. Fitur Teknis Tersedia
- [x] **Privacy DPT**: Penghapusan NIK dari database.
- [x] **Counter Mode**: Pencatatan cepat dengan hotkeys keyboard.
- [x] **Staff Identity**: Foto profil petugas pendukung akuntabilitas.
- [x] **Smart Sync**: Sinkronisasi data warga dengan Google Sheets.

---
**Panitia Pemilihan RT 12**
*Januari 2026*
