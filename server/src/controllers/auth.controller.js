import { loginSchema, adminSchema } from "../validators/schemas.js";
import * as auth from "../services/auth.service.js";
export const login = async (req, res) => {
  const data = await auth.login(loginSchema.parse(req.body));
  return data
    ? res.json(data)
    : res.status(401).json({ error: "Email atau password salah." });
};
export const me = (req, res) => res.json(req.user);
export const createAdmin = async (req, res) =>
  res.status(201).json(await auth.createAdmin(adminSchema.parse(req.body)));
