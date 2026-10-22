export default function definePeriod(db, D) {
  return db.define(
    "Period",
    {
      date: { type: D.DATEONLY, unique: true, allowNull: false },
      status: {
        type: D.ENUM("open", "closed"),
        defaultValue: "open",
        allowNull: false,
      },
      closedAt: D.DATE,
    },
    {
      indexes: [
        {
          name: "one_open_period",
          unique: true,
          fields: ["status"],
          where: { status: "open" },
        },
      ],
    },
  );
}
