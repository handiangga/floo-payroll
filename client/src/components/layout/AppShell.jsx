import { useState } from "react";
import { Menu, X } from "lucide-react";
import {
  Scissors,
  LogOut,
  NotebookPen,
  Users,
  History,
  Tags,
} from "lucide-react";
export default function AppShell({
  user,
  tab,
  setTab,
  setNote,
  onLogout,
  children,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="app">
      <div className="mobilebar"><span className="brand">FLOO<small>PRODUKSI</small></span><button aria-label={menuOpen ? "Tutup menu" : "Buka menu"} aria-expanded={menuOpen} aria-controls="main-sidebar" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button></div>
      {menuOpen && <button className="menu-backdrop" aria-label="Tutup menu" onClick={() => setMenuOpen(false)} />}
      <aside id="main-sidebar" className={menuOpen ? "menu-open" : ""} onKeyDown={(e) => { if (e.key === "Escape") setMenuOpen(false); }}>
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
                setMenuOpen(false);
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
              onLogout();
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
        {children}
      </div>
    </div>
  );
}
