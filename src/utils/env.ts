import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

export const envSchema = z.object({
  PORT: z.string().default("3000"),
  JWT_SECRET: z.string(),
  NODE_ENVIRONMENT: z
    .enum(["development", "production", "preview", "test"])
    .default("development"),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_WEB_API_KEY: z.string().optional(),
  COLLECTION_ID: z.string().default("driverchart"),
  FIREBASE_STORAGE_BUCKET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_DOMAIN_VERIFIED: z
    .string()
    .transform((v) => v === "true")
    .optional()
    .pipe(z.boolean().default(false)), // Defaults to false (test mode)
});

export const env = envSchema.parse(process.env);
