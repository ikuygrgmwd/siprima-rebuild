# Kemajuan — 22 Oktober 2026

## Fase selesai untuk preview demo

1. **Fondasi dan alur pengajuan:** Next.js App Router/TypeScript, Tailwind, React Hook Form/Zod, layout responsif, repository IndexedDB, form lengkap, detail/edit/delete, lima jenis lampiran.
2. **Fitur utama lain:** landing, akun demo/register/reset/logout, dashboard per peran, CRUD akun admin, master tujuan, laporan, unduhan berdasarkan kode, pencarian/filter/pagination, reset demo.
3. **Verifikasi dan dokumentasi:** build produksi, lint, typecheck, sembilan pengujian repository lulus; alur browser inti, upload via file picker, refresh, download PDF, isolasi pemilik, dan administrasi diuji. README, inventaris, kontrak backend, hasil verifikasi tersedia.
4. **Pendaftaran & pengelolaan magang:** modul `/magang` sesuai permintaan lanjutan pengguna. Form pemohon/admin, daftar dengan enam filter/pencarian/pagination/CSV, detail, edit, status, pembimbing, catatan, riwayat, dan konfirmasi hapus. Migrasi state versi 1 ke 2 menjaga data penelitian dan berkas. Total 14 pengujian otomatis; alur browser dan responsivitas terverifikasi. Pengguna meminta modul ini diteruskan ke GitHub dan integrasi Vercel yang sudah terhubung.

## Keputusan

- Unggahan magang kini memiliki tujuh bagian: Transkrip, Foto, File pendukung lainnya, Proposal, Daftar Riwayat Hidup, Surat Pengantar, dan Surat Pernyataan. Semuanya opsional, satu PDF/JPG/JPEG/PNG maksimum 5 MiB per bagian. Form menampilkan batas/ukuran aktual; detail menampilkan tabel lihat/unduh. Pratinjau PDF menggunakan PDF.js dengan worker lokal, gambar memakai Blob URL. State v3 memigrasi surat kampus lama tanpa kehilangan berkas. Total 19 tes otomatis lulus.

- Tambahan lanjutan: unggahan surat pengantar kampus opsional (PDF/JPG/JPEG/PNG, maksimum 5 MiB), penggantian/penghapusan, unduhan pemilik/admin, dan cleanup berkas atomik. Total 17 tes otomatis lulus. Data magang lama tanpa lampiran tetap terbaca.

- npm satu-satunya package manager; lockfile disertakan; tidak ada ORM/backend/secret.
- IndexedDB menyimpan metadata dan Blob secara atomik. Sesi simulasi; BroadcastChannel/fokus menyegarkan tab lain.
- Pemohon hanya mengakses data miliknya melalui repository; admin semua data. Otorisasi produksi wajib server.
- Webpack untuk build karena Turbopack worker CSS panic pada Windows ini, termasuk setelah dicoba di luar sandbox. Dev Turbopack berjalan normal.
- Versi teruji: Next 16.4.2, React 19.3.1, Tailwind 4.3.3, RHF 7.90.0, Zod 4.6.7, resolver 5.9.2. Resolver 6 tidak dipakai karena konflik peer dependency; tanpa force/legacy-peer-deps.
- Source lama hanya dibaca, project baru awalnya kosong. Atas permintaan lanjutan pengguna, repository privat `ikuygrgmwd/siprima-rebuild` dibuat dengan branch `main`; belum ada deployment publik.
- shadcn/ui tidak diperlukan; komponen lokal memakai HTML semantik, fokus keyboard, modal native, ikon Lucide.

## Preview

`npm run dev` melayani http://127.0.0.1:3000. Origin ini menyimpan perubahan sintetis hasil uji browser, termasuk “Uji browser — judul diperbarui”. Reset data demo tersedia untuk mengembalikan seed.

Preview magang: http://127.0.0.1:3000/magang, akun demo Admin. Data pendaftaran sementara untuk uji browser telah dihapus, sedangkan data penelitian lama dipertahankan. Unit/program/pembimbing adalah contoh; backend bersama belum tersedia.

## Berikutnya jika diminta

- Konfirmasi kontak resmi dan profil/role di luar dua peran inti.
- Integrasi backend/auth/storage privat sesuai backend-integration.md, uji migrasi pada salinan, lalu keputusan deployment Vercel.
- HAKI, diklat, Dukcapil, peta, hotel/wisata tetap cakupan tertunda, bukan tombol placeholder.
- Jangan ulang audit seluruh repository lama; gunakan feature-parity.md sebagai acuan.
