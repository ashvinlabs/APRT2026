# Feature Specification: APRT2026 (Aplikasi Pemilu RT 2026)

## 1. Pendahuluan
APRT2026 adalah aplikasi berbasis web yang dirancang untuk mendukung pelaksanaan pemilihan Ketua RT di tingkat Rukun Tetangga (RT 12 Pelem Kidul, Baturetno, Banguntapan, Bantul). Aplikasi ini mengutamakan transparansi, efisiensi pendaftaran, dan rekapitulasi suara secara real-time.

## 2. Konsep Pemilihan
- **Kandidat:** Terdiri dari 3 orang calon yang akan dipilih oleh pengurus RT aktif saat ini. Nama kandidat bersifat rahasia hingga hari pemilihan.
- **Output Jabatan:** 
  - Suara terbanyak menjabat sebagai **Ketua RT**.
  - Posisi **Sekretaris** dan **Bendahara** ditunjuk oleh Ketua RT terpilih dari sisa kandidat yang tidak menang.
- **Tujuan Utama:** Menghasilkan rekapitulasi suara sah untuk menentukan suara tertinggi secara transparan.

## 3. Ketentuan Pemilih
- **Usia:** Minimal 17 tahun ke atas.
- **Domisili:** Warga RT 12 berdasarkan data kependudukan ketua RT aktif.
- **Verifikasi:** Wajib menunjukkan undangan fisik/digital untuk mendapatkan surat suara.
- **Aturan Pilih:** Satu pemilih hanya dapat memilih satu kandidat.

## 4. Alur Hari-H (Proses Pemilihan)
1. **Pendaftaran:** Pemilih menunjukkan undangan (berupa QR Code).
2. **Verifikasi:** Panitia mencocokkan undangan dan KTP.
3. **Check-in:** Panitia melakukan scan/pencarian nama di aplikasi.
   - Aplikasi mencatat log panitia yang memproses (User Management tracking).
   - Counter "Jumlah Hadir" pada layar dashboard bertambah seketika.
4. **Pemungutan:** Pemilih menerima surat suara fisik dan melakukan pencoblosan di bilik suara.

## 5. Proses Penghitungan Suara (Tallying)
- Dilakukan secara terbuka di depan saksi dan warga.
- **Input Data:** Operator memasukkan hasil setiap surat suara yang dibuka satu per satu ke dalam aplikasi.
- **Live Update:** Setiap input akan memperbarui statistik di layar monitor/TV secara instan (Real-time).
- **Kategori Suara:** Mencatat suara untuk Kandidat 1, 2, 3, serta Suara Tidak Sah.

## 6. Spesifikasi Teknis & Antarmuka
- **Tech Stack:** Next.js (Frontend/Backend) & Supabase (Database & Real-time).
- **Deployment:** Vercel (Frontend) & Supabase Cloud (Database).
- **UI/UX Design:** 
  - **Light Mode (Tampilan Terang):** Mengutamakan keterbacaan tinggi (high contrast) agar mudah dipahami oleh warga senior.
  - **Live Dashboard:** Menampilkan chart statistik, foto kandidat, dan progres suara masuk.
- **Fitur Data:** 
  - Import data dari Google Sheets.
  - Input & Edit data manual via CMS internal.
  - **Sync-back:** Sinkronisasi otomatis kembali ke Google Sheets apabila ada perubahan data penduduk/pemilih di aplikasi.
- **User Management & Logging:** 
  - Login khusus untuk Panitia.
  - Pencatatan aktivitas (Audit Log) untuk melihat siapa panitia yang memproses setiap pemilih.

## 7. Dokumentasi
- **README.md:** Petunjuk instalasi lokal dan panduan operasional.
- **Dokumentasi Internal:** Struktur database dan API integrasi (Supabase).
- **Manual User:** Panduan singkat untuk Panitia Pendaftaran dan Operator Hitung.
