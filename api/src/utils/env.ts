import { z } from "zod"
import dotenv from "dotenv"

dotenv.config()

export const envSchema = z.object({
  PORT: z.string().default("3000"),
  JWT_SECRET: z.string(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_APP_ID: z.string().default("dot-compliance-app"),
  APP_ID: z.string().default("dot-compliance-app"),
})

export const env = envSchema.parse(process.env)