export default function definePayroll(db, D, { Period, Worker }) {
  return db.define(
    "Payroll",
    {
      periodId: {
        type: D.INTEGER,
        allowNull: false,
        references: { model: Period, key: "id" },
      },
      workerId: {
        type: D.INTEGER,
        allowNull: false,
        references: { model: Worker, key: "id" },
      },
      workerName: { type: D.STRING, allowNull: false },
      job: { type: D.STRING, allowNull: false },
      bookTotal: { type: D.INTEGER, allowNull: true },
      subtotal: { type: D.INTEGER, allowNull: false },
      net: { type: D.INTEGER, allowNull: false },
      cash: { type: D.INTEGER, allowNull: false },
      lines: { type: D.JSONB, allowNull: false },
      adjustments: { type: D.JSONB, allowNull: false },
      transfers: { type: D.JSONB, allowNull: false },
    },
    { indexes: [{ unique: true, fields: ["periodId", "workerId"] }] },
  );
}
