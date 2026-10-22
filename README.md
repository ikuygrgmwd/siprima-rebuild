# SIPRIMA — preview rebuild

Sistem Informasi Perizinan Riset dan Magang, dengan identitas SIPRIMA Bappeda Kota Bekasi dari aplikasi referensi. Preview lokal; bukan layanan resmi. Data contoh sintetis, tanpa database, API key, atau email eksternal.

## Menjalankan

Gunakan Node.js 22 atau lebih baru dan npm. Versi aktual terkunci dalam `package-lock.json`.

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

- Pengajuan memuat semua 13 isian termasuk relasi tujuan dari form penelitian lama, lima jenis lampiran opsional, kode REG, dan status awal Review.
- Modul **Pendaftaran magang**: pemohon membuat dan mengedit pendaftaran berstatus Diajukan; admin mengelola semua peserta, penempatan, pembimbing, catatan, serta status Diajukan/Diterima/Aktif/Selesai/Ditolak/Mengundurkan diri. Riwayat status tercatat, hanya admin dapat menghapus. Data yang dibuat manual oleh admin terkait akun admin tersebut.
- Daftar magang memiliki enam filter, pencarian, pagination, ekspor CSV seluruh hasil filter, dan enam peserta sintetis. Jalur `/magang/baru`, `/magang/[id]`, `/magang/[id]/edit` tersedia. Pilihan unit/program adalah contoh, belum master data layanan resmi.
- Surat pengantar kampus pada magang bersifat opsional: satu PDF/JPG/JPEG/PNG maksimum 5 MiB. Surat dapat diganti/dihapus saat mengedit dan diunduh pemilik atau admin dari detail. Berkas lama tetap tersimpan jika formulir diedit tanpa mengubah lampiran; penghapusan pendaftaran membersihkan berkasnya.
- Penelitian tetap berstatus Review; belum ada persetujuan penelitian, pembayaran, atau penerbitan surat otomatis. **Unduh laporan** mengambil laporan unggahan, sesuai perilaku menu lama yang salah dilabeli sebagai surat penelitian.
- State browser versi 1 dimigrasi otomatis ke versi 2 untuk menambahkan magang tanpa menghapus akun, sesi, pengajuan, laporan, atau Blob lama. Nama database tetap sama agar data sebelumnya terbaca.
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
