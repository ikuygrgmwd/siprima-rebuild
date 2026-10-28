import "fake-indexeddb/auto";
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { repository } from "../src/lib/repository";
import { masterKinds, applicationSchema } from "../src/lib/domain";
import { sampleInput, sampleFile } from "../src/lib/sample";

beforeEach(async () => { await repository.resetDemo(); });

const selected = { ...sampleInput, opdId: "opd-1", districtId: "district-1", villageId: "village-1" };

test("masters are admin-managed, readable by applicants, and hidden from signed-out users", async () => {
  for (const kind of masterKinds) {
    assert.deepEqual((await repository.snapshot())[kind], []);
    await assert.rejects(repository.saveMaster(kind, { name: "Test" }), /masuk/);
  }
  await repository.loginDemo("pemohon");
  for (const kind of masterKinds) {
    const item = (await repository.snapshot())[kind][0];
    assert.ok(item);
    await assert.rejects(repository.saveMaster(kind, { name: "Test" }, item.id), /admin/);
    await assert.rejects(repository.deleteMaster(kind, item.id), /admin/);
  }
});

test("master CRUD persists; names are trimmed, duplicates scoped to district, and missing parents rejected", async () => {
  await repository.loginDemo("admin");
  for (const kind of masterKinds) {
    const input = { name: "  Nama uji  ", districtId: "district-1" };
    await repository.saveMaster(kind, input);
    const item = (await repository.snapshot())[kind].find((r) => r.name === "Nama uji")!;
    assert.ok(item);
    if (kind !== "villages") assert.equal(item.districtId, undefined);
    await assert.rejects(repository.saveMaster(kind, { ...input, name: "NAMA UJI" }), /sudah tersedia/);
    await repository.saveMaster(kind, { ...input, name: "Nama baru" }, item.id);
    await repository.logout();
    await repository.loginDemo("admin");
    assert.equal((await repository.snapshot())[kind].find((r) => r.id === item.id)?.name, "Nama baru");
    await repository.deleteMaster(kind, item.id);
    assert.ok(!(await repository.snapshot())[kind].some((r) => r.id === item.id));
    await assert.rejects(repository.saveMaster(kind, input, "missing"), /tidak ditemukan/);
    await assert.rejects(repository.deleteMaster(kind, "missing"), /tidak ditemukan/);
    await assert.rejects(repository.saveMaster(kind, { name: " " }));
  }
  await assert.rejects(repository.saveMaster("villages", { name: "Tanpa kecamatan" }), /kecamatan/);
  await assert.rejects(repository.saveMaster("villages", { name: "Salah kecamatan", districtId: "missing" }), /kecamatan/);
  await repository.saveMaster("villages", { name: "Nama sama", districtId: "district-1" });
  await repository.saveMaster("villages", { name: "Nama sama", districtId: "district-2" });
});

test("research references survive rename and protect used masters against deletion or reparenting", async () => {
  await repository.loginDemo("pemohon");
  const id = await repository.saveApplication(selected, { letter: sampleFile() });
  await repository.loginDemo("admin");
  for (const [kind, masterId] of [["opds", "opd-1"], ["districts", "district-1"], ["villages", "village-1"]] as const) {
    await assert.rejects(repository.deleteMaster(kind, masterId), /digunakan/);
    await repository.saveMaster(kind, { name: "Nama diganti", districtId: "district-1" }, masterId);
  }
  await assert.rejects(repository.saveMaster("villages", { name: "Pindah", districtId: "district-2" }, "village-1"), /dipindah/);
  await repository.loginDemo("pemohon");
  const snapshot = await repository.snapshot();
  const app = snapshot.applications.find((a) => a.id === id)!;
  assert.equal(snapshot.opds.find((o) => o.id === app.opdId)?.name, "Nama diganti");
  assert.equal(snapshot.districts.find((d) => d.id === app.districtId)?.name, "Nama diganti");
  assert.equal(snapshot.villages.find((v) => v.id === app.villageId)?.name, "Nama diganti");
  await repository.saveApplication({ ...app, opdId: "", districtId: "", villageId: "" }, {}, id);
  const cleared = (await repository.snapshot()).applications.find((a) => a.id === id)!;
  assert.equal(cleared.villageId, "");
  assert.equal(cleared.attachments.letter!.id, app.attachments.letter!.id);
  await repository.loginDemo("admin");
  await repository.deleteMaster("opds", "opd-1");
  await repository.deleteMaster("villages", "village-1");
  await assert.rejects(repository.deleteMaster("districts", "district-1"), /memiliki kelurahan/);
});

test("invalid or stale master choices cannot commit research, while optional fields remain compatible", async () => {
  await repository.loginDemo("pemohon");
  const before = (await repository.snapshot()).applications.length;
  for (const patch of [{ opdId: "missing" }, { districtId: "missing" }, { villageId: "missing" }, { districtId: "district-2" }]) {
    await assert.rejects(repository.saveApplication({ ...selected, ...patch }, { letter: sampleFile() }));
  }
  assert.equal(applicationSchema.safeParse({ ...selected, districtId: "" }).success, false);
  assert.equal((await repository.snapshot()).applications.length, before);
  await repository.saveApplication(sampleInput, {});
  await repository.saveApplication({ ...sampleInput, opdId: "opd-1" }, {});
  await repository.saveApplication({ ...sampleInput, districtId: "district-1" }, {});
});

test("v4 migration preserves existing records, session, and file bytes without assigning sample locations", async () => {
  await repository.loginDemo("pemohon");
  const file = sampleFile("master-migration");
  const id = await repository.saveApplication(sampleInput, { letter: file });
  const before = await repository.snapshot();
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.open("siprima-demo-v1", 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction("state", "readwrite");
      const store = tx.objectStore("state");
      const get = store.get("current");
      get.onsuccess = () => {
        const state = get.result;
        state.version = 4;
        for (const kind of masterKinds) delete state[kind];
        store.put(state, "current");
      };
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onabort = () => { db.close(); reject(tx.error); };
    };
  });
  const after = await repository.snapshot();
  for (const key of ["user", "applications", "internships", "reports", "purposes", "news"] as const)
    assert.deepEqual(after[key], before[key]);
  assert.equal(after.opds.length, 2);
  assert.equal(after.districts.length, 2);
  assert.equal(after.villages.length, 3);
  const app = after.applications.find((a) => a.id === id)!;
  assert.equal(app.districtId, undefined);
  assert.equal(await (await repository.getFile(app.attachments.letter!.id)).blob.text(), await file.text());
});

test("empty master lists stay empty after reopening instead of being seeded again", async () => {
  await repository.loginDemo("admin");
  for (const kind of ["villages", "districts", "opds"] as const) {
    for (const item of (await repository.snapshot())[kind]) await repository.deleteMaster(kind, item.id);
  }
  await repository.logout();
  await repository.loginDemo("admin");
  for (const kind of masterKinds) assert.deepEqual((await repository.snapshot())[kind], []);
});
