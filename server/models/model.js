export default function defineModel(db, D) {
  return db.define("Model", {
    code: { type: D.STRING, unique: true, allowNull: false },
    name: { type: D.STRING, allowNull: false },
    sewingRate: { type: D.INTEGER, allowNull: true },
    cuttingRate: { type: D.INTEGER, allowNull: true },
  });
}
