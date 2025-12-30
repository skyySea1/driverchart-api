import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import cors from "@fastify/cors";

// CORS plugin
export const corsPlugin = fp(async (fastify: FastifyInstance) => {
  await fastify.register(cors, {
    origin: "*", // Allow all origins - pending change for production
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
});
