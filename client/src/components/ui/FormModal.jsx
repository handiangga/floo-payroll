import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function FormModal({ title, busy, onClose, children }) {
  const panel = useRef(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  const dirty = useRef(false);
  const requestClose = () => {
    if (!busyRef.current && (!dirty.current || window.confirm("Isian belum disimpan. Tutup form dan buang perubahan?"))) onClose();
  };
  closeRef.current = requestClose;
  busyRef.current = busy;
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current.querySelector("input, select, button")?.focus();
    function keydown(e) {
      if (document.querySelector(".swal2-container")) return;
      if (e.key === "Escape" && !busyRef.current) closeRef.current();
      if (e.key !== "Tab") return;
      const items = [...panel.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]')];
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
    document.addEventListener("keydown", keydown);
    const beforeUnload = (e) => { if (dirty.current) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", keydown);
      window.removeEventListener("beforeunload", beforeUnload);
      previous?.focus();
    };
  }, []);
  return createPortal(
    <div className="form-modal-overlay">
      <section ref={panel} onChangeCapture={() => { dirty.current = true; }} onClickCapture={(e) => { const button = e.target.closest("button"); if (button?.textContent.trim() === "Batal") { e.preventDefault(); e.stopPropagation(); requestClose(); } }} className="form-modal" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={busy}>
        <div className="form-modal-heading"><h2 id={titleId}>{title}</h2><button className="icon-button" type="button" disabled={busy} title="Tutup" aria-label="Tutup form" onClick={requestClose}><X size={20} /></button></div>
        {children}
      </section>
    </div>, document.body,
  );
}
