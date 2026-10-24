import { test } from "node:test";
import assert from "node:assert/strict";
import { calculate } from "../src/calculation.js";
const models = [
  {
    id: 1,
    name: "Dres A",
    sewingRate: 30000,
    cuttingRate: 12000,
  },
];
const worker = { id: 1, name: "Ani", job: "jahit" };
const base = {
  workerId: 1,
  lines: [{ modelId: 1, qty: 5 }],
  adjustments: [],
  cash: 50000,
  transfers: [{ destination: "BRI", amount: 100000 }],
};
test("deduction category is preserved without changing payroll math", () => {
  const result = calculate({ ...base, adjustments: [{ kind: "deduction", category: "bon", label: "Bon", qty: 1, rate: 10000 }], transfers: [{ destination: "BRI", amount: 90000 }] }, worker, models);
  assert.equal(result.adjustments[0].category, "bon");
  assert.equal(result.net, 140000);
});
test("tarif jahit dan snapshot transaksi", () => {
  const r = calculate(base, worker, models);
  models[0].sewingRate = 40000;
  assert.equal(r.lines[0].rate, 30000);
  models[0].sewingRate = 30000;
  assert.equal(r.net, 150000);
});
test("tarif potong berdasarkan jobdes", () =>
  assert.equal(
    calculate(
      {
        ...base,
        cash: 0,
        transfers: [{ destination: "DANA", amount: 60000 }],
      },
      { ...worker, job: "potong" },
      models,
    ).net,
    60000,
  ));
test("tambahan, potongan dan dua tujuan transfer", () =>
  assert.equal(
    calculate(
      {
        ...base,
        adjustments: [
          { kind: "addition", label: "Makan", qty: 6, rate: 20000 },
          { kind: "deduction", label: "Kasbon", qty: 1, rate: 10000 },
        ],
        transfers: [
          { destination: "BRI", amount: 200000 },
          { destination: "DANA", amount: 10000 },
        ],
      },
      worker,
      models,
    ).net,
    260000,
  ));
for (const [label, patch, pattern] of [
  ["pembagian salah", { cash: 0 }, /cash/],
  [
    "model duplikat",
    {
      lines: [
        { modelId: 1, qty: 2 },
        { modelId: 1, qty: 3 },
      ],
    },
    /duplikat/,
  ],
  ["pecahan pcs", { lines: [{ modelId: 1, qty: 1.5 }] }, /expected int/],
])
  test(label, () =>
    assert.throws(
      () => calculate({ ...base, ...patch }, worker, models),
      pattern,
    ),
  );
test("tarif belum diisi bukan nol", () =>
  assert.throws(
    () => calculate(base, worker, [{ ...models[0], sewingRate: null }]),
    /belum diisi/,
  ));
test("tarif nol yang sengaja diatur diperbolehkan", () =>
  assert.equal(
    calculate({ ...base, bookTotal: 0, cash: 0, transfers: [] }, worker, [
      { ...models[0], sewingRate: 0 },
    ]).net,
    0,
  ));

test("simpan tanpa total buku dan status aktif", () => {
  const r = calculate(base, worker, models);
  assert.equal(r.net, 150000);
  assert.equal("bookTotal" in r, false);
});
