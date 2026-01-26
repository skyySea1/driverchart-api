import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { DocumentLogSchema } from "../../schemas/documentsSchema";
import { AuditLogSchema } from "../../schemas/auditSchema";
import { documentService } from "../../services/documentService";
import { driverService } from "../../services/driverService";
import { emailService } from "../../services/emailService";
import { tokenService } from "../../services/tokenService";
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
        applicationId,
        applicantName,
        entityName,
        documentType,
        uploadDate,
        expiryDate,
      } = fields;

      if (!documentType) {
        return reply.status(400).send({ message: "Missing documentType" });
      }

      // get path: Driver (documents) vs Applicant (applications)
      let storagePath = "";
      if (driverId) {
        storagePath = `artifacts/${env.APP_ID}/public/documents/${
          entityName || driverId
        }/${documentType}/${filename}`;
      } else if (applicantName || applicationId) {
        storagePath = `artifacts/${env.APP_ID}/public/applications/${applicantName || applicationId}/${documentType}/${filename}`;
      } else {
        return reply
          .status(400)
          .send({ message: "Missing driverId, applicationId or applicantName" });
      }

      const fileStream = Readable.from(fileBuffer);
      const url = await documentService.uploadFile(
        fileStream,
        mimetype,
        storagePath
      );

      // if exists, update
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
      } else if (applicationId) {
         // Update Application Record
         const { applicationService } = require("../../services/applicationService");
         const updateData: Record<string, any> = {};
         
         // Map document Types to ApplicationSchema fields
         if (documentType === 'license') {
            updateData.licenseFront = url; 
            // Note: Simplification. Ideally we check licenseFront/Back but upload type is usually just 'license'
            // The frontend should specify 'licenseFront' or 'licenseBack' as documentType if possible.
            // If the documentType match schema fields exactly, we can use it directly.
         } else if (documentType === 'medical') {
            updateData.medicalCard = url;
         } else {
            // Generic fallback or direct mapping if names match
            updateData[documentType] = url;
         }

         await applicationService.update(applicationId, updateData);

         await documentService.createAuditLog({
            entityId: applicationId,
            entityName: applicantName || "Applicant",
            type: 'application_update',
            date: dayjs().toISOString(),
            user: (request.user as any).name || "System",
            description: `Applicant Upload: ${documentType}`,
         });
      }

      if (entityName || applicantName) {
        await documentService.createLog({
          date: uploadDate || dayjs().toISOString(),
          fileName: filename,
          type: documentType,
          entityName: entityName || applicantName,
          user: (request.user as any).name || (request.user as any).email || "User",
          fileUrl: url,
        });
      }

      return { url, filename: filename };
    }
  );

  // REQUESTS AND MEMOS

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
          magicLink: z.string(), // Kept for schema compatibility or if needed, but we regenerate secure link
          customMessage: z.string().optional(),
          driverId: z.string().optional(),
          docType: z.string().optional()
        }),
      },
    },
    async (request, reply) => {
      console.log("DEBUG: request-upload body:", request.body);
      const { email, driverName, requestType, magicLink, customMessage, driverId, docType } = request.body;
      
      let finalLink = magicLink;

      // If we have context to generate a secure token, do it
      if (driverId && docType) {
        const token = await tokenService.generateToken(driverId, docType);
        if (process.env.NODE_ENVIRONMENT ===  "production") {
          const baseUrl = process.env.APP_URL;
          finalLink = `${baseUrl}/driver/upload/?token=${token}`;
        } else {
          finalLink = `http://localhost:5173/driver/upload/?token=${token}`;
        }
      }

      await emailService.sendUploadRequest(email, driverName, requestType, finalLink, customMessage);
      return { success: true };
    }
  );

  server.get(
    "/upload-context/:token",
    {
      schema: {
        description: "Get context for an upload token",
        tags: ["Documents"],
        response: {
          200: z.object({
             valid: z.boolean(),
             driverName: z.string().optional(),
             documentType: z.string().optional(),
             driverId: z.string().optional()
          }),
          400: z.object({ message: z.string() }), // Token invalid/expired
        },
      },
    },
    async (request, reply) => {
      const { token } = request.params as { token: string };
      try {
        const meta = await tokenService.validateToken(token);
        const driver = await driverService.getById(meta.driverId);
        
        return { 
           valid: true, 
           driverName: driver ? `${driver.firstName} ${driver.lastName}` : "Unknown Driver",
           documentType: meta.documentType,
           driverId: meta.driverId
        };
      } catch (err) {
         return reply.status(400).send({ message: (err as Error).message });
      }
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

  server.post(
    "/public-upload",
    {
      schema: {
        description: "Public secure upload using a valid token",
        tags: ["Documents"],
        // No onRequest auth - handled by token validation
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

      if (!fileBuffer) return reply.status(400).send({ message: "No file uploaded" });

      const { token } = fields;
      if (!token) return reply.status(400).send({ message: "Missing token" });

      // Validate Token
      let meta;
      try {
        meta = await tokenService.validateToken(token);
      } catch (err) {
        return reply.status(400).send({ message: (err as Error).message });
      }

      // Upload File
      const storagePath = `artifacts/${env.APP_ID}/public/documents/${meta.driverId}/${meta.documentType}/${filename}`;
      const url = await documentService.uploadFile(Readable.from(fileBuffer), mimetype, storagePath);

      // Create/Update Driver Document Record
      const updateData: Record<string, any> = {};
      const { documentType } = meta;
      if (
        ["license", "medical", "mvr", "drugAlcohol", "roadTest"].includes(
          documentType
        )
      ) {
        const currentDriver = await driverService.getById(meta.driverId);
        if (currentDriver) {
           const currentDoc = (currentDriver as any)[documentType] || {};
           updateData[documentType] = {
             ...currentDoc,
             file: url,
             uploadedAt: dayjs().toISOString()
           };
        }
      } else if (documentType === "ssnDoc") {
         updateData.ssnDoc = url;
         updateData.ssnDocName = filename;
      } else {
         // Generic fallback
         updateData[documentType] = { file: url, uploadedAt: dayjs().toISOString() };
      }

      if (Object.keys(updateData).length > 0) {
        await driverService.updateDriver(meta.driverId, updateData);
        
        await documentService.createAuditLog({
            entityId: meta.driverId,
            entityName: "Driver Upload",
            type: 'profile_update',
            date: dayjs().toISOString(),
            user: "Driver (Token)",
            description: `Public Upload: ${meta.documentType} - ${filename}`,
        });
      }

      // Mark Token Used
      await tokenService.markTokenUsed(token);

      return { success: true, url, filename };
    }
  );

  server.delete(
    "/memos/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "Delete a memo or policy",
        tags: ["Documents"],
        params: z.object({ id: z.string() }),
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      await documentService.deleteMemo(id);
      return reply.status(204).send();
    }
  );
}
