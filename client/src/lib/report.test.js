import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizePeriod, summarizeReport } from "./report.js";

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
