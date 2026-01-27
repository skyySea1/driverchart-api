import { db } from "./firebaseService";
import {
  ApplicationSchema,
  type Application,
} from "../schemas/applicationSchema";
import { env } from "../utils/env";
import { logger } from "./logger-service";

const APP_ID = env.APP_ID;
const COLLECTION_PATH = `artifacts/${APP_ID}/public/data/applications`;

export const applicationService = {
  async getAll(): Promise<Application[]> {
    if (!COLLECTION_PATH) throw new Error("Invalid firebase collection path");
    const snapshot = await db.collection(COLLECTION_PATH).get();

    return snapshot.docs
      .map((doc) => {
        const result = ApplicationSchema.safeParse({
          id: doc.id,
          ...doc.data(),
        });
        if (!result.success) {
          logger.warn(
            { docId: doc.id, issues: result.error.issues },
            "[ApplicationService] Skipping invalid document"
          );
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
      logger.info("[ApplicationService] Creating application");
      if (!data) throw new Error("Invalid application data");

      const validatedData = ApplicationSchema.parse(data);
      logger.debug("[ApplicationService] Data validated successfully");

      // Generate ID explicitly
      const docRef = db.collection(COLLECTION_PATH).doc();
      const id = docRef.id;
      logger.debug(
        { id, path: COLLECTION_PATH },
        "[ApplicationService] Generated ID"
      );

      await docRef.set({
        ...validatedData,
        id: id, // Store ID in the document
        createdAt: new Date().toISOString(),
        status: validatedData.status || "New",
      });
      logger.info("[ApplicationService] Document saved to Firestore");
      return id;
    } catch (error) {
      logger.error(
        { err: error },
        "[ApplicationService] Error creating application"
      );
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
