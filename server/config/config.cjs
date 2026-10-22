const path = require("node:path");
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
  quiet: true,
});
const common = {
  dialect: "postgres",
  logging: false,
  migrationStorage: "sequelize",
  migrationStorageTableName: "SequelizeMeta",
  seederStorage: "sequelize",
  seederStorageTableName: "SequelizeData",
  dialectOptions:
    process.env.DB_SSL === "true"
      ? { ssl: { require: true, rejectUnauthorized: true } }
      : {},
};
const connection = process.env.DATABASE_URL
  ? { use_env_variable: "DATABASE_URL" }
  : {
      username: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD ?? "postgres",
      database: process.env.DB_NAME || "floo_payroll",
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 5432),
    };
module.exports = {
  development: { ...common, ...connection },
  test: { ...common, ...connection },
  production: { ...common, ...connection },
};
