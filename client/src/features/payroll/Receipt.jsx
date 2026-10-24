import { rup, dateLabel, fileDate } from "../../lib/format";
import usePrintTitle from "../../hooks/usePrintTitle";
import { Printer } from "lucide-react";
export default function Receipt({ row: r, period, onBack }) {
  const deductions = r.adjustments.filter((a) => a.kind === "deduction");
  const deductionTotal = deductions.reduce((sum, a) => sum + Math.abs(Number(a.total)), 0);
  const safeName = r.workerName.replace(/[<>:"/\\|?*\x00-\x1f]/g, " ").trim();
  usePrintTitle(`nota ${safeName}${period?.date ? ` tanggal ${fileDate(period.date)}` : ""}`);
  return (
    <>
      <div className="flex gap-3 mb-4 no-print">
        <button onClick={onBack}>Kembali</button>
        <button className="primary" onClick={() => window.print()}>
          <Printer size={16} />
          Cetak / Simpan PDF
        </button>
      </div>
      <article className="box receipt">
        <div className="receipt-title">
          <div className="brand justify-center">FLOO FASHION</div>
          <h1>Nota gaji mingguan</h1>
          <p>
            No. FJ-{period?.date.replaceAll("-", "")}-
            {String(r.id).padStart(4, "0")}
          </p>
        </div>
        <div className="summaryrow receipt-worker">
          <strong>
            {r.workerName} · {r.job === "jahit" ? "Penjahit" : "Pemotong"}
          </strong>
          <span>{period && dateLabel(period.date)}</span>
        </div>
        <div className="overflow-x-auto"><table>
          <thead>
            <tr>
              <th>Model / pekerjaan</th>
              <th>Jumlah</th>
              <th>Tarif</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {r.lines.map((l, i) => (
              <tr key={i}>
                <td>{l.modelName}</td>
                <td>{l.qty}</td>
                <td>{rup(l.rate)}</td>
                <td>{rup(l.total)}</td>
              </tr>
            ))}
            {r.adjustments.filter((a) => a.kind !== "deduction").map((a, i) => (
              <tr key={"a" + i}>
                <td>
                  {a.label}
                </td>
                <td>{a.qty}</td>
                <td>{rup(a.rate)}</td>
                <td>{rup(a.total)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
        <section className="receipt-payment">
        {deductions.length > 0 && <div className="receipt-deductions">
          <div className="summaryrow"><strong>Gaji sebelum potongan</strong><strong>{rup(Number(r.net) + deductionTotal)}</strong></div>
          {deductions.map((a, i) => <div className="summaryrow" key={i}><span>{a.label}</span><strong>−{rup(Math.abs(Number(a.total)))}</strong></div>)}
        </div>}
        <div className="summaryrow total">
          <strong>Gaji bersih</strong>
          <strong>{rup(r.net)}</strong>
        </div>
        <div className="notice">
          <div className="summaryrow">
            <span>Cash</span>
            <strong>{rup(r.cash)}</strong>
          </div>
          {r.transfers.map((t, i) => (
            <div key={i} className="summaryrow">
              <span>{t.destination}</span>
              <strong>{rup(t.amount)}</strong>
            </div>
          ))}
        </div>
        </section>
        <div className="flex justify-between mt-12 receipt-signatures">
          <span>
            Admin
            <br />
            <br />
            <br />
            ________________
          </span>
          <span>
            Penerima
            <br />
            <br />
            <br />
            ________________
          </span>
        </div>
      </article>
    </>
  );
}
