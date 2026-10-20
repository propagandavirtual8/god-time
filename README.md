# God Time

Aplikasi pembelajaran kalender Yahudi dalam bahasa Indonesia. Versi awal mencakup kalender interaktif, 12 profil bulan dan suku menurut tradisi, renungan, pokok doa global, serta pengantar Rosh Chodesh.

## Menjalankan

Memerlukan Node.js 22 atau lebih baru dan pnpm. SDK Supabase serta alat build/test dikunci melalui `pnpm-lock.yaml`.

```sh
pnpm install --frozen-lockfile
pnpm run dev
pnpm test
pnpm run test:browser
pnpm run build
```

Setelah dependensi terinstal, perintah Node yang setara juga tersedia: `node serve.mjs`, `node --test calendar.test.mjs tests/*.test.mjs`, dan `node build.mjs`. Buka http://127.0.0.1:4173 untuk pratinjau.

## Deploy melalui GitHub dan Vercel

1. Import repository `propagandavirtual8/god-time` pada Vercel.
2. Framework Preset: **Other**; Root Directory: root repository.
3. Build Command: `pnpm run build`; Output Directory: `dist` (tersedia juga di `vercel.json`).
4. Ikuti [panduan Supabase](IMPLEMENTASI-SUPABASE.md): tinjau migrasi, impor data lama, konfigurasi Google OAuth dan kedua environment publik.
5. Uji di staging dan sepakati aktivasi produksi sebelum push/deploy. Domain produksi yang dikonfirmasi: `https://ehop-godtime.vercel.app`.

## Mengubah materi

- `content.js`: ringkasan, rujukan tiap bulan, pesan utama, dan doa global.
- `calendar.js`: konversi kalender dan penanda hari raya.
- `app.js`: interaksi serta tampilan dinamis.
- `styles.css`: warna, tipografi, dan responsivitas.

Seluruh teks antarmuka dan ringkasan menggunakan bahasa Indonesia. Nama bulan dan istilah Ibrani dipertahankan untuk pembelajaran. Sumber lanjutan berbahasa Inggris.

## Sumber dan editorial

Sumber utama: [Hebrew for Christians, Rosh Chodesh](https://www.hebrew4christians.com/Holidays/Rosh_Chodesh/rosh_chodesh.html), John J. Parsons, serta halaman setiap bulan yang ditautkan di aplikasi. Ringkasan disusun dengan bahasa sendiri; aplikasi tidak menyalin keseluruhan artikel atau gambar dan tidak berafiliasi dengan situs tersebut.

Pemetaan bulan–suku menggunakan urutan tradisi konvensional yang dibahas dalam [Months and Tribes](https://hebrewnations.com/articles/tribes/calendar.html). Sumber ini dipakai hanya untuk mendokumentasikan variasi pemetaan; bukan untuk mengadopsi klaim identitas bangsa modern. Hubungan bulan–suku bukan penetapan eksplisit satu-per-satu dalam teks Alkitab. Ikon merupakan ilustrasi, bukan lambang resmi suku.

Renungan dan doa merupakan draf editorial mandiri. Tidak ada klaim bahwa keduanya pesan resmi dari sumber, laporan peristiwa terkini, atau wahyu otomatis untuk pengguna. Sebelum memperluas isi, pengelola perlu meninjau sumber dan penafsirannya. Versi ini berisi ringkasan awal, bukan seluruh materi situs Hebrew for Christians.

## Kalender dan keterbatasan

- Konversi memakai kalender Ibrani tetap dari Intl/ICU pada browser modern, tanpa layanan eksternal. Mendukung 12/13 bulan serta panjang Cheshvan dan Kislev yang berubah.
- Zona acuan tanggal hari ini: Asia/Jakarta (WIB).
- Pergantian hari otomatis mengikuti estimasi matahari terbenam di pusat Jakarta (GMT+07.00), memakai pendekatan persamaan NOAA di `time.js`. Angka ini perkiraan, bukan jadwal ibadah presisi. Pilihan malam tetap dapat diubah manual. Rentang tanggal sipil ditampilkan bersama waktu awal pada petang sebelumnya.
- Pilihan Israel/diaspora mengatur perbedaan durasi Pesakh, Shavuot, dan Simchat Torah.
- Penanda meliputi hari raya utama dan beberapa peringatan tradisional, bukan semua hari libur atau jadwal ibadah. Tahun baru Tisyri tidak diberi label Rosh Chodesh biasa.
- Puasa Tamuz, Tisha BeAv, dan Gedalya yang jatuh Sabat dipindah ke Minggu.
- Font Google bersifat opsional; jika offline, tampilan menggunakan font sistem.
- Jangkauan pemilihan tanggal 1900–2100. Uji kalender mencakup tahun-tahun dalam rentang ini.

## Verifikasi

`node --test calendar.test.mjs` memeriksa konversi pembanding Hebcal, batas zona waktu, tahun kabisat, navigasi bulan, panjang Hanukkah, Purim, perbedaan diaspora, dan penundaan puasa. Contoh pembanding: 16 Oktober 2026 = 5 Cheshvan 5787; 8 Februari 2027 = 1 Adar I 5787; 11 Maret 2027 = 2 Adar II 5787.

## Menginput dan menjadwalkan pesan bulanan

Buka `/kelola.html`, masuk dengan Google, lalu kelola pesan menggunakan akun admin. Role user tidak mendapat akses editor atau izin menulis database. Akun baru selalu menjadi user; pemilik proyek memberikan admin melalui SQL yang ditinjau. Pilih tahun/bulan, isi pesan, pratinjau, lalu Simpan pesan. Hilangkan centang Terbitkan untuk menyimpan draf. Pesan terjadwal hanya tersedia publik selama bulan Yahudi yang dipilih; gunakan Adar I/II pada tahun kabisat.

CRUD langsung ke Supabase menggantikan ekspor JSON melalui GitHub. Perubahan dari tab admin lain diperiksa dengan revision agar tidak tertimpa. Draf hanya dapat dibaca admin melalui RLS. Sumber `messages.json` tidak diubah; impor lama tersedia sebagai SQL yang hanya menambahkan periode kosong. Jangan memasukkan draf rahasia ke repository publik.

Beranda membaca database memakai client anonim terpisah. Jika database kosong atau tidak tersedia, renungan pengantar dari `content.js` tetap tampil. Snapshot JSON lama hanya dipakai jika konfigurasi Supabase benar-benar kosong. Tampilan kalender dan materi tetap dipertahankan.

Lihat [catatan implementasi, konfigurasi Google, migrasi dan aktivasi admin](IMPLEMENTASI-SUPABASE.md) serta [laporan uji](LAPORAN-UJI.md). Perubahan ini belum dijalankan pada database produksi atau dideploy.
