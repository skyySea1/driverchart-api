// src/plugins/corsPlugin.ts
import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import cors from "@fastify/cors";

// CORS plugin
export const corsPlugin = fp(async (fastify: FastifyInstance) => {
  await fastify.register(cors, {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  });
});
