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
