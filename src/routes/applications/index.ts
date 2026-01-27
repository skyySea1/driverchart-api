import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { ApplicationSchema } from "../../schemas/applicationSchema";
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
            statusCode: z.number().optional(),
            error: z.string(),
            message: z.string(),
            issues: z.array(z.any()).optional(),
          }),
          500: z.object({ message: z.string(), error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const id = await applicationService.create(request.body);
      return reply.status(201).send({ id });
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

  server.post(
    "/:id/promote",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "Promote applicant to pending driver",
        tags: ["Applications"],
        params: z.object({ id: z.string() }),
        response: {
          200: z.object({ driverId: z.string() }),
          400: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const app = await applicationService.getById(id);
      if (!app)
        return reply.status(404).send({ message: "Application not found" });

      // Check duplicates
      const allDrivers = await import("../../services/driverService").then(m => m.driverService.getAll());
      const isDuplicate = allDrivers.some(
        (d) => d.ssnNumber === app.personalInfo.ssnNumber || d.email === app.personalInfo.email
      );

      if (isDuplicate) {
        return reply.status(400).send({ message: "Driver with this SSN or Email already exists." });
      }

      // Map Application to Driver
      // Basic mapping
      const { driverService } = await import("../../services/driverService");
      const { documentService } = await import("../../services/documentService"); 
      const dayjs = (await import("dayjs")).default;
      const { env } = await import("../../utils/env");

      const primaryAddress = app.addresses[0] || { street: "", city: "", state: "", zip: "" };
      const primaryLicense = app.licenses[0] || { number: "", state: "", expirationDate: "" };

      const newDriverId = await driverService.createDriver({
        firstName: app.personalInfo.firstName,
        middleName: app.personalInfo.middleName,
        lastName: app.personalInfo.lastName,
        dob: app.personalInfo.dob,
        ssnNumber: app.personalInfo.ssnNumber,
        phone: app.personalInfo.phone,
        email: app.personalInfo.email,
        address: primaryAddress.street,
        city: primaryAddress.city,
        state: primaryAddress.state,
        zip: primaryAddress.zip,
        hireDate: dayjs().format("YYYY-MM-DD"),
        hireStatus: "Pending",
        w9Signed: false,
        isFlagged: false,
        
        license: {
          documentNumber: primaryLicense.number,
          state: primaryLicense.state,
          expiryDate: primaryLicense.expirationDate,
          // File will be copied later
        },
        medical: {
          expiryDate: app.personalInfo.medicalExpirationDate,
          documentNumber: "",
          registry: "",
          // File will be copied later
        },
        // Initialize others
        mvr: { documentNumber: "" },
        drugAlcohol: { documentNumber: "" },
        roadTest: { documentNumber: "", examiner: "" },
        emergencyContact: { name: "", phone: "", relationship: "" },
        
        // App Reference
        applicationId: app.id,
        appliedDate: app.appliedDate || app.createdAt,
        
        // Signatures
        drugTestSignature: app.drugTestSignature,
        drugTestDate: app.drugTestDate,
        authReleaseSignature: app.authReleaseSignature,
        authReleaseDate: app.authReleaseDate,
        pspDisclosureSignature: app.pspDisclosureSignature,
        pspDisclosureDate: app.pspDisclosureDate,
        fmcsaConsentSignature: app.fmcsaConsentSignature,
        fmcsaConsentDate: app.fmcsaConsentDate,
        alcoholDrugPolicySignature: app.alcoholDrugPolicySignature,
        alcoholDrugPolicyDate: app.alcoholDrugPolicyDate,
        generalWorkPolicySignature: app.generalWorkPolicySignature,
        generalWorkPolicyDate: app.generalWorkPolicyDate,
        fairCreditReportingSignature: app.fairCreditReportingSignature,
        fairCreditReportingDate: app.fairCreditReportingDate,

        // Checklist
        qualificationChecklist: {
          dotApplication: true,
          completedAt: {
             dotApplication: dayjs().toISOString(),
          },
          drivingRecordInquiry: false,
          goodFaithEffort: false,
          roadTest: false,
          medicalCertificate: false,
          medicalRegistryVerification: false,
          annualDrivingReview: false,
          cdlisReport: false,
          drugAlcoholClearinghouse: false,
          preEmploymentDrugTest: false,
          randomProgramPlacement: false,
          companyTestingPolicyReceipt: false,
          drugAlcoholStatement: false,
        }
      });

      // File Copy Logic
      const updates: Record<string, any> = {};
      const copy = async (url: string | undefined, type: string) => {
        if (!url) return undefined;
        const sourcePath = documentService.getStoragePathFromUrl(url);
        if (!sourcePath) return url; // Keep original if fail to extract (maybe it's external?)

        // Construct destination path: artifacts/APP_ID/public/documents/DRIVER_ID/TYPE/FILENAME
        const filename = sourcePath.split("/").pop() || "doc";
        const destPath = `artifacts/${env.APP_ID}/public/documents/${newDriverId}/${type}/${filename}`;

        try {
           const newUrl = await documentService.copyFile(sourcePath, destPath);
           return newUrl;
        } catch (e) {
           console.error(`Failed to copy file for ${type}:`, e);
           return url; // Fallback to original
        }
      };

      // Perform Copies
      if (app.licenseFront) {
         const newUrl = await copy(app.licenseFront, "license");
         updates.license = { 
           documentNumber: primaryLicense.number,
           state: primaryLicense.state,
           expiryDate: primaryLicense.expirationDate,
           file: newUrl 
         };
      }
      
      if (app.medicalCard) {
         const newUrl = await copy(app.medicalCard, "medical");
         updates.medical = {
            expiryDate: app.personalInfo.medicalExpirationDate,
            file: newUrl
         };
      }

      // Update Driver if we copied files
      if (Object.keys(updates).length > 0) {
        await driverService.updateDriver(newDriverId, updates);
      }

      // Update Application
      await applicationService.update(id, { status: "Pending" });

      return { driverId: newDriverId };
    }
  );
}
