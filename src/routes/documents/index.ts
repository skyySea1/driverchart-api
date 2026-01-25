import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { DocumentLogSchema } from "../../schemas/documentsSchema";
import { AuditLogSchema } from "../../schemas/auditSchema";
import { documentService } from "../../services/documentService";
import { driverService } from "../../services/driverService";
import { emailService } from "../../services/emailService";
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

  server.get(
    "/audit/:entityId",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "Get audit logs for a specific entity",
        tags: ["Documents"],
        params: z.object({ entityId: z.string() }),
        response: {
          200: z.array(AuditLogSchema),
        },
      },
    },
    async (request) => {
      const { entityId } = request.params;
      return await documentService.getAuditByEntity(entityId);
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
          
          // Log the profile update for the document link
          await documentService.createAuditLog({
            entityId: driverId,
            entityName: entityName || (currentDriver as any).firstName + " " + (currentDriver as any).lastName,
            type: 'profile_update',
            date: dayjs().toISOString(),
            user: (request.user as any).name || (request.user as any).email || "Unknown User",
            description: `Uploaded and linked ${documentType}: ${filename}`,
          });
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
          user: (request.user as any).name || (request.user as any).email || "User",
        });
      }

      return { url, filename: filename };
    }
  );

  // --- NEW ROUTES FOR REQUESTS AND MEMOS ---

  server.post(
    "/request-upload",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "Send a document upload request email to a driver",
        tags: ["Documents"],
        body: z.object({
          email: z.string().email(),
          driverName: z.string(),
          requestType: z.string(),
          magicLink: z.string(),
        }),
      },
    },
    async (request, reply) => {
      const { email, driverName, requestType, magicLink } = request.body;
      await emailService.sendUploadRequest(email, driverName, requestType, magicLink);
      return { success: true };
    }
  );

  server.post(
    "/send-memos",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "Send memos/policies to a driver via email",
        tags: ["Documents"],
        body: z.object({
          email: z.string().email(),
          driverName: z.string(),
          memoTitle: z.string(),
          memoLinks: z.array(z.string()),
        }),
      },
    },
    async (request, reply) => {
      const { email, driverName, memoTitle, memoLinks } = request.body;
      await emailService.sendMemo(email, driverName, memoTitle, memoLinks);
      return { success: true };
    }
  );

  server.get(
    "/memos",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "Get all available memos and policies",
        tags: ["Documents"],
      },
    },
    async () => {
      return await documentService.getAllMemos();
    }
  );

  server.post(
    "/memos/upload",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "Upload a new memo or policy to the central repository",
        tags: ["Documents"],
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

      if (!fileBuffer) return reply.status(400).send({ message: "No file" });

      const storagePath = `artifacts/${env.APP_ID}/public/memos/${filename}`;
      const url = await documentService.uploadFile(Readable.from(fileBuffer), mimetype, storagePath);

      await documentService.saveMemo({
        title: fields.title || filename,
        fileUrl: url,
        type: fields.type || 'memo'
      });

      return { url, filename };
    }
  );
}
