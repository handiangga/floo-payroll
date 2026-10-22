import bcrypt from "bcryptjs";
import { migrate } from "./migrate.js";
import { db, User, Worker, Model } from "./db.js";
try {
  await db.authenticate();
  await migrate();
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12)
    throw new Error("Isi ADMIN_EMAIL dan ADMIN_PASSWORD minimal 12 karakter.");
  await User.findOrCreate({
    where: { email: ADMIN_EMAIL.toLowerCase() },
    defaults: {
      name: ADMIN_NAME || "Owner",
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12),
      role: "owner",
    },
  });
  if (process.argv.includes("--seed")) {
    for (const w of [
      { name: "Bu Ani (contoh)", job: "jahit" },
      { name: "Pak Budi (contoh)", job: "potong" },
    ])
      await Worker.findOrCreate({ where: { name: w.name }, defaults: w });
    for (const m of [
      {
        code: "D001",
        name: "Dres A (contoh)",
        sewingRate: 30000,
        cuttingRate: 12000,
      },
      {
        code: "D002",
        name: "Dres B (contoh)",
        sewingRate: 35000,
        cuttingRate: 15000,
      },
    ])
      await Model.findOrCreate({ where: { code: m.code }, defaults: m });
  }
  console.log(
    "Skema siap. Owner dibuat jika belum ada. Seed hanya data contoh.",
  );
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await db.close();
}
