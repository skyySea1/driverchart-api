import Fastify from "fastify";
import { serializerCompiler,  validatorCompiler} from "fastify-type-provider-zod";

import { corsPlugin } from "./plugins/corsPlugin";
import {jwtPlugin} from "./plugins/jwt";
import {swaggerPlugin} from "./plugins/swagger";

// Routes
import driverRoutes from "./routes/drivers";
import vehicleRoutes from "./routes/vehicles";
import documentRoutes from "./routes/documents";
import userRoutes from "./routes/users";
import expirationRoutes from "./routes/expirations";
import infoRoute from "./routes/info";

const fastify = Fastify({
  logger: true,
});

// Set validator and serializer compilers for Zod
fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

async function start() {
  try {
    // Register Plugins
    await fastify.register(corsPlugin);
    await fastify.register(jwtPlugin);
    await fastify.register(swaggerPlugin);

    // Register Routes
    await fastify.register(driverRoutes, { prefix: "/api/drivers" });
    await fastify.register(vehicleRoutes, { prefix: "/api/vehicles" });
    await fastify.register(documentRoutes, { prefix: "/api/documents" });
    await fastify.register(userRoutes, { prefix: "/api/users" });
    await fastify.register(expirationRoutes, { prefix: "/api/expiration" });

    // Info route
    await fastify.register(infoRoute);

    // Health check
    fastify.get("/health", async () => {
      return { status: "ok", timestamp: new Date().toISOString() };
    });

    const port = Number(process.env.PORT) || 3000;
    await fastify.listen({ port, host: "0.0.0.0" });
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
