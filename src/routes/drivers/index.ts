import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { DriverSchema } from "../../schemas/driversSchema";
import { driverService } from "../../services/driverService";
import { documentService } from "../../services/documentService";
import { z } from "zod";
import dayjs from "dayjs";

export default async function (fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/",
    {
      onRequest: [fastify.authenticate],
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
      onRequest: [fastify.authenticate],
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
      onRequest: [fastify.authenticate],
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
      
      // Log creation
      await documentService.createAuditLog({
        entityId: id,
        entityName: `${request.body.firstName} ${request.body.lastName}`,
        type: 'creation',
        date: dayjs().toISOString(),
        user: (request.user as any).name || (request.user as any).email || "System",
        description: "Created new driver profile",
      });

      return reply.status(201).send({ id });
    }
  );

  server.put(
    "/:id",
    {
      onRequest: [fastify.authenticate],
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
      const previousDriver = await driverService.getById(id);
      
      if (!previousDriver)
        return reply.status(404).send({ message: "Driver not found" });
      
      const updates = request.body;
      const changedFields: string[] = [];
      
      // Basic change detection
      for (const key in updates) {
        if (updates[key as keyof typeof updates] !== (previousDriver as any)[key]) {
          changedFields.push(key);
        }
      }

      if (changedFields.length === 0) {
        return reply.status(204).send();
      }

      await driverService.updateDriver(id, updates);

      let logType: 'profile_update' | 'status_change' | 'creation' = 'profile_update';
      let logDescription = "";

      if (changedFields.includes('hireStatus')) {
        logType = 'status_change';
        logDescription = `Status changed from ${(previousDriver as any).hireStatus || 'N/A'} to ${updates.hireStatus}. `;
        const otherFields = changedFields.filter(f => f !== 'hireStatus');
        if (otherFields.length > 0) {
          logDescription += `Also updated: ${otherFields.join(', ')}`;
        }
      } else {
        logDescription = `Updated fields: ${changedFields.join(', ')}`;
      }
      
      await documentService.createAuditLog({
        entityId: id,
        entityName: (previousDriver as any).firstName + " " + (previousDriver as any).lastName,
        type: logType,
        date: dayjs().toISOString(),
        user: (request.user as any).name || (request.user as any).email || "System",
        description: logDescription,
      });

      return reply.status(204).send();
    }
  );

  server.delete(
    "/:id",
    {
      onRequest: [fastify.authenticate],
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
