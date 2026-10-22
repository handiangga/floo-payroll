"use strict";
module.exports = {
  async up(q) {
    const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12)
      throw new Error(
        "Isi ADMIN_EMAIL dan ADMIN_PASSWORD minimal 12 karakter di server/.env.",
      );
    const bcrypt = require("bcryptjs");
    await q.sequelize.query(
      `INSERT INTO "Users" (name,email,"passwordHash",role,"createdAt","updatedAt") VALUES (:name,:email,:hash,'owner',NOW(),NOW()) ON CONFLICT (email) DO NOTHING`,
      {
        replacements: {
          name: ADMIN_NAME || "Owner Floo",
          email: ADMIN_EMAIL.toLowerCase(),
          hash: await bcrypt.hash(ADMIN_PASSWORD, 12),
        },
      },
    );
  },
  async down() {
    throw new Error(
      "Undo owner diblokir agar akun yang sudah dipakai tidak terhapus.",
    );
  },
};
