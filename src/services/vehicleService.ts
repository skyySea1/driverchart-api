import { db } from "../utils/firebase";
import { VehicleSchema, type Vehicle } from "../schemas/vehiclesSchema";
import { env } from "../utils/env";

const APP_ID = env.APP_ID;
const COLLECTION_PATH = `artifacts/${APP_ID}/public/data/vehicles`;

// added schema parsing to ensure data integrity and return, input validation
// todo add error handling for create and update operations

export const vehicleService = {
  async getAll(): Promise<Vehicle[]> {
    if (!COLLECTION_PATH) throw new Error("Invalid collection path");

    const snapshot = await db.collection(COLLECTION_PATH).get();
    return snapshot.docs.map((doc) =>
      VehicleSchema.parse({ id: doc.id, ...doc.data() })
    );
  },

  async getById(id: string): Promise<Vehicle | null> {
    if (!id) throw new Error("Invalid ID");
    const doc = await db.collection(COLLECTION_PATH).doc(id).get();
    if (!doc.exists) throw new Error("Vehicle not found");
    return VehicleSchema.parse({ id: doc.id, ...doc.data() });
  },

  async createVehicle(data: Vehicle): Promise<string> {
    if (!data) throw new Error("Invalid vehicle data");
    const validatedData = VehicleSchema.parse(data);
    const docRef = await db.collection(COLLECTION_PATH).add({
      ...validatedData,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  },

  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<void> {
    if (!id) throw new Error("Invalid ID");
    else if (Object.keys(data).length === 0)
      throw new Error("No data provided for update");
    const validatedData = VehicleSchema.partial().parse(data);
    await db.collection(COLLECTION_PATH).doc(id).update(validatedData);
  },

  async delete(id: string): Promise<void> {
    if (!id) throw new Error("Invalid ID");
    await db.collection(COLLECTION_PATH).doc(id).delete();
  },
};
