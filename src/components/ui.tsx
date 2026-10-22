"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  FileSearch,
  LoaderCircle,
  X,
} from "lucide-react";
import { repository } from "@/lib/repository";

export function Field({
  label,
  error,
  hint,
  children,
  id,
  required,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  id: string;
  required?: boolean;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required && <span className="required"> *</span>}
      </label>
      {children}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
      {error && (
        <p className="field-error" role="alert" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
export function ErrorMessage({ message }: { message?: string }) {
  return message ? (
    <div role="alert" className="error-box">
      {message}
    </div>
  ) : null;
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={24} /> Memuat ruang kerja…
    </div>
  );
}
export function Empty({
  title = "Belum ada data",
  description = "Data yang sesuai akan muncul di sini.",
  children,
}: {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <FileSearch size={34} />
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function Badge({ report = false }: { report?: boolean }) {
  return (
    <span className={`badge ${report ? "green" : "amber"}`}>
      <i />
      {report ? "Laporan tersedia" : "Review"}
    </span>
  );
}
export function Pagination({
  page,
  setPage,
  count,
  size = 5,
}: {
  page: number;
  setPage: (page: number) => void;
  count: number;
  size?: number;
}) {
  const total = Math.max(1, Math.ceil(count / size));
  return (
    <div className="pagination">
      <span>
        {count === 0
          ? "0 data"
          : `${(page - 1) * size + 1}–${Math.min(page * size, count)} dari ${count} data`}
      </span>
      <div>
        <button
          className="icon-button"
          aria-label="Halaman sebelumnya"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          <ArrowLeft size={16} />
        </button>
        <span>
          {page} / {total}
        </span>
        <button
          className="icon-button"
          aria-label="Halaman berikutnya"
          disabled={page >= total}
          onClick={() => setPage(page + 1)}
        >
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
export function Confirm({
  title,
  description,
  onClose,
  onConfirm,
  label = "Hapus",
  destructive = true,
}: {
  title: string;
  description: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  label?: string;
  destructive?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
      aria-labelledby="confirm-title"
      className="modal"
    >
      <div className="modal-heading">
        <h2 id="confirm-title">{title}</h2>
        <button
          className="icon-button"
          aria-label="Tutup konfirmasi"
          disabled={busy}
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <p>{description}</p>
      <ErrorMessage message={error} />
      <div className="actions end">
        <button className="button secondary" disabled={busy} onClick={onClose}>
          Batal
        </button>
        <button
          className={`button ${destructive ? "danger" : "primary"}`}
          disabled={busy}
          onClick={async () => {
            if (busy) return;
            setBusy(true);
            try {
              await onConfirm();
              onClose();
            } catch (e) {
              setError(messageOf(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Memproses…" : label}
        </button>
      </div>
    </dialog>
  );
}
export function messageOf(e: unknown) {
  return e instanceof Error ? e.message : "Terjadi kesalahan. Coba lagi.";
}
export function DownloadButton({ id, name }: { id: string; name?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <span className="download-control">
      <button
        type="button"
        className="button secondary small"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const { meta, blob } = await repository.getFile(id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = meta.name;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          } catch (e) {
            setError(messageOf(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        <Download size={15} />
        {busy ? "Menyiapkan…" : (name ?? "Unduh")}
      </button>
      {error && (
        <small className="field-error" role="alert">
          {error}
        </small>
      )}
    </span>
  );
}
