import { z } from "zod";
export const errorHandler = (err, req, res, next) => {
  if (err instanceof z.ZodError)
    return res.status(400).json({
      error: err.issues
        .map((x) => x.path.join(".") + ": " + x.message)
        .join("; "),
    });
  if (err.name === "SequelizeUniqueConstraintError")
    return res
      .status(409)
      .json({ error: "Data sudah ada atau periode lain masih terbuka." });
  if (err.name?.startsWith("Sequelize")) {
    console.error(err.name);
    return res
      .status(500)
      .json({ error: "Operasi database gagal. Periksa konfigurasi server." });
  }
  res.status(400).json({ error: err.message || "Permintaan gagal." });
};
