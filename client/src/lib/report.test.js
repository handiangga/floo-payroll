import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizePeriod, summarizeReport } from "./report.js";

test("only 24 October legacy deductions count as bon without overriding explicit categories", () => {
  const rows = [{ workerId: 1, net: 100, job: "jahit", lines: [], adjustments: [
    { kind: "deduction", total: -500000 },
    { kind: "deduction", category: "bon", total: -100000 },
    { kind: "deduction", category: "other", total: -20000 },
    { kind: "addition", total: 30000 },
  ] }];
  const legacy = summarizePeriod({ date: "2026-10-24" }, rows);
  assert.equal(legacy.bon, 600000);
  assert.equal(legacy.bonPayments.length, 1);
  assert.equal(legacy.bonPayments[0].amount, 600000);
  assert.equal(legacy.unclassified, 0);
  assert.deepEqual(legacy.bonWorkerIds, [1]);
  const next = summarizePeriod({ date: "2026-10-31" }, rows);
  assert.equal(next.bon, 100000);
  assert.equal(next.bonPayments[0].amount, 100000);
  assert.equal(next.unclassified, 1);
  assert.equal(rows[0].adjustments[0].category, undefined);
});

test("bon excludes other and unclassified deductions, counts unique workers", () => {
  const row = (workerId, adjustments) => ({ workerId, net: 100, job: "jahit", lines: [{ qty: 2 }], adjustments });
  const bon = { kind: "deduction", category: "bon", total: -50000 };
  const period = summarizePeriod({ id: 1 }, [row(1, [bon, bon]), row(2, [{ kind: "deduction", category: "other", total: -20000 }]), row(3, [{ kind: "deduction", total: -10000 }])]);
  assert.equal(period.bon, 100000);
  assert.deepEqual(period.bonWorkerIds, [1]);
  assert.equal(period.unclassified, 1);
  const report = summarizeReport([period, summarizePeriod({ id: 2 }, [row(1, [bon])])]);
  assert.equal(report.bon, 150000);
  assert.equal(report.bonWorkers, 1);
  assert.equal(summarizeReport([]).bon, 0);
});
