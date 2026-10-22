"use strict";
const tables = ["Users", "Workers", "Models", "Periods", "Payrolls", "Audits"];
module.exports = {
  async up(q, S) {
    await q.sequelize.transaction(async (transaction) => {
      const options = { transaction };
      await q.sequelize.query("SELECT pg_advisory_xact_lock(826410)", options);
      const [legacy] = await q.sequelize.query(
        `SELECT name FROM "SequelizeMeta" WHERE name = '001-initial.sql'`,
        options,
      );
      if (legacy.length) {
        // Adopt only a complete v1 schema. Keep the legacy marker to block destructive undo.
        const expected = {
          Users: [
            "id",
            "name",
            "email",
            "passwordHash",
            "role",
            "createdAt",
            "updatedAt",
          ],
          Workers: [
            "id",
            "name",
            "job",
            "destination",
            "active",
            "createdAt",
            "updatedAt",
          ],
          Models: [
            "id",
            "code",
            "name",
            "sewingRate",
            "cuttingRate",
            "active",
            "createdAt",
            "updatedAt",
          ],
          Periods: [
            "id",
            "date",
            "status",
            "closedAt",
            "createdAt",
            "updatedAt",
          ],
          Payrolls: [
            "id",
            "periodId",
            "workerId",
            "workerName",
            "job",
            "bookTotal",
            "subtotal",
            "net",
            "cash",
            "lines",
            "adjustments",
            "transfers",
            "createdAt",
            "updatedAt",
          ],
          Audits: [
            "id",
            "userId",
            "action",
            "details",
            "createdAt",
            "updatedAt",
          ],
        };
        for (const table of tables) {
          const columns = await q.describeTable(table, options);
          for (const column of expected[table])
            if (!columns[column])
              throw new Error(
                `Skema v1 tidak lengkap: ${table}.${column}. Migrasi dibatalkan.`,
              );
        }
        const indexes = await q.showIndex("Periods", options);
        if (!indexes.some((i) => i.name === "one_open_period" && i.unique))
          throw new Error(
            "Index one_open_period tidak ditemukan. Periksa database v1.",
          );
        console.log(
          "Skema v1 dikenali: tabel dan data dipertahankan, riwayat diadopsi oleh sequelize-cli.",
        );
        return;
      }
      const existing = await q.showAllTables(options);
      if (tables.some((t) => existing.includes(t)))
        throw new Error(
          "Tabel aplikasi sudah ada tanpa penanda migrasi v1. Tidak diubah; periksa database dan riwayat migrasi.",
        );
      const id = () => ({
        type: S.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      });
      const timestamps = () => ({
        createdAt: { type: S.DATE, allowNull: false },
        updatedAt: { type: S.DATE, allowNull: false },
      });
      const str = () => ({ type: S.STRING, allowNull: false });
      const int = () => ({ type: S.INTEGER, allowNull: false });
      // Create named enum types in the same transaction, then reference them.
      // Avoid Sequelize's out-of-transaction dynamic OID refresh during enum creation.
      await q.sequelize.query(
        `CREATE TYPE "enum_Users_role" AS ENUM ('owner','admin'); CREATE TYPE "enum_Workers_job" AS ENUM ('jahit','potong'); CREATE TYPE "enum_Periods_status" AS ENUM ('open','closed');`,
        options,
      );
      await q.createTable(
        "Users",
        {
          id: id(),
          name: str(),
          email: { ...str(), unique: true },
          passwordHash: str(),
          role: {
            type: '"enum_Users_role"',
            allowNull: false,
            defaultValue: "admin",
          },
          ...timestamps(),
        },
        options,
      );
      await q.createTable(
        "Workers",
        {
          id: id(),
          name: str(),
          job: { type: '"enum_Workers_job"', allowNull: false },
          destination: { type: S.STRING, defaultValue: "" },
          active: { type: S.BOOLEAN, defaultValue: true },
          ...timestamps(),
        },
        options,
      );
      await q.createTable(
        "Models",
        {
          id: id(),
          code: { ...str(), unique: true },
          name: str(),
          sewingRate: { type: S.INTEGER, allowNull: true },
          cuttingRate: { type: S.INTEGER, allowNull: true },
          active: { type: S.BOOLEAN, defaultValue: true },
          ...timestamps(),
        },
        options,
      );
      await q.createTable(
        "Periods",
        {
          id: id(),
          date: { type: S.DATEONLY, unique: true, allowNull: false },
          status: {
            type: '"enum_Periods_status"',
            allowNull: false,
            defaultValue: "open",
          },
          closedAt: { type: S.DATE },
          ...timestamps(),
        },
        options,
      );
      await q.addIndex("Periods", ["status"], {
        ...options,
        name: "one_open_period",
        unique: true,
        where: { status: "open" },
      });
      await q.createTable(
        "Payrolls",
        {
          id: id(),
          periodId: { ...int(), references: { model: "Periods", key: "id" } },
          workerId: { ...int(), references: { model: "Workers", key: "id" } },
          workerName: str(),
          job: str(),
          bookTotal: int(),
          subtotal: int(),
          net: int(),
          cash: int(),
          lines: { type: S.JSONB, allowNull: false },
          adjustments: { type: S.JSONB, allowNull: false },
          transfers: { type: S.JSONB, allowNull: false },
          ...timestamps(),
        },
        options,
      );
      await q.addIndex("Payrolls", ["periodId", "workerId"], {
        ...options,
        unique: true,
        name: "payrolls_period_worker_unique",
      });
      await q.createTable(
        "Audits",
        {
          id: id(),
          userId: int(),
          action: str(),
          details: { type: S.JSONB, allowNull: false },
          ...timestamps(),
        },
        options,
      );
      for (const sql of [
        'ALTER TABLE "Models" ADD CONSTRAINT models_sewing_nonnegative CHECK ("sewingRate" >= 0)',
        'ALTER TABLE "Models" ADD CONSTRAINT models_cutting_nonnegative CHECK ("cuttingRate" >= 0)',
        'ALTER TABLE "Payrolls" ADD CONSTRAINT payroll_net_nonnegative CHECK (net >= 0)',
        'ALTER TABLE "Payrolls" ADD CONSTRAINT payroll_cash_range CHECK (cash >= 0 AND cash <= net)',
      ])
        await q.sequelize.query(sql, options);
    });
  },
  async down(q) {
    await q.sequelize.transaction(async (transaction) => {
      const options = { transaction };
      const [legacy] = await q.sequelize.query(
        `SELECT name FROM "SequelizeMeta" WHERE name='001-initial.sql'`,
        options,
      );
      if (legacy.length)
        throw new Error(
          "Database v1 diadopsi; undo initial diblokir agar data lama tidak terhapus.",
        );
      for (const table of [...tables].reverse()) {
        const [result] = await q.sequelize.query(
          `SELECT EXISTS (SELECT 1 FROM "${table}" LIMIT 1) AS populated`,
          options,
        );
        if (result[0].populated)
          throw new Error(
            "Undo initial diblokir karena ada data aplikasi. Gunakan migrasi koreksi.",
          );
      }
      for (const table of [
        "Payrolls",
        "Audits",
        "Periods",
        "Models",
        "Workers",
        "Users",
      ])
        await q.dropTable(table, options);
      for (const name of [
        "enum_Users_role",
        "enum_Workers_job",
        "enum_Periods_status",
      ])
        await q.sequelize.query(`DROP TYPE IF EXISTS "${name}"`, options);
    });
  },
};
