import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import { env } from "../utils/env";

// JWT plugin
export const jwtPlugin = fp(async (fastify: FastifyInstance) => {
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required for JWT configuration');
  }

  await fastify.register(jwt, {
    secret: jwtSecret,
    sign: { expiresIn: "1h" },
  });
});
