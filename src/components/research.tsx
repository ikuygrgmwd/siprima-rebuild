"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import {
  applicationSchema,
  attachmentKinds,
  attachmentLabels,
  formatDate,
  validateFile,
} from "@/lib/domain";
import type {
  Application,
  ApplicationInput,
  AttachmentChanges,
  AttachmentKind,
} from "@/lib/domain";
import { repository } from "@/lib/repository";
import { sampleFile, sampleInput } from "@/lib/sample";
import { useDemo } from "./demo-provider";
import { PageHeading } from "./page-heading";
import {
  Badge,
  Confirm,
  DownloadButton,
  Empty,
  ErrorMessage,
  Field,
  Pagination,
  messageOf,
} from "./ui";

export function ApplicationList() {
  const { data, run } = useDemo();
  const [query, setQuery] = useState("");
  const [purpose, setPurpose] = useState("");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<Application | null>(null);
  const filtered = data!.applications.filter(
    (a) =>
      `${a.title} ${a.code} ${a.applicantName} ${a.institution}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (!purpose || a.purposeId === purpose),
  );
  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 5)));
  return (
    <>
      <PageHeading
        eyebrow="LAYANAN PENELITIAN"
        title="Pengajuan penelitian"
        description="Temukan, periksa, dan kelola pengajuan penelitian Anda."
      >
        <Link href="/pengajuan/baru" className="button primary">
          <Plus size={18} />
          Buat pengajuan
        </Link>
      </PageHeading>
      <section className="card">
        <div className="table-toolbar">
          <div className="search-field">
            <Search size={18} />
            <input
              aria-label="Cari pengajuan"
              placeholder="Cari judul, kode, atau pemohon…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            aria-label="Filter tujuan penelitian"
            value={purpose}
            onChange={(e) => {
              setPurpose(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Semua tujuan</option>
            {data!.purposes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        {filtered.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Penelitian</th>
                  {data!.user!.role === "admin" && <th>Pemohon</th>}
                  <th>Tujuan</th>
                  <th>Tanggal</th>
                  <th>Status</th>
                  <th className="align-right">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice((safePage - 1) * 5, safePage * 5).map((a) => (
                  <tr key={a.id}>
                    <td className="title-cell">
                      <Link href={`/pengajuan/${a.id}`}>
                        <small>{a.code}</small>
                        <strong>{a.title}</strong>
                      </Link>
                      <span>{a.institution}</span>
                    </td>
                    {data!.user!.role === "admin" && <td>{a.applicantName}</td>}
                    <td>
                      {data!.purposes.find((p) => p.id === a.purposeId)?.name}
                    </td>
                    <td className="nowrap">{formatDate(a.createdAt)}</td>
                    <td>
                      <Badge />
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link
                          title="Lihat detail"
                          aria-label={`Lihat ${a.code}`}
                          className="icon-button"
                          href={`/pengajuan/${a.id}`}
                        >
                          <ArrowRight size={17} />
                        </Link>
                        <Link
                          title="Edit"
                          aria-label={`Edit ${a.code}`}
                          className="icon-button"
                          href={`/pengajuan/${a.id}/edit`}
                        >
                          <Pencil size={16} />
                        </Link>
                        <button
                          title="Hapus"
                          aria-label={`Hapus ${a.code}`}
                          className="icon-button delete"
                          onClick={() => setDeleting(a)}
                        >
                          <Trash2 size={16} />
                        </button>
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
              query || purpose
                ? "Pengajuan tidak ditemukan"
                : "Belum ada pengajuan"
            }
            description={
              query || purpose
                ? "Coba kata kunci atau filter yang berbeda."
                : "Mulai dengan membuat pengajuan penelitian pertama."
            }
          />
        )}
        <Pagination page={safePage} setPage={setPage} count={filtered.length} />
      </section>
      {deleting && (
        <Confirm
          title="Hapus pengajuan?"
          description={`${deleting.code} beserta seluruh lampiran dan laporannya akan dihapus dari demo.`}
          onClose={() => setDeleting(null)}
          onConfirm={() =>
            run(
              () => repository.deleteApplication(deleting.id),
              "Pengajuan berhasil dihapus.",
            )
          }
        />
      )}
    </>
  );
}
const fields: {
  key: Exclude<keyof ApplicationInput, "opdId" | "districtId" | "villageId">;
  label: string;
  type?: string;
  section: number;
  placeholder?: string;
}[] = [
  {
    key: "applicantName",
    label: "Nama pemohon / ketua kelompok",
    section: 1,
    placeholder: "Nama tanpa gelar",
  },
  {
    key: "email",
    label: "Email pemohon",
    type: "email",
    section: 1,
    placeholder: "nama@example.test",
  },
  { key: "phone", label: "Nomor telepon / WhatsApp", type: "tel", section: 1 },
  { key: "address", label: "Alamat pemohon", section: 1 },
  { key: "title", label: "Judul penelitian", section: 2 },
  { key: "institution", label: "Lembaga / perguruan tinggi", section: 2 },
  { key: "supervisor", label: "Penanggung jawab", section: 2 },
  { key: "location", label: "Detail lokasi penelitian", section: 2 },
  { key: "startDate", label: "Tanggal mulai", type: "date", section: 2 },
  { key: "endDate", label: "Tanggal selesai", type: "date", section: 2 },
  { key: "letterNumber", label: "Nomor surat pengantar", section: 3 },
  {
    key: "letterDate",
    label: "Tanggal surat pengantar",
    type: "date",
    section: 3,
  },
];
export function ApplicationForm({ id }: { id?: string }) {
  const { data } = useDemo();
  const existing = data!.applications.find((a) => a.id === id);
  if (id && !existing)
    return (
      <Empty
        title="Pengajuan tidak dapat diakses"
        description="Pengajuan tidak ditemukan atau bukan milik akun ini."
      />
    );
  return <ApplicationEditor existing={existing} key={id ?? "new"} />;
}
function ApplicationEditor({ existing }: { existing?: Application }) {
  const { data, run } = useDemo();
  const router = useRouter();
  const [error, setError] = useState("");
  const [files, setFiles] = useState<AttachmentChanges>({});
  const [fileErrors, setFileErrors] = useState<
    Partial<Record<AttachmentKind, string>>
  >({});
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema),
    defaultValues: { opdId: "", districtId: "", villageId: "", ...(existing ?? {
      applicantName: data!.user!.name,
      email: data!.user!.email,
      phone: data!.user!.phone,
      address: data!.user!.address,
      purposeId: "",
    }) },
  });
  const districtId = useWatch({ control, name: "districtId" });
  const villages = data!.villages.filter((v) => v.districtId === districtId);
  function selectFile(kind: AttachmentKind, file: File) {
    const error = validateFile(file);
    setFileErrors((previous) => ({ ...previous, [kind]: error ?? "" }));
    if (!error) setFiles((previous) => ({ ...previous, [kind]: file }));
  }
  return (
    <>
      <Link
        href={existing ? `/pengajuan/${existing.id}` : "/pengajuan"}
        className="back-link"
      >
        <ArrowLeft size={16} />
        Kembali ke {existing ? "detail" : "daftar"}
      </Link>
      <PageHeading
        eyebrow="LAYANAN PENELITIAN"
        title={existing ? "Edit pengajuan" : "Pengajuan baru"}
        description={
          existing
            ? `Perbarui informasi ${existing.code}.`
            : "Lengkapi informasi berikut untuk memulai pengajuan penelitian."
        }
      >
        <button
          className="button secondary"
          disabled={isSubmitting}
          onClick={() => {
            reset({
              ...sampleInput,
              purposeId: data!.purposes[0]?.id ?? "",
              opdId: "",
              districtId: "",
              villageId: "",
              applicantName: data!.user!.name,
              email: data!.user!.email,
            });
            setError("");
          }}
        >
          <Sparkles size={17} />
          Isi data contoh
        </button>
      </PageHeading>
      <div className="form-layout">
        <form
          noValidate
          onSubmit={handleSubmit(async (values) => {
            setError("");
            if (Object.values(fileErrors).some(Boolean)) {
              setError("Periksa kesalahan lampiran sebelum menyimpan.");
              return;
            }
            try {
              const id = await run(
                () => repository.saveApplication(values, files, existing?.id),
                existing
                  ? "Pengajuan berhasil diperbarui."
                  : "Pengajuan berhasil dibuat.",
              );
              router.push(`/pengajuan/${id}`);
            } catch (e) {
              setError(messageOf(e));
            }
          })}
        >
          <fieldset disabled={isSubmitting} className="form-fieldset">
            {[
              {
                n: 1,
                title: "Identitas pemohon",
                description: "Gunakan data fiktif untuk mencoba layanan.",
              },
              {
                n: 2,
                title: "Rencana penelitian",
                description: "Informasi kegiatan dan periode penelitian.",
              },
              {
                n: 3,
                title: "Surat pengantar",
                description:
                  "Informasi surat dari lembaga atau perguruan tinggi.",
              },
            ].map(({ n, title, description }) => (
              <section key={n} className="card form-section">
                <div className="form-section-heading">
                  <span>{String(n).padStart(2, "0")}</span>
                  <div>
                    <h2>{title}</h2>
                    <p>{description}</p>
                  </div>
                </div>
                <div className="form-grid">
                  {n === 2 && (
                    <>
                    <Field
                      id="purposeId"
                      label="Tujuan penelitian"
                      error={errors.purposeId?.message}
                      required
                    >
                      <select
                        id="purposeId"
                        aria-invalid={!!errors.purposeId}
                        {...register("purposeId")}
                      >
                        <option value="">Pilih tujuan penelitian</option>
                        {data!.purposes.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field id="opdId" label="OPD tujuan penelitian" error={errors.opdId?.message}
                      hint={data!.opds.length ? "Opsional, pilih jika penelitian ditujukan ke OPD tertentu." : "Belum ada OPD. Admin dapat menambahkan melalui Master OPD."}>
                      <select id="opdId" {...register("opdId")}>
                        <option value="">Tanpa OPD tujuan</option>
                        {data!.opds.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                    </Field>
                    <Field id="districtId" label="Kecamatan lokasi penelitian" error={errors.districtId?.message}
                      hint={data!.districts.length ? "Opsional, sesuai lokasi kegiatan penelitian." : "Belum ada kecamatan. Hubungi admin untuk menambahkan data."}>
                      <select id="districtId" aria-invalid={!!errors.districtId} {...register("districtId", {
                        onChange: () => setValue("villageId", "", { shouldDirty: true, shouldValidate: true }),
                      })}>
                        <option value="">Pilih kecamatan (opsional)</option>
                        {data!.districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </Field>
                    <Field id="villageId" label="Kelurahan lokasi penelitian" error={errors.villageId?.message}
                      hint={!districtId ? "Pilih kecamatan terlebih dahulu." : villages.length ? "Pilihan mengikuti kecamatan yang dipilih." : "Belum ada kelurahan untuk kecamatan ini."}>
                      <select id="villageId" disabled={!districtId || !villages.length} {...register("villageId")}>
                        <option value="">Pilih kelurahan (opsional)</option>
                        {villages.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                    </Field>
                    </>
                  )}
                  {fields
                    .filter((f) => f.section === n)
                    .map((f) => (
                      <Field
                        key={f.key}
                        id={f.key}
                        label={f.label}
                        error={errors[f.key]?.message}
                        required
                      >
                        <input
                          id={f.key}
                          type={f.type ?? "text"}
                          placeholder={f.placeholder}
                          aria-invalid={!!errors[f.key]}
                          aria-describedby={
                            errors[f.key] ? `${f.key}-error` : undefined
                          }
                          {...register(f.key)}
                        />
                      </Field>
                    ))}
                </div>
              </section>
            ))}
            <section className="card form-section">
              <div className="form-section-heading">
                <span>04</span>
                <div>
                  <h2>Lampiran pendukung</h2>
                  <p>Opsional · PDF, JPG, PNG · Maksimum 5 MiB per berkas</p>
                </div>
              </div>
              <div className="subtle-note">
                Jangan unggah KTP atau dokumen pribadi sungguhan. Tombol contoh
                menyediakan PDF sintetis.
              </div>
              <div className="attachment-list">
                {attachmentKinds.map((kind) => {
                  const pending = files[kind];
                  const previous = existing?.attachments[kind];
                  const fileName =
                    pending === null
                      ? undefined
                      : (pending?.name ?? previous?.name);
                  return (
                    <div key={kind} className="attachment-row">
                      <div className="attachment-label">
                        <Paperclip size={18} />
                        <div>
                          <label htmlFor={`file-${kind}`}>
                            {attachmentLabels[kind]}
                          </label>
                          <small>{fileName ?? "Belum ada berkas"}</small>
                        </div>
                      </div>
                      <div className="attachment-actions">
                        <label
                          className="button secondary small"
                          htmlFor={`file-${kind}`}
                        >
                          <Upload size={14} />
                          Pilih berkas
                          <input
                            className="file-input"
                            id={`file-${kind}`}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) selectFile(kind, file);
                              e.target.value = "";
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          className="button ghost small"
                          onClick={() =>
                            selectFile(kind, sampleFile(`contoh-${kind}`))
                          }
                        >
                          Pakai contoh
                        </button>
                        {fileName && (
                          <button
                            type="button"
                            aria-label={`Hapus lampiran ${attachmentLabels[kind]}`}
                            className="icon-button delete"
                            onClick={() => {
                              setFiles((prev) => ({ ...prev, [kind]: null }));
                              setFileErrors((prev) => ({
                                ...prev,
                                [kind]: "",
                              }));
                            }}
                          >
                            <XMark />
                          </button>
                        )}
                      </div>
                      {fileErrors[kind] && (
                        <p className="field-error" role="alert">
                          {fileErrors[kind]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
            <ErrorMessage message={error} />
            <div className="form-submit">
              <span>
                Kolom bertanda <b>*</b> wajib diisi.
              </span>
              <div className="actions">
                <Link
                  className="button secondary"
                  href={existing ? `/pengajuan/${existing.id}` : "/pengajuan"}
                >
                  Batal
                </Link>
                <button disabled={isSubmitting} className="button primary">
                  {isSubmitting
                    ? "Menyimpan…"
                    : existing
                      ? "Simpan perubahan"
                      : "Simpan pengajuan"}
                  <ArrowRight size={17} />
                </button>
              </div>
            </div>
          </fieldset>
        </form>
        <aside className="form-guide">
          <span className="guide-icon">
            <FileText size={26} />
          </span>
          <h3>Satu langkah lebih dekat.</h3>
          <p>
            Pastikan identitas dan rencana penelitian sudah sesuai sebelum
            menyimpan.
          </p>
          <hr />
          <h4>Tentang mode demo</h4>
          <p>
            Semua perubahan tersimpan di browser ini. Anda dapat mengedit
            pengajuan setelah menyimpannya.
          </p>
          <p>Lampiran contoh tersedia pada setiap jenis dokumen.</p>
          <span className="badge green">Data sintetis</span>
        </aside>
      </div>
    </>
  );
}
function XMark() {
  return <Trash2 size={15} />;
}
export function ApplicationDetail({ id }: { id: string }) {
  const { data, run } = useDemo();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const a = data!.applications.find((a) => a.id === id);
  if (!a)
    return (
      <Empty
        title="Pengajuan tidak dapat diakses"
        description="Data tidak ditemukan atau bukan milik akun ini."
      />
    );
  const reports = data!.reports.filter((r) => r.applicationId === a.id);
  return (
    <>
      <Link className="back-link" href="/pengajuan">
        <ArrowLeft size={16} />
        Kembali ke daftar
      </Link>
      <PageHeading
        eyebrow={a.code}
        title="Detail pengajuan"
        description={`Dibuat ${formatDate(a.createdAt)} · Diperbarui ${formatDate(a.updatedAt)}`}
      >
        <div className="actions">
          <button
            className="button secondary delete"
            onClick={() => setDeleting(true)}
          >
            <Trash2 size={16} />
            Hapus
          </button>
          <Link className="button primary" href={`/pengajuan/${id}/edit`}>
            <Pencil size={16} />
            Edit pengajuan
          </Link>
        </div>
      </PageHeading>
      <section className="card detail-title">
        <div>
          <span className="eyebrow">
            {data!.purposes.find((p) => p.id === a.purposeId)?.name}
          </span>
          <h2>{a.title}</h2>
          <p>{a.institution}</p>
        </div>
        <Badge />
      </section>
      <div className="detail-grid">
        {[
          {
            title: "Identitas pemohon",
            keys: ["applicantName", "email", "phone", "address"],
          },
          {
            title: "Rencana penelitian",
            keys: [
              "supervisor",
              "location",
              "startDate",
              "endDate",
              "letterNumber",
              "letterDate",
            ],
          },
        ].map((group) => (
          <section className="card detail-section" key={group.title}>
            <h2>{group.title}</h2>
            <dl>
              {group.title === "Rencana penelitian" && [
                ["OPD tujuan penelitian", data!.opds.find((o) => o.id === a.opdId)?.name],
                ["Kecamatan lokasi penelitian", data!.districts.find((d) => d.id === a.districtId)?.name],
                ["Kelurahan lokasi penelitian", data!.villages.find((v) => v.id === a.villageId)?.name],
              ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "Tidak diisi"}</dd></div>)}
              {group.keys.map((key) => {
                const field = fields.find((f) => f.key === key)!;
                return (
                  <div key={key}>
                    <dt>{field.label}</dt>
                    <dd>
                      {field.type === "date"
                        ? formatDate(a[field.key])
                        : a[field.key]}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        ))}
      </div>
      <section className="card detail-section">
        <h2>Lampiran pendukung</h2>
        <div className="document-list">
          {attachmentKinds.map((kind) => {
            const file = a.attachments[kind];
            return (
              <div key={kind}>
                <span className="document-icon">
                  <Paperclip size={20} />
                </span>
                <div>
                  <strong>{attachmentLabels[kind]}</strong>
                  <small>{file?.name ?? "Tidak dilampirkan"}</small>
                </div>
                {file && <DownloadButton id={file.id} />}
              </div>
            );
          })}
        </div>
      </section>
      <section className="card detail-section">
        <div className="card-heading compact">
          <h2>Laporan penelitian</h2>
          <Link className="text-link" href={`/laporan?pengajuan=${id}`}>
            Unggah laporan <Upload size={16} />
          </Link>
        </div>
        {reports.length ? (
          <div className="document-list">
            {reports.map((r) => (
              <div key={r.id}>
                <span className="document-icon">
                  <FileText size={20} />
                </span>
                <div>
                  <strong>{r.file.name}</strong>
                  <small>{formatDate(r.createdAt)}</small>
                </div>
                <DownloadButton id={r.file.id} />
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">Belum ada laporan untuk pengajuan ini.</p>
        )}
      </section>
      {deleting && (
        <Confirm
          title="Hapus pengajuan?"
          description={`${a.code}, lampiran, dan semua laporannya akan dihapus.`}
          onClose={() => setDeleting(false)}
          onConfirm={async () => {
            await run(
              () => repository.deleteApplication(id),
              "Pengajuan berhasil dihapus.",
            );
            router.push("/pengajuan");
          }}
        />
      )}
    </>
  );
}
