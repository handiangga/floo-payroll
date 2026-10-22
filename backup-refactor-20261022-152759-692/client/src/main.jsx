import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import Swal from "sweetalert2";
import {
  Scissors,
  Plus,
  Trash2,
  Printer,
  LogOut,
  LockKeyhole,
  NotebookPen,
  Users,
  History,
  Tags,
} from "lucide-react";
import "./style.css";
const rup = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID"),
  API = import.meta.env.VITE_API_URL || "/api",
  today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()),
  dateLabel = (d) =>
    new Date(d + "T12:00:00").toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
let token = sessionStorage.getItem("floo_token") || "";
async function api(path, method = "GET", body) {
  const res = await fetch(API + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) {
      token = "";
      sessionStorage.removeItem("floo_token");
    }
    throw Error(data.error || "Permintaan gagal");
  }
  return data;
}
const fail = (e) =>
  Swal.fire({
    icon: "error",
    title: "Belum berhasil",
    text: e.message,
    confirmButtonColor: "#594631",
  });
const ask = async (title, text) =>
  (
    await Swal.fire({
      title,
      text,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, lanjutkan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#594631",
    })
  ).isConfirmed;
function Field({ label, children }) {
  return (
    <label className="field">
      {label}
      {children}
    </label>
  );
}
function Amount({ value, onChange, ...p }) {
  return (
    <input
      type="number"
      min="0"
      step="1"
      value={value}
      onChange={(e) =>
        onChange(e.target.value === "" ? "" : Number(e.target.value))
      }
      {...p}
    />
  );
}
function App() {
  const [user, setUser] = useState(null),
    [boot, setBoot] = useState({ workers: [], models: [], periods: [] }),
    [periodId, setPeriodId] = useState(""),
    [rows, setRows] = useState([]),
    [tab, setTab] = useState("input"),
    [note, setNote] = useState(null),
    [edit, setEdit] = useState(null),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(!!token);
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
    if (token)
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
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  async function newPeriod() {
    const { value } = await Swal.fire({
      title: "Buka periode baru",
      input: "date",
      inputValue: today,
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
  const sums = rows.reduce(
    (s, r) => ({
      net: s.net + r.net,
      cash: s.cash + r.cash,
      tf: s.tf + r.transfers.reduce((a, t) => a + t.amount, 0),
    }),
    { net: 0, cash: 0, tf: 0 },
  );
  return (
    <div className="app">
      <aside>
        <div className="brand">
          <Scissors size={23} />
          <div>
            FLOO<small>PRODUKSI</small>
          </div>
        </div>
        <nav>
          {[
            ["input", "Input gaji", NotebookPen],
            ["rekap", "Rekap mingguan", Users],
            ["history", "Riwayat periode", History],
            ["models", "Model & tarif", Tags],
            ["workers", "Data pekerja", Users],
          ].map(([id, label, Icon]) => (
            <button
              key={id}
              className={tab === id ? "selected" : ""}
              onClick={() => {
                setTab(id);
                setNote(null);
              }}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <div className="asidebottom">
          <small>
            {user.name} · {user.role}
          </small>
          <button
            onClick={() => {
              token = "";
              sessionStorage.removeItem("floo_token");
              setUser(null);
            }}
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header>
          <span>Penggajian borongan</span>
          <span className="badge">Floo Fashion</span>
        </header>
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
                        await api(
                          `/periods/${periodId}/payrolls`,
                          "POST",
                          data,
                        );
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
                <>
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
                              "",
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
                                    <small className="block">
                                      {t.destination}
                                    </small>
                                  </div>
                                ))}
                              </td>
                              <td>
                                <div className="flex gap-2 flex-wrap">
                                  <button onClick={() => setNote(r)}>
                                    Nota
                                  </button>
                                  {period?.status === "open" && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setEdit(r);
                                          setTab("input");
                                        }}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        aria-label="Hapus rekap"
                                        onClick={async () => {
                                          if (
                                            await ask(
                                              "Hapus rekap " +
                                                r.workerName +
                                                "?",
                                              "Data di periode ini akan dihapus.",
                                            )
                                          )
                                            action(async () => {
                                              await api(
                                                `/periods/${periodId}/payrolls/${r.id}`,
                                                "DELETE",
                                              );
                                              await loadRows();
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
                        <p className="empty">
                          Belum ada rekap pada periode ini.
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="hint">
                    Pembagian cash dan transfer adalah catatan alokasi gaji.
                  </p>
                </>
              )}
              {tab === "history" && (
                <div className="box">
                  <h2>Arsip mingguan</h2>
                  {boot.periods.map((p) => (
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
                  {!boot.periods.length && <p>Belum ada periode.</p>}
                </div>
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
      </div>
    </div>
  );
}
function Login({ onLogin }) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div className="login">
      <form
        className="box"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const d = await api("/auth/login", "POST", { email, password });
            token = d.token;
            sessionStorage.setItem("floo_token", token);
            await onLogin(d.user);
          } catch (e) {
            fail(e);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="brand">
          <Scissors />
          <div>
            FLOO<small>PRODUKSI</small>
          </div>
        </div>
        <h1>Selamat datang</h1>
        <p>Masuk untuk mengelola gaji mingguan.</p>
        <Field label="Email">
          <input
            type="email"
            required
            value={email}
            autoComplete="username"
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            required
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <button className="primary w-full" disabled={busy}>
          {busy ? "Memeriksa…" : "Masuk"}
        </button>
      </form>
    </div>
  );
}
function PayrollForm({ boot, edit, busy, saved, onSave, onCancel }) {
  const [workerId, setWorker] = useState(edit?.workerId || ""),
    [lines, setLines] = useState(
      edit?.lines.map((l) => ({ modelId: l.modelId, qty: l.qty })) || [
        { modelId: "", qty: 1 },
      ],
    ),
    [adj, setAdj] = useState(edit?.adjustments || []),
    [cash, setCash] = useState(edit?.cash || 0),
    [dest, setDest] = useState(edit?.transfers[0]?.destination || ""),
    [others, setOthers] = useState(edit?.transfers.slice(1) || []);
  const worker =
    boot.workers.find((w) => w.id === Number(workerId)) ||
    (edit ? { id: edit.workerId, name: edit.workerName, job: edit.job } : null);
  const availableModels = [...boot.models];
  if (edit)
    for (const line of edit.lines) {
      if (!availableModels.some((m) => m.id === line.modelId))
        availableModels.push({
          id: line.modelId,
          name: line.modelName + " (dihapus)",
          sewingRate: line.rate,
          cuttingRate: line.rate,
        });
    }
  const evaluated = lines.map((l) => {
      const m = availableModels.find((m) => m.id === Number(l.modelId));
      const rate = worker?.job === "jahit" ? m?.sewingRate : m?.cuttingRate;
      return { ...l, rate, total: Number(l.qty) * Number(rate || 0) };
    }),
    subtotal = evaluated.reduce((s, l) => s + l.total, 0),
    adjust = adj.reduce(
      (s, a) =>
        s + Number(a.qty) * Number(a.rate) * (a.kind === "deduction" ? -1 : 1),
      0,
    ),
    net = subtotal + adjust,
    transfer = net - Number(cash),
    otherTotal = others.reduce((s, t) => s + Number(t.amount), 0),
    mainTransfer = transfer - otherTotal,
    valid =
      worker &&
      net >= 0 &&
      cash >= 0 &&
      mainTransfer >= 0 &&
      lines.length > 0 &&
      evaluated.every(
        (l) =>
          l.modelId && l.qty > 0 && l.rate !== null && l.rate !== undefined,
      );
  function patch(i, key, value) {
    setLines(lines.map((l, j) => (j === i ? { ...l, [key]: value } : l)));
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onSave({
          workerId: Number(workerId),
          lines: lines.map((l) => ({
            modelId: Number(l.modelId),
            qty: Number(l.qty),
          })),
          adjustments: adj.map((a) => ({
            ...a,
            qty: Number(a.qty),
            rate: Number(a.rate),
          })),
          cash: Number(cash),
          transfers: [
            ...(mainTransfer > 0
              ? [{ destination: dest, amount: mainTransfer }]
              : []),
            ...others.map((t) => ({ ...t, amount: Number(t.amount) })),
          ],
          replace: !!edit,
        });
      }}
    >
      <div className="formgrid">
        <div>
          <section className="box">
            <div className="sectionhead">
              <h2>{edit ? "Edit rekap" : "Pekerjaan minggu ini"}</h2>
              {edit && (
                <button type="button" onClick={onCancel}>
                  Batal edit
                </button>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nama pekerja">
                <select
                  required
                  disabled={!!edit}
                  value={workerId}
                  onChange={(e) => {
                    setWorker(Number(e.target.value));
                    setDest(
                      boot.workers.find((w) => w.id === Number(e.target.value))
                        ?.destination || "",
                    );
                  }}
                >
                  <option value="">Pilih pekerja</option>
                  {edit &&
                    !boot.workers.some((w) => w.id === edit.workerId) && (
                      <option value={edit.workerId}>
                        {edit.workerName} (dihapus)
                      </option>
                    )}
                  {boot.workers
                    .filter(
                      (w) => edit || !saved.some((r) => r.workerId === w.id),
                    )
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Jobdes otomatis">
                <input
                  readOnly
                  value={
                    worker
                      ? worker.job === "jahit"
                        ? "Penjahit"
                        : "Pemotong"
                      : "—"
                  }
                />
              </Field>
            </div>
            <div className="lineheading">
              <span>Model</span>
              <span>Jumlah</span>
              <span>Subtotal</span>
              <span />
            </div>
            {evaluated.map((l, i) => (
              <div className="jobrow" key={i}>
                <select
                  aria-label="Model"
                  required
                  value={l.modelId}
                  onChange={(e) => patch(i, "modelId", Number(e.target.value))}
                >
                  <option value="">Pilih model</option>
                  {availableModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <Amount
                  aria-label="Jumlah pcs"
                  min="1"
                  required
                  value={l.qty}
                  onChange={(v) => patch(i, "qty", v)}
                />
                <div className="text-right">
                  <small className="block">
                    {l.modelId && worker
                      ? l.rate == null
                        ? "Tarif belum diisi"
                        : rup(l.rate) + "/pcs"
                      : "—"}
                  </small>
                  <strong>{rup(l.total)}</strong>
                </div>
                <button
                  type="button"
                  aria-label="Hapus model"
                  onClick={() => setLines(lines.filter((_, j) => j !== i))}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <button
              className="w-full border-dashed mt-4"
              type="button"
              onClick={() => setLines([...lines, { modelId: "", qty: 1 }])}
            >
              <Plus size={16} />
              Tambah model
            </button>
          </section>
          <section className="box">
            <div className="sectionhead">
              <h2>Tambahan & potongan</h2>
              <button
                type="button"
                onClick={() =>
                  setAdj([
                    ...adj,
                    { kind: "addition", label: "", qty: 1, rate: 0 },
                  ])
                }
              >
                <Plus size={16} />
                Tambah
              </button>
            </div>
            {adj.length === 0 && (
              <p className="hint">
                Uang makan, revisi berbayar, selendang, atau potongan kasbon.
              </p>
            )}
            {adj.map((a, i) => {
              const change = (k, v) =>
                setAdj(adj.map((x, j) => (i === j ? { ...x, [k]: v } : x)));
              return (
                <div className="adjustrow" key={i}>
                  <Field label="Jenis">
                    <select
                      value={a.kind}
                      onChange={(e) => change("kind", e.target.value)}
                    >
                      <option value="addition">Tambahan</option>
                      <option value="deduction">Potongan</option>
                    </select>
                  </Field>
                  <Field label="Keterangan">
                    <input
                      required
                      value={a.label}
                      onChange={(e) => change("label", e.target.value)}
                    />
                  </Field>
                  <Field label="Jumlah">
                    <Amount
                      min="1"
                      required
                      value={a.qty}
                      onChange={(v) => change("qty", v)}
                    />
                  </Field>
                  <Field label="Tarif (Rp)">
                    <Amount
                      required
                      value={a.rate}
                      onChange={(v) => change("rate", v)}
                    />
                  </Field>
                  <button
                    type="button"
                    aria-label="Hapus tambahan"
                    onClick={() => setAdj(adj.filter((_, j) => j !== i))}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </section>
        </div>
        <div>
          <section className="box">
            <h2>Ringkasan gaji</h2>
            <div className="summaryrow">
              <span>Upah {worker?.job === "potong" ? "potong" : "jahit"}</span>
              <strong>{rup(subtotal)}</strong>
            </div>
            <div className="summaryrow">
              <span>Tambahan bersih</span>
              <span>{rup(adjust)}</span>
            </div>
            <div className="summaryrow total">
              <span>Gaji bersih</span>
              <strong>{rup(net)}</strong>
            </div>
          </section>
          <section className="box">
            <h2>Pembagian gaji</h2>
            <Field label="Cash yang diminta (Rp)">
              <Amount required value={cash} onChange={setCash} />
            </Field>
            <div className="summaryrow">
              <span>Sisa transfer otomatis</span>
              <strong>{rup(transfer)}</strong>
            </div>
            <Field label="Tujuan transfer utama">
              <input
                required={mainTransfer > 0}
                placeholder="Bank / e-wallet · nomor · nama penerima"
                value={dest}
                onChange={(e) => setDest(e.target.value)}
              />
            </Field>
            <div className="summaryrow">
              <small>Nominal tujuan utama</small>
              <strong>{rup(mainTransfer)}</strong>
            </div>
            {others.map((t, i) => (
              <div key={i} className="transferrow">
                <Field label="Tujuan tambahan">
                  <input
                    required
                    value={t.destination}
                    onChange={(e) =>
                      setOthers(
                        others.map((x, j) =>
                          j === i ? { ...x, destination: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </Field>
                <Field label="Nominal (Rp)">
                  <Amount
                    required
                    value={t.amount}
                    onChange={(v) =>
                      setOthers(
                        others.map((x, j) =>
                          j === i ? { ...x, amount: v } : x,
                        ),
                      )
                    }
                  />
                </Field>
                <button
                  type="button"
                  aria-label="Hapus tujuan"
                  onClick={() => setOthers(others.filter((_, j) => j !== i))}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="w-full"
              onClick={() =>
                setOthers([...others, { destination: "", amount: 0 }])
              }
            >
              + Bagi ke tujuan lain
            </button>
            {mainTransfer < 0 && (
              <p className="error">Pembagian melebihi gaji bersih.</p>
            )}
            <button className="primary w-full mt-4" disabled={busy || !valid}>
              {busy
                ? "Menyimpan…"
                : edit
                  ? "Simpan perubahan"
                  : "Simpan ke rekap"}
            </button>
          </section>
        </div>
      </div>
    </form>
  );
}
function Master({ kind, data, owner, refresh, action }) {
  const [edit, setEdit] = useState(null),
    [creating, setCreating] = useState(false);
  const models = kind === "models";
  const empty = models
    ? { code: "", name: "", sewingRate: "", cuttingRate: "" }
    : { name: "", job: "jahit", destination: "" };
  function open(row) {
    setEdit(
      row
        ? {
            ...row,
            sewingRate: row.sewingRate ?? "",
            cuttingRate: row.cuttingRate ?? "",
          }
        : empty,
    );
    setCreating(!row);
  }
  const change = (k, v) => setEdit({ ...edit, [k]: v });
  return (
    <>
      <div className="box">
        <div className="sectionhead">
          <h2>{models ? "Harga berdasarkan jobdes" : "Pekerja produksi"}</h2>
          {owner && (
            <button className="primary" onClick={() => open(null)}>
              <Plus size={16} />
              Tambah {models ? "model" : "pekerja"}
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                {(models
                  ? ["Kode", "Model", "Jahit / pcs", "Potong / pcs", ""]
                  : ["Nama", "Jobdes", "Tujuan transfer", ""]
                ).map((v, i) => (
                  <th key={i}>{v}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.id}>
                  {models ? (
                    <>
                      <td>{d.code}</td>
                      <td>{d.name}</td>
                      <td>
                        {d.sewingRate == null
                          ? "Belum diisi"
                          : rup(d.sewingRate)}
                      </td>
                      <td>
                        {d.cuttingRate == null
                          ? "Belum diisi"
                          : rup(d.cuttingRate)}
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{d.name}</td>
                      <td>{d.job === "jahit" ? "Penjahit" : "Pemotong"}</td>
                      <td>{d.destination || "—"}</td>
                    </>
                  )}
                  <td>
                    {owner && (
                      <div className="flex gap-2">
                        <button onClick={() => open(d)}>Edit</button>
                        {
                          <button
                            className="text-red-700"
                            onClick={async () => {
                              if (
                                await ask(
                                  (models ? "Hapus model " : "Hapus pegawai ") +
                                    d.name +
                                    "?",
                                  models
                                    ? "Model dihapus dari daftar dan pilihan input. Rincian gaji serta nota lama tetap tersimpan."
                                    : "Pegawai dihapus dari daftar dan pilihan input. Riwayat gaji serta nota tetap tersimpan.",
                                )
                              )
                                action(async () => {
                                  await api("/" + kind + "/" + d.id, "DELETE");
                                  if (edit?.id === d.id) setEdit(null);
                                  await refresh();
                                });
                            }}
                          >
                            <Trash2 size={15} />
                            Hapus
                          </button>
                        }
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {edit && (
        <form
          className="box"
          onSubmit={(e) => {
            e.preventDefault();
            action(async () => {
              const body = models
                ? {
                    code: edit.code,
                    name: edit.name,
                    sewingRate:
                      edit.sewingRate === "" ? null : Number(edit.sewingRate),
                    cuttingRate:
                      edit.cuttingRate === "" ? null : Number(edit.cuttingRate),
                  }
                : {
                    name: edit.name,
                    job: edit.job,
                    destination: edit.destination,
                  };
              await api(
                "/" + kind + (creating ? "" : "/" + edit.id),
                creating ? "POST" : "PUT",
                body,
              );
              await refresh();
              setEdit(null);
            });
          }}
        >
          <h2>
            {creating ? "Tambah" : "Edit"} {models ? "model" : "pekerja"}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {models && (
              <Field label="Kode model">
                <input
                  required
                  value={edit.code}
                  onChange={(e) => change("code", e.target.value)}
                />
              </Field>
            )}
            <Field label="Nama">
              <input
                required
                value={edit.name}
                onChange={(e) => change("name", e.target.value)}
              />
            </Field>
            {models ? (
              <>
                <Field label="Tarif jahit / pcs (kosong = belum diatur)">
                  <Amount
                    value={edit.sewingRate}
                    onChange={(v) => change("sewingRate", v)}
                  />
                </Field>
                <Field label="Tarif potong / pcs (kosong = belum diatur)">
                  <Amount
                    value={edit.cuttingRate}
                    onChange={(v) => change("cuttingRate", v)}
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="Jobdes">
                  <select
                    value={edit.job}
                    onChange={(e) => change("job", e.target.value)}
                  >
                    <option value="jahit">Penjahit</option>
                    <option value="potong">Pemotong</option>
                  </select>
                </Field>
                <Field label="Tujuan transfer default">
                  <input
                    value={edit.destination}
                    onChange={(e) => change("destination", e.target.value)}
                  />
                </Field>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <button className="primary">Simpan</button>
            <button type="button" onClick={() => setEdit(null)}>
              Batal
            </button>
          </div>
        </form>
      )}
    </>
  );
}
function Receipt({ row: r, period, onBack }) {
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
function AdminCreate({ action }) {
  const [show, setShow] = useState(false),
    [b, setB] = useState({ name: "", email: "", password: "" });
  return (
    <div className="box">
      <button onClick={() => setShow(!show)}>Tambah akun admin</button>
      {show && (
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            action(async () => {
              await api("/users", "POST", b);
              setB({ name: "", email: "", password: "" });
              setShow(false);
              Swal.fire("Berhasil", "Akun admin sudah dibuat.", "success");
            });
          }}
        >
          <div className="grid sm:grid-cols-3 gap-3">
            {["name", "email", "password"].map((k) => (
              <Field label={k === "name" ? "Nama" : k} key={k}>
                <input
                  required
                  type={k === "name" ? "text" : k}
                  minLength={k === "password" ? 12 : 1}
                  value={b[k]}
                  onChange={(e) => setB({ ...b, [k]: e.target.value })}
                />
              </Field>
            ))}
          </div>
          <button className="primary">Buat admin</button>
        </form>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
