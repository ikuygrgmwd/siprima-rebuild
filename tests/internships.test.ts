import "fake-indexeddb/auto";
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { repository } from "../src/lib/repository";
import {
  internshipManagementSchema,
  internshipSchema,
} from "../src/lib/domain";
import {
  emptyInternshipFilters,
  filterInternships,
  internshipsCsv,
  seedInternships,
} from "../src/lib/internships";
import { sampleFile, sampleInput } from "../src/lib/sample";

const input = seedInternships()[0];
beforeEach(async () => {
  await repository.resetDemo();
});

test("internship CRUD persists, retains owner and records actual status changes", async () => {
  await repository.loginDemo("pemohon");
  const ids = await Promise.all(
    Array.from({ length: 3 }, () => repository.saveInternship(input)),
  );
  const snapshot = await repository.snapshot();
  assert.equal(
    new Set(snapshot.internships.map((a) => a.code)).size,
    snapshot.internships.length,
  );
  const id = ids[0];
  await repository.loginDemo("admin");
  await repository.saveInternship(
    { ...input, unit: "Administrasi & pelayanan" },
    id,
    { status: "Aktif", mentor: "Pembimbing demo", note: "Orientasi Senin" },
  );
  await repository.saveInternship(
    { ...input, unit: "Administrasi & pelayanan" },
    id,
    { status: "Aktif", mentor: "Pembimbing demo", note: "Orientasi Selasa" },
  );
  await repository.loginDemo("pemohon");
  const a = (await repository.snapshot()).internships.find((a) => a.id === id)!;
  assert.equal(a.ownerId, "nadia");
  assert.equal(a.unit, "Administrasi & pelayanan");
  assert.equal(a.note, "Orientasi Selasa");
  assert.deepEqual(
    a.history.map((h) => h.status),
    ["Diajukan", "Aktif"],
  );
  await assert.rejects(repository.saveInternship(input, id), /sudah diproses/);
  await repository.loginDemo("admin");
  await repository.deleteInternship(id);
  assert.ok(
    !(await repository.snapshot()).internships.some((a) => a.id === id),
  );
});

test("internship permissions protect ownership, administration and orphaned accounts", async () => {
  assert.deepEqual((await repository.snapshot()).internships, []);
  await assert.rejects(repository.saveInternship(input), /masuk/);
  await repository.loginDemo("pemohon");
  assert.equal((await repository.snapshot()).internships.length, 1);
  await assert.rejects(
    repository.saveInternship(input, "internship-2"),
    /diakses/,
  );
  await assert.rejects(
    repository.saveInternship(input, undefined, {
      status: "Diterima",
      mentor: "",
      note: "",
    }),
    /admin/,
  );
  await assert.rejects(repository.deleteInternship("internship-1"), /admin/);
  const id = await repository.saveInternship({
    ...input,
    status: "Selesai",
    ownerId: "raka",
  } as typeof input);
  const a = (await repository.snapshot()).internships.find((a) => a.id === id)!;
  assert.equal(a.status, "Diajukan");
  assert.equal(a.ownerId, "nadia");
  await repository.loginDemo("admin");
  await repository.deleteApplication("application-7");
  await assert.rejects(repository.deleteUser("raka"), /magang/);
});

test("internship validation rejects bad dates and active participants without mentors", async () => {
  assert.equal(
    internshipSchema.safeParse({ ...input, startDate: "2026-02-30" }).success,
    false,
  );
  assert.equal(
    internshipSchema.safeParse({ ...input, endDate: "2025-01-01" }).success,
    false,
  );
  assert.equal(
    internshipManagementSchema.safeParse({
      status: "Aktif",
      mentor: " ",
      note: "",
    }).success,
    false,
  );
  await repository.loginDemo("admin");
  await assert.rejects(
    repository.saveInternship(input, "internship-1", {
      status: "Aktif",
      mentor: "",
      note: "",
    }),
  );
  assert.equal(
    (await repository.snapshot()).internships.find(
      (a) => a.id === "internship-1",
    )!.status,
    "Diajukan",
  );
});

test("filter combinations use Jakarta submission dates and CSV safely escapes user text", () => {
  const entries = seedInternships();
  const rows = filterInternships(entries, {
    ...emptyInternshipFilters,
    status: "Aktif",
    query: "raka",
    year: "2026",
    month: "10",
    unit: entries[1].unit,
    program: entries[1].program,
    level: entries[1].level,
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].applicantName, "Raka Mahardika");
  assert.equal(
    filterInternships(entries, { ...emptyInternshipFilters, query: "no match" })
      .length,
    0,
  );
  assert.equal(
    filterInternships([{ ...entries[0], createdAt: "2026-12-31T19:00:00Z" }], {
      ...emptyInternshipFilters,
      year: "2027",
      month: "01",
    }).length,
    1,
  );
  const csv = internshipsCsv([
    {
      ...rows[0],
      applicantName: " =SUM(1,2)",
      note: 'Note "quoted"\nnext line',
    },
  ]);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes('"\' =SUM(1,2)"'));
  assert.ok(csv.includes('"Note ""quoted""\nnext line"'));
  assert.ok(!csv.includes(entries[0].applicantName));
});

function editStoredState(
  edit: (state: Record<string, unknown>) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("siprima-demo-v1", 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction("state", "readwrite");
      const store = tx.objectStore("state");
      const read = store.get("current");
      read.onsuccess = () => {
        edit(read.result);
        store.put(read.result, "current");
      };
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onabort = () => {
        db.close();
        reject(tx.error);
      };
    };
  });
}

test("v1 migration preserves existing applications, file bytes, session and accounts", async () => {
  await repository.loginDemo("pemohon");
  const file = sampleFile("preserved-before-migration");
  const id = await repository.saveApplication(sampleInput, { letter: file });
  const before = await repository.snapshot();
  await editStoredState((s) => {
    s.version = 1;
    delete s.internships;
  });
  const after = await repository.snapshot();
  assert.deepEqual(after.applications, before.applications);
  assert.deepEqual(after.user, before.user);
  assert.equal(after.internships.length, 1);
  const attachment = after.applications.find((a) => a.id === id)!.attachments
    .letter!;
  assert.equal(
    await (await repository.getFile(attachment.id)).blob.text(),
    await file.text(),
  );
  await repository.loginDemo("admin");
  for (const a of (await repository.snapshot()).internships)
    await repository.deleteInternship(a.id);
  assert.equal((await repository.snapshot()).internships.length, 0);
  assert.equal(
    (await repository.snapshot()).internships.length,
    0,
    "deleted demo data must not be reseeded",
  );
});
