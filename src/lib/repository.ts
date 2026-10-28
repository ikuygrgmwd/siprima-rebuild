import {
  applicationSchema,
  attachmentKinds,
  emailSchema,
  jakartaDay,
  nextCode,
  passwordSchema,
  registrationSchema,
  userSchema,
  validateFile,
  internshipSchema,
  internshipManagementSchema,
  internshipAttachmentKinds,
  newsSchema,
  profileSchema,
  masterSchema,
} from "./domain";
import type {
  Application,
  ApplicationInput,
  AttachmentChanges,
  FileMeta,
  Purpose,
  RegistrationInput,
  Report,
  Role,
  Snapshot,
  User,
  UserInput,
  Internship,
  InternshipInput,
  InternshipManagement,
  InternshipAttachmentChanges,
  News,
  NewsInput,
  ProfileInput,
  MasterData,
  MasterKind,
  MasterInput,
} from "./domain";
import { sampleInput, samplePdf } from "./sample";
import { seedInternships } from "./internships";
import { seedNews } from "./news";
import { seedMasters, masterApplicationFields } from "./masters";

type StoredUser = User & { passwordDigest: string };
type State = MasterData & {
  version: 1 | 2 | 3 | 4 | 5;
  news: News[];
  internships: Internship[];
  users: StoredUser[];
  purposes: Purpose[];
  applications: Application[];
  reports: Report[];
  blobs: Record<string, Blob>;
  session: string | null;
  resets: Record<string, { userId: string; expires: number }>;
};
export interface ResearchRepository {
  snapshot(): Promise<Snapshot>;
  login(email: string, password: string): Promise<void>;
  loginDemo(role: Role): Promise<void>;
  logout(): Promise<void>;
  register(input: RegistrationInput): Promise<void>;
  requestReset(email: string): Promise<string>;
  resetPassword(token: string, password: string): Promise<void>;
  saveApplication(
    input: ApplicationInput,
    files: AttachmentChanges,
    id?: string,
  ): Promise<string>;
  deleteApplication(id: string): Promise<void>;
  addReport(applicationId: string, file: File): Promise<void>;
  deleteReport(id: string): Promise<void>;
  getFile(id: string): Promise<{ meta: FileMeta; blob: Blob }>;
  savePurpose(name: string, id?: string): Promise<void>;
  deletePurpose(id: string): Promise<void>;
  saveMaster(kind: MasterKind, input: MasterInput, id?: string): Promise<void>;
  deleteMaster(kind: MasterKind, id: string): Promise<void>;
  saveUser(input: UserInput, password?: string, id?: string): Promise<void>;
  deleteUser(id: string): Promise<void>;
  saveNews(input: NewsInput, id?: string): Promise<void>;
  deleteNews(id: string): Promise<void>;
  updateProfile(input: ProfileInput): Promise<void>;
  changePassword(current: string, next: string): Promise<void>;
  resetDemo(): Promise<void>;
  saveInternship(
    input: InternshipInput,
    id?: string,
    management?: InternshipManagement,
    files?: InternshipAttachmentChanges,
  ): Promise<string>;
  deleteInternship(id: string): Promise<void>;
}
const DB = "siprima-demo-v1";
async function digest(password: string) {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(password),
  );
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
async function seed(): Promise<State> {
  const passwordDigest = await digest("demo12345");
  const users: StoredUser[] = [
    {
      id: "admin",
      name: "Admin SIPRIMA",
      email: "admin@example.test",
      role: "admin",
      phone: "080000000000",
      address: "Kantor demo",
      active: true,
      passwordDigest,
    },
    {
      id: "nadia",
      name: "Nadia Pratama",
      email: "nadia@example.test",
      role: "pemohon",
      phone: "080000000001",
      address: sampleInput.address,
      active: true,
      passwordDigest,
    },
    {
      id: "raka",
      name: "Raka Mahardika",
      email: "raka@example.test",
      role: "pemohon",
      phone: "080000000002",
      address: "Jalan Simulasi 8 (data sintetis)",
      active: true,
      passwordDigest,
    },
  ];
  const titles = [
    sampleInput.title,
    "Literasi digital pada pelayanan masyarakat",
    "Pola mobilitas mahasiswa di kawasan perkotaan",
    "Pengelolaan sampah berbasis masyarakat",
    "Kajian aksesibilitas fasilitas publik",
    "Pengembangan ekonomi kreatif lokal",
    "Pemetaan kebutuhan layanan perpustakaan",
  ];
  const blob = samplePdf("Laporan penelitian contoh");
  const reportFile = {
    id: "seed-report-file",
    name: "laporan-contoh.pdf",
    type: blob.type,
    size: blob.size,
  };
  const applications: Application[] = titles.map((title, i) => ({
    ...sampleInput,
    title,
    id: `application-${i + 1}`,
    code: `REG202610${String(21 - i).padStart(2, "0")}00001`,
    ownerId: i === 6 ? "raka" : "nadia",
    applicantName: i === 6 ? users[2].name : users[1].name,
    email: i === 6 ? users[2].email : users[1].email,
    phone: i === 6 ? users[2].phone : users[1].phone,
    address: i === 6 ? users[2].address : users[1].address,
    purposeId: i % 2 ? "purpose-2" : "purpose-1",
    status: "Review",
    createdAt: `2026-10-${21 - i}T03:00:00Z`,
    updatedAt: `2026-10-${21 - i}T03:00:00Z`,
    attachments: {},
  }));
  return {
    version: 5,
    ...seedMasters(),
    news: seedNews(),
    internships: seedInternships(),
    users,
    purposes: [
      { id: "purpose-1", name: "Skripsi / tugas akhir" },
      { id: "purpose-2", name: "Penelitian akademik" },
      { id: "purpose-3", name: "Magang" },
    ],
    applications,
    reports: [
      {
        id: "report-1",
        applicationId: "application-2",
        ownerId: "nadia",
        createdAt: "2026-10-21T06:00:00Z",
        file: reportFile,
      },
    ],
    blobs: { [reportFile.id]: blob },
    session: null,
    resets: {},
  };
}
function connect(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined")
      return reject(
        new Error(
          "IndexedDB tidak tersedia. Buka preview di browser dengan penyimpanan diizinkan.",
        ),
      );
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore("state");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () =>
      reject(new Error("Penyimpanan browser tidak dapat dibuka."));
    req.onblocked = () =>
      reject(new Error("Tutup tab SIPRIMA lain lalu coba lagi."));
  });
}
// A read-modify-write transaction serializes writes across tabs. Metadata and files commit together.
async function transaction<T>(
  action: (state: State) => T,
  write = false,
): Promise<T> {
  const initial = await seed();
  const db = await connect();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("state", "readwrite");
    const store = tx.objectStore("state");
    let value: T;
    let failure: unknown;
    const req = store.get("current");
    req.onsuccess = () => {
      try {
        const state: State = req.result ?? initial;
        if (![1, 2, 3, 4, 5].includes(state.version))
          throw new Error(
            "Versi data demo tidak dikenali. Reset data demo untuk melanjutkan.",
          );
        const migrated = state.version !== 5;
        if (state.version === 1) {
          state.internships = seedInternships().filter((a) =>
            state.users.some((u) => u.id === a.ownerId),
          );
        }
        if (state.version < 3) {
          for (const item of state.internships) {
            const legacy = item as Internship & { campusLetter?: FileMeta };
            item.attachments ??= {};
            if (legacy.campusLetter)
              item.attachments.letter = legacy.campusLetter;
            delete legacy.campusLetter;
          }
          state.version = 3;
        }
        if (state.version === 3) {
          state.news = seedNews();
          state.version = 4;
        }
        if (state.version === 4) {
          Object.assign(state, seedMasters());
          state.version = 5;
        }
        value = action(state);
        if (write || !req.result || migrated) store.put(state, "current");
      } catch (error) {
        failure = error;
        tx.abort();
      }
    };
    tx.oncomplete = () => {
      db.close();
      resolve(value);
    };
    tx.onabort = tx.onerror = () => {
      db.close();
      reject(
        failure ??
          new Error(
            "Data gagal disimpan. Penyimpanan browser mungkin penuh atau diblokir.",
          ),
      );
    };
  });
}
function actor(s: State) {
  const u = s.users.find((u) => u.id === s.session && u.active);
  if (!u) throw new Error("Silakan masuk kembali.");
  return u;
}
function admin(s: State) {
  const u = actor(s);
  if (u.role !== "admin") throw new Error("Akses hanya untuk admin.");
  return u;
}
function owned(s: State, id: string) {
  const u = actor(s);
  const a = s.applications.find((a) => a.id === id);
  if (!a || (u.role !== "admin" && a.ownerId !== u.id))
    throw new Error("Pengajuan tidak ditemukan atau tidak dapat diakses.");
  return a;
}
function publicUser(u: StoredUser): User {
  const { passwordDigest: _digest, ...safe } = u;
  void _digest;
  return safe;
}
function fileMeta(file: File): FileMeta {
  return {
    id: crypto.randomUUID(),
    name: file.name,
    type: file.type,
    size: file.size,
  };
}
function checkFile(file: File) {
  const error = validateFile(file);
  if (error) throw new Error(error);
}
function removeReport(s: State, r: Report) {
  delete s.blobs[r.file.id];
  s.reports = s.reports.filter((v) => v.id !== r.id);
}
export const repository: ResearchRepository = {
  saveMaster: (kind, input, id) =>
    transaction((s) => {
      admin(s);
      const parsed = masterSchema.parse(input);
      const data = {
        name: parsed.name,
        ...(kind === "villages" ? { districtId: parsed.districtId } : {}),
      };
      const item = id ? s[kind].find((record) => record.id === id) : undefined;
      if (id && !item) throw new Error("Data master tidak ditemukan.");
      if (kind === "villages") {
        if (!s.districts.some((d) => d.id === data.districtId))
          throw new Error("Pilih kecamatan yang tersedia.");
        if (item && item.districtId !== data.districtId &&
            s.applications.some((a) => a.villageId === item.id))
          throw new Error("Kelurahan masih digunakan oleh pengajuan; kecamatannya tidak dapat dipindah.");
      }
      if (s[kind].some((record) => record.id !== id &&
          record.name.toLocaleLowerCase("id-ID") === data.name.toLocaleLowerCase("id-ID") &&
          (kind !== "villages" || record.districtId === data.districtId)))
        throw new Error("Nama sudah tersedia pada master ini.");
      if (item) Object.assign(item, data);
      else s[kind].push({ ...data, id: crypto.randomUUID() });
    }, true),
  deleteMaster: (kind, id) =>
    transaction((s) => {
      admin(s);
      if (!s[kind].some((record) => record.id === id))
        throw new Error("Data master tidak ditemukan.");
      if (s.applications.some((a) => a[masterApplicationFields[kind]] === id))
        throw new Error("Data masih digunakan oleh pengajuan dan tidak dapat dihapus.");
      if (kind === "districts" && s.villages.some((v) => v.districtId === id))
        throw new Error("Kecamatan masih memiliki kelurahan dan tidak dapat dihapus.");
      s[kind] = s[kind].filter((record) => record.id !== id);
    }, true),
  saveNews: (input, id) =>
    transaction((s) => {
      admin(s);
      const data = newsSchema.parse(input);
      const now = new Date().toISOString();
      if (id) {
        const item = s.news.find((n) => n.id === id);
        if (!item) throw new Error("Berita tidak ditemukan.");
        Object.assign(item, data, { updatedAt: now });
      } else {
        s.news.push({
          ...data,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        });
      }
    }, true),
  deleteNews: (id) =>
    transaction((s) => {
      admin(s);
      if (!s.news.some((n) => n.id === id))
        throw new Error("Berita tidak ditemukan.");
      s.news = s.news.filter((n) => n.id !== id);
    }, true),
  updateProfile: (input) =>
    transaction((s) => {
      const user = actor(s);
      const data = profileSchema.parse(input);
      if (s.users.some((u) => u.id !== user.id && u.email === data.email))
        throw new Error("Email sudah digunakan.");
      Object.assign(user, data);
    }, true),
  changePassword: async (current, next) => {
    const currentHash = await digest(current);
    const nextHash = await digest(passwordSchema.parse(next));
    await transaction((s) => {
      const user = actor(s);
      if (user.passwordDigest !== currentHash)
        throw new Error("Kata sandi saat ini tidak sesuai.");
      if (currentHash === nextHash)
        throw new Error("Gunakan kata sandi yang berbeda dari sebelumnya.");
      user.passwordDigest = nextHash;
      for (const token of Object.keys(s.resets)) {
        if (s.resets[token].userId === user.id) delete s.resets[token];
      }
    }, true);
  },
  snapshot: () =>
    transaction((s) => {
      const user = s.users.find((u) => u.id === s.session && u.active) ?? null;
      const applications = user
        ? s.applications
            .filter((a) => user.role === "admin" || a.ownerId === user.id)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        : [];
      return {
        user: user ? publicUser(user) : null,
        news: user
          ? s.news
              .filter((n) => user.role === "admin" || n.active)
              .sort(
                (a, b) =>
                  a.order - b.order ||
                  a.createdAt.localeCompare(b.createdAt) ||
                  a.id.localeCompare(b.id),
              )
          : [],
        users: user?.role === "admin" ? s.users.map(publicUser) : [],
        purposes: user ? s.purposes : [],
        opds: user ? s.opds : [],
        districts: user ? s.districts : [],
        villages: user ? s.villages : [],
        applications,
        internships: user
          ? s.internships
              .filter((a) => user.role === "admin" || a.ownerId === user.id)
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          : [],
        reports: s.reports.filter((r) =>
          applications.some((a) => a.id === r.applicationId),
        ),
      };
    }),
  login: async (email, password) => {
    const hash = await digest(password);
    await transaction((s) => {
      const u = s.users.find(
        (u) =>
          u.email === email.trim().toLowerCase() &&
          u.passwordDigest === hash &&
          u.active,
      );
      if (!u)
        throw new Error(
          "Email atau sandi demo tidak sesuai, atau akun tidak aktif.",
        );
      s.session = u.id;
    }, true);
  },
  loginDemo: (role) =>
    transaction((s) => {
      const id = role === "admin" ? "admin" : "nadia";
      const u = s.users.find((u) => u.id === id && u.active);
      if (!u)
        throw new Error(
          "Akun demo ini tidak aktif. Reset data demo untuk memulihkan.",
        );
      s.session = id;
    }, true),
  logout: () =>
    transaction((s) => {
      s.session = null;
    }, true),
  register: async (input) => {
    const data = registrationSchema.parse(input);
    const hash = await digest(data.password);
    await transaction((s) => {
      if (s.users.some((u) => u.email === data.email))
        throw new Error("Email sudah digunakan.");
      const { password: _password, ...profile } = data;
      void _password;
      const id = crypto.randomUUID();
      s.users.push({
        ...profile,
        id,
        role: "pemohon",
        active: true,
        passwordDigest: hash,
      });
      s.session = id;
    }, true);
  },
  requestReset: (email) =>
    transaction((s) => {
      const address = emailSchema.parse(email);
      const u = s.users.find((u) => u.email === address && u.active);
      if (!u)
        throw new Error("Akun demo aktif dengan email ini tidak ditemukan.");
      const token = crypto.randomUUID();
      for (const [key, reset] of Object.entries(s.resets))
        if (reset.userId === u.id || reset.expires < Date.now())
          delete s.resets[key];
      s.resets[token] = { userId: u.id, expires: Date.now() + 15 * 60 * 1000 };
      return token;
    }, true),
  resetPassword: async (token, password) => {
    const hash = await digest(passwordSchema.parse(password));
    await transaction((s) => {
      const reset = s.resets[token];
      const u = s.users.find((u) => u.id === reset?.userId && u.active);
      if (!reset || reset.expires < Date.now() || !u)
        throw new Error("Tautan reset tidak valid atau kedaluwarsa.");
      u.passwordDigest = hash;
      delete s.resets[token];
      s.session = null;
    }, true);
  },
  saveApplication: async (input, files, id) => {
    const data = applicationSchema.parse(input);
    for (const file of Object.values(files)) if (file) checkFile(file);
    return transaction((s) => {
      const u = actor(s);
      if (!s.purposes.some((p) => p.id === data.purposeId))
        throw new Error("Tujuan penelitian tidak tersedia.");
      if (data.opdId && !s.opds.some((o) => o.id === data.opdId))
        throw new Error("OPD tujuan tidak tersedia. Pilih kembali OPD.");
      if (data.districtId && !s.districts.some((d) => d.id === data.districtId))
        throw new Error("Kecamatan tidak tersedia. Pilih kembali kecamatan.");
      if (data.villageId && !s.villages.some((v) =>
          v.id === data.villageId && v.districtId === data.districtId))
        throw new Error("Kelurahan tidak tersedia pada kecamatan yang dipilih.");
      const now = new Date().toISOString();
      const a = id
        ? owned(s, id)
        : ({
            ...data,
            id: crypto.randomUUID(),
            code: nextCode(s.applications, jakartaDay()),
            ownerId: u.id,
            status: "Review" as const,
            createdAt: now,
            updatedAt: now,
            attachments: {},
          } as Application);
      Object.assign(a, data, { updatedAt: now });
      for (const kind of attachmentKinds)
        if (files[kind] !== undefined) {
          const old = a.attachments[kind];
          if (old) delete s.blobs[old.id];
          const file = files[kind];
          if (file) {
            const meta = fileMeta(file);
            s.blobs[meta.id] = file;
            a.attachments[kind] = meta;
          } else delete a.attachments[kind];
        }
      if (!id) s.applications.push(a);
      return a.id;
    }, true);
  },
  deleteApplication: (id) =>
    transaction((s) => {
      const a = owned(s, id);
      Object.values(a.attachments).forEach((f) => delete s.blobs[f.id]);
      s.reports
        .filter((r) => r.applicationId === id)
        .forEach((r) => removeReport(s, r));
      s.applications = s.applications.filter((a) => a.id !== id);
    }, true),
  addReport: async (id, file) => {
    checkFile(file);
    await transaction((s) => {
      const a = owned(s, id);
      const meta = fileMeta(file);
      s.blobs[meta.id] = file;
      s.reports.push({
        id: crypto.randomUUID(),
        applicationId: a.id,
        ownerId: a.ownerId,
        createdAt: new Date().toISOString(),
        file: meta,
      });
    }, true);
  },
  deleteReport: (id) =>
    transaction((s) => {
      const r = s.reports.find((r) => r.id === id);
      if (!r) throw new Error("Laporan tidak ditemukan.");
      owned(s, r.applicationId);
      removeReport(s, r);
    }, true),
  getFile: (id) =>
    transaction((s) => {
      const internship = s.internships.find((a) =>
        Object.values(a.attachments ?? {}).some((f) => f.id === id),
      );
      if (internship) {
        const u = actor(s);
        if (u.role !== "admin" && internship.ownerId !== u.id)
          throw new Error("Berkas magang tidak dapat diakses.");
        const meta = Object.values(internship.attachments ?? {}).find(
          (f) => f.id === id,
        )!;
        if (!s.blobs[id]) throw new Error("Berkas tidak tersedia.");
        return { meta, blob: s.blobs[id] };
      }
      const a = s.applications.find((a) =>
        Object.values(a.attachments).some((f) => f.id === id),
      );
      const r = s.reports.find((r) => r.file.id === id);
      const record = owned(s, a?.id ?? r?.applicationId ?? "");
      const meta =
        r?.file ?? Object.values(record.attachments).find((f) => f.id === id);
      if (!meta || !s.blobs[id]) throw new Error("Berkas tidak tersedia.");
      return { meta, blob: s.blobs[id] };
    }),
  savePurpose: (name, id) =>
    transaction((s) => {
      admin(s);
      const clean = name.trim();
      if (!clean || clean.length > 150)
        throw new Error("Isi nama tujuan, maksimum 150 karakter.");
      if (
        s.purposes.some(
          (p) => p.id !== id && p.name.toLowerCase() === clean.toLowerCase(),
        )
      )
        throw new Error("Tujuan sudah tersedia.");
      if (id) {
        const p = s.purposes.find((p) => p.id === id);
        if (!p) throw new Error("Tujuan tidak ditemukan.");
        p.name = clean;
      } else s.purposes.push({ id: crypto.randomUUID(), name: clean });
    }, true),
  deletePurpose: (id) =>
    transaction((s) => {
      admin(s);
      if (s.applications.some((a) => a.purposeId === id))
        throw new Error(
          "Tujuan masih digunakan oleh pengajuan dan tidak dapat dihapus.",
        );
      s.purposes = s.purposes.filter((p) => p.id !== id);
    }, true),
  saveUser: async (input, password, id) => {
    const data = userSchema.parse(input);
    const hash = password
      ? await digest(passwordSchema.parse(password))
      : undefined;
    await transaction((s) => {
      const current = admin(s);
      if (s.users.some((u) => u.id !== id && u.email === data.email))
        throw new Error("Email sudah digunakan.");
      if (id === current.id && (!data.active || data.role !== "admin"))
        throw new Error(
          "Tidak dapat menonaktifkan atau menurunkan peran akun sendiri.",
        );
      if (id) {
        const u = s.users.find((u) => u.id === id);
        if (!u) throw new Error("Akun tidak ditemukan.");
        Object.assign(u, data, hash ? { passwordDigest: hash } : {});
      } else {
        if (!hash) throw new Error("Sandi demo wajib diisi untuk akun baru.");
        s.users.push({
          ...data,
          id: crypto.randomUUID(),
          passwordDigest: hash,
        });
      }
    }, true);
  },
  deleteUser: (id) =>
    transaction((s) => {
      const u = admin(s);
      if (u.id === id) throw new Error("Tidak dapat menghapus akun sendiri.");
      if (
        s.applications.some((a) => a.ownerId === id) ||
        s.internships.some((a) => a.ownerId === id)
      )
        throw new Error(
          "Akun masih memiliki pengajuan penelitian atau magang. Nonaktifkan akun atau hapus pengajuannya terlebih dahulu.",
        );
      s.users = s.users.filter((u) => u.id !== id);
      for (const [token, reset] of Object.entries(s.resets))
        if (reset.userId === id) delete s.resets[token];
    }, true),
  saveInternship: async (input, id, management, files = {}) => {
    const fields = internshipSchema.parse(input);
    if (
      Object.keys(files).some(
        (key) => !internshipAttachmentKinds.some((kind) => kind === key),
      )
    )
      throw new Error("Jenis berkas magang tidak dikenal.");
    for (const file of Object.values(files)) if (file) checkFile(file);
    const controls = management
      ? internshipManagementSchema.parse(management)
      : undefined;
    return transaction((s) => {
      const u = actor(s);
      if (controls && u.role !== "admin")
        throw new Error("Status dan pembimbing hanya dapat diatur admin.");
      const previous = id ? s.internships.find((a) => a.id === id) : undefined;
      if (
        id &&
        (!previous || (u.role !== "admin" && previous.ownerId !== u.id))
      )
        throw new Error(
          "Pendaftaran tidak ditemukan atau tidak dapat diakses.",
        );
      if (previous && u.role !== "admin" && previous.status !== "Diajukan")
        throw new Error(
          "Pendaftaran sudah diproses. Hubungi admin untuk perubahan.",
        );
      const now = new Date().toISOString();
      const record: Internship = previous ?? {
        ...fields,
        id: crypto.randomUUID(),
        ownerId: u.id,
        code: nextCode(
          s.internships.map((a) => ({ code: a.code.replace(/^MAG/, "REG") })),
          jakartaDay(),
        ).replace(/^REG/, "MAG"),
        status: "Diajukan",
        mentor: "",
        note: "",
        createdAt: now,
        updatedAt: now,
        history: [],
      };
      const nextStatus = controls?.status ?? record.status;
      if (!previous || nextStatus !== previous.status)
        record.history.push({ status: nextStatus, at: now, by: u.name });
      Object.assign(record, fields, controls, { updatedAt: now });
      // Commit all file changes atomically; untouched sections retain their saved bytes.
      record.attachments ??= {};
      for (const kind of internshipAttachmentKinds) {
        const file = files[kind];
        if (file === undefined) continue;
        const previousFile = record.attachments[kind];
        if (previousFile) delete s.blobs[previousFile.id];
        if (file) {
          const meta = fileMeta(file);
          s.blobs[meta.id] = file;
          record.attachments[kind] = meta;
        } else delete record.attachments[kind];
      }
      if (!previous) s.internships.push(record);
      return record.id;
    }, true);
  },
  deleteInternship: (id) =>
    transaction((s) => {
      admin(s);
      const record = s.internships.find((a) => a.id === id);
      if (!record) throw new Error("Pendaftaran tidak ditemukan.");
      Object.values(record.attachments ?? {}).forEach(
        (f) => delete s.blobs[f.id],
      );
      s.internships = s.internships.filter((a) => a.id !== id);
    }, true),
  resetDemo: async () => {
    const fresh = await seed();
    const db = await connect();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("state", "readwrite");
      tx.objectStore("state").put(fresh, "current");
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onabort = tx.onerror = () => {
        db.close();
        reject(new Error("Reset gagal. Periksa izin penyimpanan browser."));
      };
    });
  },
};
