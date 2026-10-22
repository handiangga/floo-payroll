import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
function cli(args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [require.resolve("sequelize-cli/lib/sequelize"), ...args],
      {
        cwd: fileURLToPath(new URL("../", import.meta.url)),
        env: { ...process.env, ...env },
        stdio: "inherit",
      },
    );
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error("CLI exit " + code)),
    );
  });
}

test(
  "API PostgreSQL: periode, role, jobdes, snapshot dan penguncian",
  { skip: !process.env.TEST_DATABASE_URL },
  async () => {
    const url = new URL(process.env.TEST_DATABASE_URL);
    assert.match(
      url.pathname,
      /_test$/,
      "Wajib memakai database khusus berakhiran _test",
    );
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    process.env.JWT_SECRET = "test-only-secret-never-use-in-production-123";
    const { db, User, Worker, Model, Payroll } = await import("../src/db.js");
    const { migrate } = await import("../src/migrate.js");
    const { app } = await import("../src/app.js");
    const bcrypt = await import("bcryptjs");
    let server;
    try {
      await db.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
      await migrate();
      await migrate();
      await cli(["db:seed:all"], {
        ADMIN_EMAIL: "seed@example.com",
        ADMIN_PASSWORD: "seed-testing-password",
        SEED_DEMO: "true",
      });
      await cli(["db:seed:all"], {
        ADMIN_EMAIL: "seed@example.com",
        ADMIN_PASSWORD: "seed-testing-password",
        SEED_DEMO: "true",
      });
      assert.equal(
        await User.count({ where: { email: "seed@example.com" } }),
        1,
      );
      assert.equal(await Worker.count(), 2);
      assert.equal(await Model.count(), 2);
      await User.create({
        name: "Owner",
        email: "test@example.com",
        passwordHash: await bcrypt.hash("testing-password", 4),
        role: "owner",
      });
      await User.create({
        name: "Admin",
        email: "admin@example.com",
        passwordHash: await bcrypt.hash("testing-password", 4),
        role: "admin",
      });
      server = app.listen(0);
      await new Promise((resolve) => server.on("listening", resolve));
      const base = "http://localhost:" + server.address().port + "/api";
      let token = "";
      const req = async (path, method = "GET", body) => {
        const res = await fetch(base + path, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
        return { status: res.status, body: await res.json() };
      };
      assert.equal((await req("/bootstrap")).status, 401);
      let login = await req("/auth/login", "POST", {
        email: "test@example.com",
        password: "testing-password",
      });
      assert.equal(login.status, 200);
      token = login.body.token;
      const ownerToken = token;
      const w = await req("/workers", "POST", {
        name: "Ani",
        job: "jahit",
        destination: "BRI",
      });
      assert.equal(w.status, 201);
      const c = await req("/workers", "POST", {
        name: "Budi",
        job: "potong",
      });
      assert.equal(c.status, 201);
      const m = await req("/models", "POST", {
        code: "D1",
        name: "Dres A",
        sewingRate: 30000,
        cuttingRate: 12000,
      });
      assert.equal(m.status, 201);
      const p = await req("/periods", "POST", { date: "2026-10-24" });
      assert.equal(p.status, 201);
      assert.equal(
        (await req("/periods", "POST", { date: "2026-10-31" })).status,
        400,
      );
      const data = {
        workerId: w.body.id,
        cash: 50000,
        lines: [{ modelId: m.body.id, qty: 5 }],
        adjustments: [],
        transfers: [{ destination: "BRI", amount: 100000 }],
      };
      assert.equal(
        (
          await req(`/periods/${p.body.id}/payrolls`, "POST", {
            ...data,
            cash: 0,
          })
        ).status,
        400,
      );
      let saved = await req(`/periods/${p.body.id}/payrolls`, "POST", data);
      assert.equal(saved.status, 200);
      assert.equal(saved.body.net, 150000);
      assert.equal(
        (await req(`/periods/${p.body.id}/payrolls`, "POST", data)).status,
        400,
      );
      assert.equal(
        (
          await req(`/periods/${p.body.id}/payrolls`, "POST", {
            ...data,
            workerId: c.body.id,
            cash: 60000,
            transfers: [],
          })
        ).body.net,
        60000,
      );
      await req("/models/" + m.body.id, "PUT", {
        code: "D1",
        name: "Dres A baru",
        sewingRate: 40000,
        cuttingRate: 12000,
      });
      assert.equal(
        (await Payroll.findByPk(saved.body.id)).lines[0].rate,
        30000,
      );
      assert.equal(
        (await Payroll.findByPk(saved.body.id)).lines[0].modelName,
        "Dres A",
      );
      assert.equal(
        (await req(`/periods/${p.body.id}/close`, "POST")).status,
        200,
      );
      assert.equal(
        (
          await req(`/periods/${p.body.id}/payrolls`, "POST", {
            ...data,
            replace: true,
          })
        ).status,
        400,
      );
      assert.equal(
        (await req(`/periods/${p.body.id}/payrolls/${saved.body.id}`, "DELETE"))
          .status,
        400,
      );
      login = await req("/auth/login", "POST", {
        email: "admin@example.com",
        password: "testing-password",
      });
      token = login.body.token;
      assert.equal(
        (
          await req("/models", "POST", {
            code: "X",
            name: "X",
            sewingRate: 1,
            cuttingRate: 1,
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await req(`/periods/${p.body.id}/reopen`, "POST", {
            reason: "Koreksi pekerjaan",
          })
        ).status,
        403,
      );
      assert.equal((await req("/workers/" + w.body.id, "DELETE")).status, 403);
      token = ownerToken;
      assert.equal(
        (
          await req(`/periods/${p.body.id}/reopen`, "POST", {
            reason: "Koreksi pekerjaan",
          })
        ).status,
        200,
      );
      await req(`/periods/${p.body.id}/close`, "POST");
      const beforeDelete = await Payroll.findByPk(saved.body.id);
      assert.equal((await req("/workers/" + w.body.id, "DELETE")).status, 200);
      assert.equal(
        (await req("/bootstrap")).body.workers.some((x) => x.id === w.body.id),
        false,
      );
      assert.equal(
        (await Worker.findByPk(w.body.id, { paranoid: false }))
          .deletedAt instanceof Date,
        true,
      );
      const afterDelete = await Payroll.findByPk(saved.body.id);
      assert.equal(afterDelete.workerName, beforeDelete.workerName);
      assert.deepEqual(afterDelete.lines, beforeDelete.lines);
      assert.equal(
        (
          await req("/workers/" + w.body.id, "PUT", {
            name: "Return",
            job: "jahit",
          })
        ).status,
        400,
      );
      const next = await req("/periods", "POST", { date: "2026-10-31" });
      assert.equal(next.status, 201);
      assert.equal(
        (await req(`/periods/${next.body.id}/payrolls`, "POST", data)).status,
        400,
      );

      assert.equal(
        (await req(`/periods/${next.body.id}/payrolls`)).body.length,
        0,
      );
      assert.equal(
        (await req(`/periods/${p.body.id}/payrolls`)).body.length,
        2,
      );
      assert.equal(
        (
          await req(`/periods/${p.body.id}/reopen`, "POST", {
            reason: "Koreksi pekerjaan",
          })
        ).status,
        400,
      );
      // Simulate the actual legacy v1 schema, then adopt it without data loss.
      await db.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
      await db.query(
        await readFile(
          new URL("./fixtures/v1-initial.sql", import.meta.url),
          "utf8",
        ),
      );
      await db.query(
        `CREATE TABLE "SequelizeMeta" (name VARCHAR(255) PRIMARY KEY); INSERT INTO "SequelizeMeta" VALUES ('001-initial.sql');`,
      );
      const legacy = await User.create({
        name: "Legacy owner",
        email: "legacy@example.com",
        passwordHash: "unchanged-hash",
        role: "owner",
      });
      await migrate();
      assert.equal(
        (await User.findByPk(legacy.id)).passwordHash,
        "unchanged-hash",
      );
      const [metadata] = await db.query('SELECT name FROM "SequelizeMeta"');
      assert.equal(metadata.length, 3);
      await migrate();
      await cli(["db:migrate:undo"]);
      let undoBlocked = false;
      try {
        await cli(["db:migrate:undo"]);
      } catch {
        undoBlocked = true;
      }
      assert.equal(undoBlocked, true);
      assert.equal(await User.count(), 1);
    } finally {
      if (server) await new Promise((resolve) => server.close(resolve));
      await db.close();
    }
  },
);
