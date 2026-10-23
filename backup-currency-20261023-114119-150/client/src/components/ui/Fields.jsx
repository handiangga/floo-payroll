export function Field({ label, children }) {
  return (
    <label className="field">
      {label}
      {children}
    </label>
  );
}
export function Amount({ value, onChange, ...p }) {
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
