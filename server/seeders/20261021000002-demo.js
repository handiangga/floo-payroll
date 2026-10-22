"use strict";
module.exports = {
  async up(q) {
    if (process.env.SEED_DEMO !== "true") {
      console.log("Data contoh dilewati (SEED_DEMO bukan true).");
      return;
    }
    await q.sequelize.transaction(async (transaction) => {
      for (const [name, job] of [
        ["Bu Ani (contoh)", "jahit"],
        ["Pak Budi (contoh)", "potong"],
      ])
        await q.sequelize.query(
          `INSERT INTO "Workers" (name,job,destination,"createdAt","updatedAt") SELECT :name,:job,'',NOW(),NOW() WHERE NOT EXISTS (SELECT 1 FROM "Workers" WHERE name=:name)`,
          { transaction, replacements: { name, job } },
        );
      for (const [code, name, sewingRate, cuttingRate] of [
        ["D001", "Dres A (contoh)", 30000, 12000],
        ["D002", "Dres B (contoh)", 35000, 15000],
      ])
        await q.sequelize.query(
          `INSERT INTO "Models" (code,name,"sewingRate","cuttingRate","createdAt","updatedAt") VALUES (:code,:name,:sewingRate,:cuttingRate,NOW(),NOW()) ON CONFLICT (code) DO NOTHING`,
          {
            transaction,
            replacements: { code, name, sewingRate, cuttingRate },
          },
        );
    });
  },
  async down() {
    throw new Error(
      "Penghapusan seed contoh otomatis diblokir; hapus pekerja dari menu Data pekerja jika sudah tidak digunakan.",
    );
  },
};
