import { z } from "zod";
export const id = z.coerce.number().int().positive();
const integer = z.number().int().min(0).max(1_000_000_000);
export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(200),
});
export const adminSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.email(),
  password: z.string().min(12).max(200),
});
export const workerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  job: z.enum(["jahit", "potong"]),
  destination: z.string().max(200).default(""),
});
export const modelSchema = z.object({
  code: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(120),
  sewingRate: integer.nullable(),
  cuttingRate: integer.nullable(),
});
