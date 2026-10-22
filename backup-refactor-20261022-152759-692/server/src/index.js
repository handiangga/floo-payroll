import { app } from "./app.js";
import { db } from "./db.js";
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
  throw Error("JWT_SECRET minimal 32 karakter wajib diatur.");
await db.authenticate();
const server = app.listen(process.env.PORT || 4000, () =>
  console.log("Floo API siap"),
);
process.on("SIGTERM", () =>
  server.close(async () => {
    await db.close();
    process.exit(0);
  }),
);
