export default function defineWorker(db, D) {
  return db.define(
    "Worker",
    {
      name: { type: D.STRING, allowNull: false },
      job: { type: D.ENUM("jahit", "potong"), allowNull: false },
      destination: { type: D.STRING, defaultValue: "" },
    },
    { paranoid: true },
  );
}
