# Assessment: Sistem Pemilihan Digital (APRT2026)

Dokumen ini berisi penilaian teknis dan rencana implementasi untuk transisi dari sistem pemilihan fisik/hybrid ke sistem pemilihan **sepenuhnya digital** tanpa *live-count*.

## Ringkasan Konsep
Sistem akan menggunakan QR Code sebagai tiket masuk suara. Setiap terminal suara (laptop) akan merekam proses scanning sebagai bukti keabsahan (audit trail), namun pilihan tetap anonim. Hasil suara hanya akan ditampilkan setelah pemilihan resmi ditutup.

## Perubahan yang Diusulkan

### 1. Portal Undangan Digital (Warga)
Memberikan kemudahan bagi warga untuk mendapatkan QR Code tanpa harus menunggu undangan fisik.
- **Fitur:** Halaman publik dimana warga memasukkan NIK untuk memunculkan undangan digital (Nama, Alamat, dan QR Code).
- **Endpoint:** `/undangan` (Public Access).

### 2. Stasiun Pendaftaran (Panitia)
Tetap menggunakan sistem check-in yang sudah ada untuk menandai kehadiran warga.
- **Hardware:** 1 Laptop/Tablet.
- **Workflow:** Scan QR warga -> Set `is_present = true`.

### 3. Bilik Suara Digital (Voting Terminal)
Terminal mandiri bagi warga untuk memberikan suara.
#### Alur Kerja (Workflow):
1. **Standby:** Menampilkan instruksi "Scan Undangan Anda".
2. **Scan & Record:** 
   - Begitu QR terdeteksi, sistem mulai **merekam video via webcam** laptop.
   - Validasi: Pastikan warga sudah check-in dan **belum pernah memilih**.
3. **Pilihan:** Menampilkan foto dan nama kandidat.
4. **Konfirmasi:** Pemilih memilih satu dan menekan "OK".
5. **Finalisasi:**
   - Suara disimpan ke tabel `votes` secara **anonim** (hanya `candidate_id`).
   - Tabel `voters` diupdate: `has_voted = true`.
   - Video disimpan sebagai bukti audit di `audit_logs` (dikaitkan dengan ID Warga, bukan ID Suara).
   - Menampilkan layar "Terima Kasih" yang desainnya sama dengan layar "Standby" (untuk otomatis reset bagi pemilih berikutnya).

### 4. Dashboard Hasil (Hidden Count)
Mencegah pengaruh psikologis dari perolehan suara sementara.
- **Kondisi:** Jika `is_voting_open` (di Settings) masih `true`, dashboard hanya menampilkan statistik partisipasi (Jumlah DPT vs Kehadiran).
- **Pengumuman:** Perolehan suara kandidat hanya muncul jika tombol "Tutup Pemilihan" telah ditekan oleh Admin.

---

## Spesifikasi Teknis & Database

### Struktur Database
```sql
-- Tambahkan status sudah memilih di tabel voters
ALTER TABLE public.voters 
ADD COLUMN has_voted BOOLEAN DEFAULT FALSE,
ADD COLUMN voted_at TIMESTAMPTZ;

-- Tabel untuk menyimpan referensi rekaman audit (Supabase Storage)
CREATE TABLE IF NOT EXISTS public.voting_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voter_id UUID REFERENCES public.voters(id),
    video_url TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Kebutuhan Perangkat Keras (Hardware)
- **1x Laptop Pendaftaran:** Untuk panitia di meja depan.
- **2x Laptop Bilik Suara:** Ditempatkan di dalam kotak pemilihan (dengan webcam aktif).
- **1x Projector:** Untuk menampilkan hasil akhir di layar besar.
- **Koneksi Internet:** Stabil untuk sinkronisasi Supabase.

---

## Rencana Verifikasi (Testing Plan)

### Skenario Uji
1. **Double Voting Test:** Mencoba scan ulang QR yang sudah memberikan suara. Sistem harus menolak.
2. **Anonymity Audit:** Memastikan di database tidak ada link langsung antara `voter_id` and `candidate_id` di tabel `votes`.
3. **Video Capture:** Memastikan recording dimulai saat scan dan tersimpan dengan benar di Supabase Storage.
4. **Live Count Block:** Memastikan hasil perolehan tidak bisa diakses via browser console atau inspect element selama voting masih buka.

---

> [!IMPORTANT]
> **Privasi Video:** Rekaman video hanya digunakan jika ada dispute/keberatan mengenai keabsahan jumlah pemilih. Video tidak boleh merekam layar/tombol yang ditekan oleh pemilih, melainkan hanya wajah/proses scanning di depan laptop.
