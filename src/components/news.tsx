"use client";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Newspaper,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  newsSchema,
  formatDate,
  type News,
  type NewsInput,
} from "@/lib/domain";
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

export function NewsCarousel() {
  const { data } = useDemo();
  const [selected, setSelected] = useState<string | null>(null);
  const articles = data!.news.filter((n) => n.active);
  const index = Math.max(
    0,
    articles.findIndex((n) => n.id === selected),
  );
  const article = articles[index];
  if (!article)
    return (
      <section className="card">
        <Empty
          title="Belum ada berita"
          description="Berita dan informasi terbaru akan ditampilkan di sini."
        />
      </section>
    );
  function move(delta: number) {
    setSelected(
      articles[(index + delta + articles.length) % articles.length].id,
    );
  }
  return (
    <section
      className={`welcome-banner news-carousel news-${article.theme}`}
      aria-label="Berita SIPRIMA"
      aria-roledescription="carousel"
    >
      <div className="news-slide" aria-live="polite" aria-atomic="true">
        <div
          role="group"
          aria-roledescription="slide"
          aria-label={`${index + 1} dari ${articles.length}`}
        >
          <span className="eyebrow">KABAR SIPRIMA / {article.category}</span>
          <h2>{article.title}</h2>
          <p>{article.summary}</p>
          <Link href={`/berita/${article.id}`} className="button white">
            Baca berita <ArrowRight size={17} />
          </Link>
        </div>
      </div>
      <div className="banner-illustration" aria-hidden="true">
        <div className="banner-circle" />
        <div className="mini-sheet">
          <Newspaper size={34} />
          <span />
          <span />
          <span />
          <b>KABAR SIPRIMA</b>
        </div>
        <div className="mini-badge">
          <span>✓</span> Informasi untuk langkah Anda
        </div>
        <span className="banner-star">✳</span>
      </div>
      <div className="carousel-controls">
        <span className="carousel-count">
          {String(index + 1).padStart(2, "0")}{" "}
          <span>/ {String(articles.length).padStart(2, "0")}</span>
        </span>
        <div className="carousel-arrows">
          <button
            className="carousel-arrow"
            aria-label="Berita sebelumnya"
            disabled={articles.length < 2}
            onClick={() => move(-1)}
          >
            <ChevronLeft size={21} />
          </button>
          <button
            className="carousel-arrow"
            aria-label="Berita berikutnya"
            disabled={articles.length < 2}
            onClick={() => move(1)}
          >
            <ChevronRight size={21} />
          </button>
        </div>
      </div>
    </section>
  );
}

export function NewsDetail({ id }: { id: string }) {
  const { data } = useDemo();
  const article = data!.news.find((n) => n.id === id);
  if (!article)
    return (
      <Empty
        title="Berita tidak tersedia"
        description="Berita ini telah dihapus atau belum ditayangkan."
      >
        <Link href="/dashboard" className="button secondary">
          Kembali ke dashboard
        </Link>
      </Empty>
    );
  return (
    <>
      <Link href="/dashboard" className="text-link">
        <ArrowLeft size={16} /> Kembali ke dashboard
      </Link>
      <article className="card news-article">
        <span className="eyebrow">
          {article.category} · {formatDate(article.createdAt)}
        </span>
        {!article.active && (
          <p className="subtle-note">Draf — hanya terlihat oleh admin.</p>
        )}
        <h1>{article.title}</h1>
        <p className="news-lead">{article.summary}</p>
        <div className="news-body">{article.content}</div>
      </article>
    </>
  );
}

export function NewsMaster() {
  const { data, run } = useDemo();
  const [editing, setEditing] = useState<News | "new" | null>(null);
  const [deleting, setDeleting] = useState<News | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const rows = data!.news.filter((n) =>
    `${n.title} ${n.category}`.toLowerCase().includes(query.toLowerCase()),
  );
  const safePage = Math.min(page, Math.max(1, Math.ceil(rows.length / 5)));
  return (
    <>
      <PageHeading
        eyebrow="ADMINISTRASI"
        title="Master carousel"
        description="Kelola berita yang tampil pada carousel dashboard. Urutan terkecil tampil lebih dahulu."
      >
        <button className="button primary" onClick={() => setEditing("new")}>
          <Plus size={17} /> Tambah berita
        </button>
      </PageHeading>
      {editing && (
        <NewsForm
          key={editing === "new" ? "new" : editing.id}
          article={editing === "new" ? undefined : editing}
          nextOrder={Math.min(
            99999,
            Math.max(0, ...data!.news.map((n) => n.order)) + 1,
          )}
          close={() => setEditing(null)}
        />
      )}
      <section className="card">
        <div className="table-toolbar">
          <div className="search-field">
            <Search size={18} />
            <input
              aria-label="Cari berita"
              placeholder="Cari judul atau kategori…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
        {rows.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Urutan</th>
                  <th>Berita</th>
                  <th>Status</th>
                  <th className="align-right">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice((safePage - 1) * 5, safePage * 5).map((n) => (
                  <tr key={n.id}>
                    <td>{n.order}</td>
                    <td className="news-table-title">
                      <Link href={`/berita/${n.id}`}>
                        <strong>{n.title}</strong>
                      </Link>
                      <small>{n.category}</small>
                    </td>
                    <td>
                      <span className={`badge ${n.active ? "green" : "amber"}`}>
                        {n.active ? "Tayang" : "Draf"}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="button secondary small"
                          aria-label={`Edit ${n.title}`}
                          onClick={() => setEditing(n)}
                        >
                          <Pencil size={15} /> Edit
                        </button>
                        <button
                          className="icon-button delete"
                          aria-label={`Hapus ${n.title}`}
                          onClick={() => setDeleting(n)}
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
            title="Belum ada berita yang sesuai"
            description="Tambahkan berita baru atau ubah pencarian."
          />
        )}
        <Pagination page={safePage} count={rows.length} setPage={setPage} />
      </section>
      {deleting && (
        <Confirm
          title="Hapus berita?"
          description={`Berita “${deleting.title}” akan dihapus dari master dan carousel dashboard.`}
          onClose={() => setDeleting(null)}
          onConfirm={() =>
            run(
              () => repository.deleteNews(deleting.id),
              "Berita berhasil dihapus.",
            )
          }
        />
      )}
    </>
  );
}

function NewsForm({
  article,
  nextOrder,
  close,
}: {
  article?: News;
  nextOrder: number;
  close: () => void;
}) {
  const { run } = useDemo();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewsInput>({
    resolver: zodResolver(newsSchema),
    defaultValues: article ?? {
      title: "",
      category: "Kabar SIPRIMA",
      summary: "",
      content: "",
      theme: "teal",
      order: nextOrder,
      active: true,
    },
  });
  return (
    <form
      className="card admin-form"
      noValidate
      onSubmit={handleSubmit(async (values) => {
        setError("");
        try {
          await run(
            () => repository.saveNews(values, article?.id),
            "Berita berhasil disimpan.",
          );
          close();
        } catch (e) {
          setError(messageOf(e));
        }
      })}
    >
      <h2>{article ? "Edit berita" : "Tambah berita"}</h2>
      <fieldset className="form-fieldset" disabled={isSubmitting}>
        <Field
          id="news-title"
          label="Judul berita"
          error={errors.title?.message}
          required
        >
          <input id="news-title" maxLength={120} {...register("title")} />
        </Field>
        <div className="form-grid">
          <Field
            id="news-category"
            label="Kategori"
            error={errors.category?.message}
            required
          >
            <input
              id="news-category"
              maxLength={40}
              {...register("category")}
            />
          </Field>
          <Field
            id="news-order"
            label="Urutan tampil"
            error={errors.order?.message}
            required
          >
            <input
              id="news-order"
              type="number"
              min={1}
              max={99999}
              {...register("order", { valueAsNumber: true })}
            />
          </Field>
          <Field
            id="news-theme"
            label="Warna carousel"
            error={errors.theme?.message}
          >
            <select id="news-theme" {...register("theme")}>
              <option value="teal">Hijau SIPRIMA</option>
              <option value="blue">Biru</option>
              <option value="amber">Cokelat keemasan</option>
            </select>
          </Field>
        </div>
        <Field
          id="news-summary"
          label="Ringkasan carousel"
          hint="Maksimum 280 karakter."
          error={errors.summary?.message}
          required
        >
          <textarea
            id="news-summary"
            rows={3}
            maxLength={280}
            {...register("summary")}
          />
        </Field>
        <Field
          id="news-content"
          label="Isi berita"
          error={errors.content?.message}
          required
        >
          <textarea
            id="news-content"
            rows={7}
            maxLength={10000}
            {...register("content")}
          />
        </Field>
        <label className="checkbox-label">
          <input type="checkbox" {...register("active")} /> Tampilkan di
          carousel dashboard
        </label>
        <ErrorMessage message={error} />
        <div className="actions">
          <button className="button primary" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan…" : "Simpan berita"}
          </button>
          <button type="button" className="button secondary" onClick={close}>
            Batal
          </button>
        </div>
      </fieldset>
    </form>
  );
}
