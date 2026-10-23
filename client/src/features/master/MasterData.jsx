import { useState } from "react";
import FormModal from "../../components/ui/FormModal";
import { rup } from "../../lib/format";
import { api } from "../../lib/api";
import { ask, success } from "../../lib/dialogs";
import { Field, Amount } from "../../components/ui/Fields";
import { Trash2, Plus, Pencil } from "lucide-react";
export default function Master({ kind, data, owner, refresh, action, busy }) {
  const [query, setQuery] = useState("");
  const [edit, setEdit] = useState(null),
    [creating, setCreating] = useState(false);
  const models = kind === "models";
  const filtered = data.filter((d) => [d.name, d.code, d.destination, d.job === "jahit" ? "Penjahit" : "Pemotong"].filter(Boolean).join(" ").toLocaleLowerCase("id").includes(query.trim().toLocaleLowerCase("id")));
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
            <button disabled={busy} className="primary" title={models ? "Tambah model" : "Tambah pekerja"} aria-label={models ? "Tambah model" : "Tambah pekerja"} onClick={() => open(null)}>
              <Plus size={16} />
              Tambah {models ? "model" : "pekerja"}
            </button>
          )}
        </div>
        <div className="searchbar no-print"><input type="search" aria-label={models ? "Cari model" : "Cari pekerja"} placeholder={models ? "Cari nama atau kode model…" : "Cari nama, jobdes, atau tujuan transfer…"} value={query} onChange={(e) => setQuery(e.target.value)} /><small role="status">{filtered.length} dari {data.length} data</small></div>
        <div className={`overflow-x-auto data-table ${models ? "model-table" : ""}`}>
          <table>
            <thead>
              <tr>
                {(models
                  ? ["Kode", "Model", "Jahit / pcs", "Potong / pcs", "Aksi"]
                  : ["Nama", "Jobdes", "Tujuan transfer", "Aksi"]
                ).map((v, i) => (
                  <th key={i}>{v}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
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
                        <button className="icon-button" title="Edit" aria-label={"Edit " + d.name} disabled={busy} onClick={() => open(d)}><Pencil size={18} /></button>
                        {
                          <button
                            className="text-red-700 icon-button"
                            title="Hapus"
                            aria-label={"Hapus " + d.name}
                            disabled={busy}
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
                                  await success("Data berhasil dihapus.");
                                });
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        }
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <div className="empty"><p>{data.length ? "Tidak ada data yang cocok. Coba kata kunci lain." : models ? "Belum ada model. Gunakan tombol + untuk menambahkan model dan tarif." : "Belum ada pekerja. Gunakan tombol + untuk menambahkan pekerja."}</p></div>}
        </div>
      </div>
      {edit && (
        <FormModal title={`${creating ? "Tambah" : "Edit"} ${models ? "model" : "pekerja"}`} busy={busy} onClose={() => setEdit(null)}>
        <form
          className="modal-form"
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
              await success(creating ? "Data baru berhasil ditambahkan." : "Perubahan sudah disimpan.");
            });
          }}
        >
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
                    money
                    value={edit.sewingRate}
                    onChange={(v) => change("sewingRate", v)}
                  />
                </Field>
                <Field label="Tarif potong / pcs (kosong = belum diatur)">
                  <Amount
                    money
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
            <button disabled={busy} className="primary">{busy ? "Menyimpan…" : "Simpan"}</button>
            <button disabled={busy} type="button" onClick={() => setEdit(null)}>
              Batal
            </button>
          </div>
        </form>
        </FormModal>
      )}
    </>
  );
}
