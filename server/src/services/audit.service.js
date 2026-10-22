import { Audit } from "../db.js";
export const audit = (userId, action, details, transaction) =>
  Audit.create({ userId, action, details }, { transaction });
