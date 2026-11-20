import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "INVALID_IDENTIFIER")
    .max(128)
    .optional(),
  email: z.string().trim().max(128).optional(),
  username: z.string().trim().max(50).optional(),
  password: z.string().min(1, "WEAK_PASSWORD").max(128),
}).transform((v) => {
  const identifier = (v.identifier || v.email || v.username || "").trim();
  return { identifier, password: v.password };
}).refine((v) => v.identifier.length > 0, {
  message: "INVALID_IDENTIFIER",
  path: ["identifier"],
});

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("INVALID_EMAIL")
    .max(128),
  password: z
    .string()
    .min(8, "WEAK_PASSWORD")
    .max(128)
    .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), "WEAK_PASSWORD"),
});

export const userCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email("INVALID_EMAIL").max(128).optional().nullable(),
  username: z.string().trim().min(1).max(50).optional().nullable(),
  password: z.string().min(8).max(128).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  legacyRole: z.number().int().min(0).max(10).optional(),
  roleIds: z.array(z.string().min(1).max(64)).max(20).optional(),
});

export const userUpdateSchema = userCreateSchema.partial();
