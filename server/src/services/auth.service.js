import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../db.js";
export async function login(body) {
  const user = await User.findOne({
    where: { email: body.email.toLowerCase() },
  });
  if (!user || !(await bcrypt.compare(body.password, user.passwordHash)))
    return null;
  return {
    token: jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "8h",
    }),
    user: { id: user.id, name: user.name, role: user.role },
  };
}
export async function createAdmin(b) {
  const user = await User.create({
    name: b.name,
    email: b.email.toLowerCase(),
    passwordHash: await bcrypt.hash(b.password, 12),
    role: "admin",
  });
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}
