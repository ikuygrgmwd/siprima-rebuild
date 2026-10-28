# SIPRIMA — preview rebuild

Sistem Informasi Perizinan Riset dan Magang, dengan identitas SIPRIMA Bappeda Kota Bekasi dari aplikasi referensi. Preview lokal; bukan layanan resmi. Data contoh sintetis, tanpa database, API key, atau email eksternal.

## Menjalankan

Gunakan Node.js 22.13 atau lebih baru dan npm. Versi aktual terkunci dalam `package-lock.json`.

```sh
npm ci
npm run dev
```

Buka http://127.0.0.1:3000. Jika port dipakai, lihat alamat yang dicetak Next.js. Gunakan origin yang sama agar data demo tetap terlihat: `localhost` dan `127.0.0.1` memiliki penyimpanan browser berbeda.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

`build` memakai Webpack resmi (`next build --webpack`) karena worker CSS Turbopack mengalami panic pada lingkungan Windows saat verifikasi. Dev memakai Turbopack. Tidak ada environment variable yang wajib; `.env.example` tidak diperlukan. Untuk preview produksi pada port lain: `npm start -- --port 3002`.

## Mencoba demo

1. Buka **Masuk**, lalu pilih **Demo pemohon** atau **Demo admin**; tidak perlu mengetik sandi.
2. Buat pengajuan → **Isi data contoh** → **Pakai contoh** pada lampiran → **Simpan pengajuan**.
3. Buka daftar/detail, cari judul atau kode, gunakan filter dan pagination, lalu edit.
4. Dari detail pilih **Unggah laporan** → **Pakai laporan contoh** → **Unggah laporan**.
5. Buka **Unduh laporan**, pilih kode pengajuan, dan unduh berkas. Refresh untuk mengecek persistensi.
6. Keluar lalu masuk sebagai admin untuk mengelola akun, master tujuan, dan **Peserta magang** (`/magang`).
7. **Reset data demo** di sidebar mengembalikan data awal setelah konfirmasi dan mengeluarkan sesi.

Akun contoh (seluruhnya fiktif):

| Email              | Peran                           | Sandi demo |
| ------------------ | ------------------------------- | ---------- |
| nadia@example.test | Pemohon                         | demo12345  |
| raka@example.test  | Pemohon kedua untuk uji isolasi | demo12345  |
| admin@example.test | Admin                           | demo12345  |

Registrasi membuat akun pemohon lokal. Reset sandi menampilkan tautan simulasi yang berlaku 15 menit; tidak mengirim email. Tombol masuk cepat peran memang melewati verifikasi sandi dalam mode demo.

## Fitur dan batas

- Admin mengelola **Master OPD**, **Master kecamatan**, dan **Master kelurahan** melalui `/master/opd`, `/master/kecamatan`, dan `/master/kelurahan`: tambah, edit, pencarian, pagination, serta hapus dengan konfirmasi. Kelurahan terkait satu kecamatan; filter kecamatan tersedia pada daftar kelurahan. Data awal sintetis dan dapat diganti melalui menu master.
- Form penelitian memiliki OPD tujuan, kecamatan lokasi penelitian, dan kelurahan lokasi penelitian yang opsional. Pilihan kelurahan mengikuti kecamatan; mengganti kecamatan mengosongkan kelurahan. Detail lokasi tetap berupa teks wajib. Nama pada dropdown dan detail mengikuti master melalui ID, termasuk setelah nama diedit. Data yang digunakan pengajuan tidak dapat dihapus; kecamatan yang memiliki kelurahan tidak dapat dihapus, dan kelurahan terpakai tidak dapat dipindah kecamatannya.
- State versi 5 menambahkan master tanpa mengubah pengajuan, akun, sesi, berita, magang, laporan, atau berkas lama. Pengajuan lama tidak otomatis diberi wilayah/OPD contoh. Penyimpanan tetap IndexedDB pada browser; belum database server. Master OPD belum menggantikan unit penempatan magang.
- Dashboard memiliki carousel berita dengan tombol sebelumnya/berikutnya, penghitung slide, dan halaman baca berita. Tiga berita dummy disediakan saat instalasi atau migrasi pertama. Admin mengelola judul, kategori, ringkasan, isi, warna, urutan, serta status tayang/draf melalui **Master carousel** (`/carousel`), termasuk pencarian, pagination, dan hapus dengan konfirmasi. Draf tidak tersedia pada snapshot pemohon.
- **Pengaturan akun** (`/pengaturan-akun`) tersedia di sidebar admin maupun pemohon, dengan bagian Profil saya dan Kata sandi. Perubahan profil tidak mengubah data pengajuan lama; perubahan sandi memerlukan sandi saat ini dan membatalkan token reset lama. Role/status akun tetap dikelola melalui menu administrasi.
- State versi 4 menambahkan berita tanpa menghapus akun, sesi, pengajuan, magang, dan berkas versi sebelumnya. Berita serta pengaturan akun tetap tersimpan di browser; belum tersambung ke database server.
- Pengajuan memuat semua 13 isian termasuk relasi tujuan dari form penelitian lama, lima jenis lampiran opsional, kode REG, dan status awal Review.
- Modul **Pendaftaran magang**: pemohon membuat dan mengedit pendaftaran berstatus Diajukan; admin mengelola semua peserta, penempatan, pembimbing, catatan, serta status Diajukan/Diterima/Aktif/Selesai/Ditolak/Mengundurkan diri. Riwayat status tercatat, hanya admin dapat menghapus. Data yang dibuat manual oleh admin terkait akun admin tersebut.
- Daftar magang memiliki enam filter, pencarian, pagination, ekspor CSV seluruh hasil filter, dan enam peserta sintetis. Jalur `/magang/baru`, `/magang/[id]`, `/magang/[id]/edit` tersedia. Pilihan unit/program adalah contoh, belum master data layanan resmi.
- Berkas magang dibagi menjadi tujuh bagian opsional: Transkrip, Foto, File pendukung lainnya, Proposal, Daftar Riwayat Hidup, Surat Pengantar, dan Surat Pernyataan. Setiap bagian menerima satu PDF/JPG/JPEG/PNG maksimum 5 MiB (5.242.880 byte), dengan ukuran aktual, pratinjau PDF/gambar, penggantian, dan penghapusan terpisah. Detail menampilkan tabel berkas beserta tombol lihat/unduh bagi pemilik atau admin. Mengedit bagian lain mempertahankan berkas lama; menghapus pendaftaran membersihkan semua berkasnya.
- Penelitian tetap berstatus Review; belum ada persetujuan penelitian, pembayaran, atau penerbitan surat otomatis. **Unduh laporan** mengambil laporan unggahan, sesuai perilaku menu lama yang salah dilabeli sebagai surat penelitian.
- State browser versi 1/2 dimigrasi otomatis ke versi 3 tanpa menghapus akun, sesi, pengajuan, laporan, atau Blob lama. Surat kampus lama dipindahkan ke bagian Surat Pengantar dengan metadata dan byte yang sama. Nama database tetap sama agar data sebelumnya terbaca.
- Data dan Blob disimpan dalam IndexedDB, transaksi metadata/berkas atomik, perubahan antar-tab disinkronkan melalui BroadcastChannel/fokus.
- Semua operasi melewati kontrak async `ResearchRepository`. Repository memfilter dan memeriksa kepemilikan, termasuk unduhan, edit, hapus, dan upload. Ini hanya simulasi, bukan keamanan server.
- Upload menerima PDF/JPG/PNG maksimum 5 MiB; validasi ekstensi dan MIME. Preview tidak memindai isi/malware. Gunakan dokumen sintetis saja.
- Sesi dibagi antar-tab pada origin yang sama. Beralih akun di satu tab mengubah sesi tab lain. Penyimpanan bisa dihapus oleh browser, reset, atau mode privat; bukan penyimpanan produksi atau cadangan.
- Kontak pada source lama masih template. Tidak menampilkan nomor telepon, email, atau alamat resmi yang belum dikonfirmasi.
- HAKI, diklat, Dukcapil, peta, hotel/wisata dan modul tersembunyi tercatat dalam inventaris, tidak dimasukkan ke navigasi inti.
- Komponen dibuat lokal dengan HTML semantik, Tailwind CSS, React Hook Form, Zod, dan ikon Lucide. shadcn/ui tidak diperlukan untuk lingkup komponen saat ini.

## Struktur

```text
src/app/               App Router: landing, auth, ruang kerja
src/components/        Tampilan dan komponen reusable
src/lib/domain.ts      Tipe, skema validasi, aturan berkas
src/lib/repository.ts  Kontrak async + implementasi IndexedDB
src/lib/sample.ts      Data dan generator PDF sintetis
tests/                 Uji perilaku repository dengan fake-indexeddb
docs/                  Inventaris, keputusan, hasil uji, integrasi backend
```

## GitHub

Repository privat: [ikuygrgmwd/siprima-rebuild](https://github.com/ikuygrgmwd/siprima-rebuild), branch utama `main`. Untuk mengambil project di perangkat lain yang memiliki akses:

```sh
git clone https://github.com/ikuygrgmwd/siprima-rebuild.git
cd siprima-rebuild
npm ci
npm run dev
```

Untuk mengunggah perubahan berikutnya dari checkout ini:

```sh
git add .
git commit -m "Describe the change"
git push origin main
```

`.gitignore` mengecualikan dependency, hasil build, secret, dump SQL, unggahan, dan data pribadi. Jangan menambahkan source lama, dump, atau dokumen asli ke repository baru.

## Vercel

Setelah repository tersedia, gunakan **Add New → Project → Import Git Repository** di Vercel. Pilih framework Next.js, root folder project, build `npm run build`; install `npm ci` dan output Next.js standar. Gunakan versi Node yang memenuhi `engines`. Tidak perlu `vercel.json`, database, secret, atau filesystem server untuk data aplikasi. Integrasi Git Vercel membangun perubahan berikutnya dari branch yang dipilih. Belum ada deployment yang dilakukan oleh sesi rebuild ini.

Setiap domain preview memiliki data demo tersendiri. Implementasi backend produksi dirinci di [docs/backend-integration.md](docs/backend-integration.md). Cakupan dan hasil aktual ada di [docs/feature-parity.md](docs/feature-parity.md) dan [docs/progress.md](docs/progress.md).

Konfigurasi framework mengacu pada dokumentasi [instalasi Next.js](https://nextjs.org/docs/app/getting-started/installation) dan [Tailwind CSS untuk Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs), serta dokumentasi yang dibundel di package Next.js terpasang.
