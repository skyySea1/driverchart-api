import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { DocumentLogSchema } from "../../schemas/documentsSchema";
import { documentService } from "../../services/documentService";
import { driverService } from "../../services/driverService";
import { env } from "../../utils/env";
import { z } from "zod";
import dayjs from "dayjs";
import { Readable } from "stream";
import path from "path";

function sanitizeFilename(filename: string): string {
  // Remove directory traversal characters
  const safeName = path.basename(filename);
  // Replace potentially dangerous characters with underscore, allowing typical filename chars
  return safeName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

export default async function (fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/logs",
    {
      onRequest: [fastify.authenticate],
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
      onRequest: [fastify.authenticate],
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
      onRequest: [fastify.authenticate],
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

  server.post(
    "/upload",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "Upload a document",
        tags: ["Documents"],
        response: {
          200: z.object({ url: z.string(), filename: z.string() }),
          400: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const parts = request.parts();
      let fileBuffer: Buffer | undefined;
      let filename: string = "";
      let mimetype: string = "";
      const fields: Record<string, any> = {};

      for await (const part of parts) {
        if (part.type === "file") {
          fileBuffer = await part.toBuffer();
          filename = sanitizeFilename(part.filename);
          mimetype = part.mimetype;
        } else {
          fields[part.fieldname] = part.value;
        }
      }

      if (!fileBuffer) {
        return reply.status(400).send({ message: "No file uploaded" });
      }

      const {
        driverId,
        applicantName,
        entityName,
        documentType,
        uploadDate,
        expiryDate,
      } = fields;

      if (!documentType) {
        return reply.status(400).send({ message: "Missing documentType" });
      }

      // Determinar caminho: Driver (documents) vs Applicant (applications)
      let storagePath = "";
      if (driverId) {
        storagePath = `artifacts/${env.APP_ID}/public/documents/${
          entityName || driverId
        }/${documentType}/${filename}`;
      } else if (applicantName) {
        storagePath = `artifacts/${env.APP_ID}/public/applications/${applicantName}/${documentType}/${filename}`;
      } else {
        return reply
          .status(400)
          .send({ message: "Missing driverId or applicantName" });
      }

      const fileStream = Readable.from(fileBuffer);
      const url = await documentService.uploadFile(
        fileStream,
        mimetype,
        storagePath
      );

      // Se for um motorista existente, atualiza o registro dele
      if (driverId) {
        const currentDriver = await driverService.getById(driverId);
        if (currentDriver) {
          const updateData: Record<string, any> = {};
          if (
            ["license", "medical", "mvr", "drugAlcohol", "roadTest"].includes(
              documentType
            )
          ) {
            const currentDoc = (currentDriver as any)[documentType] || {};
            updateData[documentType] = {
              ...currentDoc,
              file: url,
              ...(expiryDate ? { expiryDate } : {}),
            };
          } else if (documentType === "ssnDoc") {
            updateData.ssnDoc = url;
            updateData.ssnDocName = filename;
          }
          await driverService.updateDriver(driverId, updateData);
        }
      }

      // Logs de auditoria para aplicações são opcionais aqui pois o JSON final da aplicação será salvo depois
      // Mas vamos registrar o log se houver um entityName
      if (entityName || applicantName) {
        await documentService.createLog({
          date: uploadDate || dayjs().toISOString(),
          fileName: filename,
          type: documentType,
          entityName: entityName || applicantName,
          user: "Public Portal / System",
        });
      }

      return { url, filename: filename };
    }
  );
}
