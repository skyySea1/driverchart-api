import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { driverService } from "../../services/driverService";
import { documentService } from "../../services/documentService";
import { env } from "../../utils/env";
import { Readable } from "stream";
import path from "path";
import dayjs from "dayjs";

function sanitizeFilename(filename: string): string {
  const safeName = path.basename(filename);
  return safeName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

const TYPE_MAP: Record<string, string> = {
  "5": "license",
  "6": "medical",
  "7": "fcra"
};

export default async function (fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  // Get public info for driver (to show "Hello, John D.")
  server.get(
    "/driver/:id",
    {
      schema: {
        description: "Get limited public info for a driver",
        tags: ["Public"],
        params: z.object({ id: z.string() }),
        response: {
          200: z.object({
            firstName: z.string(),
            lastNameInitial: z.string(),
          }),
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const driver = await driverService.getById(id);
      if (!driver) return reply.status(404).send({ message: "Driver not found" });

      return {
        firstName: driver.firstName,
        lastNameInitial: driver.lastName.charAt(0).toUpperCase(),
      };
    }
  );

  // Public Upload Endpoint
  server.post(
    "/upload",
    {
      schema: {
        description: "Publicly upload a document for a driver via magic link",
        tags: ["Public"],
      },
    },
    async (request, reply) => {
      const parts = request.parts();
      let fileBuffer: Buffer | undefined;
      let filename: string = "";
      let mimetype: string = "";
      const fields: Record<string, string> = {};

      for await (const part of parts) {
        if (part.type === "file") {
          fileBuffer = await part.toBuffer();
          filename = sanitizeFilename(part.filename);
          mimetype = part.mimetype;
        } else {
          fields[part.fieldname] = part.value as string;
        }
      }

      const { driverId, typeId } = fields;

      if (!fileBuffer || !driverId || !typeId) {
        return reply.status(400).send({ message: "Missing file, driverId or typeId" });
      }

      const documentType = TYPE_MAP[typeId];
      if (!documentType) return reply.status(400).send({ message: "Invalid type ID" });

      const driver = await driverService.getById(driverId);
      if (!driver) return reply.status(404).send({ message: "Driver not found" });

      const driverName = `${driver.firstName} ${driver.lastName}`;
      const storagePath = `artifacts/${env.APP_ID}/public/drivers/${driverName}/${documentType}/${filename}`;

      const url = await documentService.uploadFile(Readable.from(fileBuffer), mimetype, storagePath);

      // Update driver record
      const updateData: Record<string, any> = {};
      if (["license", "medical", "fcra"].includes(documentType)) {
         // for fcra we might want a different structure, but treating as doc for now
         const currentDoc = (driver as any)[documentType] || {};
         updateData[documentType] = {
           ...currentDoc,
           file: url,
           uploadDate: dayjs().toISOString()
         };
      }

      await driverService.updateDriver(driverId, updateData);

      // Log the event
      await documentService.createAuditLog({
        entityId: driverId,
        entityName: driverName,
        type: 'profile_update',
        date: dayjs().toISOString(),
        user: "Public Magic Link",
        description: `Driver uploaded ${documentType} via magic link: ${filename}`,
      });

      return { success: true, url };
    }
  );
}
