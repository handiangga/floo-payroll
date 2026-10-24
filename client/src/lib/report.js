export function summarizePeriod(period, rows) {
  const bonRows = rows.filter((r) => (r.adjustments || []).some((a) => a.kind === "deduction" && a.category === "bon" && Number(a.total) !== 0));
  const bonWorkerIds = [...new Set(bonRows.map((r) => r.workerId))];
  const bon = rows.reduce((sum, r) => sum + (r.adjustments || []).filter((a) => a.kind === "deduction" && a.category === "bon").reduce((n, a) => n + Math.abs(Number(a.total)), 0), 0);
  const unclassified = rows.reduce((sum, r) => sum + (r.adjustments || []).filter((a) => a.kind === "deduction" && !a.category).length, 0);
  return { ...period, bon, bonWorkerIds, unclassified, net: rows.reduce((sum, row) => sum + Number(row.net), 0), workers: new Set(rows.map((r) => r.workerId)).size,
    sewing: rows.filter((r) => r.job === "jahit").reduce((sum, r) => sum + r.lines.reduce((n, l) => n + Number(l.qty), 0), 0),
    cutting: rows.filter((r) => r.job === "potong").reduce((sum, r) => sum + r.lines.reduce((n, l) => n + Number(l.qty), 0), 0) };
}
export function summarizeReport(periods) {
  const count = periods.length;
  const sum = (key) => periods.reduce((n, p) => n + p[key], 0);
  return { total: sum("net"), bon: periods.reduce((n, p) => n + (p.bon || 0), 0), bonWorkers: new Set(periods.flatMap((p) => p.bonWorkerIds || [])).size, unclassified: periods.reduce((n, p) => n + (p.unclassified || 0), 0), workers: count ? sum("workers") / count : 0, sewing: count ? sum("sewing") / count : 0, cutting: count ? sum("cutting") / count : 0 };
}
