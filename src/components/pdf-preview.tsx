"use client";
import { useEffect, useRef, useState } from "react";
import type {
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  RenderTask,
} from "pdfjs-dist";
import { ErrorMessage, messageOf } from "./ui";

export function PdfPreview({ blob }: { blob: Blob }) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    let cancelled = false;
    let task: PDFDocumentLoadingTask | undefined;
    void Promise.all([import("pdfjs-dist"), blob.arrayBuffer()])
      .then(async ([pdfjs, bytes]) => {
        if (cancelled) return;
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
        task = pdfjs.getDocument({
          data: new Uint8Array(bytes),
          useSystemFonts: true,
        });
        const loaded = await task.promise;
        if (!cancelled) setDocument(loaded);
      })
      .catch((e) => {
        if (!cancelled)
          setError(`PDF tidak dapat ditampilkan: ${messageOf(e)}`);
      });
    return () => {
      cancelled = true;
      void task?.destroy();
    };
  }, [blob]);
  if (error) return <ErrorMessage message={error} />;
  if (!document) return <p role="status">Menyiapkan pratinjau PDF…</p>;
  return (
    <div className="intern-pdf-viewer">
      <div className="intern-pdf-toolbar">
        <button
          type="button"
          className="button secondary small"
          disabled={page <= 1}
          onClick={() => setPage((v) => v - 1)}
        >
          Halaman sebelumnya
        </button>
        <span aria-live="polite">
          {page} / {document.numPages}
        </span>
        <button
          type="button"
          className="button secondary small"
          disabled={page >= document.numPages}
          onClick={() => setPage((v) => v + 1)}
        >
          Halaman berikutnya
        </button>
      </div>
      <PdfPage key={page} document={document} page={page} />
    </div>
  );
}

function PdfPage({
  document,
  page,
}: {
  document: PDFDocumentProxy;
  page: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    let task: RenderTask | undefined;
    void document
      .getPage(page)
      .then(async (pdfPage) => {
        const canvas = ref.current;
        if (cancelled || !canvas) return;
        const base = pdfPage.getViewport({ scale: 1 });
        const viewport = pdfPage.getViewport({
          scale: Math.min(2, 1600 / Math.max(base.width, base.height)),
        });
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        task = pdfPage.render({ canvas, viewport });
        await task.promise;
        if (!cancelled) setReady(true);
      })
      .catch((e) => {
        if (!cancelled) setError(messageOf(e));
      });
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [document, page]);
  return (
    <>
      <ErrorMessage message={error} />
      {!ready && !error && <p role="status">Memuat halaman…</p>}
      <canvas
        ref={ref}
        role="img"
        aria-label={`Pratinjau PDF halaman ${page}`}
        style={{ display: ready ? "block" : "none" }}
      />
    </>
  );
}
