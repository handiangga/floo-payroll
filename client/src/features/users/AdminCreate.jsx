import { useState } from "react";
import FormModal from "../../components/ui/FormModal";
import Swal from "sweetalert2";
import { UserPlus } from "lucide-react";
import { api } from "../../lib/api";
import { Field } from "../../components/ui/Fields";
export default function AdminCreate({ action, busy }) {
  const [show, setShow] = useState(false),
    [b, setB] = useState({ name: "", email: "", password: "" });
  return (
    <div className="box">
      <button title="Tambah akun admin" aria-label="Tambah akun admin" disabled={busy} onClick={() => setShow(!show)}><UserPlus size={18} />Tambah akun admin</button>
      {show && (
        <FormModal title="Tambah akun admin" busy={busy} onClose={() => setShow(false)}>
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
          <div className="grid gap-3">
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
          <button disabled={busy} className="primary">{busy ? "Menyimpan…" : "Buat admin"}</button>
          <button type="button" disabled={busy} className="ml-2" onClick={() => setShow(false)}>Batal</button>
        </form>
        </FormModal>
      )}
    </div>
  );
}
