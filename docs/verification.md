# Hasil verifikasi — 22 Oktober 2026

## Pemeriksaan otomatis

| Pemeriksaan | Hasil |
| --- | --- |
| `npm run lint` | Lulus tanpa error/warning |
| `npm run typecheck` | Lulus |
| `npm test` | 9/9 lulus, Node test runner + fake-indexeddb |
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

## Batas

- Browser Chromium in-app di Windows; Safari/Firefox, pembaca layar nyata, perangkat fisik belum diuji.
- Reset sandi penuh, delete akun/pengajuan beserta cascade dan validasi file negatif diuji repository; belum seluruh kombinasinya di browser.
- Kuota penuh/IndexedDB diblokir memiliki penanganan error, tetapi belum diinjeksi sebagai kegagalan browser nyata.
- Tidak menguji email nyata, backend/auth server, database, migrasi data pribadi, Vercel publik, atau modul tersembunyi; di luar fase demo.
