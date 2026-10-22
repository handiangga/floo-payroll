import { Sequelize, DataTypes as D } from "sequelize";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const config = require("../config/config.cjs")[
  process.env.NODE_ENV || "development"
];
if (!config) throw new Error("NODE_ENV tidak didukung.");
export const db = config.use_env_variable
  ? new Sequelize(process.env[config.use_env_variable], config)
  : new Sequelize(config.database, config.username, config.password, config);
export const User = db.define("User", {
  name: { type: D.STRING, allowNull: false },
  email: { type: D.STRING, unique: true, allowNull: false },
  passwordHash: { type: D.STRING, allowNull: false },
  role: {
    type: D.ENUM("owner", "admin"),
    allowNull: false,
    defaultValue: "admin",
  },
});
export const Worker = db.define(
  "Worker",
  {
    name: { type: D.STRING, allowNull: false },
    job: { type: D.ENUM("jahit", "potong"), allowNull: false },
    destination: { type: D.STRING, defaultValue: "" },
  },
  { paranoid: true },
);
export const Model = db.define("Model", {
  code: { type: D.STRING, unique: true, allowNull: false },
  name: { type: D.STRING, allowNull: false },
  sewingRate: { type: D.INTEGER, allowNull: true },
  cuttingRate: { type: D.INTEGER, allowNull: true },
});
export const Period = db.define(
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
export const Payroll = db.define(
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
export const Audit = db.define("Audit", {
  userId: { type: D.INTEGER, allowNull: false },
  action: { type: D.STRING, allowNull: false },
  details: { type: D.JSONB, allowNull: false },
});
