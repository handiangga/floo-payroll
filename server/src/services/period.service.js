import { db, Period, Payroll } from "../db.js";
import { z } from "zod";
import { id } from "../validators/schemas.js";
import { audit } from "./audit.service.js";
export async function openPeriod({ recordId, payrollId, input, userId }) {
  const b = z.object({ date: z.iso.date() }).parse(input);
  if (new Date(b.date + "T12:00:00Z").getUTCDay() !== 6)
    throw Error("Pilih tanggal Sabtu untuk periode gaji.");
  const p = await db.transaction(async (t) => {
    await db.query("SELECT pg_advisory_xact_lock(826411)", { transaction: t });
    if (await Period.count({ where: { status: "open" }, transaction: t }))
      throw Error("Tutup periode aktif terlebih dahulu.");
    const p = await Period.create(b, { transaction: t });
    await audit(userId, "period.open", { id: p.id, date: p.date }, t);
    return p;
  });
  return p;
}
export async function closePeriod({ recordId, payrollId, input, userId }) {
  const result = await db.transaction(async (t) => {
    const p = await Period.findByPk(id.parse(recordId), {
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
    await audit(userId, "period.close", { id: p.id }, t);
    return p;
  });
  return result;
}
export async function reopenPeriod({ recordId, payrollId, input, userId }) {
  const { reason } = z
    .object({ reason: z.string().trim().min(5).max(500) })
    .parse(input);
  const result = await db.transaction(async (t) => {
    await db.query("SELECT pg_advisory_xact_lock(826411)", { transaction: t });
    if (await Period.count({ where: { status: "open" }, transaction: t }))
      throw Error("Masih ada periode aktif.");
    const p = await Period.findByPk(id.parse(recordId), {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!p || p.status !== "closed") throw Error("Periode tidak ditutup.");
    await p.update({ status: "open", closedAt: null }, { transaction: t });
    await audit(userId, "period.reopen", { id: p.id, reason }, t);
    return p;
  });
  return result;
}
