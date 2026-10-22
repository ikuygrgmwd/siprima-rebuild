"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { Purpose, User } from "@/lib/domain";
import { passwordSchema, userSchema } from "@/lib/domain";
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

export function Purposes() {
  const { data, run } = useDemo();
  const [editing, setEditing] = useState<Purpose | "new" | null>(null);
  const [deleting, setDeleting] = useState<Purpose | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const rows = data!.purposes.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()),
  );
  const safePage = Math.min(page, Math.max(1, Math.ceil(rows.length / 5)));
  return (
    <>
      <PageHeading
        eyebrow="ADMINISTRASI"
        title="Tujuan penelitian"
        description="Kelola pilihan tujuan pada formulir pengajuan penelitian."
      >
        <button className="button primary" onClick={() => setEditing("new")}>
          <Plus size={17} />
          Tambah tujuan
        </button>
      </PageHeading>
      {editing && (
        <PurposeForm
          key={typeof editing === "string" ? "new" : editing.id}
          purpose={typeof editing === "string" ? undefined : editing}
          close={() => setEditing(null)}
        />
      )}
      <section className="card">
        <div className="table-toolbar">
          <div className="search-field">
            <Search size={18} />
            <input
              aria-label="Cari tujuan"
              placeholder="Cari tujuan penelitian…"
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
                  <th>Nama tujuan</th>
                  <th>Jumlah pengajuan</th>
                  <th className="align-right">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice((safePage - 1) * 5, safePage * 5).map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                    </td>
                    <td>
                      {
                        data!.applications.filter((a) => a.purposeId === p.id)
                          .length
                      }{" "}
                      pengajuan
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          aria-label={`Edit ${p.name}`}
                          className="button secondary small"
                          onClick={() => setEditing(p)}
                        >
                          <Pencil size={15} />
                          Edit
                        </button>
                        <button
                          aria-label={`Hapus ${p.name}`}
                          className="icon-button delete"
                          onClick={() => setDeleting(p)}
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
          <Empty title="Tujuan tidak ditemukan" />
        )}
        <Pagination page={safePage} count={rows.length} setPage={setPage} />
      </section>
      {deleting && (
        <Confirm
          title="Hapus tujuan penelitian?"
          description={`Tujuan “${deleting.name}” hanya dapat dihapus jika tidak digunakan oleh pengajuan.`}
          onClose={() => setDeleting(null)}
          onConfirm={() =>
            run(
              () => repository.deletePurpose(deleting.id),
              "Tujuan berhasil dihapus.",
            )
          }
        />
      )}
    </>
  );
}
function PurposeForm({
  purpose,
  close,
}: {
  purpose?: Purpose;
  close: () => void;
}) {
  const { run } = useDemo();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ name: string }>({
    resolver: zodResolver(
      z.object({
        name: z
          .string()
          .trim()
          .min(1, "Nama tujuan wajib diisi.")
          .max(150, "Maksimum 150 karakter."),
      }),
    ),
    defaultValues: { name: purpose?.name ?? "" },
  });
  return (
    <form
      className="card admin-form"
      noValidate
      onSubmit={handleSubmit(async (values) => {
        try {
          setError("");
          await run(
            () => repository.savePurpose(values.name, purpose?.id),
            "Tujuan penelitian berhasil disimpan.",
          );
          close();
        } catch (e) {
          setError(messageOf(e));
        }
      })}
    >
      <h2>{purpose ? "Edit tujuan" : "Tambah tujuan"}</h2>
      <Field
        id="purpose-name"
        label="Nama tujuan penelitian"
        error={errors.name?.message}
        required
      >
        <input
          autoFocus
          id="purpose-name"
          disabled={isSubmitting}
          {...register("name")}
        />
      </Field>
      <ErrorMessage message={error} />
      <div className="actions">
        <button className="button primary" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan…" : "Simpan tujuan"}
        </button>
        <button
          type="button"
          className="button secondary"
          disabled={isSubmitting}
          onClick={close}
        >
          Batal
        </button>
      </div>
    </form>
  );
}
export function Accounts() {
  const { data, run } = useDemo();
  const [editing, setEditing] = useState<User | "new" | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const rows = data!.users.filter(
    (u) =>
      `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase()) &&
      (!role || u.role === role),
  );
  const safePage = Math.min(page, Math.max(1, Math.ceil(rows.length / 5)));
  return (
    <>
      <PageHeading
        eyebrow="ADMINISTRASI"
        title="Pengelolaan akun"
        description="Kelola akun, peran, dan status aktif pengguna demo."
      >
        <button className="button primary" onClick={() => setEditing("new")}>
          <Plus size={17} />
          Tambah akun
        </button>
      </PageHeading>
      {editing && (
        <AccountForm
          key={typeof editing === "string" ? "new" : editing.id}
          user={typeof editing === "string" ? undefined : editing}
          close={() => setEditing(null)}
        />
      )}
      <section className="card">
        <div className="table-toolbar">
          <div className="search-field">
            <Search size={18} />
            <input
              aria-label="Cari akun"
              placeholder="Cari nama atau email…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            aria-label="Filter peran"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Semua peran</option>
            <option value="admin">Admin</option>
            <option value="pemohon">Pemohon</option>
          </select>
        </div>
        {rows.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Pengguna</th>
                  <th>Peran</th>
                  <th>Status</th>
                  <th className="align-right">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice((safePage - 1) * 5, safePage * 5).map((u) => (
                  <tr key={u.id}>
                    <td className="account-name">
                      <strong>{u.name}</strong>
                      <small>{u.email}</small>
                    </td>
                    <td className="capitalize">{u.role}</td>
                    <td>
                      <span className={`badge ${u.active ? "green" : "gray"}`}>
                        <i />
                        {u.active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          aria-label={`Edit ${u.name}`}
                          className="button secondary small"
                          onClick={() => setEditing(u)}
                        >
                          <Pencil size={15} />
                          Edit
                        </button>
                        <button
                          aria-label={`Hapus ${u.name}`}
                          className="icon-button delete"
                          onClick={() => setDeleting(u)}
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
          <Empty title="Akun tidak ditemukan" />
        )}
        <Pagination page={safePage} count={rows.length} setPage={setPage} />
      </section>
      {deleting && (
        <Confirm
          title="Hapus akun?"
          description={`Hapus akun ${deleting.name}. Akun yang masih memiliki pengajuan tidak dapat dihapus; gunakan status nonaktif.`}
          onClose={() => setDeleting(null)}
          onConfirm={() =>
            run(
              () => repository.deleteUser(deleting.id),
              "Akun berhasil dihapus.",
            )
          }
        />
      )}
    </>
  );
}
const accountSchema = userSchema.extend({
  password: z.union([z.literal(""), passwordSchema]),
});
function AccountForm({ user, close }: { user?: User; close: () => void }) {
  const { run } = useDemo();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: user
      ? { ...user, password: "" }
      : {
          name: "",
          email: "",
          phone: "080000000004",
          address: "Alamat contoh",
          role: "pemohon",
          active: true,
          password: "demo12345",
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
            () =>
              repository.saveUser(
                values,
                values.password || undefined,
                user?.id,
              ),
            "Akun berhasil disimpan.",
          );
          close();
        } catch (e) {
          setError(messageOf(e));
        }
      })}
    >
      <h2>{user ? "Edit akun" : "Tambah akun demo"}</h2>
      <fieldset disabled={isSubmitting} className="form-fieldset">
        <div className="form-grid">
          {(
            [
              { key: "name", label: "Nama fiktif", type: "text" },
              { key: "email", label: "Email demo", type: "email" },
              { key: "phone", label: "Telepon contoh", type: "tel" },
              { key: "address", label: "Alamat contoh", type: "text" },
            ] as const
          ).map((f) => (
            <Field
              id={`account-${f.key}`}
              key={f.key}
              label={f.label}
              error={errors[f.key]?.message}
              required
            >
              <input
                id={`account-${f.key}`}
                type={f.type}
                {...register(f.key)}
              />
            </Field>
          ))}
          <Field
            id="account-role"
            label="Peran"
            error={errors.role?.message}
            required
          >
            <select id="account-role" {...register("role")}>
              <option value="pemohon">Pemohon</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          <Field
            id="account-password"
            label="Sandi demo"
            error={errors.password?.message}
            hint={
              user
                ? "Kosongkan untuk mempertahankan sandi."
                : "Gunakan sandi fiktif, minimal 8 karakter."
            }
          >
            <input
              id="account-password"
              type="password"
              autoComplete="off"
              {...register("password")}
            />
          </Field>
        </div>
        <label className="checkbox-label">
          <input type="checkbox" {...register("active")} />
          Akun aktif
        </label>
        <ErrorMessage message={error} />
        <div className="actions">
          <button className="button primary" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan…" : "Simpan akun"}
          </button>
          <button type="button" className="button secondary" onClick={close}>
            Batal
          </button>
        </div>
      </fieldset>
    </form>
  );
}
