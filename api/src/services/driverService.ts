import { db } from "../utils/firebase";
import { DriverSchema, type Driver } from "../schemas/driversSchema";
import { env } from "../utils/env";

const APP_ID = env.APP_ID;
const COLLECTION_PATH = `artifacts/${APP_ID}/public/data/drivers`;
// added schema parsing to ensure data integrity and validation
// todo add error handling for create and update operations

export const driverService = {
  async getAll(): Promise<Driver[]> {
    if (!COLLECTION_PATH) throw new Error("Invalid collection path");
    console.log(`Querying Firestore path: ${COLLECTION_PATH}`);
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
    const docRef = await db.collection(COLLECTION_PATH).add({
      ...validatedData,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  },

  async updateDriver(id: string, data: Partial<Driver>): Promise<void> {
    if (!id || !data) throw new Error("Invalid ID, or driver data");

    const validatedData = DriverSchema.partial().parse(data);
    await db.collection(COLLECTION_PATH).doc(id).update(validatedData);
  },

  async delete(id: string): Promise<void> {
    if (!id) throw new Error("Invalid ID");
    await db.collection(COLLECTION_PATH).doc(id).delete();
  },
};
