import { rup, dateLabel } from "../../lib/format";
import { Printer } from "lucide-react";
export default function Receipt({ row: r, period, onBack }) {
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
          <h1>Nota upah borongan</h1>
          <p>
            No. FJ-{period?.date.replaceAll("-", "")}-
            {String(r.id).padStart(4, "0")}
          </p>
        </div>
        <div className="summaryrow">
          <strong>
            {r.workerName} · {r.job === "jahit" ? "Penjahit" : "Pemotong"}
          </strong>
          <span>{period && dateLabel(period.date)}</span>
        </div>
        <table>
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
            {r.adjustments.map((a, i) => (
              <tr key={"a" + i}>
                <td>
                  {a.label}
                  {a.kind === "deduction" ? " (potongan)" : ""}
                </td>
                <td>{a.qty}</td>
                <td>{rup(a.rate)}</td>
                <td>{rup(a.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
        <div className="flex justify-between mt-12">
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
