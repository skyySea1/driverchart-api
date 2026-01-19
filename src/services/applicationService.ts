import { db } from "./firebaseService";
import {
  ApplicationSchema,
  type Application,
} from "../schemas/applicationsSchema";
import { env } from "../utils/env";

const APP_ID = env.APP_ID;
const COLLECTION_PATH = `artifacts/${APP_ID}/public/data/applications`;

export const applicationService = {
  async getAll(): Promise<Application[]> {
    if (!COLLECTION_PATH) throw new Error("Invalid collection path");
    const snapshot = await db.collection(COLLECTION_PATH).get();
    
    return snapshot.docs
      .map((doc) => {
        const result = ApplicationSchema.safeParse({ id: doc.id, ...doc.data() });
        if (!result.success) {
          console.warn(`[ApplicationService] Skipping invalid document ${doc.id}:`, JSON.stringify(result.error.issues));
          return null;
        }
        return result.data;
      })
      .filter((doc): doc is Application => doc !== null);
  },

  async getById(id: string): Promise<Application | null> {
    if (!id) throw new Error("Invalid ID");

    const doc = await db.collection(COLLECTION_PATH).doc(id).get();
    if (!doc.exists) return null;
    return ApplicationSchema.parse({ id: doc.id, ...doc.data() });
  },

  async create(data: Application): Promise<string> {
    try {
      console.log("[ApplicationService] Creating application with data:", JSON.stringify(data, null, 2));
      if (!data) throw new Error("Invalid application data");

      const validatedData = ApplicationSchema.parse(data);
      console.log("[ApplicationService] Data validated successfully");
      
      // Generate ID explicitly
      const docRef = db.collection(COLLECTION_PATH).doc(); // review why await is needed here
      const id = docRef.id;
      console.log("[ApplicationService] Generated ID:", id, "at path:", COLLECTION_PATH);

      await docRef.set({
        ...validatedData,
        id: id, // Store ID in the document
        createdAt: new Date().toISOString(),
        status: "Pending",
      });
      console.log("[ApplicationService] Document saved to Firestore");
      return id;
    } catch (error) {
      console.error("[ApplicationService] Error creating application:", error);
      throw error;
    }
  },

  async update(id: string, data: Partial<Application>): Promise<void> {
    if (!id || !data) throw new Error("Invalid ID, or application data");

    const validatedData = ApplicationSchema.partial().parse(data);
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
