import { dateLabel } from "../lib/format";
export default function HistoryPage({ periods, setPeriodId, setTab }) {
  return (
    <div className="box">
      <h2>Arsip mingguan</h2>
      {periods.map((p) => (
        <div className="historyrow" key={p.id}>
          <div>
            <strong>{dateLabel(p.date)}</strong>
            <small className="block">
              {p.status === "closed"
                ? "Ditutup " +
                  new Date(p.closedAt).toLocaleString("id-ID", {
                    timeZone: "Asia/Jakarta",
                  })
                : "Masih terbuka"}
            </small>
          </div>
          <button
            onClick={() => {
              setPeriodId(String(p.id));
              setTab("rekap");
            }}
          >
            Lihat rekap
          </button>
        </div>
      ))}
      {!periods.length && <p>Belum ada periode.</p>}
    </div>
  );
}
