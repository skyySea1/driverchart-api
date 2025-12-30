import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { VehicleSchema } from "../../schemas/vehiclesSchema";
import { vehicleService } from "../../services/vehicleService";
import { z } from "zod";

export default async function (fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/",
    {
      schema: {
        description: "Get all vehicles",
        tags: ["Vehicles"],
        response: {
          200: z.array(VehicleSchema),
        },
      },
    },
    async () => {
      return await vehicleService.getAll();
    }
  );

  server.get(
    "/:id",
    {
      schema: {
        description: "Get vehicle by ID",
        tags: ["Vehicles"],
        params: z.object({ id: z.string() }),
        response: {
          200: VehicleSchema,
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const vehicle = await vehicleService.getById(id);
      if (!vehicle)
        return reply.status(404).send({ message: "Vehicle not found" });
      return vehicle;
    }
  );

  server.post(
    "/",
    {
      schema: {
        description: "Create new vehicle",
        tags: ["Vehicles"],
        body: VehicleSchema,
        response: {
          201: z.object({ id: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const id = await vehicleService.createVehicle(request.body);
      return reply.status(201).send({ id });
    }
  );

  server.put(
    "/:id",
    {
      schema: {
        description: "Update vehicle",
        tags: ["Vehicles"],
        params: z.object({ id: z.string() }),
        body: VehicleSchema.partial(),
        response: {
          204: z.null(),
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const vehicle = await vehicleService.getById(id);
      if (!vehicle)
        return reply.status(404).send({ message: "Vehicle not found" });
      await vehicleService.updateVehicle(id, request.body);
      return reply.status(204).send();
    }
  );

  server.delete(
    "/:id",
    {
      schema: {
        description: "Delete vehicle",
        tags: ["Vehicles"],
        params: z.object({ id: z.string() }),
        response: {
          204: z.null(),
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const vehicle = await vehicleService.getById(id);
      if (!vehicle)
        return reply.status(404).send({ message: "Vehicle not found" });
      await vehicleService.delete(id);
      return reply.status(204).send();
    }
  );
}
