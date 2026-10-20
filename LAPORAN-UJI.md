# Laporan verifikasi God Time — 19 Oktober 2026

Alur yang diperiksa: pengelola masuk melalui Google/PKCE, Supabase memeriksa role, admin mengelola pesan melalui API dengan RLS, dan pengunjung membaca pesan aktif melalui client anonim tanpa memperoleh draf atau pesan terjadwal lebih awal.

## Hasil

**24 pemeriksaan Node/PostgreSQL dan 8 alur browser lulus (32 total). Build produksi lokal berhasil.** Tidak ada data atau role produksi yang ditulis, tidak ada push ke GitHub, dan tidak ada deployment.

| Batas alur | Hasil | Bukti dan batas pengujian |
|---|---|---|
| Tampilan pengelola | Lulus lokal | Chrome: sebelum login editor tersembunyi; user tidak memperoleh editor/arsip; admin melihat kolom lama dan daftar pesan. |
| Google OAuth/PKCE | Lulus lokal; login nyata belum diuji | Chrome: tombol login membentuk URL Google dengan PKCE S256 dan callback lokal tetap; kode callback ditukar ke endpoint token dan dihapus dari URL. Respons penyedia Auth dikendalikan pengujian, tanpa login Google sungguhan. |
| Client ke API CRUD | Lulus lokal | Chrome: create, read, preview, update, reload, delete, logout. Permintaan update/delete membawa ID dan revision. Respons API dimock, tidak memakai database produksi. |
| API ke izin database | Lulus pada PostgreSQL lokal | PGlite/PostgreSQL 18.6 menjalankan migrasi RLS asli. Skema/UID milik Supabase disimulasikan. Anon/user tidak bisa menulis; admin bisa CRUD; metadata user tidak dapat memberikan admin. |
| Keamanan role | Lulus pada PostgreSQL lokal | Anon tidak bisa membaca tabel role, user hanya melihat role sendiri, bahkan admin tidak bisa menaikkan role melalui API. Pencabutan admin langsung mengurangi akses tanpa refresh JWT. |
| Jadwal publik | Lulus lokal | Anon hanya melihat published dengan waktu aktif; draf/masa depan/lampau tidak terbaca langsung. Awal inklusif, akhir eksklusif. Perhitungan waktu diuji pada tahun 5600, 5786–5788 dan 6000 termasuk Adar I/II. |
| Konflik penyimpanan | Lulus lokal | PostgreSQL menolak update/delete dengan revision lama (nol baris); revision palsu diganti trigger. Chrome mempertahankan isian konflik dan menonaktifkan simpan sampai reload. INSERT periode duplikat tidak menimpa data. |
| Respons ke tampilan publik | Lulus lokal | Chrome menampilkan teks database, merender payload script/img sebagai teks, kalender tetap ada; request publik tidak memakai JWT admin yang disimpan. |
| Fallback | Lulus lokal | Database gagal/kosong menghasilkan renungan pengantar; tidak mengambil snapshot JSON lama. Mode tanpa konfigurasi membaca arsip published dan memilih tahun/bulan tepat. |
| Impor data | Lulus pada PostgreSQL lokal | Semua field arsip diperiksa setelah impor; pengulangan idempoten; record dengan periode yang sudah terisi tidak berubah. `messages.json` sumber tidak diedit. |
| Admin pertama | Lulus pada PostgreSQL lokal | Script gagal jika akun belum ada atau belum memiliki identitas Google; hanya email terkonfirmasi yang ditentukan mendapat admin. |
| Berkas dan konfigurasi | Lulus lokal | Konfigurasi setengah terisi/secret key/service-role key ditolak. Server menolak akses `.env.local`, Git, SQL, source konfigurasi dan dependensi. JSON hasil build Supabase tidak membawa pesan lama. |
| Kalender dan sunset lama | Lulus lokal | Seluruh 11 pemeriksaan sebelumnya tetap lulus, termasuk tahun kabisat, hari raya, perbedaan diaspora dan pergantian tanggal Jakarta. |

## Bukti konfigurasi aktual (hanya baca)

- `https://ehop-godtime.vercel.app/`: HTTP 200, judul `God Time — Memahami waktu, menghidupi firman`.
- Supabase `/auth/v1/settings`: HTTP 200, Google provider aktif.
- Supabase REST untuk `god_time_messages`: HTTP 404 `PGRST205`; tabel belum tersedia pada schema cache.

Batas nyata berhenti di skema database: migrasi belum diterapkan. Dengan public key, daftar redirect, Google secret, dan akun/role aktual tidak dapat diverifikasi sebagai pemilik. Oleh karena itu laporan ini tidak menyatakan integrasi produksi sudah aktif atau login Google nyata sudah lulus. Ikuti langkah aktivasi dalam [IMPLEMENTASI-SUPABASE.md](IMPLEMENTASI-SUPABASE.md), lalu ulangi pemeriksaan dengan dua akun di staging sebelum publikasi.

## Menjalankan ulang

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm run test:browser
pnpm run build
```

Uji Node: `24 pass, 0 fail`. Uji browser: `8 passed` pada Chrome. Versi pengujian: Node 24.19.0, Supabase JS 2.118.0, PGlite 0.5.10, Playwright 1.64.1, esbuild 0.28.2. Chrome harus tersedia untuk pengujian browser. Laporan HTML lokal Playwright berada di folder `playwright-report` yang diabaikan Git.
