import { db } from "../db.js";
import { audit } from "./audit.service.js";
export async function create(Entity, body, userId, resource) {
  return db.transaction(async (t) => {
    const row = await Entity.create(body, { transaction: t });
    await audit(userId, resource + ".create", { id: row.id, ...body }, t);
    return row;
  });
}
export async function update(Entity, recordId, body, userId, resource) {
  return db.transaction(async (t) => {
    const row = await Entity.findByPk(recordId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!row) throw Error("Data tidak ditemukan.");
    await row.update(body, { transaction: t });
    await audit(userId, resource + ".update", { id: row.id, ...body }, t);
    return row;
  });
}
export async function remove(Entity, recordId, userId, resource) {
  await db.transaction(async (t) => {
    const row = await Entity.findByPk(recordId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!row) throw Error("Data tidak ditemukan atau sudah dihapus.");
    await audit(userId, resource + ".delete", { id: row.id }, t);
    await row.destroy({ transaction: t });
  });
  return { ok: true };
}
