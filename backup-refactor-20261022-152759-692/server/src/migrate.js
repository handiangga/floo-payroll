// Test/helper entry point. All migration execution is owned by sequelize-cli.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
export function migrate() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [require.resolve("sequelize-cli/lib/sequelize"), "db:migrate"],
      {
        cwd: fileURLToPath(new URL("../", import.meta.url)),
        env: process.env,
        stdio: "inherit",
      },
    );
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error("sequelize-cli migration gagal: " + code)),
    );
  });
}
