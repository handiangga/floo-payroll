export function summarizePeriod(period, rows) {
  return { ...period, net: rows.reduce((sum, row) => sum + Number(row.net), 0), workers: new Set(rows.map((r) => r.workerId)).size,
    sewing: rows.filter((r) => r.job === "jahit").reduce((sum, r) => sum + r.lines.reduce((n, l) => n + Number(l.qty), 0), 0),
    cutting: rows.filter((r) => r.job === "potong").reduce((sum, r) => sum + r.lines.reduce((n, l) => n + Number(l.qty), 0), 0) };
}
export function summarizeReport(periods) {
  const count = periods.length;
  const sum = (key) => periods.reduce((n, p) => n + p[key], 0);
  return { total: sum("net"), workers: count ? sum("workers") / count : 0, sewing: count ? sum("sewing") / count : 0, cutting: count ? sum("cutting") / count : 0 };
}
