# Rencana integrasi backend — belum diimplementasikan

## Batas demo

`ResearchRepository` di `src/lib/repository.ts` merupakan kontrak async yang dipanggil UI. Adapter saat ini menggunakan satu dokumen state versi 5 pada IndexedDB `siprima-demo-v1`, termasuk Blob; state lama versi 1/2/3/4 dimigrasi tanpa menghapus data sebelumnya. Ini cocok untuk demo kecil, bukan dataset besar. Tidak ada ORM, migration database server, API produksi, atau filesystem server penyimpan unggahan.

Master OPD/kecamatan/kelurahan menggunakan `saveMaster` dan `deleteMaster` khusus admin. Snapshot pengguna masuk menyertakan `opds`, `districts`, dan `villages`; kelurahan memiliki `districtId`. Penelitian menyimpan `opdId`, `districtId`, dan `villageId` opsional, sementara `location` tetap detail lokasi teks wajib. Adapter server harus memeriksa FK, kecocokan pasangan kecamatan-kelurahan, duplikat nama (kelurahan dalam kecamatan yang sama), dan larangan hapus master terpakai/pindah kecamatan pada kelurahan terpakai secara atomik. Nama dibaca dari master, sehingga koreksi nama tercermin pada detail pengajuan lama. Migrasi tidak menebak wilayah dari teks lokasi lama. Seed saat ini sintetis, bukan daftar resmi Kota Bekasi.

Carousel menambahkan `News` (judul, kategori, ringkasan, isi teks, tema, urutan, active, timestamps). Endpoint berita harus membatasi mutasi pada admin dan tidak mengirim draf kepada pemohon. `updateProfile` hanya menerima nama/email/telepon/alamat dan menentukan pemilik dari sesi; `changePassword` memerlukan sandi lama dan membatalkan token reset. Adapter produksi perlu reautentikasi, hashing/auth yang sesuai, verifikasi perubahan email, serta kebijakan invalidasi sesi server.

Saat mengganti adapter dengan HTTP, pertahankan metode dan tipe di `domain.ts`. UI hanya menerima Snapshot yang sudah dibatasi, metadata berkas, dan hasil operasi. Untuk skala produksi, ganti snapshot penuh dengan query list berparameter (search, filter, cursor/page) dan detail per ID; halaman daftar kemudian dapat memanggil query tersebut. State UI dan form tetap dapat dipakai.

## Pemetaan data

| Lama                                                                                                   | Model demo                                                | Catatan integrasi                                                                |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------- |
| users/id_hak_akses/is_aktif                                                                            | User/role/active                                          | Role eksplisit, dua peran inti; peran wilayah/pendamping perlu keputusan cakupan |
| tujuan_penelitian/nama                                                                                 | Purpose/name                                              | Relasi wajib, lindungi penghapusan tujuan yang direferensikan                    |
| pengajuan_penelitian/id_user                                                                           | Application/ownerId                                       | FK pemilik dari sesi server, bukan body client                                   |
| nama_pemohon, email, telp, alamat                                                                      | applicantName, email, phone, address                      | Pertahankan snapshot identitas ketika pengajuan dibuat                           |
| id_tujuan_penelitian                                                                                   | purposeId                                                 | FK master tujuan                                                                 |
| judul_penelitian, penanggungjawab, nama_lembaga, lokasi_penelitian                                     | title, supervisor, institution, location                  | Semua dipertahankan                                                              |
| tanggal_pelaksanaan_awal/akhir                                                                         | startDate/endDate                                         | Tanggal kalender, selesai tidak sebelum mulai                                    |
| no_surat_pengantar, tanggal_surat_pengantar                                                            | letterNumber/letterDate                                   | Dipertahankan                                                                    |
| file_surat_pengantar, file_ktp, file_proposal_penelitian, file_persetujuan_izin, file_surat_pernyataan | attachments letter/identity/proposal/internship/statement | Metadata dan object key privat; jangan URL publik                                |
| kode_pengajuan/status                                                                                  | code/status                                               | REG + tanggal Asia/Jakarta + urutan; status Review, tanpa workflow baru          |
| upload_laporan_penelitian                                                                              | Report                                                    | FK applicationId; owner mengikuti pengajuan; kode diturunkan dari relasi         |

## Operasi server yang diperlukan

- Auth: register/login/logout, sesi cookie HttpOnly/Secure, reset token sekali pakai, expiry dan rate limit, pengiriman email nyata, CSRF sesuai pola sesi. Jangan memakai tombol login cepat atau hash SHA-256 demo untuk produksi; gunakan layanan auth atau hashing sandi yang sesuai.
- Users: list/create/update/delete untuk admin; jangan menonaktifkan admin sendiri atau menghilangkan admin terakhir. Jangan otomatis membuat record Dukcapil. Putuskan field NIK/KK/wilayah dan verifikasi identitas secara terpisah sebelum migrasi profil lengkap.
- Applications: list/detail/create/update/delete, pengecekan owner atau role admin pada setiap endpoint. Generate kode secara transaksional dengan unique constraint dan counter yang tidak digunakan ulang. Demo menghitung urutan dari data tersimpan; produksi memerlukan counter permanen.
- Purposes: admin CRUD, unique nama yang dinormalisasi, RESTRICT ketika dipakai.
- Reports/files: upload tervalidasi, metadata relasi, penyimpanan object privat, download melalui proxy atau signed URL berumur pendek setelah otorisasi. Terapkan batas ukuran server, sniffing file sebenarnya, scan malware, safe filename, kuota, serta cleanup orphan.
- Penghapusan aplikasi: transaksi perubahan relasi dan pekerjaan cleanup berkas yang dapat dicoba ulang. Kebijakan retensi/soft-delete perlu keputusan layanan.
- Query produksi: pagination/filter/search server dan indeks ownerId, createdAt, purposeId, applicationId, unique code/email.
- Kesalahan: field errors terstruktur, 401/403/404/409/413/422, pesan ramah pengguna, indikator retry, logging yang tidak memuat dokumen/data sensitif.

Otorisasi client tidak dapat melindungi data dari manipulasi browser. Production wajib memeriksa akses di server, termasuk dokumen, dan menghapus seed/demo bypass. Admin tidak ditentukan oleh ID 1.

## Migrasi dan keputusan terbuka

### Tambahan modul magang

- `Internship`: identitas peserta (nama/email/telepon/NIM atau NIS/institusi/jurusan/jenjang), program, unit, tanggal mulai/selesai, motivasi, ownerId, kode MAG, status, pembimbing, catatan admin, timestamps. `InternshipStatusHistory`: status, waktu, aktor; server harus memakai ID aktor dan menyimpan audit yang tidak bisa diedit klien.
- `saveInternship` dan `deleteInternship` melengkapi kontrak repository. Pemohon hanya membaca miliknya, membuat Diajukan, dan mengedit selama Diajukan; pemohon tidak mengubah pembimbing/catatan/status. Admin mengelola seluruh peserta dan menghapus. Hapus akun pemilik dibatasi ketika masih ada magang terkait.
- Form admin mengizinkan entri manual dengan pemilik akun admin; hubungan ke akun peserta perlu rancangan invitation/claim saat backend, bukan pencocokan otomatis berdasarkan email.
- Konfirmasi daftar unit/program/jenjang dan aturan transisi status resmi. Preview mengizinkan admin memilih seluruh status; pembimbing wajib ketika Aktif/Selesai. Catatan admin terlihat oleh pemohon, bukan catatan internal rahasia.
- Query daftar dan ekspor perlu otorisasi/filter server yang sama; tanggal filter pengajuan memakai Asia/Jakarta. CSV menetralkan formula dari nilai pengguna.
- Tujuh berkas opsional disimpan pada `Internship.attachments` dengan key `transcript`, `photo`, `supporting`, `proposal`, `cv`, `letter`, `statement`. Nilai adalah FileMeta dan byte disimpan sebagai Blob. Parameter keempat `saveInternship` menerima objek perubahan per key: File untuk mengganti, null untuk menghapus, undefined untuk mempertahankan. Semua file divalidasi sebelum transaksi; metadata/bytes atomik, download hanya pemilik/admin, penghapusan pendaftaran membersihkan seluruh Blob. Migrasi versi 3 memindahkan `campusLetter` lama ke `attachments.letter`, mempertahankan ID dan byte serta menghapus field lama agar tidak muncul kembali setelah penghapusan. Adapter server perlu object storage privat, validasi berkas server, dan pemeriksaan akses yang sama.
- Belum mencakup absensi, penilaian, sertifikat, atau notifikasi email. Status penelitian tetap terpisah dari status magang.

Audit lama menyebut migration inti belum lengkap. Pada fase backend, baca **definisi tabel saja** dari salinan dump sesuai kebutuhan, petakan ID dan hubungan, lalu siapkan migration lengkap serta uji jumlah/relasi/berkas hilang. Jangan impor data pribadi ke preview ini.

Konfirmasi kontak resmi, kebutuhan peran selain admin/pemohon, profil Dukcapil, aturan wajib/jenis/batas berkas, retensi dan kepemilikan laporan lama. Alur persetujuan, pembayaran, surat keluaran dan modul tersembunyi memerlukan bukti atau keputusan baru; belum masuk implementasi.
