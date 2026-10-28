import type { News } from "./domain";

export function seedNews(): News[] {
  const articles = [
    {
      title: "Ide hari ini, perubahan untuk kota esok hari.",
      category: "Riset & inovasi",
      summary:
        "Kenali bagaimana penelitian mahasiswa dapat membantu menjawab tantangan kota. Mulai kontribusi Anda melalui SIPRIMA.",
      content:
        "Berita contoh untuk demonstrasi SIPRIMA.\n\nPenelitian tentang lingkungan, pelayanan publik, dan mobilitas dapat menjadi awal gagasan untuk kota yang lebih baik. Mahasiswa dapat menyiapkan rencana penelitian, menentukan tujuan, dan melengkapi dokumen melalui ruang kerja SIPRIMA.\n\nInformasi ini bersifat fiktif dan bukan pengumuman resmi Bappeda Kota Bekasi.",
      theme: "teal" as const,
    },
    {
      title: "Belajar langsung, tumbuh lewat pengalaman.",
      category: "Kabar magang",
      summary:
        "Jelajahi pengalaman magang di bidang perencanaan, data, dan pelayanan. Siapkan profil serta dokumen pendukung Anda.",
      content:
        "Berita contoh untuk demonstrasi SIPRIMA.\n\nProgram magang membantu peserta mengenal kegiatan perencanaan dan administrasi. Dalam simulasi ini, peserta dapat memilih program dan unit, mengajukan pendaftaran, serta melihat pembaruan status dari admin.\n\nJadwal, kuota, dan pembukaan program resmi belum diumumkan melalui berita contoh ini.",
      theme: "blue" as const,
    },
    {
      title: "Dokumen rapi, pengajuan lebih mudah.",
      category: "Panduan layanan",
      summary:
        "Sebelum mengajukan, periksa kembali identitas, jadwal kegiatan, dan lampiran. Semua bisa Anda kelola dalam satu ruang kerja.",
      content:
        "Berita contoh untuk demonstrasi SIPRIMA.\n\nPeriksa kecocokan nama dan kontak, tanggal mulai serta selesai kegiatan, dan keterbacaan dokumen. Formulir magang menyediakan tujuh bagian berkas opsional dengan pratinjau sebelum disimpan.\n\nGunakan dokumen sintetis selama mencoba aplikasi demo. Ketentuan layanan resmi akan disesuaikan kemudian.",
      theme: "amber" as const,
    },
  ];
  return articles.map((article, index) => ({
    ...article,
    id: `news-${index + 1}`,
    active: true,
    order: index + 1,
    createdAt: "2026-10-28T03:00:00Z",
    updatedAt: "2026-10-28T03:00:00Z",
  }));
}
