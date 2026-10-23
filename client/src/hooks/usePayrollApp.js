import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { api, hasSession } from "../lib/api";
import { ask, fail } from "../lib/dialogs";
import { today } from "../lib/format";
export default function usePayrollApp() {
  const actionLock = useRef(false);
  const [user, setUser] = useState(null),
    [boot, setBoot] = useState({ workers: [], models: [], periods: [] }),
    [periodId, setPeriodId] = useState(""),
    [rows, setRows] = useState([]),
    [tab, setTab] = useState("input"),
    [note, setNote] = useState(null),
    [edit, setEdit] = useState(null),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(hasSession());
  const period = boot.periods.find((p) => p.id === Number(periodId)),
    owner = user?.role === "owner";
  async function refresh(preferred) {
    const b = await api("/bootstrap");
    setBoot(b);
    setPeriodId((previous) =>
      String(
        preferred ||
          b.periods.find((p) => p.id === Number(previous))?.id ||
          b.periods.find((p) => p.status === "open")?.id ||
          b.periods[0]?.id ||
          "",
      ),
    );
    return b;
  }
  useEffect(() => {
    if (hasSession())
      api("/me")
        .then((u) => {
          setUser(u);
          return refresh();
        })
        .catch(fail)
        .finally(() => setLoading(false));
  }, []);
  async function loadRows() {
    if (periodId) setRows(await api(`/periods/${periodId}/payrolls`));
    else setRows([]);
  }
  useEffect(() => {
    loadRows().catch(fail);
    setEdit(null);
    setNote(null);
  }, [periodId]);
  async function action(fn) {
    if (actionLock.current) return;
    actionLock.current = true;
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      fail(e);
    } finally {
      actionLock.current = false;
      setBusy(false);
    }
  }
  async function newPeriod() {
    const { value } = await Swal.fire({
      title: "Buka periode baru",
      input: "date",
      inputValue: today(),
      showCancelButton: true,
      confirmButtonText: "Buka periode",
      cancelButtonText: "Batal",
      confirmButtonColor: "#594631",
    });
    if (value)
      await action(async () => {
        const p = await api("/periods", "POST", { date: value });
        await refresh(p.id);
        setTab("input");
      });
  }
  async function close() {
    if (
      !(await ask(
        "Tutup rekap minggu ini?",
        "Pastikan semua pekerja sudah diinput. Rincian dan nominal akan dikunci.",
      ))
    )
      return;
    await action(async () => {
      await api(`/periods/${periodId}/close`, "POST");
      await refresh();
      setTab("rekap");
    });
  }
  async function reopen() {
    const { value } = await Swal.fire({
      title: "Buka kembali periode",
      input: "text",
      inputLabel: "Alasan perubahan (minimal 5 karakter)",
      showCancelButton: true,
      confirmButtonText: "Buka kembali",
    });
    if (value)
      action(async () => {
        await api(`/periods/${periodId}/reopen`, "POST", { reason: value });
        await refresh();
      });
  }

  return {
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
  };
}
