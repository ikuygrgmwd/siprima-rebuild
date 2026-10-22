import "fake-indexeddb/auto";
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { repository } from "../src/lib/repository";
import {
  applicationSchema,
  MAX_FILE_SIZE,
  nextCode,
  validateFile,
} from "../src/lib/domain";
import { sampleFile, sampleInput } from "../src/lib/sample";

beforeEach(async () => {
  await repository.resetDemo();
});

test("pemohon cannot read, change, delete or attach reports to someone else's application", async () => {
  await repository.loginDemo("pemohon");
  assert.equal((await repository.snapshot()).applications.length, 6);
  assert.equal((await repository.snapshot()).users.length, 0);
  await assert.rejects(
    repository.saveApplication(sampleInput, {}, "application-7"),
    /tidak ditemukan|diakses/,
  );
  await assert.rejects(
    repository.deleteApplication("application-7"),
    /tidak ditemukan|diakses/,
  );
  await assert.rejects(
    repository.addReport("application-7", sampleFile()),
    /tidak ditemukan|diakses/,
  );
  await assert.rejects(repository.savePurpose("Tidak boleh"), /admin/);
  await assert.rejects(repository.deleteUser("raka"), /admin/);
});

test("application, edited values, attachment and report bytes survive reopening the database", async () => {
  await repository.loginDemo("pemohon");
  const file = sampleFile("lampiran-uji");
  const id = await repository.saveApplication(sampleInput, { letter: file });
  const a = (await repository.snapshot()).applications.find(
    (a) => a.id === id,
  )!;
  assert.match(a.code, /^REG\d{13}$/);
  assert.equal(
    await (await repository.getFile(a.attachments.letter!.id)).blob.text(),
    await file.text(),
  );
  await repository.saveApplication(
    { ...sampleInput, title: "Judul diperbarui" },
    {},
    id,
  );
  await repository.addReport(id, sampleFile("laporan-uji"));
  await repository.logout();
  await assert.rejects(repository.getFile(a.attachments.letter!.id), /masuk/);
  await repository.login("nadia@example.test", "demo12345");
  const snapshot = await repository.snapshot();
  assert.equal(
    snapshot.applications.find((a) => a.id === id)!.title,
    "Judul diperbarui",
  );
  const report = snapshot.reports.find((r) => r.applicationId === id)!;
  assert.match(
    await (await repository.getFile(report.file.id)).blob.text(),
    /^%PDF/,
  );
  await repository.login("raka@example.test", "demo12345");
  await assert.rejects(repository.getFile(report.file.id), /diakses/);
  await assert.rejects(repository.getFile(a.attachments.letter!.id), /diakses/);
  await assert.rejects(repository.deleteReport(report.id), /diakses/);
  await repository.loginDemo("admin");
  await repository.deleteApplication(id);
  assert.ok(
    !(await repository.snapshot()).reports.some((r) => r.applicationId === id),
  );
  await assert.rejects(repository.getFile(report.file.id));
});

test("validation rejects invalid dates, email, empty and oversized or disguised files", () => {
  assert.equal(
    applicationSchema.safeParse({ ...sampleInput, email: "invalid" }).success,
    false,
  );
  assert.equal(
    applicationSchema.safeParse({ ...sampleInput, endDate: "2026-01-01" })
      .success,
    false,
  );
  assert.equal(
    applicationSchema.safeParse({ ...sampleInput, letterDate: "2026-02-30" })
      .success,
    false,
  );
  assert.match(
    validateFile({ name: "bad.exe", type: "application/pdf", size: 10 })!,
    /PDF/,
  );
  assert.match(
    validateFile({ name: "bad.pdf", type: "text/html", size: 10 })!,
    /tipe/,
  );
  assert.match(
    validateFile({ name: "empty.pdf", type: "application/pdf", size: 0 })!,
    /kosong/,
  );
  assert.match(
    validateFile({
      name: "huge.pdf",
      type: "application/pdf",
      size: MAX_FILE_SIZE + 1,
    })!,
    /5 MiB/,
  );
});

test("invalid file prevents any partial application or blob write", async () => {
  await repository.loginDemo("pemohon");
  const before = (await repository.snapshot()).applications.length;
  await assert.rejects(
    repository.saveApplication(sampleInput, {
      letter: sampleFile(),
      proposal: new File(["bad"], "bad.exe", {
        type: "application/octet-stream",
      }),
    }),
  );
  assert.equal((await repository.snapshot()).applications.length, before);
});

test("concurrent submissions use unique registration codes without lost writes", async () => {
  await repository.loginDemo("pemohon");
  const ids = await Promise.all(
    Array.from({ length: 5 }, (_, i) =>
      repository.saveApplication(
        { ...sampleInput, title: `Concurrent ${i}` },
        {},
      ),
    ),
  );
  const applications = (await repository.snapshot()).applications.filter((a) =>
    ids.includes(a.id),
  );
  assert.equal(applications.length, 5);
  assert.equal(new Set(applications.map((a) => a.code)).size, 5);
  assert.equal(
    nextCode([{ code: "REG2026102200100" }], "2026-10-22"),
    "REG2026102200101",
  );
});

test("master purpose references are protected and duplicate names rejected", async () => {
  await repository.loginDemo("admin");
  await assert.rejects(repository.deletePurpose("purpose-1"), /digunakan/);
  await repository.savePurpose("Tujuan uji");
  let p = (await repository.snapshot()).purposes.find(
    (p) => p.name === "Tujuan uji",
  )!;
  await assert.rejects(repository.savePurpose("tujuan uji"), /tersedia/);
  await repository.savePurpose("Tujuan diperbarui", p.id);
  p = (await repository.snapshot()).purposes.find((v) => v.id === p.id)!;
  assert.equal(p.name, "Tujuan diperbarui");
  await repository.deletePurpose(p.id);
  assert.ok(!(await repository.snapshot()).purposes.some((v) => v.id === p.id));
});

test("accounts support registration, login, active status, edit and protected deletes", async () => {
  const profile = {
    name: "Akun Uji",
    email: "test@example.test",
    phone: "080000000005",
    address: "Alamat sintetis",
  };
  await repository.register({ ...profile, password: "test12345" });
  const id = (await repository.snapshot()).user!.id;
  assert.equal((await repository.snapshot()).applications.length, 0);
  await assert.rejects(
    repository.register({ ...profile, password: "test12345" }),
    /digunakan/,
  );
  await repository.loginDemo("admin");
  await repository.saveUser(
    { ...profile, name: "Akun Nonaktif", role: "pemohon", active: false },
    undefined,
    id,
  );
  await repository.logout();
  await assert.rejects(
    repository.login(profile.email, "test12345"),
    /tidak aktif/,
  );
  await repository.loginDemo("admin");
  await assert.rejects(repository.deleteUser("admin"), /sendiri/);
  await assert.rejects(repository.deleteUser("nadia"), /pengajuan/);
  await repository.deleteUser(id);
  assert.ok(!(await repository.snapshot()).users.some((u) => u.id === id));
});

test("reset simulation consumes token, changes password and invalidates current session", async () => {
  const token = await repository.requestReset("nadia@example.test");
  await repository.resetPassword(token, "newdemo123");
  assert.equal((await repository.snapshot()).user, null);
  await assert.rejects(repository.resetPassword(token, "another123"), /valid/);
  await assert.rejects(repository.login("nadia@example.test", "demo12345"));
  await repository.login("nadia@example.test", "newdemo123");
  assert.equal((await repository.snapshot()).user!.id, "nadia");
});

test("replacing and removing attachments revokes previous blob access", async () => {
  await repository.loginDemo("pemohon");
  const id = await repository.saveApplication(sampleInput, {
    letter: sampleFile("first"),
  });
  const oldId = (await repository.snapshot()).applications.find(
    (a) => a.id === id,
  )!.attachments.letter!.id;
  await repository.saveApplication(
    sampleInput,
    { letter: sampleFile("second") },
    id,
  );
  await assert.rejects(repository.getFile(oldId));
  await repository.saveApplication(sampleInput, { letter: null }, id);
  assert.equal(
    (await repository.snapshot()).applications.find((a) => a.id === id)!
      .attachments.letter,
    undefined,
  );
});
