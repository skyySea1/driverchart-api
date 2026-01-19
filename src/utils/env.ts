import { z } from "zod"
import dotenv from "dotenv"

dotenv.config()

export const envSchema = z.object({
  PORT: z.string().default("3000"),
  JWT_SECRET: z.string(),
  NODE_ENVIRONMENT: z.enum(["development", "production", "preview", "test"]).default("development"),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_WEB_API_KEY: z.string().optional(),
  FIREBASE_APP_ID: z.string().default("dot-compliance-app"),
  APP_ID: z.string().default("dot-compliance-app"),
})

export const env = envSchema.parse(process.env)