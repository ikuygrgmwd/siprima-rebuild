"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCheck,
  Download,
  Eye,
  GraduationCap,
  ListFilter,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import {
  formatDate,
  internshipLevels,
  internshipManagementSchema,
  internshipPrograms,
  internshipSchema,
  internshipStatuses,
  internshipUnits,
  jakartaDay,
  type Internship,
  type InternshipInput,
  type InternshipManagement,
} from "@/lib/domain";
import {
  emptyInternshipFilters,
  filterInternships,
  internshipsCsv,
  type InternshipFilters,
} from "@/lib/internships";
import { repository } from "@/lib/repository";
import { useDemo } from "./demo-provider";
import { PageHeading } from "./page-heading";
import {
  Confirm,
  Empty,
  ErrorMessage,
  Field,
  Pagination,
  messageOf,
} from "./ui";

function Status({ value }: { value: Internship["status"] }) {
  const color =
    value === "Diajukan"
      ? "amber"
      : value === "Aktif" || value === "Selesai"
        ? "green"
        : value === "Diterima"
          ? "blue"
          : "gray";
  return (
    <span className={`badge ${color}`}>
      <i />
      {value}
    </span>
  );
}

export function InternshipList() {
  const { data, run } = useDemo();
  const admin = data!.user!.role === "admin";
  const [filters, setFilters] = useState<InternshipFilters>(
    emptyInternshipFilters,
  );
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(5);
  const [deleting, setDeleting] = useState<Internship | null>(null);
  const items = data!.internships;
  const rows = filterInternships(items, filters);
  const safePage = Math.min(page, Math.max(1, Math.ceil(rows.length / size)));
  const activeFilters = Object.values(filters).filter(Boolean).length;
  const years = [
    ...new Set([
      jakartaDay().slice(0, 4),
      ...items.map((a) => jakartaDay(new Date(a.createdAt)).slice(0, 4)),
    ]),
  ]
    .sort()
    .reverse();
  const update = (key: keyof InternshipFilters, value: string) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };
  const reset = () => {
    setFilters(emptyInternshipFilters);
    setPage(1);
  };
  const controls: {
    key: keyof InternshipFilters;
    label: string;
    all: string;
    values: readonly string[];
  }[] = [
    {
      key: "unit",
      label: "Unit penempatan",
      all: "Semua unit",
      values: internshipUnits,
    },
    {
      key: "year",
      label: "Tahun pengajuan",
      all: "Semua tahun",
      values: years,
    },
    {
      key: "month",
      label: "Bulan pengajuan",
      all: "Semua bulan",
      values: Array.from({ length: 12 }, (_, i) =>
        String(i + 1).padStart(2, "0"),
      ),
    },
    {
      key: "level",
      label: "Jenjang pendidikan",
      all: "Semua jenjang",
      values: internshipLevels,
    },
    {
      key: "program",
      label: "Program magang",
      all: "Semua program",
      values: internshipPrograms,
    },
    {
      key: "status",
      label: "Status peserta",
      all: "Semua status",
      values: internshipStatuses,
    },
  ];
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  return (
    <>
      <PageHeading
        eyebrow="PENGEMBANGAN TALENTA"
        title={admin ? "Peserta magang" : "Pendaftaran magang"}
        description={
          admin
            ? "Kelola pendaftaran, penempatan, dan perjalanan magang dalam satu ruang."
            : "Ajukan program magang dan pantau perkembangan pendaftaranmu."
        }
      >
        <Link href="/magang/baru" className="button primary">
          <Plus size={18} />
          {admin ? "Tambah peserta" : "Daftar magang"}
        </Link>
      </PageHeading>
      <section
        className="intern-overview"
        aria-label="Ringkasan seluruh pendaftaran magang"
      >
        {[
          {
            label: "Total pendaftaran",
            value: items.length,
            hint: "Seluruh pendaftaran",
            icon: Users,
            color: "teal",
          },
          {
            label: "Menunggu review",
            value: items.filter((a) => a.status === "Diajukan").length,
            hint: "Perlu ditinjau admin",
            icon: ListFilter,
            color: "amber",
          },
          {
            label: "Sedang magang",
            value: items.filter((a) => a.status === "Aktif").length,
            hint: "Peserta berstatus aktif",
            icon: UserCheck,
            color: "blue",
          },
          {
            label: "Magang selesai",
            value: items.filter((a) => a.status === "Selesai").length,
            hint: "Program telah diselesaikan",
            icon: CheckCheck,
            color: "teal",
          },
        ].map(({ label, value, hint, icon: Icon, color }) => (
          <div className="intern-stat card" key={label}>
            <div>
              <span>{label}</span>
              <span className={`intern-stat-icon ${color}`}>
                <Icon size={19} />
              </span>
            </div>
            <strong>{String(value).padStart(2, "0")}</strong>
            <small>{hint}</small>
          </div>
        ))}
      </section>
      <section
        className="card intern-filter"
        aria-labelledby="intern-filter-title"
      >
        <div className="intern-section-heading">
          <div>
            <SlidersHorizontal size={18} />
            <h2 id="intern-filter-title">Filter pendaftaran</h2>
            {activeFilters > 0 && (
              <span className="intern-filter-count">{activeFilters} aktif</span>
            )}
          </div>
          <button
            className="text-button"
            onClick={reset}
            disabled={!activeFilters}
          >
            Reset filter
          </button>
        </div>
        <div className="intern-filter-grid">
          {controls.map((c) => (
            <Field key={c.key} id={`filter-${c.key}`} label={c.label}>
              <select
                id={`filter-${c.key}`}
                value={filters[c.key]}
                onChange={(e) => update(c.key, e.target.value)}
              >
                <option value="">{c.all}</option>
                {c.values.map((v) => (
                  <option key={v} value={v}>
                    {c.key === "month" ? months[Number(v) - 1] : v}
                  </option>
                ))}
              </select>
            </Field>
          ))}
        </div>
      </section>
      <section
        className="card intern-register"
        aria-labelledby="intern-list-title"
      >
        <div className="intern-section-heading">
          <div>
            <span className="intern-heading-icon">
              <GraduationCap size={20} />
            </span>
            <div>
              <h2 id="intern-list-title">Daftar peserta magang</h2>
              <p>
                {rows.length} pendaftaran
                {activeFilters ? " sesuai filter" : " terdaftar"}
              </p>
            </div>
          </div>
          <button
            className="button secondary small"
            disabled={!rows.length}
            onClick={() => {
              const url = URL.createObjectURL(
                new Blob([internshipsCsv(rows)], {
                  type: "text/csv;charset=utf-8;",
                }),
              );
              const anchor = document.createElement("a");
              anchor.href = url;
              anchor.download = `peserta-magang-${jakartaDay()}.csv`;
              anchor.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          >
            <Download size={16} />
            Ekspor CSV
          </button>
        </div>
        <div className="table-toolbar intern-toolbar">
          <div className="search-field">
            <Search size={18} />
            <input
              aria-label="Cari peserta magang"
              placeholder="Cari nama, ID, atau instansi…"
              value={filters.query}
              onChange={(e) => update("query", e.target.value)}
            />
          </div>
          <label className="intern-page-size">
            Tampilkan{" "}
            <select
              aria-label="Jumlah peserta per halaman"
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {[5, 10, 25].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            data
          </label>
        </div>
        {rows.length ? (
          <div className="table-scroll">
            <table className="intern-table">
              <thead>
                <tr>
                  <th>Peserta / pengajuan</th>
                  <th>Program & penempatan</th>
                  <th>Periode magang</th>
                  <th>Pembimbing</th>
                  <th>Status</th>
                  <th className="align-right">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {rows
                  .slice((safePage - 1) * size, safePage * size)
                  .map((a, index) => (
                    <tr key={a.id}>
                      <td>
                        <div className="intern-person">
                          <span className={`intern-avatar tone-${index % 3}`}>
                            {a.applicantName
                              .split(" ")
                              .slice(0, 2)
                              .map((s) => s[0])
                              .join("")}
                          </span>
                          <div>
                            <Link
                              href={`/magang/${a.id}`}
                              className="intern-name"
                            >
                              {a.applicantName}
                            </Link>
                            <span>{a.institution}</span>
                            <small>
                              {a.code} · {formatDate(a.createdAt)}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{a.program}</strong>
                        <span className="intern-cell-sub">{a.unit}</span>
                      </td>
                      <td>
                        <span className="intern-date">
                          {formatDate(a.startDate)}
                        </span>
                        <span className="intern-cell-sub">
                          s.d. {formatDate(a.endDate)}
                        </span>
                      </td>
                      <td>
                        {a.mentor || (
                          <span className="intern-muted">Belum ditentukan</span>
                        )}
                      </td>
                      <td>
                        <Status value={a.status} />
                      </td>
                      <td>
                        <div className="table-actions">
                          <Link
                            href={`/magang/${a.id}`}
                            className="icon-button"
                            aria-label={`Detail ${a.applicantName}`}
                            title="Lihat detail"
                          >
                            <Eye size={17} />
                          </Link>
                          {(admin || a.status === "Diajukan") && (
                            <Link
                              href={`/magang/${a.id}/edit`}
                              className="icon-button"
                              aria-label={`Edit ${a.applicantName}`}
                              title="Edit pendaftaran"
                            >
                              <Pencil size={16} />
                            </Link>
                          )}
                          {admin && (
                            <button
                              className="icon-button delete"
                              aria-label={`Hapus ${a.applicantName}`}
                              title="Hapus pendaftaran"
                              onClick={() => setDeleting(a)}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title={
              items.length
                ? "Tidak ada peserta yang sesuai"
                : "Belum ada pendaftaran magang"
            }
            description={
              items.length
                ? "Coba ubah pencarian atau reset filter untuk melihat seluruh peserta."
                : "Mulai dengan menambahkan pendaftaran magang pertama."
            }
          >
            {items.length ? (
              <button className="button secondary" onClick={reset}>
                Reset filter
              </button>
            ) : (
              <Link className="button primary" href="/magang/baru">
                Daftar magang
              </Link>
            )}
          </Empty>
        )}
        <Pagination
          page={safePage}
          setPage={setPage}
          count={rows.length}
          size={size}
        />
      </section>
      <p className="intern-demo-note">
        Data contoh untuk simulasi. Unit, program, dan pembimbing dapat
        disesuaikan dengan kebijakan instansi saat integrasi backend.
      </p>
      {deleting && (
        <Confirm
          title="Hapus pendaftaran magang?"
          description={`Pendaftaran ${deleting.applicantName} (${deleting.code}) beserta riwayat statusnya akan dihapus dari browser ini.`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await run(
              () => repository.deleteInternship(deleting.id),
              "Pendaftaran magang dihapus.",
            );
          }}
        />
      )}
    </>
  );
}

export function InternshipForm({ id }: { id?: string }) {
  const { data, run } = useDemo();
  const router = useRouter();
  const user = data!.user!;
  const admin = user.role === "admin";
  const original = data!.internships.find((a) => a.id === id);
  const [error, setError] = useState("");
  const [controlErrors, setControlErrors] = useState<Record<string, string>>(
    {},
  );
  const [management, setManagement] = useState<InternshipManagement>({
    status: original?.status ?? "Diajukan",
    mentor: original?.mentor ?? "",
    note: original?.note ?? "",
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InternshipInput>({
    resolver: zodResolver(internshipSchema),
    defaultValues: original ?? {
      applicantName: admin ? "" : user.name,
      email: admin ? "" : user.email,
      phone: admin ? "" : user.phone,
      institution: "",
      studentNumber: "",
      major: "",
      level: "D4 / S1",
      program: "Magang riset",
      unit: "Data & inovasi",
      startDate: "",
      endDate: "",
      motivation: "",
    },
  });
  if (id && !original)
    return (
      <Empty
        title="Pendaftaran tidak ditemukan"
        description="Pendaftaran mungkin sudah dihapus atau tidak dapat diakses oleh akun ini."
      />
    );
  if (original && !admin && original.status !== "Diajukan")
    return (
      <Empty
        title="Pendaftaran sudah diproses"
        description="Hubungi admin untuk mengubah pendaftaran ini."
      >
        <Link href={`/magang/${id}`} className="button secondary">
          Lihat detail
        </Link>
      </Empty>
    );
  function input(
    name: keyof InternshipInput,
    label: string,
    type = "text",
    hint?: string,
  ) {
    return (
      <Field
        id={`intern-${name}`}
        label={label}
        required
        error={errors[name]?.message}
        hint={hint}
      >
        <input
          id={`intern-${name}`}
          type={type}
          {...register(name)}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? `intern-${name}-error` : undefined}
        />
      </Field>
    );
  }
  function select(
    name: "level" | "program" | "unit",
    label: string,
    options: readonly string[],
  ) {
    return (
      <Field
        id={`intern-${name}`}
        label={label}
        required
        error={errors[name]?.message}
      >
        <select id={`intern-${name}`} {...register(name)}>
          {options.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </Field>
    );
  }
  return (
    <>
      <Link href={id ? `/magang/${id}` : "/magang"} className="back-link">
        <ArrowLeft size={16} />
        Kembali ke {id ? "detail" : "daftar magang"}
      </Link>
      <PageHeading
        eyebrow="PENDAFTARAN MAGANG"
        title={
          id
            ? "Edit pendaftaran magang"
            : admin
              ? "Tambah peserta magang"
              : "Mulai perjalanan magangmu"
        }
        description="Lengkapi identitas peserta, pilihan program, dan rencana periode magang."
      />
      <form
        noValidate
        onSubmit={handleSubmit(async (values) => {
          setError("");
          setControlErrors({});
          if (admin) {
            const checked = internshipManagementSchema.safeParse(management);
            if (!checked.success) {
              setControlErrors(
                Object.fromEntries(
                  checked.error.issues.map((i) => [
                    String(i.path[0]),
                    i.message,
                  ]),
                ),
              );
              return;
            }
          }
          try {
            const saved = await run(
              () =>
                repository.saveInternship(
                  values,
                  id,
                  admin ? management : undefined,
                ),
              id
                ? "Pendaftaran magang diperbarui."
                : "Pendaftaran magang berhasil disimpan.",
            );
            router.push(`/magang/${saved}`);
          } catch (e) {
            setError(messageOf(e));
          }
        })}
        className="intern-form"
      >
        <fieldset disabled={isSubmitting}>
          <section className="card form-section">
            <div className="form-section-heading">
              <span>01</span>
              <div>
                <h2>Identitas peserta</h2>
                <p>Gunakan data sintetis saat mencoba mode demo.</p>
              </div>
            </div>
            <div className="form-grid">
              {input("applicantName", "Nama lengkap")}
              {input("email", "Email", "email")}
              {input("phone", "Nomor telepon", "tel")}
              {input("studentNumber", "NIM / NIS")}
              {input("institution", "Sekolah / perguruan tinggi")}
              {input("major", "Jurusan / program studi")}
              {select("level", "Jenjang pendidikan", internshipLevels)}
            </div>
          </section>
          <section className="card form-section">
            <div className="form-section-heading">
              <span>02</span>
              <div>
                <h2>Rencana magang</h2>
                <p>Penempatan dan periode akan ditinjau oleh admin.</p>
              </div>
            </div>
            <div className="form-grid">
              {select("program", "Program magang", internshipPrograms)}
              {select("unit", "Unit penempatan", internshipUnits)}
              {input("startDate", "Tanggal mulai", "date")}
              {input("endDate", "Tanggal selesai", "date")}
              <Field
                id="intern-motivation"
                label="Tujuan / motivasi magang"
                required
                error={errors.motivation?.message}
              >
                <textarea
                  id="intern-motivation"
                  rows={4}
                  {...register("motivation")}
                  aria-invalid={Boolean(errors.motivation)}
                />
              </Field>
            </div>
          </section>
          {admin && (
            <section className="card form-section">
              <div className="form-section-heading">
                <span>03</span>
                <div>
                  <h2>Pengelolaan oleh admin</h2>
                  <p>
                    Status, pembimbing, dan catatan ini dapat dilihat oleh
                    pemohon.
                  </p>
                </div>
              </div>
              <div className="form-grid">
                <Field
                  id="intern-status"
                  label="Status peserta"
                  error={controlErrors.status}
                >
                  <select
                    id="intern-status"
                    value={management.status}
                    onChange={(e) =>
                      setManagement({
                        ...management,
                        status: e.target.value as Internship["status"],
                      })
                    }
                  >
                    {internshipStatuses.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  id="intern-mentor"
                  label="Pembimbing lapangan"
                  hint="Wajib diisi untuk status Aktif dan Selesai."
                  error={controlErrors.mentor}
                >
                  <input
                    id="intern-mentor"
                    value={management.mentor}
                    onChange={(e) =>
                      setManagement({ ...management, mentor: e.target.value })
                    }
                  />
                </Field>
                <Field
                  id="intern-note"
                  label="Catatan untuk peserta"
                  error={controlErrors.note}
                >
                  <textarea
                    id="intern-note"
                    rows={3}
                    value={management.note}
                    onChange={(e) =>
                      setManagement({ ...management, note: e.target.value })
                    }
                    placeholder="Contoh: Silakan hadir untuk orientasi pada hari pertama."
                  />
                </Field>
              </div>
            </section>
          )}
          <ErrorMessage message={error} />
          <div className="intern-form-footer">
            <p>
              {admin
                ? "Data yang ditambahkan admin dikelola melalui akun admin ini."
                : "Pendaftaran dapat diedit selama masih berstatus Diajukan."}
            </p>
            <div className="actions">
              <Link
                className="button secondary"
                href={id ? `/magang/${id}` : "/magang"}
              >
                Batal
              </Link>
              <button
                className="button primary"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Menyimpan…"
                  : id
                    ? "Simpan perubahan"
                    : "Simpan pendaftaran"}
                <ArrowUpRight size={17} />
              </button>
            </div>
          </div>
        </fieldset>
      </form>
    </>
  );
}

export function InternshipDetail({ id }: { id: string }) {
  const { data, run } = useDemo();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const a = data!.internships.find((item) => item.id === id);
  const admin = data!.user!.role === "admin";
  if (!a)
    return (
      <Empty
        title="Pendaftaran tidak ditemukan"
        description="Pendaftaran mungkin sudah dihapus atau tidak dapat diakses oleh akun ini."
      >
        <Link className="button secondary" href="/magang">
          Kembali ke daftar
        </Link>
      </Empty>
    );
  const groups = [
    {
      title: "Identitas peserta",
      fields: [
        ["Nama lengkap", a.applicantName],
        ["Email", a.email],
        ["Telepon", a.phone],
        ["Sekolah / perguruan tinggi", a.institution],
        ["NIM / NIS", a.studentNumber],
        ["Jurusan / program studi", a.major],
        ["Jenjang pendidikan", a.level],
      ],
    },
    {
      title: "Program & penempatan",
      fields: [
        ["Program magang", a.program],
        ["Unit penempatan", a.unit],
        [
          "Periode magang",
          `${formatDate(a.startDate)} – ${formatDate(a.endDate)}`,
        ],
        ["Pembimbing lapangan", a.mentor || "Belum ditentukan"],
        ["Tujuan / motivasi", a.motivation],
        ["Catatan admin", a.note || "Belum ada catatan."],
      ],
    },
  ];
  return (
    <>
      <Link href="/magang" className="back-link">
        <ArrowLeft size={16} />
        Kembali ke daftar magang
      </Link>
      <PageHeading
        eyebrow={a.code}
        title={a.applicantName}
        description={`Diajukan ${formatDate(a.createdAt)} · Diperbarui ${formatDate(a.updatedAt)}`}
      >
        <div className="actions">
          {admin && (
            <button
              className="button secondary"
              onClick={() => setDeleting(true)}
            >
              <Trash2 size={16} />
              Hapus
            </button>
          )}
          {(admin || a.status === "Diajukan") && (
            <Link href={`/magang/${a.id}/edit`} className="button primary">
              <Pencil size={16} />
              {admin ? "Kelola peserta" : "Edit pendaftaran"}
            </Link>
          )}
        </div>
      </PageHeading>
      <div className="intern-status-banner">
        <div>
          <GraduationCap size={25} />
          <div>
            <strong>{a.program}</strong>
            <p>{a.unit}</p>
          </div>
        </div>
        <Status value={a.status} />
      </div>
      <div className="intern-details">
        {groups.map((g) => (
          <section className="card" key={g.title}>
            <h2>{g.title}</h2>
            <dl>
              {g.fields.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
      <section className="card intern-history">
        <h2>Riwayat status</h2>
        <ol>
          {[...a.history].reverse().map((h, i) => (
            <li key={`${h.at}-${i}`}>
              <span className="intern-timeline-dot" />
              <div>
                <Status value={h.status} />
                <p>
                  {formatDate(h.at)} ·{" "}
                  {new Date(h.at).toLocaleTimeString("id-ID", {
                    timeZone: "Asia/Jakarta",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  WIB · {h.by}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      {deleting && (
        <Confirm
          title="Hapus pendaftaran magang?"
          description={`Pendaftaran ${a.applicantName} dan riwayat statusnya akan dihapus.`}
          onClose={() => setDeleting(false)}
          onConfirm={async () => {
            await run(
              () => repository.deleteInternship(a.id),
              "Pendaftaran magang dihapus.",
            );
            router.push("/magang");
          }}
        />
      )}
    </>
  );
}
