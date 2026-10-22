import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  ArrowRight,
  FileText,
  FolderOpen,
  Download,
  FlaskConical,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { Brand } from "@/components/brand";
export default function Home() {
  return (
    <div className="landing">
      <header className="public-header">
        <Brand />
        <nav aria-label="Navigasi publik">
          <a href="#layanan">Layanan</a>
          <a href="#panduan">Panduan</a>
          <a href="#kontak">Kontak</a>
        </nav>
        <Link className="button primary" href="/masuk">
          Masuk <ArrowUpRight size={17} />
        </Link>
      </header>
      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="status-dot" /> BAPPEDA KOTA BEKASI
            </div>
            <h1>
              Langkah awal
              <br />
              untuk riset yang
              <br />
              <em>berarti.</em>
            </h1>
            <p>
              Sistem Informasi Perizinan Riset dan Magang.
              <br />
              Ajukan penelitian, kelola dokumen, dan unggah laporan dalam satu
              tempat.
            </p>
            <div className="actions">
              <Link href="/masuk" className="button primary large">
                Mulai pengajuan <ArrowUpRight size={19} />
              </Link>
              <a href="#panduan" className="text-link">
                Pelajari alurnya <ArrowRight size={17} />
              </a>
            </div>
            <div className="hero-note">
              <ShieldCheck size={17} />
              <span>Mode demo · Coba dengan data dan dokumen sintetis</span>
            </div>
          </div>
          <div
            className="hero-art"
            aria-label="Ilustrasi ruang kerja penelitian"
          >
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-label">
              <FlaskConical size={19} /> Ruang untuk gagasan baru
            </div>
            <div className="paper-card back" />
            <div className="paper-card">
              <span className="paper-logo">
                <LayersMark />
              </span>
              <span className="eyebrow">SIPRIMA / PENELITIAN</span>
              <h3>
                Riset hari ini.
                <br />
                Dampak esok hari.
              </h3>
              <div className="paper-line" />
              <div className="paper-line short" />
              <div className="paper-divider" />
              <div className="paper-check">
                <span>✓</span> Data penelitian
              </div>
              <div className="paper-check">
                <span>✓</span> Dokumen pendukung
              </div>
              <div className="paper-check">
                <span>✓</span> Laporan penelitian
              </div>
              <div className="paper-footer">
                KOTA BEKASI <ArrowUpRight size={20} />
              </div>
            </div>
            <div className="floating-note">
              <span>
                <FolderOpen size={22} />
              </span>
              <div>
                <strong>Terhubung dalam satu tempat</strong>
                <small>Pengajuan hingga laporan</small>
              </div>
            </div>
          </div>
        </section>
        <section className="service-strip" id="layanan">
          <div>
            <span className="eyebrow">LAYANAN SIPRIMA</span>
            <h2>
              Lebih tertata.
              <br />
              Lebih mudah.
            </h2>
          </div>
          {[
            {
              icon: FileText,
              title: "Pengajuan penelitian",
              text: "Lengkapi identitas, rencana penelitian, dan dokumen pendukung.",
            },
            {
              icon: FolderOpen,
              title: "Pengelolaan laporan",
              text: "Simpan laporan sesuai kode pengajuan penelitian Anda.",
            },
            {
              icon: Download,
              title: "Akses dokumen",
              text: "Temukan dan unduh kembali laporan yang telah diunggah.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <article key={title}>
              <Icon size={25} />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </section>
        <section className="guide-section" id="panduan">
          <div>
            <span className="eyebrow">PANDUAN SINGKAT</span>
            <h2>
              Dari gagasan
              <br />
              ke pengajuan.
            </h2>
            <p>
              Siapkan data penelitian Anda.
              <br />
              Untuk mencoba, gunakan contoh yang tersedia.
            </p>
            <Link href="/masuk" className="text-link">
              Jelajahi mode demo <ArrowRight size={17} />
            </Link>
          </div>
          <ol>
            {[
              [
                "01",
                "Masuk ke ruang kerja",
                "Pilih demo pemohon atau buat akun dengan identitas fiktif.",
              ],
              [
                "02",
                "Lengkapi pengajuan",
                "Isi rencana penelitian dan tambahkan lampiran contoh.",
              ],
              [
                "03",
                "Kelola dan unggah laporan",
                "Periksa detail, perbarui data, lalu unggah laporan sesuai kode pengajuan.",
              ],
            ].map(([n, title, text]) => (
              <li key={n}>
                <span>{n}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section className="contact-section" id="kontak">
          <div>
            <span className="eyebrow">INFORMASI LAYANAN</span>
            <h2>SIPRIMA Kota Bekasi</h2>
            <p>
              <MapPin size={18} /> Bappeda Kota Bekasi
            </p>
            <p>
              Kontak resmi belum tersedia pada referensi aplikasi. Email, nomor
              telepon, dan alamat layanan akan ditampilkan setelah dikonfirmasi.
            </p>
            <small>
              Preview ini tidak mengirim email atau menerima permohonan layanan
              resmi.
            </small>
          </div>
          <Image
            src="/siprima-reference.png"
            width={556}
            height={236}
            alt="Identitas SIPRIMA dari aplikasi lama: Sistem Informasi Perizinan Riset dan Magang, Bappeda Kota Bekasi"
          />
        </section>
      </main>
      <footer className="public-footer">
        <Brand />
        <span>Preview SIPRIMA · Seluruh data contoh bersifat sintetis</span>
        <Link href="/masuk">
          Buka ruang kerja <ArrowUpRight size={15} />
        </Link>
      </footer>
    </div>
  );
}
function LayersMark() {
  return <FlaskConical size={28} />;
}
