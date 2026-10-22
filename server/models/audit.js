export default function defineAudit(db, D) {
  return db.define("Audit", {
    userId: { type: D.INTEGER, allowNull: false },
    action: { type: D.STRING, allowNull: false },
    details: { type: D.JSONB, allowNull: false },
  });
}
