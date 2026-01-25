import { db } from "./firebaseService";
import { DriverSchema, type Driver } from "../schemas/driversSchema";
import { env } from "../utils/env";
import { documentService } from "./documentService";
import dayjs from "dayjs";

const APP_ID = env.APP_ID;
const COLLECTION_PATH = `artifacts/${APP_ID}/public/data/drivers`;

export const driverService = {
  async getAll(): Promise<Driver[]> {
    if (!COLLECTION_PATH) throw new Error("Invalid collection path");
    const snapshot = await db.collection(COLLECTION_PATH).get();
    return snapshot.docs.map((doc) =>
      DriverSchema.parse({ id: doc.id, ...doc.data() })
    );
  },

  async getById(id: string): Promise<Driver | null> {
    if (!id) throw new Error("Invalid ID");

    const doc = await db.collection(COLLECTION_PATH).doc(id).get();
    if (!doc.exists) return null;
    return DriverSchema.parse({ id: doc.id, ...doc.data() });
  },

  async createDriver(data: Driver): Promise<string> {
    if (!data) throw new Error("Invalid driver data");

    const validatedData = DriverSchema.parse(data);

    // Check for existing driver with same email (uniqueness check)
    if (validatedData.email) {
      const existing = await db
        .collection(COLLECTION_PATH)
        .where("email", "==", validatedData.email)
        .get();

      if (!existing.empty) {
        // Return existing ID instead of creating duplicate
        // OR throw error depending on desired behavior.
        // For seed script stability, we return existing ID.
        // For API, throwing might be better but let's be idempotent for now.
        console.log(
          `Driver with email ${validatedData.email} already exists. Skipping creation.`
        );
        return existing.docs[0].id;
      }
    }

    // Generate ID explicitly so we can store it in the document
    const docRef = db.collection(COLLECTION_PATH).doc();
    const id = docRef.id;

    await docRef.set({
      ...validatedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      id: id, // Store ID in the document last to ensure it's not overwritten
    });
    return id;
  },

  async updateDriver(id: string, data: Partial<Driver>): Promise<void> {
    if (!id || !data) throw new Error("Invalid ID, or driver data");

    // Fetch current state to compare files
    const currentDoc = await this.getById(id);
    const validatedData = DriverSchema.partial().parse(data);

    if (currentDoc) {
      const driverName = `${currentDoc.firstName} ${currentDoc.lastName}`;
      const logChange = async (
        type: string,
        oldFile?: string | null,
        newFile?: string | null
      ) => {
        if (newFile && newFile !== oldFile) {
          // Extrair nome limpo do arquivo decodificando a URL e pegando a última parte
          let cleanFileName = "document";
          try {
            const decoded = decodeURIComponent(newFile);
            cleanFileName = decoded.split("/").pop() || "document";
            // Remover parâmetros de query se houver (ex: ?alt=media)
            cleanFileName = cleanFileName.split("?")[0];
          } catch (e) {
            cleanFileName = newFile.split("/").pop() || "document";
          }

          await documentService.createLog({
            date: dayjs().toISOString(),
            fileName: cleanFileName,
            type: type,
            entityName: driverName,
            user: "System Audit",
          });
        }
      };

      await Promise.all([
        logChange(
          "License",
          currentDoc.license?.file,
          validatedData.license?.file
        ),
        logChange(
          "Medical Certificate",
          currentDoc.medical?.file,
          validatedData.medical?.file
        ),
        logChange("MVR Report", currentDoc.mvr?.file, validatedData.mvr?.file),
        logChange(
          "Drug & Alcohol",
          currentDoc.drugAlcohol?.file,
          validatedData.drugAlcohol?.file
        ),
        logChange(
          "Road Test",
          currentDoc.roadTest?.file,
          validatedData.roadTest?.file
        ),
        logChange("SSN Card", currentDoc.ssnDoc, (validatedData as any).ssnDoc),
      ]);
    }

    await db
      .collection(COLLECTION_PATH)
      .doc(id)
      .update({
        ...validatedData,
        updatedAt: new Date().toISOString(),
      });
  },

  async delete(id: string): Promise<void> {
    if (!id) throw new Error("Invalid ID");
    await db.collection(COLLECTION_PATH).doc(id).delete();
  },
};