"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Download,
  FileText,
  FolderOpen,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  RotateCcw,
  Target,
  Users,
  X,
} from "lucide-react";
import { useDemo } from "./demo-provider";
import { Brand } from "./brand";
import { Badge, Confirm, Empty, ErrorMessage, Loading, messageOf } from "./ui";
import { repository } from "@/lib/repository";
import { formatDate } from "@/lib/domain";
import {
  ApplicationList,
  ApplicationDetail,
  ApplicationForm,
} from "./research";
import { Reports } from "./reports";
import { Accounts, Purposes } from "./administration";
import { PageHeading } from "./page-heading";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pengajuan", label: "Pengajuan penelitian", icon: FileText },
  { href: "/laporan", label: "Laporan penelitian", icon: FolderOpen },
  { href: "/unduhan", label: "Unduh laporan", icon: Download },
];
export function Portal() {
  const path = usePathname();
  const router = useRouter();
  const { data, error, refresh, run } = useDemo();
  const [menu, setMenu] = useState(false);
  const [reset, setReset] = useState(false);
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (data && !data.user) router.replace("/masuk");
  }, [data, router]);
  if (error)
    return (
      <main className="recovery">
        <h1>Penyimpanan demo belum siap</h1>
        <ErrorMessage message={error} />
        <div className="actions">
          <button className="button primary" onClick={() => void refresh()}>
            Coba lagi
          </button>
          <button className="button secondary" onClick={() => setReset(true)}>
            Reset data demo
          </button>
        </div>
        {reset && (
          <Confirm
            title="Reset seluruh data demo?"
            description="Seluruh data dan berkas pada browser ini akan diganti dengan contoh awal."
            label="Reset data"
            onClose={() => setReset(false)}
            onConfirm={async () => {
              await run(() => repository.resetDemo());
              router.replace("/masuk");
            }}
          />
        )}
      </main>
    );
  if (!data?.user) return <Loading />;
  const user = data.user;
  const isAdmin = user.role === "admin";
  const title =
    [
      ...navigation,
      { href: "/akun", label: "Pengelolaan akun" },
      { href: "/tujuan", label: "Tujuan penelitian" },
    ].find((n) => path.startsWith(n.href))?.label ?? "Halaman";
  const parts = path.split("/").filter(Boolean);
  let content: React.ReactNode;
  if (path === "/dashboard") content = <Dashboard />;
  else if (path === "/pengajuan") content = <ApplicationList />;
  else if (path === "/pengajuan/baru") content = <ApplicationForm />;
  else if (
    parts[0] === "pengajuan" &&
    parts.length === 3 &&
    parts[2] === "edit"
  )
    content = <ApplicationForm id={parts[1]} />;
  else if (parts[0] === "pengajuan" && parts.length === 2)
    content = <ApplicationDetail id={parts[1]} />;
  else if (path === "/laporan" || path === "/unduhan")
    content = <Reports downloadOnly={path === "/unduhan"} />;
  else if (path === "/akun" || path === "/tujuan")
    content = isAdmin ? (
      path === "/akun" ? (
        <Accounts />
      ) : (
        <Purposes />
      )
    ) : (
      <Empty
        title="Akses khusus admin"
        description="Akun pemohon tidak memiliki akses ke administrasi."
      />
    );
  else
    content = (
      <Empty title="Halaman tidak ditemukan">
        <Link className="button primary" href="/dashboard">
          Kembali ke dashboard
        </Link>
      </Empty>
    );
  return (
    <div className="portal">
      <a className="skip-link" href="#main">
        Lewati ke konten
      </a>
      {menu && (
        <button
          className="sidebar-overlay"
          aria-label="Tutup menu"
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <div className="sidebar-brand">
          <Brand />
          <button
            className="mobile-only icon-button"
            aria-label="Tutup menu"
            onClick={() => setMenu(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace-label">
          RUANG KERJA <span>{isAdmin ? "ADMIN" : "PEMOHON"}</span>
        </div>
        <nav aria-label="Navigasi ruang kerja">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={path.startsWith(href) ? "page" : undefined}
              className={path.startsWith(href) ? "active" : ""}
              onClick={() => setMenu(false)}
            >
              <Icon size={19} />
              {label}
              {href === "/pengajuan" && (
                <span className="nav-count">{data.applications.length}</span>
              )}
            </Link>
          ))}
          {isAdmin && (
            <>
              <div className="nav-section">ADMINISTRASI</div>
              <Link
                href="/akun"
                className={path === "/akun" ? "active" : ""}
                onClick={() => setMenu(false)}
              >
                <Users size={19} />
                Pengelolaan akun
              </Link>
              <Link
                href="/tujuan"
                className={path === "/tujuan" ? "active" : ""}
                onClick={() => setMenu(false)}
              >
                <Target size={19} />
                Tujuan penelitian
              </Link>
            </>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-mark">?</span>
            <h4>Baru menggunakan SIPRIMA?</h4>
            <p>Kenali alur pengajuan dan dokumen yang perlu disiapkan.</p>
            <Link href="/#panduan">
              Lihat panduan <ArrowUpRight size={15} />
            </Link>
          </div>
          <button className="reset-button" onClick={() => setReset(true)}>
            <RotateCcw size={16} />
            Reset data demo
          </button>
          <div className="sidebar-footer">SIPRIMA · Kota Bekasi</div>
        </div>
      </aside>
      <div className="portal-body">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-only"
              aria-label="Buka menu"
              onClick={() => setMenu(true)}
            >
              <Menu size={22} />
            </button>
            <Home size={16} />
            <ChevronRight size={14} />
            <span>{title}</span>
          </div>
          <div className="topbar-right">
            <span className="demo-pill">
              <span />
              Mode demo
            </span>
            <div className="user-avatar">
              {user.name
                .split(" ")
                .slice(0, 2)
                .map((v) => v[0])
                .join("")}
            </div>
            <div className="user-summary">
              <strong>{user.name}</strong>
              <small>{isAdmin ? "Administrator" : "Pemohon"}</small>
            </div>
            <button
              title="Keluar"
              aria-label="Keluar"
              className="icon-button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await run(() => repository.logout());
                  router.push("/masuk");
                } catch (e) {
                  setActionError(messageOf(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main id="main" className="main-content">
          <ErrorMessage message={actionError} />
          <div key={`${path}-${user.id}`}>{content}</div>
        </main>
        <footer className="app-footer">
          <span>Sistem Informasi Perizinan Riset dan Magang</span>
          <span>Data sintetis · Tersimpan di browser ini</span>
        </footer>
      </div>
      {reset && (
        <Confirm
          title="Reset seluruh data demo?"
          description="Semua akun tambahan, pengajuan, dan berkas contoh pada browser ini akan dihapus. Anda akan keluar dan kembali ke data awal."
          label="Reset data demo"
          onClose={() => setReset(false)}
          onConfirm={async () => {
            await run(
              () => repository.resetDemo(),
              "Data demo dikembalikan ke kondisi awal.",
            );
            router.push("/masuk");
          }}
        />
      )}
    </div>
  );
}
function Dashboard() {
  const { data } = useDemo();
  const { user, applications, reports } = data!;
  const withReports = new Set(reports.map((r) => r.applicationId)).size;
  return (
    <>
      <PageHeading
        eyebrow="RUANG KERJA SIPRIMA"
        title={`Selamat datang, ${user!.name.split(" ")[0]}.`}
        description={
          user!.role === "admin"
            ? "Ringkasan pengajuan dan laporan dari seluruh pemohon demo."
            : "Mari lanjutkan langkah penelitian Anda hari ini."
        }
      >
        <span className="date-label">
          {formatDate(new Date().toISOString())}
        </span>
      </PageHeading>
      <section className="welcome-banner">
        <div>
          <span className="eyebrow">DARI GAGASAN MENJADI KONTRIBUSI</span>
          <h2>
            Penelitian Anda,
            <br />
            langkah baik untuk kota.
          </h2>
          <p>
            Mulai pengajuan dan kelola seluruh dokumen penelitian
            <br className="desktop-only" /> dengan lebih mudah, dalam satu ruang
            kerja.
          </p>
          <Link href="/pengajuan/baru" className="button white">
            Buat pengajuan <Plus size={18} />
          </Link>
        </div>
        <div className="banner-illustration" aria-hidden="true">
          <div className="banner-circle" />
          <div className="mini-sheet">
            <FileText size={34} />
            <span />
            <span />
            <span />
            <b>RISET & MAGANG</b>
          </div>
          <div className="mini-badge">
            <span>✓</span> Satu tempat, lebih tertata
          </div>
          <span className="banner-star">✳</span>
        </div>
      </section>
      <section className="stats-grid" aria-label="Ringkasan data">
        {[
          {
            label: "Total pengajuan",
            value: applications.length,
            icon: FileText,
            note: "Seluruh pengajuan penelitian",
            color: "teal",
          },
          {
            label: "Dalam review",
            value: applications.length,
            icon: FolderOpen,
            note: "Status awal pengajuan",
            color: "amber",
          },
          {
            label: "Laporan tersedia",
            value: withReports,
            icon: Download,
            note: "Pengajuan dengan laporan",
            color: "blue",
          },
        ].map(({ label, value, icon: Icon, note, color }) => (
          <article className="stat-card" key={label}>
            <div>
              <span>{label}</span>
              <span className={`stat-icon ${color}`}>
                <Icon size={20} />
              </span>
            </div>
            <strong>{String(value).padStart(2, "0")}</strong>
            <small>{note}</small>
          </article>
        ))}
      </section>
      <div className="dashboard-columns">
        <section className="card recent-card">
          <div className="card-heading">
            <div>
              <h2>Pengajuan terbaru</h2>
              <p>Ringkasan aktivitas penelitian Anda.</p>
            </div>
            <Link className="text-link" href="/pengajuan">
              Lihat semua <ArrowRight size={16} />
            </Link>
          </div>
          {applications.length ? (
            <div className="recent-list">
              {applications.slice(0, 3).map((a) => (
                <Link
                  className="recent-item"
                  key={a.id}
                  href={`/pengajuan/${a.id}`}
                >
                  <span className="document-icon">
                    <FileText size={22} />
                  </span>
                  <div>
                    <small>{a.code}</small>
                    <h3>{a.title}</h3>
                    <span>{formatDate(a.createdAt)}</span>
                  </div>
                  <Badge />
                  <ChevronRight size={18} />
                </Link>
              ))}
            </div>
          ) : (
            <Empty
              title="Mulai penelitian pertama Anda"
              description="Buat pengajuan untuk melihat aktivitas di sini."
            />
          )}
        </section>
        <section className="card checklist-card">
          <div className="card-heading">
            <div>
              <h2>Siapkan sebelum mengajukan</h2>
              <p>Informasi yang perlu Anda lengkapi.</p>
            </div>
          </div>
          <ol>
            {[
              "Identitas dan kontak pemohon",
              "Tujuan dan rencana penelitian",
              "Informasi surat pengantar",
              "Lampiran pendukung (opsional)",
            ].map((item, i) => (
              <li key={item}>
                <span>{i + 1}</span>
                {item}
              </li>
            ))}
          </ol>
          <div className="subtle-note">
            Gunakan tombol <strong>Isi data contoh</strong> pada formulir untuk
            mencoba lebih cepat.
          </div>
        </section>
      </div>
      <div className="demo-info">
        <span className="status-dot" />
        <p>
          <strong>Anda berada dalam mode demo.</strong> Perubahan tersimpan di
          browser ini. Status Review merupakan status awal; tidak ada proses
          persetujuan pada preview.
        </p>
      </div>
    </>
  );
}
