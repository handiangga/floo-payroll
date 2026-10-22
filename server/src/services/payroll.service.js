import { db, Period, Payroll, Worker, Model } from "../db.js";
import { id } from "../validators/schemas.js";
import { audit } from "./audit.service.js";
import { calculate } from "./calculation.service.js";
export const listPayrolls = (recordId) =>
  Payroll.findAll({
    where: { periodId: id.parse(recordId) },
    order: [["workerName", "ASC"]],
  });
export async function savePayroll({ recordId, payrollId, input, userId }) {
  const periodId = id.parse(recordId);
  const result = await db.transaction(async (t) => {
    const p = await Period.findByPk(periodId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!p || p.status !== "open")
      throw Error("Periode ditutup atau tidak ditemukan.");
    const worker = await Worker.findByPk(id.parse(input.workerId), {
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
    const data = calculate(input, worker, models);
    if (worker.deletedAt && !existing)
      throw Error(
        "Pegawai sudah dihapus dan tidak dapat dipilih untuk rekap baru.",
      );
    if (existing && !input.replace)
      throw Error("Pekerja sudah direkap. Buka dan edit rekap yang ada.");
    const row = existing
      ? await existing.update(data, { transaction: t })
      : await Payroll.create({ ...data, periodId }, { transaction: t });
    await audit(
      userId,
      existing ? "payroll.update" : "payroll.create",
      { periodId, payrollId: row.id, net: row.net },
      t,
    );
    return row;
  });
  return result;
}
export async function removePayroll({ recordId, payrollId, input, userId }) {
  await db.transaction(async (t) => {
    const p = await Period.findByPk(id.parse(recordId), {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!p || p.status !== "open") throw Error("Periode sudah ditutup.");
    const row = await Payroll.findOne({
      where: { id: id.parse(payrollId), periodId: p.id },
      transaction: t,
    });
    if (!row) throw Error("Rekap tidak ditemukan.");
    await audit(
      userId,
      "payroll.delete",
      { periodId: p.id, payrollId: row.id },
      t,
    );
    await row.destroy({ transaction: t });
  });
  return { ok: true };
}
