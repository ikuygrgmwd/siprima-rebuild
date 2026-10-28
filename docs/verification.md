# Hasil verifikasi

## Carousel dan pengaturan akun — 28 Oktober 2026

- `npm test`: 23/23 lulus. Empat tes tambahan mencakup otorisasi berita, tayang/draf, urutan dan data kosong; migrasi v3 dengan pelestarian byte berkas; pembatasan perubahan profil; validasi sandi lama serta pembatalan token reset.
- `npm run typecheck`, `npm run lint`, `npm run build`: lulus. Runner tes dijalankan di luar sandbox karena `os.userInfo` pada Node Windows gagal di sandbox.
- Browser: pemohon menggeser carousel maju/mundur termasuk kembali ke slide terakhir; tautan berita dan halaman pengaturan dapat dibuka. Penyimpanan profil menampilkan notifikasi sukses. Form kata sandi kosong menampilkan pesan validasi; perubahan sandi diuji pada repository.
- Admin: form berita kosong tervalidasi; berita dummy tambahan berhasil dibuat, diubah urutannya dan dijadikan draf, bertahan setelah refresh, serta tidak lagi ditampilkan di carousel. Tiga berita awal tetap tayang. Data pengajuan lama tidak direset.
- Responsivitas: pada viewport 390 piksel CSS, lebar dokumen 380 piksel termasuk ruang scrollbar; carousel dan pengaturan akun tidak menyebabkan overflow horizontal. Menu ponsel dapat membuka pengaturan akun. Layout desktop diperiksa pada 1440 piksel CSS.
- Screenshot: `screenshots/carousel-dashboard-demo.jpg`. Hasil di atas berasal dari verifikasi lokal sebelum push; status deployment tersedia pada pemeriksaan commit GitHub–Vercel.

## Pemeriksaan sebelumnya — 22 Oktober 2026

## Pemeriksaan otomatis

| Pemeriksaan | Hasil |
| --- | --- |
| `npm run lint` | Lulus tanpa error/warning |
| `npm run typecheck` | Lulus |
| `npm test` | 19/19 lulus, Node test runner + fake-indexeddb (termasuk tujuh berkas magang dan migrasi surat kampus) |
| `npm run build` | Lulus dengan Webpack; enam halaman statis terbangun dan ruang kerja catch-all dinamis |
| `npm start -- --port 3002` | Berjalan tanpa secret/database; `/`, `/masuk`, `/pengajuan`, `/akun` memberi HTTP 200 |
| `npm audit --omit=dev` | 0 kerentanan runtime pada waktu pemeriksaan |
| `npm audit` penuh | 5 temuan high pada rantai development eslint-config-next → fast-glob → micromatch → braces |

Temuan audit development terkait GHSA-vfj7-8cjw-p6xm (`braces` stack exhaustion melalui pola bersarang). Rantai tersebut dipakai lint tooling. Tidak memaksa downgrade konfigurasi ke Next 14 yang disarankan audit. Tinjau ulang perbaikan upstream sebelum produksi. ESLint 9 kompatibel tetapi npm menandainya tidak lagi didukung; evaluasi upgrade bersama konfigurasi Next pada pemeliharaan berikutnya.

Build Turbopack gagal pada worker PostCSS di Windows ini, baik sandbox maupun percobaan eskalasi. `next build --webpack`, opsi bundler resmi, berhasil. Tidak melewati pemeriksaan TypeScript.

## Perilaku yang diuji otomatis

1. Pemohon tidak bisa membaca/mengubah/menghapus/mengunggah laporan untuk pemilik lain; bukan admin tidak bisa mengelola tujuan/akun.
2. Pengajuan, nilai edit, byte lampiran/laporan bertahan ketika koneksi database dibuka ulang; logout menutup akses; pemohon lain tidak bisa download; admin dapat menghapus beserta relasi/Blob.
3. Email, urutan tanggal, tanggal kalender tidak nyata, ekstensi/MIME, berkas kosong, maksimum 5 MiB.
4. File tidak valid tidak menyebabkan penyimpanan parsial.
5. Lima submit bersamaan menghasilkan ID/kode berbeda tanpa kehilangan data.
6. Nama tujuan duplikat ditolak; referensi tujuan melindungi delete; CRUD tujuan.
7. Registrasi, email duplikat, login, akun nonaktif, edit/hapus, pengaman akun sendiri/pemilik pengajuan.
8. Reset token sekali pakai mengubah sandi demo dan mengeluarkan sesi; sandi lama ditolak.
9. Penggantian/penghapusan lampiran mencabut akses Blob lama.

## Browser nyata

- Landing, identitas dan informasi kontak diperiksa.
- Login cepat pemohon → dashboard hanya enam pengajuan seed miliknya.
- Submit form kosong → pesan dekat field wajib, fokus menuju tujuan.
- Isi data contoh, ganti judul, lampiran surat pengantar PDF → simpan/detail lengkap.
- Edit judul → detail berubah dan nilai lain dipertahankan.
- Upload laporan dari detail → kode otomatis terpilih.
- Refresh → sesi, judul, lampiran dan laporan tetap tersedia.
- Download → `laporan-penelitian-contoh.pdf` benar-benar terunduh (710 byte, header `%PDF-1.4`).
- File picker asli memilih PDF sintetis tersebut, kemudian upload dan tampil pada filter kode di Unduh laporan.
- Pagination halaman 2; search menemukan pengajuan baru dan kembali ke halaman 1; filter Magang menampilkan empty state.
- Logout → admin → delapan pengajuan saat uji, termasuk pemohon kedua.
- Tujuan: tambah/edit/konfirmasi hapus/sukses hapus tujuan sementara; hapus tujuan terpakai ditolak dengan pesan jelas.
- Akun: tambah akun sintetis, edit status nonaktif, hasil terlihat pada daftar.
- Registrasi → dashboard kosong; akses langsung ke URL pengajuan Nadia ditolak.
- Desktop dan layar sempit diperiksa. Lebar CSS 390 px diverifikasi lewat DOM (body/scrollWidth 380 px termasuk ruang scrollbar); tanpa overflow horizontal halaman. Menu ponsel berfungsi; sidebar tertutup disembunyikan dari aksesibilitas.

## Tambahan magang — 22 Oktober 2026

- Total 14 tes otomatis lulus: 9 tes lama + 5 tes magang. Cakupan tambahan: CRUD/persistensi/kode bersamaan/riwayat, isolasi pemilik dan pengaman akun, tanggal dan pembimbing wajib, kombinasi filter/WIB/CSV anti-formula, serta migrasi state v1 tanpa kehilangan aplikasi, sesi, akun, dan byte berkas. Daftar kosong setelah penghapusan tidak diisi ulang otomatis.
- Browser: form pemohon kosong memunculkan validasi; pendaftaran contoh berhasil dibuat, detail dan refresh tetap menyimpan nilai; admin mengubah status Aktif (ditolak jika pembimbing kosong), mengisi pembimbing/catatan, dan melihat dua entri riwayat.
- Hapus pendaftaran sementara melalui konfirmasi berhasil; enam pendaftaran sebelumnya tetap ada. Filter Aktif + pencarian Raka menghasilkan satu peserta. Ekspor benar-benar mengunduh CSV dan isi diperiksa (header + satu peserta sesuai filter). Pencarian tanpa hasil menampilkan empty state dan ekspor nonaktif; reset filter dan pagination berfungsi.
- Responsivitas: desktop 1440 px dan ponsel 390 px diperiksa. Lebar dokumen ponsel 375 px (ruang scrollbar), tabel 990 px di dalam wadah 342 px yang dapat digeser, tanpa overflow horizontal halaman; filter satu kolom dan menu navigasi ponsel bekerja. Override viewport dikembalikan ke normal setelah pengujian.
- Screenshot hasil: `screenshots/internships-demo.jpg`. Data dan semua identitas pada preview bersifat sintetis.

## Batas verifikasi

### Surat kampus opsional

- Tiga tes tambahan: pendaftaran tanpa surat, persistensi bytes dan otorisasi download; penerimaan PDF/JPG/JPEG/PNG, penggantian/penghapusan/cleanup Blob; penolakan file kosong, terlalu besar, ekstensi/tipe tidak cocok tanpa penyimpanan parsial. Edit biasa mempertahankan surat, sedangkan pemohon yang telah diproses tidak dapat menggantinya.
- Browser pemohon: pemilihan PDF sintetis melalui file picker asli, simpan, refresh, unduh berkas (hash sama dengan sumber), hapus lampiran melalui edit, dan simpan tanpa surat terverifikasi. Validasi ini menggunakan berkas contoh, bukan surat pribadi. Screenshot bagian unggah: `screenshots/campus-letter-demo.jpg`.

### Tujuh bagian berkas magang

- Dua tes tambahan mencakup penyimpanan tujuh berkas secara atomik, penggantian/penghapusan per bagian tanpa memengaruhi bagian lain, penolakan satu berkas tidak valid tanpa penyimpanan parsial, isolasi pemilik, cleanup semua Blob, serta migrasi state v2 ke v3 yang mempertahankan metadata/byte surat kampus lama.
- Browser pemohon: tujuh contoh PDF dipilih, pratinjau Transkrip dirender pada canvas, lalu seluruhnya disimpan dan tetap ada setelah refresh. Pratinjau menggunakan PDF.js dengan worker yang dibundel lokal, tanpa mengirim dokumen ke layanan lain.
- JPG sintetis dipilih melalui file picker asli dan pratinjau gambar berhasil dimuat. Build Webpack (termasuk TypeScript), lint, dan 19 tes lulus setelah pembaruan. Build perlu izin filesystem normal karena sandbox Windows menolak pembuatan salah satu folder output; build di luar sandbox berhasil.
- Pada viewport CSS 390 px, ketujuh kartu tersusun satu kolom, lebar dokumen 375 px, tanpa overflow horizontal halaman. Override viewport dikembalikan. Screenshot: `screenshots/internship-files-demo.jpg` dan `screenshots/internship-documents-demo.jpg`.

### Master OPD dan wilayah — 28 Oktober 2026

- `npm run lint`, `npm run typecheck`, dan seluruh 29 tes lulus. Enam tes master baru memeriksa hak akses, CRUD/persistensi, duplikat, relasi kecamatan-kelurahan, larangan hapus/pindah data terpakai, referensi tidak valid, kompatibilitas kolom opsional, migrasi v4 tanpa kehilangan data/byte berkas, dan daftar kosong yang tidak diisi ulang.
- `npm run build` (Webpack) berhasil. Percobaan sandbox gagal membuat `.next/static/chunks/app` karena EPERM Windows; pengulangan dengan izin filesystem normal selesai dengan exit code 0.
- Browser lokal: admin mengedit nama kecamatan, menambahkan kelurahan terkait, dan menemukan perubahan pada dropdown penelitian. Mengganti kecamatan mengosongkan kelurahan dan membatasi opsinya ke kecamatan baru. Pengajuan tersimpan dan detail setelah reload menampilkan OPD/kecamatan/kelurahan yang dipilih. Perubahan nama OPD setelah pengajuan dibuat juga muncul pada detail, sedangkan ID pilihan tetap tersimpan saat edit.
- Pada viewport 390 px, form tersusun satu kolom; clientWidth dan scrollWidth dokumen sama-sama 375 px (termasuk ruang scrollbar), tanpa overflow horizontal halaman. Viewport dikembalikan setelah pemeriksaan.
- Data master awal dan data pengujian sintetis. Penyimpanan/otorisasi masih simulasi browser; tidak menguji backend produksi atau daftar wilayah resmi.

### Cakupan lingkungan terakhir

- Browser Chromium in-app di Windows; Safari/Firefox, pembaca layar nyata, perangkat fisik belum diuji.
- Reset sandi penuh, delete akun/pengajuan beserta cascade dan validasi file negatif diuji repository; belum seluruh kombinasinya di browser.
- Kuota penuh/IndexedDB diblokir memiliki penanganan error, tetapi belum diinjeksi sebagai kegagalan browser nyata.
- Tidak menguji email nyata, backend/auth server, database, migrasi data pribadi, Vercel publik, atau modul tersembunyi; di luar fase demo.
