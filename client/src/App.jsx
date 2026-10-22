import Swal from "sweetalert2";
import { Plus, LockKeyhole } from "lucide-react";
import { api, clearSession } from "./lib/api";
import { dateLabel } from "./lib/format";
import { Field } from "./components/ui/Fields";
import AppShell from "./components/layout/AppShell";
import usePayrollApp from "./hooks/usePayrollApp";
import Login from "./pages/LoginPage";
import RecapPage from "./pages/RecapPage";
import HistoryPage from "./pages/HistoryPage";
import PayrollForm from "./features/payroll/PayrollForm";
import Receipt from "./features/payroll/Receipt";
import Master from "./features/master/MasterData";
import AdminCreate from "./features/users/AdminCreate";
export default function App() {
  const {
    user,
    setUser,
    boot,
    periodId,
    setPeriodId,
    rows,
    tab,
    setTab,
    note,
    setNote,
    edit,
    setEdit,
    busy,
    loading,
    period,
    owner,
    refresh,
    loadRows,
    action,
    newPeriod,
    close,
    reopen,
  } = usePayrollApp();
  if (loading)
    return (
      <div className="login">
        <div className="box">Memuat Floo…</div>
      </div>
    );
  if (!user)
    return (
      <Login
        onLogin={async (u) => {
          setUser(u);
          await refresh();
        }}
      />
    );

  return (
    <AppShell
      {...{ user, tab, setTab, setNote }}
      onLogout={() => {
        clearSession();
        setUser(null);
      }}
    >
      <main>
        <div className="pagehead">
          <div>
            <div className="eyebrow">GAJI PRODUKSI</div>
            <h1>
              {
                {
                  input: "Input gaji mingguan",
                  rekap: "Rekap mingguan",
                  history: "Riwayat periode",
                  models: "Model & tarif",
                  workers: "Data pekerja",
                }[tab]
              }
            </h1>
            <p>Satu kali input. Rincian, nota, dan rekap otomatis.</p>
          </div>
          <button
            className="primary"
            disabled={busy || boot.periods.some((p) => p.status === "open")}
            onClick={newPeriod}
          >
            <Plus size={17} />
            Buka periode baru
          </button>
        </div>
        {!["models", "workers"].includes(tab) && (
          <div className="periodbar">
            <Field label="Periode Sabtu">
              <select
                value={periodId}
                onChange={(e) => setPeriodId(e.target.value)}
              >
                <option value="">Pilih periode</option>
                {boot.periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {dateLabel(p.date)} ·{" "}
                    {p.status === "open" ? "Terbuka" : "Ditutup"}
                  </option>
                ))}
              </select>
            </Field>
            {period && (
              <>
                <span className="badge">
                  {period.status === "open"
                    ? "Periode terbuka"
                    : "Rekap dikunci"}
                </span>
                {period.status === "open" ? (
                  <button disabled={busy || !rows.length} onClick={close}>
                    <LockKeyhole size={16} />
                    Tutup rekap
                  </button>
                ) : (
                  owner && (
                    <button disabled={busy} onClick={reopen}>
                      Buka kembali
                    </button>
                  )
                )}
              </>
            )}
          </div>
        )}
        {note ? (
          <Receipt row={note} period={period} onBack={() => setNote(null)} />
        ) : (
          <>
            {tab === "input" &&
              (period?.status === "open" ? (
                <PayrollForm
                  key={periodId + "-" + (edit?.id || "new")}
                  boot={boot}
                  edit={edit}
                  busy={busy}
                  saved={rows}
                  onCancel={() => setEdit(null)}
                  onSave={(data) =>
                    action(async () => {
                      await api(`/periods/${periodId}/payrolls`, "POST", data);
                      await loadRows();
                      setEdit(null);
                      setTab("rekap");
                      Swal.fire({
                        icon: "success",
                        title: "Rekap tersimpan",
                        timer: 1100,
                        showConfirmButton: false,
                      });
                    })
                  }
                />
              ) : (
                <div className="box empty">
                  {period
                    ? "Periode sudah ditutup. Buka Rekap atau buat periode baru."
                    : "Buka periode Sabtu untuk mulai mencatat gaji."}
                </div>
              ))}
            {tab === "rekap" && (
              <RecapPage
                {...{
                  rows,
                  period,
                  periodId,
                  setNote,
                  setEdit,
                  setTab,
                  action,
                  loadRows,
                }}
              />
            )}
            {tab === "history" && (
              <HistoryPage
                periods={boot.periods}
                {...{ setPeriodId, setTab }}
              />
            )}
            {tab === "models" && (
              <Master
                kind="models"
                data={boot.models}
                owner={owner}
                refresh={refresh}
                action={action}
              />
            )}
            {tab === "workers" && (
              <>
                <Master
                  kind="workers"
                  data={boot.workers}
                  owner={owner}
                  refresh={refresh}
                  action={action}
                />
                {owner && <AdminCreate action={action} />}
              </>
            )}
          </>
        )}
      </main>
    </AppShell>
  );
}
