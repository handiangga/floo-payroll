import { useState } from "react";
import Swal from "sweetalert2";
import { api } from "../../lib/api";
import { Field } from "../../components/ui/Fields";
export default function AdminCreate({ action }) {
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
