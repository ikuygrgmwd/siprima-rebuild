"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="recovery">
      <h1>Halaman belum dapat ditampilkan</h1>
      <p>Data demo tetap tersimpan di browser. Silakan coba kembali.</p>
      <button className="button primary" onClick={reset}>
        Coba lagi
      </button>
    </main>
  );
}
