"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Eye, FileText, Paperclip, X } from "lucide-react";
import {
  formatFileSize,
  internshipAttachmentKinds,
  internshipAttachmentLabels,
  type FileMeta,
  type Internship,
  type InternshipAttachmentChanges,
  type InternshipAttachmentKind,
} from "@/lib/domain";
import { repository } from "@/lib/repository";
import { sampleFile } from "@/lib/sample";
import { PdfPreview } from "./pdf-preview";
import { DownloadButton, ErrorMessage, Field, messageOf } from "./ui";

const descriptions: Record<InternshipAttachmentKind, string> = {
  transcript: "Transkrip nilai atau rekap hasil studi.",
  photo: "Foto diri untuk identitas peserta magang.",
  supporting: "Dokumen tambahan yang mendukung pendaftaran.",
  proposal: "Proposal atau rencana kegiatan magang.",
  cv: "CV berisi pendidikan, pengalaman, dan keterampilan.",
  letter: "Surat pengantar dari kampus atau sekolah.",
  statement: "Surat pernyataan untuk keperluan magang.",
};
type PreviewTarget =
  | { name: string; id: string; file?: never }
  | { name: string; file: File; id?: never };

function FilePreview({
  target,
  close,
}: {
  target: PreviewTarget;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [result, setResult] = useState<{
    url: string;
    type: string;
    blob: Blob;
  } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    ref.current?.showModal();
    let cancelled = false;
    let url: string | undefined;
    const read = target.file
      ? Promise.resolve({ blob: target.file, meta: target.file })
      : repository.getFile(target.id);
    void read
      .then(({ blob, meta }) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setResult({ url, type: meta.type, blob });
      })
      .catch((e) => {
        if (!cancelled) setError(messageOf(e));
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [target]);
  return (
    <dialog
      ref={ref}
      className="modal intern-file-preview"
      aria-labelledby="file-preview-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className="modal-heading">
        <h2 id="file-preview-title">{target.name}</h2>
        <button
          type="button"
          className="icon-button"
          aria-label="Tutup pratinjau"
          onClick={close}
        >
          <X size={19} />
        </button>
      </div>
      <ErrorMessage message={error} />
      {!result && !error && <p role="status">Memuat berkas…</p>}
      {result &&
        (result.type === "application/pdf" ? (
          <PdfPreview blob={result.blob} />
        ) : (
          <Image
            src={result.url}
            alt={`Pratinjau ${target.name}`}
            width={1200}
            height={900}
            unoptimized
          />
        ))}
    </dialog>
  );
}

export function InternshipUploads({
  saved,
  changes,
  errors,
  select,
  remove,
}: {
  saved: Internship["attachments"];
  changes: InternshipAttachmentChanges;
  errors: Partial<Record<InternshipAttachmentKind, string>>;
  select: (kind: InternshipAttachmentKind, file: File) => void;
  remove: (kind: InternshipAttachmentKind) => void;
}) {
  const [preview, setPreview] = useState<PreviewTarget | null>(null);
  const count = internshipAttachmentKinds.filter((kind) =>
    changes[kind] === null ? false : Boolean(changes[kind] ?? saved?.[kind]),
  ).length;
  return (
    <section
      className="intern-files-section"
      aria-labelledby="intern-files-title"
    >
      <div className="form-section-heading">
        <span>03</span>
        <div>
          <h2 id="intern-files-title">Berkas pendaftaran</h2>
          <p>Tujuh bagian dokumen · {count} dari 7 terisi · Semua opsional</p>
        </div>
      </div>
      <p className="intern-files-intro">
        Unggah satu berkas untuk setiap bagian. PDF, JPG/JPEG, atau PNG,
        maksimum 5 MiB per berkas (5.242.880 byte). Pendaftaran tetap bisa
        disimpan tanpa lampiran. Gunakan dokumen contoh pada mode demo.
      </p>
      <div className="intern-upload-grid">
        {internshipAttachmentKinds.map((kind, index) => {
          const pending = changes[kind];
          const file =
            pending === null ? undefined : (pending ?? saved?.[kind]);
          const label = internshipAttachmentLabels[kind];
          const id = `intern-file-${kind}`;
          return (
            <section
              className="card intern-upload-card"
              key={kind}
              aria-labelledby={`${id}-title`}
            >
              <div className="intern-upload-heading">
                <span className="intern-upload-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 id={`${id}-title`}>{label}</h3>
                <span className="badge gray">Opsional</span>
              </div>
              <p className="intern-upload-description">{descriptions[kind]}</p>
              <Field id={id} label={`Unggah ${label}`} error={errors[kind]}>
                <input
                  id={id}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  aria-invalid={Boolean(errors[kind])}
                  aria-describedby={`${id}-hint${errors[kind] ? ` ${id}-error` : ""}`}
                  onChange={(e) => {
                    const chosen = e.target.files?.[0];
                    if (chosen) select(kind, chosen);
                    e.target.value = "";
                  }}
                />
              </Field>
              <p id={`${id}-hint`} className="intern-upload-limit">
                PDF / JPG / PNG <span>Maks. 5 MiB per berkas</span>
              </p>
              <div className={`intern-upload-file ${file ? "has-file" : ""}`}>
                <Paperclip size={17} />
                <div>
                  <strong>{file?.name ?? "Belum ada berkas"}</strong>
                  <small>
                    {file
                      ? `${formatFileSize(file.size)} · ${pending ? "Akan disimpan" : "Tersimpan"}`
                      : pending === null
                        ? "Dihapus saat perubahan disimpan"
                        : "Bagian ini boleh dikosongkan"}
                  </small>
                </div>
              </div>
              <div className="intern-upload-actions">
                {file && (
                  <button
                    type="button"
                    className="button secondary small"
                    aria-label={`Lihat ${label}`}
                    onClick={() =>
                      setPreview(
                        pending
                          ? { name: label, file: pending }
                          : { name: label, id: (file as FileMeta).id },
                      )
                    }
                  >
                    <Eye size={14} />
                    Lihat
                  </button>
                )}
                <button
                  type="button"
                  className="button ghost small"
                  aria-label={`Pakai contoh PDF ${label}`}
                  onClick={() => select(kind, sampleFile(`contoh-${kind}`))}
                >
                  Contoh PDF
                </button>
                {(file || errors[kind]) && (
                  <button
                    type="button"
                    className="button ghost small"
                    aria-label={`Hapus pilihan ${label}`}
                    onClick={() => remove(kind)}
                  >
                    Hapus
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>
      {preview && (
        <FilePreview target={preview} close={() => setPreview(null)} />
      )}
    </section>
  );
}

export function InternshipDocuments({
  attachments,
}: {
  attachments: Internship["attachments"];
}) {
  const [preview, setPreview] = useState<PreviewTarget | null>(null);
  return (
    <section
      className="card intern-documents"
      aria-labelledby="intern-documents-title"
    >
      <div className="intern-section-heading">
        <div>
          <FileText size={20} />
          <div>
            <h2 id="intern-documents-title">Berkas pendaftaran</h2>
            <p>Dokumen peserta · Maksimum 5 MiB per berkas</p>
          </div>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Jenis berkas</th>
              <th>Nama file</th>
              <th>Ukuran (MiB)</th>
              <th className="align-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {internshipAttachmentKinds.map((kind) => {
              const file = attachments?.[kind];
              const label = internshipAttachmentLabels[kind];
              return (
                <tr key={kind}>
                  <td>
                    <strong>{label}</strong>
                  </td>
                  <td className="intern-document-name">
                    {file?.name ?? (
                      <span className="intern-muted">
                        Belum diunggah (opsional)
                      </span>
                    )}
                  </td>
                  <td>{file ? formatFileSize(file.size) : "—"}</td>
                  <td>
                    <div className="table-actions">
                      {file ? (
                        <>
                          <button
                            type="button"
                            className="button secondary small"
                            aria-label={`Lihat ${label}`}
                            onClick={() =>
                              setPreview({ name: label, id: file.id })
                            }
                          >
                            <Eye size={14} />
                            Lihat
                          </button>
                          <DownloadButton
                            id={file.id}
                            name={`Unduh ${label}`}
                          />
                        </>
                      ) : (
                        <span className="intern-muted">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {preview && (
        <FilePreview target={preview} close={() => setPreview(null)} />
      )}
    </section>
  );
}
