# God Time — Design Studio
Halaman baru: /editor.html. Implementasi pada branch feature/layout-editor, berbasis main commit 5ed3f175.
Kelola Pesan (/kelola.html), role admin pesan, SQL pesan, dan isi pesan tidak diubah.

## Fitur yang tersedia
- Canvas halaman asli dengan drag-and-drop, container bertingkat, flexbox dan grid 1–4 kolom.
- Elemen judul, teks, gambar, tombol, garis, spacer.
- Widget aplikasi: pesan utama, tanggal dan ayat harian, kalender Yahudi, 12 bulan, doa, ruang belajar.
- Widget aplikasi hanya boleh muncul sekali agar ID dan event aplikasi tetap benar.
- Inspector: ukuran, jarak, warna, latar gambar, font, garis, radius, bayangan, opasitas, visibilitas.
- Pilih “Bagian yang diatur” untuk mewarnai box dalam widget, seperti panel kalender atau box ayat.
- Logo, warna halaman/header, aksen, font sans-serif.
- Mode desktop 1280 px, tablet 768 px, mobile 390 px; tablet dan mobile mewarisi nilai desktop.
- Undo/redo, duplikat/hapus, struktur, impor/ekspor JSON.
- Draf lokal atau draf server, publikasi atomik, 20 versi terbit terakhir untuk dipulihkan sebagai draf.
- Gambar PNG/JPG/WebP/AVIF: server maksimal 5 MB, demo lokal 500 KB.
- Admin desain memiliki tabel izin tersendiri. Tidak mewarisi role admin pesan.
- Konflik revisi mencegah sesi lama menimpa draf/publikasi baru.

Ini editor khusus God Time dengan pola page builder. Bukan plugin Elementor Pro dan belum setara semua fiturnya:
belum ada Theme Builder multi-halaman, popup builder, form builder, WooCommerce, custom script/CSS bebas,
animasi tingkat lanjut, breakpoint kustom, kolaborasi realtime, atau katalog plugin pihak ketiga.
Header dapat diganti logo/warna; susunan navigasi dan footer tetap mengikuti aplikasi.

## Menjalankan lokal
Node >=22. Jalankan pnpm install, kemudian pnpm dev; buka http://127.0.0.1:4173/editor.html.
Tanpa konfigurasi Supabase, pilih “Coba editor lokal”. Simpan lokal hanya berlaku untuk browser tersebut.
Mode lokal tidak dapat menerbitkan ke situs publik. Unggah gambar demo disimpan sebagai data gambar dalam JSON.
Editor tidak menulis isi pesan.

## Memasang pada proyek Supabase yang sudah digunakan God Time
1. Tinjau dan jalankan supabase/migrations/202610270001_layout_editor.sql satu kali.
   Memerlukan migrasi pesan yang sudah ada serta skema auth/storage bawaan Supabase.
   Jangan menjalankan ulang migrasi pesan dan jangan mengganti tabel pesan.
2. Admin desain harus memiliki akun Auth yang emailnya terkonfirmasi.
   Edit email di supabase/bootstrap-layout-admin.sql lalu jalankan di SQL Editor.
   Skrip ini hanya memberikan izin desain kepada akun yang ditentukan.
   Hak admin pesan tetap terpisah.
3. Tambahkan redirect URL https://DOMAIN/editor.html di Supabase Auth URL Configuration.
   Untuk login Google, pastikan provider Google yang sudah ada aktif.
   Login email memerlukan provider email dan akun dengan password.
4. Vercel memakai SUPABASE_URL dan SUPABASE_PUBLISHABLE_KEY yang sudah digunakan.
   Gunakan publishable/anon key; jangan menaruh service-role key pada frontend.
5. Deploy branch sebagai Preview, periksa login admin desain, draf, unggah, lalu publikasi.
   Role dan tabel editor belum dipasang ke akun live oleh paket ini.
6. Deploy ke production setelah pengecekan. Sebelum layout pertama diterbitkan,
   halaman publik menggunakan susunan asli. Jika tabel belum ada atau request gagal,
   homepage tetap berfungsi dengan susunan asli.

Gambar di bucket god-time-design-media memiliki URL publik sejak diunggah, walaupun layout masih draf.
Hanya admin desain yang dapat upload. Browser tidak dapat menimpa atau menghapus gambar terbit.
Untuk mencabut akses desain:
delete from public.god_time_layout_admins where user_id = 'UUID_ADMIN_DESAIN';
Pencabutan berlaku pada permintaan berikutnya karena pemeriksaan role berlangsung di database.

## Publikasi dan pemulihan
Simpan draf tidak mengubah beranda. Terbitkan menyimpan draf terbaru lalu mempublikasikannya.
Pengunjung melihat layout baru saat memuat ulang halaman.
Riwayat publikasi memulihkan snapshot ke draf; perlu Terbitkan untuk mengaktifkannya.
Saat berpindah akun atau keluar, editor menutup canvas privat.
Draf server hanya dapat dibaca admin desain; pengunjung hanya membaca dokumen terbit.
Tidak ada HTML/JavaScript dari JSON yang dieksekusi. Properti dan URL diperiksa oleh renderer.

## Pengujian
node --test calendar.test.mjs tests/*.test.mjs
node build.mjs
Tes SQL menjalankan migrasi dan RLS nyata pada PostgreSQL PGlite dengan skema auth/storage simulasi.
Uji browser manual dilakukan pada editor lokal: pemilihan canvas, drag widget ke canvas,
container dan judul bertingkat, perubahan warna box, undo, responsive viewport, penyimpanan lokal,
dan fungsi kalender dalam preview interaktif.
Login OAuth live, Storage Supabase live, dan penerbitan ke database live memerlukan pemasangan migrasi;
belum diklaim teruji terhadap akun production.

## Integrasi dengan branch login pengguna
Paket ini mengikuti production main (PR #2). Jika menggabungkan dengan perubahan login lokal:
pertahankan entryPoints masuk.js/pengguna.js dan daftar file login pada build.mjs/serve.mjs,
kemudian tambahkan editor.js/editor.html/editor.css/layout-runtime.css dari paket ini.
Pertahankan header-actions dan account-nav.js pada branch login.
Perubahan app.js hanya menambah import/startLayout pada akhir file; index.html menambah satu stylesheet.

Validasi akhir: build berhasil; 28 tes lolos. Uji browser tambahan memastikan sumber/deskripsi gambar tersimpan dan lebar gambar 180px diterapkan tepat di canvas.
