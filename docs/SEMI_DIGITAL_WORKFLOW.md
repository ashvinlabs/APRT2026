# Panduan Operasional Pemilihan Semi-Digital RT 12 (V.2026)

Dokumen ini merupakan acuan resmi pelaksanaan pemilihan Ketua RT 12 dengan sistem **Semi-Digital**. Sistem ini menggabungkan kecepatan pencatatan digital dengan validitas fisik surat suara.

---

## 1. Prinsip Dasar
- **Privasi**: Data pemilih (DPT) hanya mencakup **Nama** dan **Alamat**. NIK tidak lagi digunakan.
- **Validitas**: Surat suara fisik tetap menjadi bukti utama pemilihan.
- **Efisiensi**: Pencatatan kehadiran dan perhitungan suara dilakukan secara digital untuk hasil real-time.

---

## 2. Alur Pelaksanaan (Hari H)

### Fase A: Pendaftaran & Check-In (Digital)
1. **Verifikasi**: Pemilih datang membawa undangan (fisik/digital) dan KTP untuk verifikasi nama.
2. **Scanning**: Petugas melakukan scanning QR Code pada undangan.
3. **Catat Kehadiran**: Sistem mencatat pemilih sebagai "Hadir" (`is_present = true`). 
4. **Distribusi Fisik**: Pemilih menerima **Surat Suara Fisik** yang telah diparaf petugas.

### Fase B: Pemungutan Suara (Fisik)
1. **Bilik Suara**: Pemilih mencoblos pilihan secara rahasia di bilik suara.
2. **Kotak Suara**: Pemilih memasukkan surat suara ke kotak suara fisik.
3. **Tanda Jari**: Pemilih mencelupkan jari ke tinta tanda telah memilih.

### Fase C: Penutupan Pendaftaran & Voting
1. **Closing Check-In**: Pendaftaran ditutup pada waktu yang ditentukan atau setelah DPT hadir semua.
2. **Closing Voting**: Proses pencoblosan dinyatakan selesai.

### Fase D: Penghitungan Suara (Semi-Digital)
Proses ini dilakukan secara terbuka di depan saksi:
1. **Membuka Kotak**: Petugas membuka kotak suara fisik.
2. **Pembacaan**: Satu petugas membacakan pilihan di surat suara fisik satu per satu.
3. **Pencatatan Ganda**: 
   - **Manual**: Dicatat pada papan/kertas yang tersedia.
   - **Digital**: Petugas operator laptop menekan tombol input pada sistem untuk setiap suara yang dibaca (Kandidat X, atau Suara Tidak Sah).
4. **Validasi**: Hasil akhir digital harus dicocokkan dengan catatan manual.

---

## 3. Laporan Hasil Akhir
Setelah perhitungan selesai, sistem secara otomatis merangkum:
- **Total DPT**: Jumlah seluruh warga yang terdaftar.
- **Tingkat Partisipasi**: Jumlah pemilih yang hadir (Check-In).
- **Total Suara Masuk**: Total kertas suara yang dihitung.
- **Validitas**:
    - **Suara Sah**: Total suara untuk seluruh kandidat.
    - **Suara Tidak Sah**: Surat suara rusak atau coblos lebih dari satu.
- **Hasil Perolehan**: Suara masing-masing kandidat.
- **Klasemen Akhir**: Urutan kandidat dari suara terbanyak ke terkecil.

---

## 4. Perubahan Teknis Mendatang
1. **Database**: Migrasi kolom `voters.nik` menjadi optional/nullable.
2. **Tallying UI**: Pengembangan antarmuka khusus untuk input perhitungan cepat (Counter-mode).
3. **Dashboard Stats**: Penambahan widget untuk Suara Sah/Tidak Sah dan Ranking.

---
**Panitia Pemilihan RT 12**  
*Pelem Kidul, Baturetno, Bantul*
