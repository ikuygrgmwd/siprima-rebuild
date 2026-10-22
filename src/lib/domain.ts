import { z } from "zod";

export type Role = "admin" | "pemohon";
export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: Role;
  active: boolean;
};
export type Purpose = { id: string; name: string };
const text = z
  .string()
  .trim()
  .min(1, "Wajib diisi.")
  .max(500, "Maksimum 500 karakter.");
const date = z
  .string()
  .refine(
    (v) =>
      /^\d{4}-\d{2}-\d{2}$/.test(v) &&
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
    "Tanggal tidak valid.",
  );
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Format email tidak valid.");
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[+\d][\d\s()-]{7,19}$/, "Gunakan nomor telepon 8–20 karakter.");
export const applicationSchema = z
  .object({
    applicantName: text,
    purposeId: text,
    email: emailSchema,
    phone: phoneSchema,
    address: text,
    title: text,
    supervisor: text,
    institution: text,
    location: text,
    startDate: date,
    endDate: date,
    letterNumber: text,
    letterDate: date,
  })
  .refine((v) => v.endDate >= v.startDate, {
    path: ["endDate"],
    message: "Tanggal selesai harus sama atau setelah tanggal mulai.",
  });
export type ApplicationInput = z.infer<typeof applicationSchema>;
export const attachmentKinds = [
  "letter",
  "identity",
  "proposal",
  "internship",
  "statement",
] as const;
export type AttachmentKind = (typeof attachmentKinds)[number];
export const attachmentLabels: Record<AttachmentKind, string> = {
  letter: "Surat pengantar",
  identity: "KTP (contoh sintetis)",
  proposal: "Proposal penelitian",
  internship: "Persetujuan izin magang",
  statement: "Surat pernyataan",
};
export type FileMeta = { id: string; name: string; type: string; size: number };
export type Application = ApplicationInput & {
  id: string;
  code: string;
  ownerId: string;
  status: "Review";
  createdAt: string;
  updatedAt: string;
  attachments: Partial<Record<AttachmentKind, FileMeta>>;
};
export type Report = {
  id: string;
  applicationId: string;
  ownerId: string;
  createdAt: string;
  file: FileMeta;
};
export type Snapshot = {
  user: User | null;
  users: User[];
  purposes: Purpose[];
  applications: Application[];
  reports: Report[];
};
export type AttachmentChanges = Partial<Record<AttachmentKind, File | null>>;
export const userSchema = z.object({
  name: text,
  email: emailSchema,
  phone: phoneSchema,
  address: text,
  role: z.enum(["admin", "pemohon"]),
  active: z.boolean(),
});
export type UserInput = z.infer<typeof userSchema>;
export const passwordSchema = z
  .string()
  .min(8, "Gunakan minimal 8 karakter untuk sandi demo.")
  .max(100);
export const registrationSchema = userSchema
  .pick({ name: true, email: true, phone: true, address: true })
  .extend({ password: passwordSchema });
export type RegistrationInput = z.infer<typeof registrationSchema>;
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export function validateFile(
  file: Pick<File, "name" | "size" | "type">,
): string | null {
  if (file.size === 0) return "Berkas kosong tidak dapat diunggah.";
  if (file.size > MAX_FILE_SIZE) return "Ukuran berkas maksimum 5 MiB.";
  const extension = file.name.split(".").pop()?.toLowerCase();
  const allowed: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
  };
  if (!extension || !allowed[extension] || file.type !== allowed[extension])
    return "Gunakan berkas PDF, JPG, atau PNG dengan tipe yang sesuai.";
  return null;
}
export function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}
export function jakartaDay(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function nextCode(items: Pick<Application, "code">[], day: string) {
  const prefix = `REG${day.replaceAll("-", "")}`;
  const max = items
    .filter((a) => a.code.startsWith(prefix))
    .reduce((n, a) => Math.max(n, Number(a.code.slice(prefix.length)) || 0), 0);
  return `${prefix}${String(max + 1).padStart(5, "0")}`;
}
