import Fastify, { FastifyError } from "fastify";
import { z } from "zod";
import {
  serializerCompiler,
  validatorCompiler,
  hasZodFastifySchemaValidationErrors,
} from "fastify-type-provider-zod";
import fastifyMultipart from "@fastify/multipart";

import { corsPlugin } from "./plugins/corsPlugin";
import { authPlugin } from "./plugins/authPlugin";
import { swaggerPlugin } from "./plugins/swagger";

// RoutesS
import publicRoutes from "./routes/public";
import driverRoutes from "./routes/drivers";
import vehicleRoutes from "./routes/vehicles";
import documentRoutes from "./routes/documents";
import userRoutes from "./routes/users";
import applicationRoutes from "./routes/applications";
import expirationRoutes from "./routes/expirations";
import infoRoute from "./routes/info";
import authRoutes from "./routes/auth";

import { env } from "./utils/env";
import { pinoConfig } from "./services/logger-service";
import { AppError } from "./utils/errors";

export async function buildApp() {
  const fastify = Fastify({
    logger: pinoConfig,
  });

  // Set validator and serializer compilers for Zod
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  // Global Error Handler
  fastify.setErrorHandler((error: FastifyError, request, reply) => {
    // Handle Zod Validation Errors
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.status(400).send({
        error: "Validation Error",
        message: "Invalid request data",
        issues: error.validation,
      });
    }

    if (error instanceof z.ZodError) {
      return reply.status(400).send({
        error: "Validation Error",
        message: "Invalid request data",
        issues: error.issues,
      });
    }

    // Handle Custom App Errors
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.name,
        message: error.message,
        code: error.code,
      });
    }

    // Handle unexpected errors
    request.log.error(error);
    return reply.status(500).send({
      error: "Internal Server Error",
      message: "Something went wrong",
    });
  });

  // Register Plugins
  await fastify.register(corsPlugin);
  await fastify.register(authPlugin);
  await fastify.register(swaggerPlugin);
  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: 10485760, // 10MB
    },
  });

  // Register Routes
  await fastify.register(publicRoutes, { prefix: "/api/public" });
  await fastify.register(authRoutes, { prefix: "/api/auth" });
  await fastify.register(driverRoutes, { prefix: "/api/drivers" });
  await fastify.register(vehicleRoutes, { prefix: "/api/vehicles" });
  await fastify.register(documentRoutes, { prefix: "/api/documents" });
  await fastify.register(userRoutes, { prefix: "/api/users" });
  await fastify.register(applicationRoutes, { prefix: "/api/applications" });
  await fastify.register(expirationRoutes, { prefix: "/api/expiration" });
  await fastify.register(infoRoute, { prefix: "/api/info" });

  // Health check - match /api/health
  fastify.get("/api/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // root path for backwards compatibility or direct access
  fastify.get("/", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  return fastify;
}

async function start() {
  try {
    const app = await buildApp();
    const port = Number(env.PORT) || 3000;
    await app.listen({ port, host: "0.0.0.0" });
    console.log(`\n Server listening on port ${port}`);
    console.log(` Current environment: ${env.NODE_ENVIRONMENT}\n`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
// Only start if NOT in a Vercel AND NOT in test environment (external injection)
if (!process.env.VERCEL && process.env.NODE_ENV !== "test") {
  start();
}
