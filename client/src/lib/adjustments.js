// Fold historical quantity-based deductions into one amount without changing value.
export const normalizeDeduction = (a) => a.kind === "deduction"
  ? { ...a, qty: 1, rate: Number(a.qty) * Number(a.rate) }
  : { ...a };
