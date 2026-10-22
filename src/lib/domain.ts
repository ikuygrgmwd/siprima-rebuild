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
  internships: Internship[];
};
export const internshipStatuses = [
  "Diajukan",
  "Diterima",
  "Aktif",
  "Selesai",
  "Ditolak",
  "Mengundurkan diri",
] as const;
export const internshipUnits = [
  "Perencanaan & evaluasi",
  "Data & inovasi",
  "Administrasi & pelayanan",
] as const;
export const internshipPrograms = [
  "Magang riset",
  "Praktik kerja lapangan",
  "Magang mandiri",
] as const;
export const internshipLevels = ["SMA / SMK", "D3", "D4 / S1", "S2"] as const;
export const internshipSchema = z
  .object({
    applicantName: text,
    email: emailSchema,
    phone: phoneSchema,
    institution: text,
    studentNumber: text,
    major: text,
    level: z.enum(internshipLevels),
    program: z.enum(internshipPrograms),
    unit: z.enum(internshipUnits),
    startDate: date,
    endDate: date,
    motivation: z
      .string()
      .trim()
      .min(1, "Wajib diisi.")
      .max(2000, "Maksimum 2.000 karakter."),
  })
  .refine((v) => v.endDate >= v.startDate, {
    path: ["endDate"],
    message: "Tanggal selesai harus sama atau setelah tanggal mulai.",
  });
export const internshipManagementSchema = z
  .object({
    status: z.enum(internshipStatuses),
    mentor: z.string().trim().max(150, "Maksimum 150 karakter."),
    note: z.string().trim().max(2000, "Maksimum 2.000 karakter."),
  })
  .refine(
    (v) => !["Aktif", "Selesai"].includes(v.status) || v.mentor.length > 0,
    {
      path: ["mentor"],
      message: "Isi pembimbing untuk peserta aktif atau selesai.",
    },
  );
export type InternshipInput = z.infer<typeof internshipSchema>;
export type InternshipManagement = z.infer<typeof internshipManagementSchema>;
export const internshipAttachmentKinds = [
  "transcript",
  "photo",
  "supporting",
  "proposal",
  "cv",
  "letter",
  "statement",
] as const;
export type InternshipAttachmentKind =
  (typeof internshipAttachmentKinds)[number];
export type InternshipAttachmentChanges = Partial<
  Record<InternshipAttachmentKind, File | null>
>;
export const internshipAttachmentLabels: Record<
  InternshipAttachmentKind,
  string
> = {
  transcript: "Transkrip",
  photo: "Foto",
  supporting: "File pendukung lainnya",
  proposal: "Proposal",
  cv: "Daftar Riwayat Hidup",
  letter: "Surat Pengantar",
  statement: "Surat Pernyataan",
};
export function formatFileSize(bytes: number) {
  const value = bytes / (1024 * 1024);
  return value > 0 && value < 0.01
    ? "< 0,01 MiB"
    : `${value.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MiB`;
}
export type Internship = InternshipInput &
  InternshipManagement & {
    attachments?: Partial<Record<InternshipAttachmentKind, FileMeta>>;
    id: string;
    code: string;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
    history: {
      status: InternshipManagement["status"];
      at: string;
      by: string;
    }[];
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
