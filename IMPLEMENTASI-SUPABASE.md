# Integrasi God Time: catatan penerapan

Implementasi lokal berada pada cabang `feat/supabase-auth-crud`, berdasarkan repo `propagandavirtual8/god-time` commit `e025475`. Tidak ada push, deployment, migrasi database produksi, atau perubahan akun/role produksi yang dijalankan.

## Hasil review konfigurasi — 19 Oktober 2026

- Situs asli adalah HTML/CSS/JavaScript statis, Node >=22, build menuju `dist`. Tidak memerlukan perpindahan framework.
- Project URL yang diberikan: `https://xtjwfqqxgxetezobbyfm.supabase.co`. Publishable key disimpan hanya di `.env.local` yang diabaikan Git. Key ini memang ditujukan untuk browser; kerahasiaan data bergantung pada RLS.
- Endpoint publik Auth settings membalas 200 dan `external.google=true`. Hal ini mengonfirmasi provider aktif, belum membuktikan redirect URI/client secret/consent Google benar.
- Pembacaan tabel baru membalas 404 `PGRST205`: `public.god_time_messages` belum tersedia di schema cache. Tidak ada percobaan membuat atau menggantinya di proyek ini.
- Metadata repo masih menunjuk `https://god-time.vercel.app` (404). Pengguna mengonfirmasi domain aktif `https://ehop-godtime.vercel.app`; pemeriksaan baca membalas HTTP 200 dengan judul God Time.
- Akses yang tersedia hanya public key. Google client secret, daftar redirect Supabase, user yang sudah terdaftar, seluruh skema database, dan environment Vercel belum dapat diaudit dengan akses pemilik.
- `messages.json` repo dan salinan proyek memiliki isi JSON yang sama; perbedaan hash hanya format berkas. Berkas asli tidak diubah.

## Perubahan

`kelola.html` mempertahankan kolom, pratinjau, dan palet tampilan. Pengguna masuk melalui Google dengan PKCE, melihat role, dan keluar dari browser ini. User biasa tidak melihat editor. Admin dapat membaca arsip, membuat pesan untuk periode kosong, mengedit, menjadwalkan, mengembalikan ke draf, dan menghapus setelah konfirmasi. Tidak ada lagi penggantian seluruh JSON melalui GitHub.

`god_time_roles` menyimpan role `user`/`admin`, terpisah dari metadata yang bisa disunting pengguna. Akun baru selalu user. Admin pun tidak punya akses API untuk memberikan role; pemilik database mengelolanya. Fungsi pembaca role memakai `security definer` dan search path kosong. Pemeriksaan role membaca tabel setiap permintaan, sehingga pencabutan admin langsung berlaku tanpa menunggu token diperbarui.

`god_time_messages` memakai RLS: anon/user hanya membaca pesan published yang waktu aktifnya sudah dimulai dan belum berakhir. Draf, bulan mendatang, dan periode lampau tidak dapat diambil melalui API publik. Admin bisa membaca semuanya dan melakukan CRUD. Satu pesan per pasangan tahun/bulan. Batas teks dan kecocokan Adar dengan tahun kabisat juga diperiksa database.

Rentang aktif dihitung saat admin menyimpan/import, menggunakan kalender ICU dan estimasi matahari terbenam Jakarta yang sudah ada di aplikasi. Awal termasuk dan akhir eksklusif. Admin dipercaya menentukan jadwal; kolom waktu hanya dapat ditulis admin. Pembatasan waktu baca memakai jam database, bukan tanggal yang dikirim pengunjung.

Update/delete menyertakan ID dan revision yang dibaca sebelumnya. Database menaikkan revision. Konflik, koneksi gagal, atau hasil penyimpanan tidak pasti mempertahankan isian dan meminta pemuatan ulang sebelum percobaan berikutnya. Pembuatan pesan memakai INSERT, sehingga tidak menimpa pesan lain pada periode sama.

`app.js` dan `messages.js` mengambil satu periode yang tepat lewat client publik terpisah yang tidak memakai sesi admin. Semua teks database dirender dengan escaping/textContent. `content.js` tetap menjadi materi kalender dan renungan pengantar; tidak menjadi HTML yang disuntikkan database. Pesan dimuat ulang setiap menit dan saat pilihan petang berubah.

Jika Supabase aktif tetapi kosong/bermasalah, situs menampilkan renungan pengantar. Tidak ada fallback ke pesan JSON lama yang mungkin sudah dihapus atau ditarik. Jika konfigurasi Supabase dikosongkan sepenuhnya, mode lama tetap membaca snapshot published saja. Dalam build Supabase, `dist/messages.json` kosong; draf dan snapshot lama tidak ikut terbit. `messages.json` sumber tetap utuh untuk impor/backup. Riwayat Git yang sudah publik tidak dapat dijadikan privat oleh RLS.

Build membundel SDK Supabase yang versinya dikunci, tanpa ketergantungan CDN. Konfigurasi tidak lengkap, secret key, service-role JWT, atau URL bukan origin HTTPS ditolak. Server lokal hanya menyajikan daftar berkas hasil build; `.env`, SQL, Git, dan dependensi tidak disajikan.

## Menjalankan dan menguji

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm exec playwright test
pnpm run build
pnpm run dev
```

Uji browser memakai Google Chrome terinstal (`channel: chrome`). Instal Chrome atau sesuaikan channel Playwright bila lingkungan berbeda. Pengujian browser memakai alamat Supabase fiktif dan respons API terkontrol; tidak menulis ke proyek Supabase yang diberikan. Uji RLS memakai PostgreSQL 18.6 melalui PGlite; hanya skema Auth milik Supabase disimulasikan.

Salin `.env.example` menjadi `.env.local`, isi `SUPABASE_URL` dan `SUPABASE_PUBLISHABLE_KEY`. Dua variabel ini dimasukkan ke bundle publik saat build. Jangan menaruh service-role key, database password, atau Google client secret di variabel browser. Build lokal sudah disiapkan menggunakan public key yang diberikan.

## Urutan aktivasi setelah target disepakati

1. Gunakan domain produksi terkonfirmasi `https://ehop-godtime.vercel.app` dan proyek Supabase di atas; konfirmasi akses pemilik dan bahwa skema bernama `god_time_*` tidak berbenturan. Cadangkan database dan arsip `messages.json` sebelum perubahan. Periksa tabel serta policy yang sudah ada melalui Dashboard pemilik.
2. Tinjau lalu jalankan `supabase/migrations/202610190001_god_time.sql` sekali melalui SQL Editor milik proyek yang benar. Seluruh migrasi dibungkus transaksi. Jika nama objek sudah ada, migrasi gagal tanpa menggantinya; investigasi dulu, jangan menghapus objek untuk memaksanya berhasil.
3. Jalankan `pnpm run prepare:import` secara lokal untuk memperbarui SQL dari arsip terbaru. Tinjau hash/jumlah pesan di `supabase/legacy-import.sql`, kemudian jalankan file itu melalui SQL Editor. Import menggunakan `ON CONFLICT (year,month) DO NOTHING`: data yang sudah ada tidak ditimpa, termasuk draf. Bandingkan setiap field/jumlah record; konflik perlu ditinjau manual.
4. Pada Google Cloud OAuth Web client, authorized redirect URI adalah `https://xtjwfqqxgxetezobbyfm.supabase.co/auth/v1/callback`. Authorized JavaScript origins memakai origin situs yang disepakati. Client ID/secret disimpan di Supabase Dashbapoard provider Google, bukan source code. Pastikan consent screen/audience mengizinkan akun admin.
5. Pada Supabase Auth URL Configuration, Site URL memakai `https://ehop-godtime.vercel.app`. Redirect allowlist harus berisi URL tepat `https://ehop-godtime.vercel.app/kelola.html` dan untuk uji lokal `http://127.0.0.1:4173/kelola.html`. Jangan memakai wildcard produksi. Path callback Google dan halaman tujuan aplikasi adalah dua URL berbeda.
6. Tambahkan kedua environment publik ke target hosting; tetap gunakan build `pnpm run build` dan output `dist`. Perubahan environment memerlukan rebuild. Jangan publikasikan root repository atau SQL/arsip privat.
7. Uji pada staging yang callback-nya juga telah diizinkan. Masuk dengan Google sebagai `ehopindonesia@gmail.com` supaya akun dibuat sebagai user. Pemilik proyek kemudian meninjau dan menjalankan `supabase/bootstrap-admin.sql`, yang hanya menaikkan akun dengan email terkonfirmasi dan identitas Google. Jika akun belum masuk, script gagal tanpa perubahan. Muat ulang halaman pengelola.
8. Verifikasi nyata: akun user ditolak CRUD; admin membuat draf dan mengeditnya; pengunjung anonim tidak bisa mengambil draf/bulan depan lewat REST; admin menerbitkan pesan bulan berjalan lalu menariknya; beranda menampilkan renungan pengantar; dua tab admin memicu konflik versi. Uji login/logout Google sesungguhnya dan cabut admin untuk menguji penolakan langsung. Hanya setelah ini, sepakati deployment produksi.

Script bootstrap admin merupakan tindakan berhak tinggi yang sengaja tidak dijalankan otomatis. Public key tidak cukup untuk menjalankan migrasi atau memberikan role.

## Pemulihan

Migrasi dan impor tidak menghapus arsip JSON atau tabel lain. Jangan drop tabel saat rollback situs: simpan pesan baru yang mungkin sudah masuk ke database. Untuk keadaan database gagal, tampilan pengantar tetap tersedia. Kembali ke mode JSON memerlukan keputusan editorial karena snapshot lama bisa menghidupkan pesan yang telah ditarik; bukan tindakan pemulihan otomatis. Backup harus mencakup pesan baru, role, dan jadwal.

## Rujukan implementasi

- [Google OAuth Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [PKCE code exchange](https://supabase.com/docs/reference/javascript/auth-exchangecodeforsession)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Pengujian database Supabase](https://supabase.com/docs/guides/database/testing)
