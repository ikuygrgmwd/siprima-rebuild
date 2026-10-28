"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LockKeyhole, UserRound } from "lucide-react";
import { passwordSchema, profileSchema, type ProfileInput } from "@/lib/domain";
import { repository } from "@/lib/repository";
import { useDemo } from "./demo-provider";
import { PageHeading } from "./page-heading";
import { ErrorMessage, Field, messageOf } from "./ui";

const changeSchema = z
  .object({
    current: z.string().min(1, "Isi kata sandi saat ini."),
    next: passwordSchema,
    confirmation: z.string().min(1, "Ulangi kata sandi baru."),
  })
  .refine((v) => v.next === v.confirmation, {
    path: ["confirmation"],
    message: "Konfirmasi kata sandi tidak sama.",
  });

export function AccountSettings() {
  const { data } = useDemo();
  const [section, setSection] = useState<"profile" | "password">("profile");
  const user = data!.user!;
  return (
    <>
      <PageHeading
        eyebrow="AKUN SAYA"
        title="Pengaturan akun"
        description="Kelola informasi profil dan kata sandi akun Anda."
      />
      <div className="settings-layout">
        <aside
          className="card settings-nav"
          aria-label="Bagian pengaturan akun"
        >
          <div className="settings-identity">
            <span className="user-avatar">
              {user.name
                .split(" ")
                .slice(0, 2)
                .map((s) => s[0])
                .join("")}
            </span>
            <strong>{user.name}</strong>
            <small>{user.role === "admin" ? "Administrator" : "Pemohon"}</small>
          </div>
          <button
            className={section === "profile" ? "active" : ""}
            aria-pressed={section === "profile"}
            onClick={() => setSection("profile")}
          >
            <UserRound size={18} /> Profil saya
          </button>
          <button
            className={section === "password" ? "active" : ""}
            aria-pressed={section === "password"}
            onClick={() => setSection("password")}
          >
            <LockKeyhole size={18} /> Kata sandi
          </button>
        </aside>
        {section === "profile" ? <ProfileForm /> : <PasswordForm />}
      </div>
    </>
  );
}

function ProfileForm() {
  const { data, run } = useDemo();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: data!.user!,
  });
  return (
    <form
      className="card admin-form settings-form"
      noValidate
      onSubmit={handleSubmit(async (values) => {
        setError("");
        try {
          await run(
            () => repository.updateProfile(values),
            "Profil berhasil diperbarui.",
          );
          reset(values);
        } catch (e) {
          setError(messageOf(e));
        }
      })}
    >
      <h2>Profil saya</h2>
      <p className="settings-description">
        Informasi ini digunakan untuk mengenali akun Anda. Data pada pengajuan
        sebelumnya tetap tersimpan.
      </p>
      <fieldset className="form-fieldset" disabled={isSubmitting}>
        <div className="form-grid">
          {(
            [
              {
                name: "name",
                label: "Nama lengkap",
                type: "text",
                autoComplete: "name",
              },
              {
                name: "email",
                label: "Email",
                type: "email",
                autoComplete: "email",
              },
              {
                name: "phone",
                label: "Nomor telepon",
                type: "tel",
                autoComplete: "tel",
              },
              {
                name: "address",
                label: "Alamat",
                type: "text",
                autoComplete: "street-address",
              },
            ] as const
          ).map((f) => (
            <Field
              key={f.name}
              id={`profile-${f.name}`}
              label={f.label}
              error={errors[f.name]?.message}
              required
            >
              <input
                id={`profile-${f.name}`}
                type={f.type}
                autoComplete={f.autoComplete}
                {...register(f.name)}
              />
            </Field>
          ))}
        </div>
        <ErrorMessage message={error} />
        <div className="actions">
          <button className="button primary" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan…" : "Simpan profil"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}

function PasswordForm() {
  const { run } = useDemo();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof changeSchema>>({
    resolver: zodResolver(changeSchema),
    defaultValues: { current: "", next: "", confirmation: "" },
  });
  return (
    <form
      className="card admin-form settings-form"
      noValidate
      onSubmit={handleSubmit(async (values) => {
        setError("");
        try {
          await run(
            () => repository.changePassword(values.current, values.next),
            "Kata sandi berhasil diperbarui.",
          );
          reset();
        } catch (e) {
          setError(messageOf(e));
        }
      })}
    >
      <h2>Ubah kata sandi</h2>
      <p className="settings-description">
        Gunakan minimal 8 karakter. Untuk mode demo, gunakan kata sandi fiktif.
      </p>
      <fieldset className="form-fieldset" disabled={isSubmitting}>
        {(
          [
            {
              name: "current",
              label: "Kata sandi saat ini",
              autoComplete: "current-password",
            },
            {
              name: "next",
              label: "Kata sandi baru",
              autoComplete: "new-password",
            },
            {
              name: "confirmation",
              label: "Konfirmasi kata sandi baru",
              autoComplete: "new-password",
            },
          ] as const
        ).map((f) => (
          <Field
            key={f.name}
            id={`password-${f.name}`}
            label={f.label}
            error={errors[f.name]?.message}
            required
          >
            <input
              id={`password-${f.name}`}
              type="password"
              autoComplete={f.autoComplete}
              {...register(f.name)}
            />
          </Field>
        ))}
        <ErrorMessage message={error} />
        <div className="actions">
          <button className="button primary" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan…" : "Simpan kata sandi"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
