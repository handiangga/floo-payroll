import { Router } from "express";
import rateLimit from "express-rate-limit";
import { db } from "../db.js";
import { authenticate, owner } from "../middleware/auth.js";
import * as auth from "../controllers/auth.controller.js";
import * as master from "../controllers/master.controller.js";
import * as periods from "../controllers/period.controller.js";
import * as payroll from "../controllers/payroll.controller.js";
export const router = Router();
router.get("/health", async (req, res) => {
  try {
    await db.authenticate();
    res.json({ ok: true });
  } catch {
    res.status(503).json({ error: "Database belum tersedia" });
  }
});
router.post(
  "/auth/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
  auth.login,
);
router.use(authenticate);
router.get("/me", auth.me);
router.get("/bootstrap", master.bootstrap);
for (const [name, controller] of [
  ["workers", master.workers],
  ["models", master.models],
]) {
  router.post("/" + name, owner, controller.create);
  router.put("/" + name + "/:id", owner, controller.update);
  router.delete("/" + name + "/:id", owner, controller.remove);
}
router.post("/users", owner, auth.createAdmin);
router.post("/periods", periods.open);
router.post("/periods/:id/close", periods.close);
router.post("/periods/:id/reopen", owner, periods.reopen);
router.get("/periods/:id/payrolls", payroll.list);
router.post("/periods/:id/payrolls", payroll.save);
router.delete("/periods/:id/payrolls/:payrollId", payroll.remove);
