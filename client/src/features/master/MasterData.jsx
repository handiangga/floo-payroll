import { useState } from "react";
import { rup } from "../../lib/format";
import { api } from "../../lib/api";
import { ask } from "../../lib/dialogs";
import { Field, Amount } from "../../components/ui/Fields";
import { Trash2, Plus } from "lucide-react";
export default function Master({ kind, data, owner, refresh, action }) {
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
