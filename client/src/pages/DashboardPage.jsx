import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { rup, dateLabel } from "../lib/format";
import { summarizePeriod, summarizeReport } from "../lib/report";
export default function DashboardPage({ periods, onPeriod }) {
  const months = [...new Set(periods.map((p) => p.date.slice(0, 7)))].sort().reverse();
  const [month, setMonth] = useState(months[0] || "");
  const [report, setReport] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState(""), [retry, setRetry] = useState(0);
  const selectedMonth = months.includes(month) ? month : months[0] || "";
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    const selected = periods.filter((p) => p.date.startsWith(selectedMonth)).sort((a, b) => a.date.localeCompare(b.date));
    Promise.all(selected.map(async (p) => summarizePeriod(p, await api(`/periods/${p.id}/payrolls`))))
      .then((data) => { if (active) setReport(data); })
      .catch((e) => { if (active) setError(e.message || "Laporan belum bisa dimuat."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [periods, selectedMonth, retry]);
  const summary = summarizeReport(report);
  const number = (n) => n.toLocaleString("id-ID", { maximumFractionDigits: 1 });
  const max = Math.max(1, ...report.map((p) => p.net));
  return <>
    <div className="periodbar"><label className="field">Bulan laporan<select value={selectedMonth} onChange={(e) => setMonth(e.target.value)}>{months.map((m) => <option key={m} value={m}>{new Date(`${m}-01T12:00:00`).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</option>)}</select></label><small>Termasuk periode terbuka · data dapat berubah</small></div>
    {loading ? <div className="box empty" role="status">Memuat ringkasan…</div> : error ? <div className="box"><p className="error" role="alert">{error}</p><button onClick={() => setRetry(retry + 1)}>Coba lagi</button></div> : !report.length ? <div className="box empty">Belum ada periode. Buka periode baru untuk mulai mencatat gaji.</div> : <>
      <div className="stats"><div className="box"><small>Total gaji bersih</small><strong>{rup(summary.total)}</strong><small>{report.length} periode tercatat</small></div><div className="box"><small>Rata-rata pekerja / minggu</small><strong>{number(summary.workers)} orang</strong><small>Pekerja yang memiliki catatan gaji</small></div><div className="box"><small>Rata-rata hasil kerja / minggu</small><strong>{number(summary.sewing)} pcs jahit</strong><small>{number(summary.cutting)} pcs potong</small></div></div>
      <div className="box bon-summary"><div><h2>Bon dibayar lewat potongan gaji</h2><p>{summary.bonWorkers} pekerja · bulan terpilih</p></div><strong>{rup(summary.bon)}</strong></div>
      {summary.unclassified > 0 && <p className="notice mb-4">Ada {summary.unclassified} potongan lama tanpa jenis. Belum dimasukkan dalam total bon. Jenis potongan dapat dilengkapi saat mengedit rekap pada periode terbuka.</p>}
      <div className="box"><h2>Tren gaji mingguan</h2><div className="report-trend">{report.map((p) => <button className="trend-item" key={p.id} onClick={() => onPeriod(p.id)} aria-label={`Lihat rekap ${dateLabel(p.date)}, ${rup(p.net)}`}><span>{dateLabel(p.date)}</span><span className="trend-track"><span style={{ width: `${p.net / max * 100}%` }} /></span><strong>{rup(p.net)}</strong></button>)}</div></div>
      <div className="box"><h2>Rekap per periode</h2><p className="hint">Rata-rata dihitung dari seluruh periode tercatat pada bulan ini, termasuk periode kosong. Jahit dan potong dipisahkan agar tidak dianggap sebagai produksi unik.</p><div className="overflow-x-auto"><table><thead><tr>{["Periode", "Pekerja", "Jahit", "Potong", "Total gaji", "Bayar bon", "Status", "Aksi"].map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{[...report].reverse().map((p) => <tr key={p.id}><td>{dateLabel(p.date)}</td><td>{p.workers} orang</td><td>{number(p.sewing)} pcs</td><td>{number(p.cutting)} pcs</td><td>{rup(p.net)}</td><td>{rup(p.bon)}<small className="block">{p.bonWorkerIds.length} pekerja</small></td><td><span className="badge">{p.status === "open" ? "Terbuka" : "Ditutup"}</span></td><td><button onClick={() => onPeriod(p.id)}>Lihat rekap</button></td></tr>)}</tbody></table></div></div>
    </>}
  </>;
}
