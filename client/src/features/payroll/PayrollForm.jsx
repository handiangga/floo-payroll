import { useState, useEffect, useRef } from "react";
import { rup } from "../../lib/format";
import { Field, Amount } from "../../components/ui/Fields";
import { Trash2, Plus } from "lucide-react";
export default function PayrollForm({
  boot,
  edit,
  busy,
  saved,
  onSave,
  onCancel,
}) {
  const dirty = useRef(false);
  useEffect(() => {
    const warn = (e) => { if (dirty.current) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
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
      onChangeCapture={() => { dirty.current = true; }}
      onClickCapture={(e) => { const button = e.target.closest("button"); if (button?.type === "button" && button !== e.target.closest('[data-cancel]')) dirty.current = true; }}
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
                <button data-cancel type="button" disabled={busy} onClick={() => { if (!dirty.current || window.confirm("Isian belum disimpan. Batalkan perubahan?")) onCancel(); }}>
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
              title="Tambah model" aria-label="Tambah model"
              type="button"
              onClick={() => setLines([...lines, { modelId: "", qty: 1 }])}
            >
              <Plus size={16} />
              Tambah model pekerjaan
            </button>
          </section>
          <section className="box">
            <div className="sectionhead">
              <h2>Tambahan & potongan</h2>
              <button
                title="Tambah tambahan atau potongan" aria-label="Tambah tambahan atau potongan"
                type="button"
                onClick={() =>
                  setAdj([
                    ...adj,
                    { kind: "addition", label: "", qty: 1, rate: 0 },
                  ])
                }
              >
                <Plus size={16} />
                Tambah penyesuaian
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
                      money
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
        <div className="payroll-summary">
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
              <Amount money required value={cash} onChange={setCash} />
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
                    money
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
              title="Tambah tujuan transfer" aria-label="Tambah tujuan transfer"
              type="button"
              className="w-full"
              onClick={() =>
                setOthers([...others, { destination: "", amount: 0 }])
              }
            >
              <Plus size={18} />
              Tambah tujuan transfer
            </button>
            {mainTransfer < 0 && (
              <p className="error">Pembagian melebihi gaji bersih.</p>
            )}
            {!valid && <p className="notice" role="status">{!worker ? "Pilih pekerja terlebih dahulu." : !lines.length ? "Tambahkan minimal satu model pekerjaan." : evaluated.some((l) => !l.modelId || !(l.qty > 0)) ? "Pilih model dan isi jumlah lebih dari 0 pada setiap baris." : evaluated.some((l) => l.rate == null) ? "Tarif model belum tersedia untuk jobdes ini. Lengkapi di Model & Tarif." : net < 0 ? "Potongan melebihi total upah. Periksa kembali rinciannya." : "Pembagian cash dan transfer melebihi gaji bersih."}</p>}
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
      <div className="mobile-payroll-total no-print"><div><small>Gaji bersih</small><strong>{rup(net)}</strong><small>Cash {rup(cash)} · Transfer {rup(transfer)}</small></div><button className="primary" disabled={busy || !valid}>{busy ? "Menyimpan…" : "Simpan"}</button></div>
    </form>
  );
}
