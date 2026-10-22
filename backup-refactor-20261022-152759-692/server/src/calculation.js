import { z } from "zod";
const money = z.number().int().min(0).max(1_000_000_000);
export const payrollSchema = z.object({
  workerId: z.number().int().positive(),
  cash: money,
  lines: z
    .array(
      z.object({
        modelId: z.number().int().positive(),
        qty: z.number().int().min(1).max(100000),
      }),
    )
    .min(1)
    .max(200),
  adjustments: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(160),
        kind: z.enum(["addition", "deduction"]),
        qty: z.number().int().min(1).max(100000),
        rate: money,
      }),
    )
    .max(100),
  transfers: z
    .array(
      z.object({
        destination: z.string().trim().min(1).max(200),
        amount: money,
      }),
    )
    .max(10),
});
export function calculate(input, worker, models) {
  const data = payrollSchema.parse(input);
  const seen = new Set();
  const lines = data.lines.map((l) => {
    if (seen.has(l.modelId))
      throw new Error("Model duplikat. Gabungkan jumlah pada satu baris.");
    seen.add(l.modelId);
    const m = models.find((m) => m.id === l.modelId);
    if (!m) throw new Error("Model tidak ditemukan.");
    const rate = worker.job === "jahit" ? m.sewingRate : m.cuttingRate;
    if (rate === null || rate === undefined)
      throw new Error(`Tarif ${worker.job} untuk ${m.name} belum diisi.`);
    return {
      modelId: m.id,
      modelName: m.name,
      qty: l.qty,
      rate: Number(rate),
      total: l.qty * Number(rate),
    };
  });
  const adjustments = data.adjustments.map((a) => ({
    ...a,
    total: a.qty * a.rate * (a.kind === "deduction" ? -1 : 1),
  }));
  const subtotal = lines.reduce((s, l) => s + l.total, 0),
    net = subtotal + adjustments.reduce((s, a) => s + a.total, 0),
    transferTotal = data.transfers.reduce((s, t) => s + t.amount, 0);
  if (!Number.isSafeInteger(net) || net < 0 || net > 1_000_000_000)
    throw new Error("Gaji bersih harus antara Rp0–Rp1 miliar.");
  if (data.cash + transferTotal !== net)
    throw new Error("Total cash dan transfer harus sama dengan gaji bersih.");
  return {
    workerId: worker.id,
    workerName: worker.name,
    job: worker.job,
    lines,
    adjustments,
    subtotal,
    net,
    cash: data.cash,
    transfers: data.transfers.filter((t) => t.amount > 0),
  };
}
