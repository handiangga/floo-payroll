export function Field({ label, children }) {
  return (
    <label className="field">
      {label}
      {children}
    </label>
  );
}
export function Amount({ value, onChange, money = false, ...p }) {
  if (money) {
    const format = (digits) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return (
      <input
        {...p}
        type="text"
        inputMode="numeric"
        value={value === "" || value == null ? "" : format(String(value))}
        onChange={(e) => {
          const input = e.target;
          const raw = input.value;
          const caret = input.selectionStart ?? raw.length;
          const digitsBefore = raw.slice(0, caret).replace(/\D/g, "").length;
          const digits = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
          const number = digits === "" ? "" : Number(digits);
          if (number !== "" && !Number.isSafeInteger(number)) return;
          const formatted = format(digits);
          input.value = formatted;
          let position = 0;
          let count = 0;
          while (position < formatted.length && count < digitsBefore) {
            if (/\d/.test(formatted[position])) count++;
            position++;
          }
          input.setSelectionRange(position, position);
          onChange(number);
        }}
      />
    );
  }
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
