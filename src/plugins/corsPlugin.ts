// src/plugins/corsPlugin.ts
import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import cors from "@fastify/cors";
import { env } from "../utils/env";


// CORS plugin
export const corsPlugin = fp(async (fastify: FastifyInstance) => {
  await fastify.register(cors, {
    origin: env.CORS_ORIGINS || env.APP_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  });
});
