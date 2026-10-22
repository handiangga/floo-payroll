export default function defineUser(db, D) {
  return db.define("User", {
    name: { type: D.STRING, allowNull: false },
    email: { type: D.STRING, unique: true, allowNull: false },
    passwordHash: { type: D.STRING, allowNull: false },
    role: {
      type: D.ENUM("owner", "admin"),
      allowNull: false,
      defaultValue: "admin",
    },
  });
}
