# Inventaris kesesuaian SIPRIMA

Referensi baca: `../siprima`, termasuk `docs/SIPRIMA_REBUILD_AUDIT.md` (22 Oktober 2026). Inventaris dibuat sebelum implementasi dan diperbarui berdasarkan hasil aktual. Seluruh data preview sintetis. **Selesai demo** tidak berarti backend atau autentikasi produksi sudah tersedia.

| Fitur lama | Sumber lama | Pengganti | Status implementasi dan verifikasi |
| --- | --- | --- | --- |
| Landing dan kontak | FrontEndController@index; front_end_new/index.blade.php, component/contact_section.blade.php | `/`, bagian kontak | Selesai demo; diperiksa browser. Kontak resmi perlu konfirmasi karena source berisi author@example.com dan alamat template. |
| Registrasi/login/logout/reset | routes/auth.php; Auth/RegisteredUserController, AuthenticatedSessionController, PasswordResetLinkController, NewPasswordController | `/daftar`, `/masuk`, `/reset-password` | Simulasi lengkap. Registrasi/login/logout diuji browser + repository; reset token/sandi diuji repository. Tidak ada email dikirim. |
| Dashboard | DashboardController; dashboard/index.blade.php | `/dashboard` | Selesai demo; ringkasan sesuai peran. Admin/pemohon/akun kosong diuji browser. |
| Akun | UserController; `/admin/management-user` | `/akun` | CRUD, role, status aktif selesai demo. Tambah/edit/nonaktif diuji browser; hapus, duplikat, pengaman diuji repository. |
| Tujuan penelitian | TujuanPenelitianController; model TujuanPenelitian | `/tujuan` | CRUD selesai demo; tambah/edit/hapus dan larangan hapus tujuan terpakai diuji browser + repository. |
| Pengajuan + lampiran | PengajuanPenelitianController; PengajuanPenelitian; pengajuan_penelitian/tambah,edit,index.blade.php; `/ajukan-penelitian` | `/pengajuan`, `/pengajuan/baru`, `/pengajuan/[id]`, `/pengajuan/[id]/edit` | Selesai demo; buat/detail/edit, lampiran, validasi wajib, search/filter/pagination diuji browser. Hapus/cascade, isolasi pemilik, tanggal/file, submit bersamaan diuji repository. |
| Upload/hapus laporan | UploadLaporanPenelitianController; UploadLaporanPenelitian; `/upload-laporan-penelitian` | `/laporan` | Selesai demo; upload contoh dan file picker, refresh, relasi kode diuji browser. Akses dan cascade diuji repository. |
| Download berdasarkan kode | DownloadLaporanPenelitianController; `/download-laporan-penelitian` | `/unduhan` | Selesai demo; filter kode diuji browser. PDF setelah refresh benar-benar terunduh dan header diperiksa. Label **Unduh laporan**, bukan surat izin. |
| HAKI/perbaikan/bukti bayar | routes/web.php; PengajuanHakiController, PerbaikanHakiController, BuktiBayarController; audit | Belum masuk navigasi | Tercatat, ditunda; penggunaan perlu konfirmasi. |
| Diklat/ujian/sertifikat | routes/web.php; rute program, ujian, pengajaran, materi; audit | Belum masuk navigasi | Tercatat, ditunda. |
| Dukcapil/form dinamis/pendataan/indikator | routes/web.php; DukcapilController; audit | Belum masuk navigasi | Tercatat, ditunda; workflow status tidak diterapkan ke penelitian. |
| Peta | routes/web.php; PetaController | Belum masuk navigasi | Tercatat, ditunda. |
| Hotel/wisata/booking | routes/web.php; FrontEndController, HotelController; audit | Belum masuk navigasi | Tercatat, ditunda; transaksi belum terbukti lengkap. |
| Wilayah/formulir/Midtrans | routes/web.php; audit | Belum masuk navigasi | Tercatat, ditunda; callback pembayaran dikomentari. |

## Aturan dan keputusan

- Semua 13 isian penelitian dipertahankan: nama, tujuan, email, telepon, alamat, judul, penanggung jawab, lembaga, lokasi, tanggal mulai/akhir, nomor/tanggal surat pengantar.
- Lima lampiran: surat pengantar, KTP, proposal, persetujuan izin magang, surat pernyataan. Form lama tidak mewajibkan file; preview mempertahankan opsional, dengan validasi format/ukuran bila diisi.
- Status awal `Review` dipertahankan. Tidak menambah persetujuan/penolakan, pembayaran, penerbitan surat. Statistik Review hanya menghitung status awal, bukan aktivitas petugas nyata.
- Kode REG + YYYYMMDD Asia/Jakarta + urutan lima digit. Peran memakai atribut eksplisit, bukan ID akun khusus.
- Ketidaksesuaian registrasi lama diperbaiki: field Dukcapil tersembunyi (NIK, kelahiran, wilayah, berkas identitas) tidak diwajibkan pada registrasi demo. Identitas pengajuan tetap lengkap. Migrasi profil lengkap perlu keputusan backend terpisah.
- Batas teknis preview: PDF/JPG/PNG, maksimum 5 MiB per file. Bukan klaim aturan layanan lama.
- Aset publik `public/SIPRIMA.png` diperiksa visual, hanya aset tersebut disalin menjadi `public/siprima-reference.png`. Tidak menyalin unggahan pribadi/dump/aset massal. Kepanjangan SIPRIMA dan Bappeda Kota Bekasi berdasarkan aset ini.
- Kontrak async memisahkan UI dari repository IndexedDB. Penyimpanan dan otorisasi masih simulasi browser; produksi wajib server dan object storage privat.

Hasil rinci: [verification.md](verification.md). Rencana backend: [backend-integration.md](backend-integration.md).
