"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { FileText, Info, Search, Sparkles, Trash2, Upload } from "lucide-react";
import { useDemo } from "./demo-provider";
import { PageHeading } from "./page-heading";
import {
  Confirm,
  DownloadButton,
  Empty,
  ErrorMessage,
  Field,
  Pagination,
  messageOf,
} from "./ui";
import { repository } from "@/lib/repository";
import { sampleFile } from "@/lib/sample";
import { formatDate, validateFile } from "@/lib/domain";

export function Reports({ downloadOnly }: { downloadOnly: boolean }) {
  const params = useSearchParams();
  const { data, run } = useDemo();
  const [applicationId, setApplicationId] = useState(
    params.get("pengajuan") ?? "",
  );
  const [filter, setFilter] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [selectionError, setSelectionError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const reports = data!.reports.filter((r) => {
    const a = data!.applications.find((a) => a.id === r.applicationId);
    return (
      (!filter || r.applicationId === filter) &&
      `${r.file.name} ${a?.code} ${a?.title}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  });
  const safePage = Math.min(page, Math.max(1, Math.ceil(reports.length / 5)));
  function chooseFile(next: File) {
    const issue = validateFile(next);
    setFileError(issue ?? "");
    if (!issue) setFile(next);
  }
  return (
    <>
      <PageHeading
        eyebrow="DOKUMEN PENELITIAN"
        title={downloadOnly ? "Unduh laporan" : "Laporan penelitian"}
        description={
          downloadOnly
            ? "Temukan laporan yang diunggah berdasarkan kode pengajuan."
            : "Lengkapi dokumentasi penelitian dengan mengunggah laporan Anda."
        }
      />
      <div className="info-banner">
        <Info size={19} />
        <p>
          Dokumen pada halaman ini adalah{" "}
          <strong>laporan penelitian yang diunggah</strong>. SIPRIMA demo tidak
          menerbitkan surat izin penelitian.
        </p>
      </div>
      {!downloadOnly && (
        <section className="card upload-card">
          <div>
            <span className="document-icon">
              <Upload size={25} />
            </span>
            <h2>Unggah laporan</h2>
            <p>
              Hubungkan laporan dengan pengajuan yang sesuai. Gunakan berkas
              sintetis.
            </p>
          </div>
          <form
            noValidate
            onSubmit={async (e) => {
              e.preventDefault();
              if (busy) return;
              setSelectionError(
                applicationId ? "" : "Pilih pengajuan terlebih dahulu.",
              );
              if (!file)
                setFileError("Pilih berkas laporan atau gunakan contoh.");
              if (!applicationId || !file || fileError) return;
              setBusy(true);
              setError("");
              try {
                await run(
                  () => repository.addReport(applicationId, file),
                  "Laporan berhasil diunggah.",
                );
                setFile(null);
                setFilter(applicationId);
                setPage(1);
              } catch (e) {
                setError(messageOf(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            <Field
              id="report-application"
              label="Kode pengajuan"
              error={selectionError}
              required
            >
              <select
                disabled={busy}
                id="report-application"
                value={applicationId}
                onChange={(e) => {
                  setApplicationId(e.target.value);
                  setSelectionError("");
                }}
              >
                <option value="">Pilih pengajuan</option>
                {data!.applications.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} — {a.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              id="report-file"
              label="Berkas laporan"
              error={fileError}
              hint="PDF, JPG, atau PNG · Maksimum 5 MiB"
              required
            >
              <input
                id="report-file"
                type="file"
                disabled={busy}
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const chosen = e.target.files?.[0];
                  if (chosen) chooseFile(chosen);
                  e.target.value = "";
                }}
              />
            </Field>
            <div className="selected-file">
              <span>{file?.name ?? "Belum ada berkas dipilih"}</span>
              <button
                className="button ghost small"
                disabled={busy}
                type="button"
                onClick={() =>
                  chooseFile(sampleFile("laporan-penelitian-contoh"))
                }
              >
                <Sparkles size={15} />
                Pakai laporan contoh
              </button>
            </div>
            <ErrorMessage message={error} />
            <button
              className="button primary"
              disabled={busy || !data!.applications.length}
            >
              {busy ? "Mengunggah…" : "Unggah laporan"}
              <Upload size={16} />
            </button>
            {!data!.applications.length && (
              <p className="muted">
                Buat pengajuan terlebih dahulu untuk mengunggah laporan.
              </p>
            )}
          </form>
        </section>
      )}
      <section className="card">
        <div className="card-heading">
          <div>
            <h2>{downloadOnly ? "Dokumen tersedia" : "Daftar laporan"}</h2>
            <p>{reports.length} laporan ditemukan</p>
          </div>
        </div>
        <div className="table-toolbar">
          <div className="search-field">
            <Search size={18} />
            <input
              aria-label="Cari laporan"
              placeholder="Cari laporan atau kode pengajuan…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            aria-label="Filter kode pengajuan"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Semua kode pengajuan</option>
            {data!.applications.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code}
              </option>
            ))}
          </select>
        </div>
        {reports.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Dokumen</th>
                  <th>Kode pengajuan</th>
                  <th>Diunggah</th>
                  <th className="align-right">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {reports.slice((safePage - 1) * 5, safePage * 5).map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="report-name">
                        <FileText size={22} />
                        <div>
                          <strong>{r.file.name}</strong>
                          <small>
                            {Math.max(1, Math.round(r.file.size / 1024))} KB ·{" "}
                            {r.file.type === "application/pdf"
                              ? "PDF"
                              : "Gambar"}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      {
                        data!.applications.find((a) => a.id === r.applicationId)
                          ?.code
                      }
                    </td>
                    <td className="nowrap">{formatDate(r.createdAt)}</td>
                    <td>
                      <div className="table-actions">
                        <DownloadButton id={r.file.id} />
                        {!downloadOnly && (
                          <button
                            aria-label={`Hapus laporan ${r.file.name}`}
                            className="icon-button delete"
                            onClick={() => setDeleting(r.id)}
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
            title="Belum ada laporan yang sesuai"
            description="Laporan yang telah diunggah akan tersedia untuk diunduh di sini."
          />
        )}
        <Pagination page={safePage} count={reports.length} setPage={setPage} />
      </section>
      {deleting && (
        <Confirm
          title="Hapus laporan?"
          description="Berkas laporan ini akan dihapus. Pengajuan penelitian tetap tersimpan."
          onClose={() => setDeleting(null)}
          onConfirm={() =>
            run(
              () => repository.deleteReport(deleting),
              "Laporan berhasil dihapus.",
            )
          }
        />
      )}
    </>
  );
}
