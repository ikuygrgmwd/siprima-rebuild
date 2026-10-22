"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowUpRight, ShieldCheck, UserRound } from "lucide-react";
import { Brand } from "./brand";
import { Field, ErrorMessage, messageOf } from "./ui";
import { useDemo } from "./demo-provider";
import { emailSchema, passwordSchema, registrationSchema } from "@/lib/domain";
import { repository } from "@/lib/repository";

export function AuthScreen({ mode }: { mode: "login" | "register" | "reset" }) {
  const router = useRouter();
  const { run } = useDemo();
  const [error, setError] = useState("");
  const [quickBusy, setQuickBusy] = useState(false);
  const [token, setToken] = useState("");
  const [resetStage, setResetStage] = useState(false);
  const [done, setDone] = useState(false);
  const schema =
    mode === "register"
      ? registrationSchema
      : mode === "reset"
        ? z.object({
            email: emailSchema,
            password: resetStage ? passwordSchema : z.string(),
          })
        : z.object({ email: emailSchema, password: passwordSchema });
  type Values = {
    name?: string;
    email: string;
    phone?: string;
    address?: string;
    password: string;
  };
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: mode === "register" ? "" : "nadia@example.test",
      password: "demo12345",
      name: "",
      phone: "080000000003",
      address: "Jalan Contoh (data sintetis)",
    },
  });
  const busy = isSubmitting || quickBusy;
  async function submit(values: Values) {
    setError("");
    try {
      if (mode === "register") {
        await run(
          () => repository.register(registrationSchema.parse(values)),
          "Akun demo berhasil dibuat.",
        );
        router.push("/dashboard");
      } else if (mode === "login") {
        await run(() => repository.login(values.email, values.password));
        router.push("/dashboard");
      } else if (resetStage) {
        await run(() => repository.resetPassword(token, values.password));
        setDone(true);
      } else {
        setToken(await repository.requestReset(values.email));
      }
    } catch (e) {
      setError(messageOf(e));
    }
  }
  return (
    <main className="auth-layout">
      <aside className="auth-aside">
        <Brand light />
        <div>
          <span className="eyebrow">RUANG KERJA PENELITIAN</span>
          <h1>
            Gagasan baik
            <br />
            dimulai dari
            <br />
            <em>langkah kecil.</em>
          </h1>
          <p>Kelola perjalanan riset dan magang Anda bersama SIPRIMA.</p>
          <span className="auth-city">BAPPEDA KOTA BEKASI</span>
        </div>
        <small>Mode demo · Tanpa layanan eksternal</small>
      </aside>
      <section className="auth-main">
        <Link href="/" className="back-link">
          <ArrowLeft size={16} /> Kembali ke beranda
        </Link>
        <div className="auth-card">
          <span className="badge green">Mode demo</span>
          <h2>
            {mode === "login"
              ? "Selamat datang kembali"
              : mode === "register"
                ? "Buat akun demo"
                : "Reset sandi demo"}
          </h2>
          <p>
            {mode === "login"
              ? "Pilih peran untuk langsung menjelajahi SIPRIMA."
              : mode === "register"
                ? "Gunakan nama fiktif dan email contoh. Jangan gunakan sandi pribadi."
                : "Simulasi di browser ini. Tidak ada email yang dikirim."}
          </p>
          {mode === "login" && (
            <>
              <div className="demo-options">
                {(["pemohon", "admin"] as const).map((role) => (
                  <button
                    disabled={busy}
                    key={role}
                    onClick={async () => {
                      setQuickBusy(true);
                      setError("");
                      try {
                        await run(() => repository.loginDemo(role));
                        router.push("/dashboard");
                      } catch (e) {
                        setError(messageOf(e));
                      } finally {
                        setQuickBusy(false);
                      }
                    }}
                  >
                    <span>
                      {role === "pemohon" ? (
                        <UserRound size={22} />
                      ) : (
                        <ShieldCheck size={22} />
                      )}
                    </span>
                    <strong>Demo {role}</strong>
                    <small>
                      {role === "pemohon"
                        ? "Ajukan & kelola penelitian"
                        : "Kelola seluruh data"}
                    </small>
                    <ArrowUpRight size={17} />
                  </button>
                ))}
              </div>
              <div className="divider-text">atau masuk dengan akun demo</div>
            </>
          )}
          {done ? (
            <div className="success-box">
              <h3>Sandi demo diperbarui</h3>
              <p>Gunakan sandi baru untuk masuk ke akun demo.</p>
              <Link className="button primary" href="/masuk">
                Kembali masuk
              </Link>
            </div>
          ) : (
            <form noValidate onSubmit={handleSubmit(submit)}>
              {mode === "register" && (
                <Field
                  id="name"
                  label="Nama fiktif"
                  error={errors.name?.message}
                  required
                >
                  <input
                    id="name"
                    {...register("name")}
                    placeholder="Nama contoh"
                  />
                </Field>
              )}
              {!resetStage && (
                <Field
                  id="email"
                  label="Email demo"
                  error={errors.email?.message}
                  required
                >
                  <input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="nama@example.test"
                  />
                </Field>
              )}
              {mode === "register" && (
                <>
                  <Field
                    id="phone"
                    label="Telepon contoh"
                    error={errors.phone?.message}
                    required
                  >
                    <input id="phone" {...register("phone")} />
                  </Field>
                  <Field
                    id="address"
                    label="Alamat contoh"
                    error={errors.address?.message}
                    required
                  >
                    <input id="address" {...register("address")} />
                  </Field>
                </>
              )}
              {(mode !== "reset" || resetStage) && (
                <Field
                  id="password"
                  label={resetStage ? "Sandi demo baru" : "Sandi demo"}
                  error={errors.password?.message}
                  hint="Sandi awal akun contoh: demo12345. Jangan gunakan sandi pribadi."
                  required
                >
                  <input
                    id="password"
                    type="password"
                    autoComplete="off"
                    {...register("password")}
                  />
                </Field>
              )}
              <ErrorMessage message={error} />
              {token && !resetStage ? (
                <div className="success-box">
                  <strong>Tautan simulasi siap</strong>
                  <p>
                    Tautan ini hanya berlaku di browser ini selama 15 menit.
                    Tidak ada email yang dikirim.
                  </p>
                  <button
                    type="button"
                    className="button primary"
                    onClick={() => setResetStage(true)}
                  >
                    Buka tautan reset demo <ArrowUpRight size={16} />
                  </button>
                </div>
              ) : (
                <button className="button primary full" disabled={busy}>
                  {busy
                    ? "Memproses…"
                    : mode === "register"
                      ? "Buat akun demo"
                      : mode === "reset"
                        ? resetStage
                          ? "Simpan sandi baru"
                          : "Buat tautan reset demo"
                        : "Masuk ke ruang kerja"}
                  <ArrowRightIcon />
                </button>
              )}
            </form>
          )}
          <div className="auth-links">
            {mode === "login" ? (
              <>
                <Link href="/daftar">Buat akun demo</Link>
                <Link href="/reset-password">Lupa sandi demo?</Link>
              </>
            ) : (
              <Link href="/masuk">Sudah punya akun? Masuk</Link>
            )}
          </div>
          <p className="auth-disclaimer">
            Data disimpan pada browser ini. Gunakan dokumen contoh, bukan
            dokumen pribadi.
          </p>
        </div>
      </section>
    </main>
  );
}
function ArrowRightIcon() {
  return <ArrowUpRight size={17} />;
}
