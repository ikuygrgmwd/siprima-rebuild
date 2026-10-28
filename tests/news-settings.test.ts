import "fake-indexeddb/auto";
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { repository } from "../src/lib/repository";
import { seedNews } from "../src/lib/news";
import { sampleFile, sampleInput } from "../src/lib/sample";

beforeEach(() => repository.resetDemo());

test("news administration enforces roles, visibility, ordering and persistent empty state", async () => {
  const input = seedNews()[0];
  await assert.rejects(repository.saveNews(input), /masuk/);
  await repository.loginDemo("pemohon");
  await assert.rejects(repository.saveNews(input), /admin/);
  await assert.rejects(repository.deleteNews(input.id), /admin/);
  await repository.loginDemo("admin");
  await repository.saveNews(
    { ...input, title: "Berita pertama", order: 1 },
    "news-3",
  );
  await repository.saveNews({ ...input, title: "Draf privat", active: false });
  const admin = await repository.snapshot();
  const draft = admin.news.find((n) => n.title === "Draf privat")!;
  assert.ok(draft);
  assert.equal(admin.news[1].id, "news-3");
  await assert.rejects(repository.saveNews({ ...input, title: " " }), /Judul/);
  assert.equal((await repository.snapshot()).news.length, 4);
  await repository.loginDemo("pemohon");
  assert.equal(
    (await repository.snapshot()).news.some((n) => n.id === draft.id),
    false,
  );
  await repository.loginDemo("admin");
  await repository.saveNews({ ...draft, active: true }, draft.id);
  await repository.loginDemo("pemohon");
  assert.equal((await repository.snapshot()).news.length, 4);
  await repository.loginDemo("admin");
  for (const n of (await repository.snapshot()).news)
    await repository.deleteNews(n.id);
  await repository.logout();
  await repository.loginDemo("admin");
  assert.equal((await repository.snapshot()).news.length, 0);
});

test("v3 migration adds news while preserving session, applications and file bytes", async () => {
  await repository.loginDemo("pemohon");
  const file = sampleFile("migration-news");
  const id = await repository.saveApplication(sampleInput, { letter: file });
  const before = await repository.snapshot();
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open("siprima-demo-v1", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("state", "readwrite");
      const store = tx.objectStore("state");
      const get = store.get("current");
      get.onsuccess = () => {
        const state = get.result;
        state.version = 3;
        delete state.news;
        store.put(state, "current");
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
  const after = await repository.snapshot();
  assert.equal(after.news.length, 3);
  assert.deepEqual(after.user, before.user);
  assert.deepEqual(after.applications, before.applications);
  assert.deepEqual(after.internships, before.internships);
  const fileId = after.applications.find((a) => a.id === id)!.attachments
    .letter!.id;
  assert.equal(
    await (await repository.getFile(fileId)).blob.text(),
    await file.text(),
  );
});

test("self profile edits cannot elevate privileges or overwrite another user or old submissions", async () => {
  await repository.loginDemo("pemohon");
  const before = await repository.snapshot();
  await assert.rejects(
    repository.updateProfile({ ...before.user!, email: "admin@example.test" }),
    /sudah digunakan/,
  );
  await repository.updateProfile({
    ...before.user!,
    name: "Nadia Baru",
    email: "NADIA.BARU@example.test",
    role: "admin",
    active: false,
  } as Parameters<typeof repository.updateProfile>[0]);
  const after = await repository.snapshot();
  assert.equal(after.user!.name, "Nadia Baru");
  assert.equal(after.user!.email, "nadia.baru@example.test");
  assert.equal(after.user!.role, "pemohon");
  assert.equal(after.user!.active, true);
  assert.deepEqual(after.applications, before.applications);
  await repository.logout();
  await assert.rejects(repository.updateProfile(before.user!), /masuk/);
  await repository.login("nadia.baru@example.test", "demo12345");
  assert.equal((await repository.snapshot()).user!.name, "Nadia Baru");
});

test("password change verifies current password and invalidates old password and reset tokens", async () => {
  await repository.loginDemo("pemohon");
  const token = await repository.requestReset("nadia@example.test");
  await assert.rejects(
    repository.changePassword("wrong", "updated12345"),
    /tidak sesuai/,
  );
  await assert.rejects(repository.changePassword("demo12345", "short"));
  await repository.changePassword("demo12345", "updated12345");
  await assert.rejects(repository.resetPassword(token, "another12345"));
  await repository.logout();
  await assert.rejects(
    repository.login("nadia@example.test", "demo12345"),
    /tidak sesuai/,
  );
  await repository.login("nadia@example.test", "updated12345");
  assert.equal((await repository.snapshot()).user!.id, "nadia");
});
