import { rup } from "../lib/format";
import { api } from "../lib/api";
import { ask, success } from "../lib/dialogs";
import { Printer, Trash2, Pencil, FileText } from "lucide-react";
export default function RecapPage({
  rows,
  period,
  periodId,
  setNote,
  setEdit,
  setTab,
  action,
  loadRows,
  busy,
}) {
  const sums = rows.reduce(
    (s, r) => ({
      net: s.net + r.net,
      cash: s.cash + r.cash,
      tf: s.tf + r.transfers.reduce((a, t) => a + t.amount, 0),
    }),
    { net: 0, cash: 0, tf: 0 },
  );
  return (
    <>
      <div className="print-heading"><h1>Rekap gaji mingguan</h1><p>Floo Fashion · Periode {period?.date || "—"}</p></div>
      <div className="stats">
        {[
          ["Total gaji", sums.net],
          ["Cash disiapkan", sums.cash],
          ["Total transfer", sums.tf],
        ].map(([label, n]) => (
          <div className="box" key={label}>
            <small>{label}</small>
            <strong>{rup(n)}</strong>
          </div>
        ))}
      </div>
      <div className="box">
        <div className="sectionhead">
          <h2>
            Rekap seluruh pekerja <small>({rows.length})</small>
          </h2>
          <button onClick={() => window.print()}>
            <Printer size={16} />
            Cetak rekap
          </button>
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                {[
                  "Pekerja",
                  "Jobdes",
                  "Gaji bersih",
                  "Cash",
                  "Transfer",
                  <span className="no-print">Aksi</span>,
                ].map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.workerName}</td>
                  <td>
                    <span className="badge">
                      {r.job === "jahit" ? "Penjahit" : "Pemotong"}
                    </span>
                  </td>
                  <td>{rup(r.net)}</td>
                  <td>{rup(r.cash)}</td>
                  <td>
                    {r.transfers.map((t, i) => (
                      <div key={i}>
                        {rup(t.amount)}
                        <small className="block">{t.destination}</small>
                      </div>
                    ))}
                  </td>
                  <td className="no-print">
                    <div className="flex gap-2 flex-wrap">
                      <button className="icon-button" title="Lihat nota" aria-label={"Lihat nota " + r.workerName} onClick={() => setNote(r)}><FileText size={18} /></button>
                      {period?.status === "open" && (
                        <>
                          <button
                            className="icon-button" title="Edit" aria-label={"Edit rekap " + r.workerName}
                            disabled={busy}
                            onClick={() => {
                              setEdit(r);
                              setTab("input");
                            }}
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            aria-label="Hapus rekap"
                            className="icon-button text-red-700" title="Hapus rekap"
                            disabled={busy}
                            onClick={async () => {
                              if (
                                await ask(
                                  "Hapus rekap " + r.workerName + "?",
                                  "Data di periode ini akan dihapus.",
                                )
                              )
                                action(async () => {
                                  await api(
                                    `/periods/${periodId}/payrolls/${r.id}`,
                                    "DELETE",
                                  );
                                  await loadRows();
                                  await success("Rekap berhasil dihapus.");
                                });
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && (
            <p className="empty">Belum ada rekap pada periode ini.</p>
          )}
        </div>
      </div>
      <p className="hint">
        Pembagian cash dan transfer adalah catatan alokasi gaji.
      </p>
    </>
  );
}
