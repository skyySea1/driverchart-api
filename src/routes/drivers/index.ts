import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { DriverSchema } from "../../schemas/driversSchema";
import { driverService } from "../../services/driverService";
import { z } from "zod";

export default async function (fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/",
    {
      schema: {
        description: "Get all drivers",
        tags: ["Drivers"],
        response: {
          200: z.array(DriverSchema),
        },
      },
    },
    async () => {
      return await driverService.getAll();
    }
  );

  server.get(
    "/:id",
    {
      schema: {
        description: "Get driver by ID",
        tags: ["Drivers"],
        params: z.object({ id: z.string() }),
        response: {
          200: DriverSchema,
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const driver = await driverService.getById(id);
      if (!driver)
        return reply.status(404).send({ message: "Driver not found" });
      return driver;
    }
  );

  server.post(
    "/",
    {
      schema: {
        description: "Create new driver",
        tags: ["Drivers"],
        body: DriverSchema,
        response: {
          201: z.object({ id: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const id = await driverService.createDriver(request.body);
      return reply.status(201).send({ id });
    }
  );

  server.put(
    "/:id",
    {
      schema: {
        description: "Update driver",
        tags: ["Drivers"],
        params: z.object({ id: z.string() }),
        body: DriverSchema.partial(),
        response: {
          204: z.null(),
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const driver = await driverService.getById(id);
      if (!driver)
        return reply.status(404).send({ message: "Driver not found" });
      await driverService.updateDriver(id, request.body);
      return reply.status(204).send();
    }
  );

  server.delete(
    "/:id",
    {
      schema: {
        description: "Delete driver",
        tags: ["Drivers"],
        params: z.object({ id: z.string() }),
        response: {
          204: z.null(),
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const driver = await driverService.getById(id);
      if (!driver)
        return reply.status(404).send({ message: "Driver not found" });
      await driverService.delete(id);
      return reply.status(204).send();
    }
  );
}
