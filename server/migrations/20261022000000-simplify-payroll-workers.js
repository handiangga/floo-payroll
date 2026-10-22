"use strict";
module.exports = {
  async up(q, S) {
    await q.sequelize.transaction(async (transaction) => {
      await q.addColumn(
        "Workers",
        "deletedAt",
        { type: S.DATE, allowNull: true },
        { transaction },
      );
      await q.removeColumn("Workers", "active", { transaction });
      await q.removeColumn("Models", "active", { transaction });
      // Retain historical book totals, but new payrolls no longer require them.
      await q.changeColumn(
        "Payrolls",
        "bookTotal",
        { type: S.INTEGER, allowNull: true },
        { transaction },
      );
    });
  },
  async down(q, S) {
    await q.sequelize.transaction(async (transaction) => {
      const [removed] = await q.sequelize.query(
        'SELECT EXISTS(SELECT 1 FROM "Workers" WHERE "deletedAt" IS NOT NULL) AS removed',
        { transaction },
      );
      if (removed[0].removed)
        throw new Error(
          "Undo diblokir: ada pegawai yang dihapus. Gunakan migrasi koreksi agar tidak muncul kembali.",
        );
      const [unmatched] = await q.sequelize.query(
        'SELECT EXISTS(SELECT 1 FROM "Payrolls" WHERE "bookTotal" IS NULL) AS found',
        { transaction },
      );
      if (unmatched[0].found)
        throw new Error(
          "Undo diblokir: ada rekap tanpa total buku. Gunakan migrasi koreksi.",
        );
      await q.addColumn(
        "Workers",
        "active",
        { type: S.BOOLEAN, defaultValue: true },
        { transaction },
      );
      await q.addColumn(
        "Models",
        "active",
        { type: S.BOOLEAN, defaultValue: true },
        { transaction },
      );
      await q.changeColumn(
        "Payrolls",
        "bookTotal",
        { type: S.INTEGER, allowNull: false },
        { transaction },
      );
      await q.removeColumn("Workers", "deletedAt", { transaction });
    });
  },
};
