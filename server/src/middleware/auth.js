import jwt from "jsonwebtoken";
import { User } from "../db.js";
export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace(/^Bearer /, "");
    const payload = jwt.verify(token || "", process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    req.user = await User.findByPk(payload.id, {
      attributes: ["id", "name", "role"],
    });
    if (!req.user) throw Error();
    next();
  } catch {
    res.status(401).json({ error: "Silakan login kembali." });
  }
};
export const owner = (req, res, next) =>
  req.user.role === "owner"
    ? next()
    : res
        .status(403)
        .json({ error: "Hanya owner yang dapat melakukan perubahan ini." });
