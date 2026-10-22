import {
  internshipLevels,
  internshipPrograms,
  internshipUnits,
  type Internship,
} from "./domain";

// Fictional participants, units and mentors for the local demonstration.
export function seedInternships(): Internship[] {
  const names = [
    "Nadia Pratama",
    "Raka Mahardika",
    "Alya Safitri",
    "Dimas Saputra",
    "Kirana Putri",
    "Farhan Aditya",
  ];
  const statuses = [
    "Diajukan",
    "Aktif",
    "Diterima",
    "Aktif",
    "Selesai",
    "Mengundurkan diri",
  ] as const;
  return names.map((name, i) => {
    const day =
      i === 4 ? "2026-06-20" : `2026-10-${String(21 - i).padStart(2, "0")}`;
    const at = `${day}T03:00:00Z`;
    const statusAt = i === 4 ? "2026-10-01T03:00:00Z" : at;
    return {
      id: `internship-${i + 1}`,
      code: `MAG${day.replaceAll("-", "")}00001`,
      ownerId: i === 0 ? "nadia" : i === 1 ? "raka" : "admin",
      applicantName: name,
      email: `${name.split(" ")[0].toLowerCase()}@example.test`,
      phone: `08000000000${i + 1}`,
      institution:
        i % 2 ? "Politeknik Nusantara (demo)" : "Universitas Cakrawala (demo)",
      studentNumber: `DEMO20260${i + 1}`,
      major: i % 2 ? "Administrasi publik" : "Sistem informasi",
      level: internshipLevels[i % 3],
      program: internshipPrograms[i % 3],
      unit: internshipUnits[i % 3],
      startDate: i === 4 ? "2026-07-01" : "2026-10-22",
      endDate: i === 4 ? "2026-10-01" : "2027-01-22",
      motivation:
        "Mengembangkan keterampilan melalui pengalaman kerja dan berkontribusi pada layanan masyarakat.",
      status: statuses[i],
      mentor: i === 0 ? "" : "Sari Wulandari (demo)",
      note:
        i === 0
          ? ""
          : "Jadwal dan penempatan pada data contoh ini bersifat simulasi.",
      createdAt: at,
      updatedAt: statusAt,
      history: [{ status: statuses[i], at: statusAt, by: "Data contoh" }],
    };
  });
}

export type InternshipFilters = {
  query: string;
  unit: string;
  year: string;
  month: string;
  level: string;
  program: string;
  status: string;
};
export const emptyInternshipFilters: InternshipFilters = {
  query: "",
  unit: "",
  year: "",
  month: "",
  level: "",
  program: "",
  status: "",
};
export function filterInternships(items: Internship[], f: InternshipFilters) {
  const query = f.query.trim().toLocaleLowerCase("id");
  return items.filter((a) => {
    const submitted = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(a.createdAt));
    return (
      (!f.unit || a.unit === f.unit) &&
      (!f.year || submitted.slice(0, 4) === f.year) &&
      (!f.month || submitted.slice(5, 7) === f.month) &&
      (!f.level || a.level === f.level) &&
      (!f.program || a.program === f.program) &&
      (!f.status || a.status === f.status) &&
      (!query ||
        [
          a.code,
          a.applicantName,
          a.email,
          a.institution,
          a.studentNumber,
          a.mentor,
        ].some((s) => s.toLocaleLowerCase("id").includes(query)))
    );
  });
}

export function internshipsCsv(items: Internship[]) {
  // Quote every cell and neutralize spreadsheet formulas from user-entered text.
  const cell = (value: string) =>
    `"${(/^[\s]*[=+@-]/.test(value) ? "'" + value : value).replaceAll('"', '""')}"`;
  const rows = [
    [
      "ID pendaftaran",
      "Tanggal pengajuan (WIB)",
      "Nama",
      "Email",
      "Telepon",
      "Instansi pendidikan",
      "NIM / NIS",
      "Jurusan",
      "Jenjang",
      "Program",
      "Unit",
      "Mulai",
      "Selesai",
      "Status",
      "Pembimbing",
      "Catatan admin",
    ],
    ...items.map((a) => [
      a.code,
      new Date(a.createdAt).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
      }),
      a.applicantName,
      a.email,
      a.phone,
      a.institution,
      a.studentNumber,
      a.major,
      a.level,
      a.program,
      a.unit,
      a.startDate,
      a.endDate,
      a.status,
      a.mentor,
      a.note,
    ]),
  ];
  return "\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n");
}
