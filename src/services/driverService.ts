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
    
    // Generate ID explicitly so we can store it in the document
    const docRef = db.collection(COLLECTION_PATH).doc();
    const id = docRef.id;

    await docRef.set({
      ...validatedData,
      id: id, // Store ID in the document
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
      const logChange = async (type: string, oldFile?: string | null, newFile?: string | null) => {
        if (newFile && newFile !== oldFile) {
          await documentService.createLog({
            date: dayjs().toISOString(),
            fileName: newFile.split('/').pop() || 'unknown-file',
            type: type,
            entityName: driverName,
            user: 'System Admin', // todo: get user from context
          });
        }
      };

      await Promise.all([
        logChange('CDL', currentDoc.cdl?.file, validatedData.cdl?.file),
        logChange('Medical', currentDoc.medical?.file, validatedData.medical?.file),
        logChange('MVR', currentDoc.mvr?.file, validatedData.mvr?.file),
        logChange('Drug & Alcohol', currentDoc.drugAlcohol?.file, validatedData.drugAlcohol?.file),
        logChange('Road Test', currentDoc.roadTest?.file, validatedData.roadTest?.file),
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