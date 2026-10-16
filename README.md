# God Time

Aplikasi pembelajaran kalender Yahudi dalam bahasa Indonesia. Versi awal mencakup kalender interaktif, 12 profil bulan dan suku menurut tradisi, renungan, pokok doa global, serta pengantar Rosh Chodesh.

## Menjalankan

Memerlukan Node.js 22 atau lebih baru. Tidak ada dependensi pihak ketiga yang perlu diinstal.

```sh
npm run dev
npm test
npm run build
```

Jika npm belum tersedia, gunakan `node serve.mjs`, `node --test calendar.test.mjs`, dan `node build.mjs`. Buka http://127.0.0.1:4173 untuk pratinjau.

## Deploy melalui GitHub dan Vercel

1. Import repository `propagandavirtual8/god-time` pada Vercel.
2. Framework Preset: **Other**; Root Directory: root repository.
3. Build Command: `npm run build`; Output Directory: `dist` (tersedia juga di `vercel.json`).
4. Tidak memerlukan environment variable, database, atau API key.
5. Deploy. Pembaruan pada branch produksi akan mengikuti integrasi Git Vercel.

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
- Setelah matahari terbenam, pengguna mengaktifkan pilihan malam secara manual. Tidak ada perhitungan matahari terbenam, pelacakan lokasi, atau asumsi pukul 18.00.
- Pilihan Israel/diaspora mengatur perbedaan durasi Pesakh, Shavuot, dan Simchat Torah.
- Penanda meliputi hari raya utama dan beberapa peringatan tradisional, bukan semua hari libur atau jadwal ibadah. Tahun baru Tisyri tidak diberi label Rosh Chodesh biasa.
- Puasa Tamuz, Tisha BeAv, dan Gedalya yang jatuh Sabat dipindah ke Minggu.
- Font Google bersifat opsional; jika offline, tampilan menggunakan font sistem.
- Jangkauan pemilihan tanggal 1900–2100. Uji kalender mencakup tahun-tahun dalam rentang ini.

## Verifikasi

`node --test calendar.test.mjs` memeriksa konversi pembanding Hebcal, batas zona waktu, tahun kabisat, navigasi bulan, panjang Hanukkah, Purim, perbedaan diaspora, dan penundaan puasa. Contoh pembanding: 16 Oktober 2026 = 5 Cheshvan 5787; 8 Februari 2027 = 1 Adar I 5787; 11 Maret 2027 = 2 Adar II 5787.

## Menginput dan menjadwalkan pesan bulanan

Buka `/kelola.html`, isi tahun dan bulan Yahudi, judul, ayat, penulis, isi, penerapan, dan doa. Centang Terbitkan, lalu Siapkan & pratinjau pesan. Pilih Salin data & buka GitHub, ganti seluruh isi `messages.json`, dan Commit changes. Vercel memperbarui situs melalui integrasi Git. Pesan terbit dipilih otomatis berdasarkan tahun dan bulan Yahudi hari ini, terpisah dari navigasi kalender. Adar I dan II diperlakukan terpisah. Jika tidak ada pesan cocok, aplikasi menampilkan renungan pengantar yang diberi label.

Formulir tidak menyimpan langsung ke server. Akses tulis tetap menggunakan akun GitHub pemilik repository, tanpa token di browser. Arsip yang sudah ada dimuat dan disertakan; gunakan satu pengelola pada satu waktu dan muat ulang sebelum mengedit agar tidak menimpa pembaruan orang lain. Draf yang di-commit ke repository publik tetap dapat dibaca publik meski tidak tampil di beranda.
