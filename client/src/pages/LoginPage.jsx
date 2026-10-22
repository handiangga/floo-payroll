import { useState } from "react";
import { api, setSession } from "../lib/api";
import { fail } from "../lib/dialogs";
import { Field } from "../components/ui/Fields";
import { Scissors } from "lucide-react";
export default function Login({ onLogin }) {
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
            setSession(d.token);
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
