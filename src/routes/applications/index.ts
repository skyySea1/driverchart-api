import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { ApplicationSchema } from "../../schemas/applicationsSchema";
import { applicationService } from "../../services/applicationService";
import { z } from "zod";

export default async function (fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "Get all applications",
        tags: ["Applications"],
        response: {
          200: z.array(ApplicationSchema),
        },
      },
    },
    async () => {
      return await applicationService.getAll();
    }
  );

  server.get(
    "/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "Get application by ID",
        tags: ["Applications"],
        params: z.object({ id: z.string() }),
        response: {
          200: ApplicationSchema,
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const application = await applicationService.getById(id);
      if (!application)
        return reply.status(404).send({ message: "Application not found" });
      return application;
    }
  );

  // POST remains public for driver applicants
  server.post(
    "/",
    {
      schema: {
        description: "Create new application",
        tags: ["Applications"],
        body: ApplicationSchema,
        response: {
          201: z.object({ id: z.string() }),
          400: z.object({ 
            error: z.string(), 
            message: z.string(), 
            issues: z.array(z.any()) 
          }),
          500: z.object({ message: z.string(), error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      try {
        const id = await applicationService.create(request.body);
        return reply.status(201).send({ id });
      } catch (error) {
        // If it's a validation error caught here (unlikely if global handler works, 
        // but good for safety if we manually throw ZodErrors)
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ 
            error: "Validation Error",
            message: "Validation error", 
            issues: error.issues
          });
        }
        throw error; // Let global handler handle other errors or 500
      }
    }
  );

  server.put(
    "/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "Update application",
        tags: ["Applications"],
        params: z.object({ id: z.string() }),
        body: ApplicationSchema.partial(),
        response: {
          204: z.null(),
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const application = await applicationService.getById(id);
      if (!application)
        return reply.status(404).send({ message: "Application not found" });
      await applicationService.update(id, request.body);
      return reply.status(204).send();
    }
  );

  server.delete(
    "/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "Delete application",
        tags: ["Applications"],
        params: z.object({ id: z.string() }),
        response: {
          204: z.null(),
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const application = await applicationService.getById(id);
      if (!application)
        return reply.status(404).send({ message: "Application not found" });
      await applicationService.delete(id);
      return reply.status(204).send();
    }
  );
}
