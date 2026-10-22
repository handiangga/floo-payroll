import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { db, User, Worker, Model, Period, Payroll, Audit } from "./db.js";
import { calculate } from "./calculation.js";
export const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) =>
      cb(
        null,
        !origin ||
          (process.env.CORS_ORIGIN || "http://localhost:5173")
            .split(",")
            .map((s) => s.trim())
            .includes(origin),
      ),
  }),
);
app.use(express.json({ limit: "256kb" }));
app.get("/api/health", async (req, res) => {
  try {
    await db.authenticate();
    res.json({ ok: true });
  } catch {
    res.status(503).json({ error: "Database belum tersedia" });
  }
});
app.post(
  "/api/auth/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
  async (req, res) => {
    const body = z
      .object({ email: z.email(), password: z.string().min(1).max(200) })
      .parse(req.body);
    const user = await User.findOne({
      where: { email: body.email.toLowerCase() },
    });
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash)))
      return res.status(401).json({ error: "Email atau password salah." });
    res.json({
      token: jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "8h",
      }),
      user: { id: user.id, name: user.name, role: user.role },
    });
  },
);
app.use("/api", async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace(/^Bearer /, "");
    const payload = jwt.verify(token || "", process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    req.user = await User.findByPk(payload.id, {
      attributes: ["id", "name", "role"],
    });
    if (!req.user) throw Error();
    next();
  } catch {
    res.status(401).json({ error: "Silakan login kembali." });
  }
});
const owner = (req, res, next) =>
  req.user.role === "owner"
    ? next()
    : res
        .status(403)
        .json({ error: "Hanya owner yang dapat melakukan perubahan ini." });
const id = z.coerce.number().int().positive();
const integer = z.number().int().min(0).max(1_000_000_000);
const audit = (req, action, details, transaction) =>
  Audit.create({ userId: req.user.id, action, details }, { transaction });
app.get("/api/me", (req, res) => res.json(req.user));
app.get("/api/bootstrap", async (req, res) =>
  res.json({
    workers: await Worker.findAll({ order: [["name", "ASC"]] }),
    models: await Model.findAll({ order: [["name", "ASC"]] }),
    periods: await Period.findAll({ order: [["date", "DESC"]] }),
  }),
);
const workerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  job: z.enum(["jahit", "potong"]),
  destination: z.string().max(200).default(""),
});
const modelSchema = z.object({
  code: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(120),
  sewingRate: integer.nullable(),
  cuttingRate: integer.nullable(),
});
for (const [route, Entity, schema] of [
  ["workers", Worker, workerSchema],
  ["models", Model, modelSchema],
]) {
  app.post("/api/" + route, owner, async (req, res) => {
    const body = schema.parse(req.body);
    const row = await db.transaction(async (t) => {
      const row = await Entity.create(body, { transaction: t });
      await audit(req, route + ".create", { id: row.id, ...body }, t);
      return row;
    });
    res.status(201).json(row);
  });
  app.put("/api/" + route + "/:id", owner, async (req, res) => {
    const body = schema.parse(req.body);
    const row = await db.transaction(async (t) => {
      const row = await Entity.findByPk(id.parse(req.params.id), {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!row) throw Error("Data tidak ditemukan.");
      await row.update(body, { transaction: t });
      await audit(req, route + ".update", { id: row.id, ...body }, t);
      return row;
    });
    res.json(row);
  });
}
app.delete("/api/models/:id", owner, async (req, res) => {
  await db.transaction(async (t) => {
    const row = await Model.findByPk(id.parse(req.params.id), {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!row) throw Error("Model tidak ditemukan atau sudah dihapus.");
    await audit(req, "models.delete", { id: row.id, name: row.name }, t);
    await row.destroy({ transaction: t });
  });
  res.json({ ok: true });
});
app.delete("/api/workers/:id", owner, async (req, res) => {
  await db.transaction(async (t) => {
    const row = await Worker.findByPk(id.parse(req.params.id), {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!row) throw Error("Pegawai tidak ditemukan atau sudah dihapus.");
    await row.destroy({ transaction: t });
    await audit(req, "workers.delete", { id: row.id }, t);
  });
  res.json({ ok: true });
});
app.post("/api/users", owner, async (req, res) => {
  const b = z
    .object({
      name: z.string().min(1).max(120),
      email: z.email(),
      password: z.string().min(12).max(200),
    })
    .parse(req.body);
  const user = await User.create({
    name: b.name,
    email: b.email.toLowerCase(),
    passwordHash: await bcrypt.hash(b.password, 12),
    role: "admin",
  });
  res
    .status(201)
    .json({ id: user.id, name: user.name, email: user.email, role: user.role });
});
app.post("/api/periods", async (req, res) => {
  const b = z.object({ date: z.iso.date() }).parse(req.body);
  if (new Date(b.date + "T12:00:00Z").getUTCDay() !== 6)
    throw Error("Pilih tanggal Sabtu untuk periode gaji.");
  const p = await db.transaction(async (t) => {
    await db.query("SELECT pg_advisory_xact_lock(826411)", { transaction: t });
    if (await Period.count({ where: { status: "open" }, transaction: t }))
      throw Error("Tutup periode aktif terlebih dahulu.");
    const p = await Period.create(b, { transaction: t });
    await audit(req, "period.open", { id: p.id, date: p.date }, t);
    return p;
  });
  res.status(201).json(p);
});
app.get("/api/periods/:id/payrolls", async (req, res) =>
  res.json(
    await Payroll.findAll({
      where: { periodId: id.parse(req.params.id) },
      order: [["workerName", "ASC"]],
    }),
  ),
);
app.post("/api/periods/:id/payrolls", async (req, res) => {
  const periodId = id.parse(req.params.id);
  const result = await db.transaction(async (t) => {
    const p = await Period.findByPk(periodId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!p || p.status !== "open")
      throw Error("Periode ditutup atau tidak ditemukan.");
    const worker = await Worker.findByPk(id.parse(req.body.workerId), {
      transaction: t,
      lock: t.LOCK.SHARE,
      paranoid: false,
    });
    if (!worker) throw Error("Pekerja tidak ditemukan.");
    const models = await Model.findAll({ transaction: t, lock: t.LOCK.SHARE });
    const existing = await Payroll.findOne({
      where: { periodId, workerId: worker.id },
      transaction: t,
    });
    // Old lines contain their own names/rates, so archived work survives model deletion.
    if (existing)
      for (const line of existing.lines) {
        if (!models.some((m) => m.id === line.modelId))
          models.push({
            id: line.modelId,
            name: line.modelName,
            sewingRate: line.rate,
            cuttingRate: line.rate,
          });
      }
    const data = calculate(req.body, worker, models);
    if (worker.deletedAt && !existing)
      throw Error(
        "Pegawai sudah dihapus dan tidak dapat dipilih untuk rekap baru.",
      );
    if (existing && !req.body.replace)
      throw Error("Pekerja sudah direkap. Buka dan edit rekap yang ada.");
    const row = existing
      ? await existing.update(data, { transaction: t })
      : await Payroll.create({ ...data, periodId }, { transaction: t });
    await audit(
      req,
      existing ? "payroll.update" : "payroll.create",
      { periodId, payrollId: row.id, net: row.net },
      t,
    );
    return row;
  });
  res.json(result);
});
app.delete("/api/periods/:id/payrolls/:payrollId", async (req, res) => {
  await db.transaction(async (t) => {
    const p = await Period.findByPk(id.parse(req.params.id), {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!p || p.status !== "open") throw Error("Periode sudah ditutup.");
    const row = await Payroll.findOne({
      where: { id: id.parse(req.params.payrollId), periodId: p.id },
      transaction: t,
    });
    if (!row) throw Error("Rekap tidak ditemukan.");
    await audit(
      req,
      "payroll.delete",
      { periodId: p.id, payrollId: row.id },
      t,
    );
    await row.destroy({ transaction: t });
  });
  res.json({ ok: true });
});
app.post("/api/periods/:id/close", async (req, res) => {
  const result = await db.transaction(async (t) => {
    const p = await Period.findByPk(id.parse(req.params.id), {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!p || p.status !== "open") throw Error("Periode tidak terbuka.");
    if (!(await Payroll.count({ where: { periodId: p.id }, transaction: t })))
      throw Error("Belum ada rekap gaji.");
    await p.update(
      { status: "closed", closedAt: new Date() },
      { transaction: t },
    );
    await audit(req, "period.close", { id: p.id }, t);
    return p;
  });
  res.json(result);
});
app.post("/api/periods/:id/reopen", owner, async (req, res) => {
  const { reason } = z
    .object({ reason: z.string().trim().min(5).max(500) })
    .parse(req.body);
  const result = await db.transaction(async (t) => {
    await db.query("SELECT pg_advisory_xact_lock(826411)", { transaction: t });
    if (await Period.count({ where: { status: "open" }, transaction: t }))
      throw Error("Masih ada periode aktif.");
    const p = await Period.findByPk(id.parse(req.params.id), {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!p || p.status !== "closed") throw Error("Periode tidak ditutup.");
    await p.update({ status: "open", closedAt: null }, { transaction: t });
    await audit(req, "period.reopen", { id: p.id, reason }, t);
    return p;
  });
  res.json(result);
});
app.use((err, req, res, next) => {
  if (err instanceof z.ZodError)
    return res.status(400).json({
      error: err.issues
        .map((x) => x.path.join(".") + ": " + x.message)
        .join("; "),
    });
  if (err.name === "SequelizeUniqueConstraintError")
    return res
      .status(409)
      .json({ error: "Data sudah ada atau periode lain masih terbuka." });
  if (err.name?.startsWith("Sequelize")) {
    console.error(err.name);
    return res
      .status(500)
      .json({ error: "Operasi database gagal. Periksa konfigurasi server." });
  }
  res.status(400).json({ error: err.message || "Permintaan gagal." });
});
