import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { DocumentLogSchema } from "../../schemas/documentsSchema";
import { documentService } from "../../services/documentService";
import { z } from "zod";

export default async function (fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/logs",
    {
      schema: {
        description: "Get all document logs",
        tags: ["Documents"],
        response: {
          200: z.array(DocumentLogSchema),
        },
      },
    },
    async () => {
      return await documentService.getAll();
    }
  );

  server.post(
    "/logs",
    {
      schema: {
        description: "Create a document log entry",
        tags: ["Documents"],
        body: DocumentLogSchema,
        response: {
          201: z.object({ id: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const id = await documentService.createLog(request.body);
      return reply.status(201).send({ id });
    }
  );

  server.get(
    "/logs/:entityName",
    {
      schema: {
        description: "Get logs for a specific entity",
        tags: ["Documents"],
        params: z.object({ entityName: z.string() }),
        response: {
          200: z.array(DocumentLogSchema),
        },
      },
    },
    async (request) => {
      const { entityName } = request.params;
      return await documentService.getByEntity(entityName);
    }
  );
}
