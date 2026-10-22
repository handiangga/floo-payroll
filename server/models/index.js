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
import defineUser from "./user.js";
export const User = defineUser(db, D);
import defineWorker from "./worker.js";
export const Worker = defineWorker(db, D);
import defineModel from "./model.js";
export const Model = defineModel(db, D);
import definePeriod from "./period.js";
export const Period = definePeriod(db, D);
import definePayroll from "./payroll.js";
export const Payroll = definePayroll(db, D, { Period, Worker });
import defineAudit from "./audit.js";
export const Audit = defineAudit(db, D);
