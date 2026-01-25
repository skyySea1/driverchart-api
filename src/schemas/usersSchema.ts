import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional(),
  role: z.enum(["Admin", "Manager", "Dispatcher", "Auditor", "Viewer"]).default("Viewer"),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  lastLogin: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;

export const LoginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginRequest = z.infer<typeof LoginSchema>;
