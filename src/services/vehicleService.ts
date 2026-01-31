import { db } from "./firebaseService";
import { VehicleSchema, type Vehicle } from "../schemas/vehiclesSchema";
import { env } from "../utils/env";
import { documentService } from "./documentService";
import dayjs from "dayjs";

const COLLECTION_ID = env.COLLECTION_ID;
const COLLECTION_PATH = `artifacts/${COLLECTION_ID}/public/data/vehicles`;

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

    // Generate ID explicitly
    const docRef = db.collection(COLLECTION_PATH).doc();
    const id = docRef.id;

    await docRef.set({
      ...validatedData,
      id: id, // Store ID in the document
      createdAt: new Date().toISOString(),
    });
    return id;
  },

  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<void> {
    if (!id) throw new Error("Invalid ID");
    else if (Object.keys(data).length === 0)
      throw new Error("No data provided for update");

    // Fetch current state to compare files
    const currentDoc = await this.getById(id);
    const validatedData = VehicleSchema.partial().parse(data);

    if (currentDoc) {
      const busName = `Bus #${
        currentDoc.busNumber
      } (VIN: ${currentDoc.vin.slice(-4)})`;

      // Log Inspection File Changes
      if (
        validatedData.inspectionFile &&
        validatedData.inspectionFile !== currentDoc.inspectionFile
      ) {
        await documentService.createLog({
          date: dayjs().toISOString(),
          fileName:
            validatedData.inspectionFile.split("/").pop() || "unknown-file",
          type: "Vehicle Inspection",
          entityName: busName,
          user: "System Admin",
        });
      }
    }

    await db.collection(COLLECTION_PATH).doc(id).update(validatedData);
  },

  async delete(id: string): Promise<void> {
    if (!id) throw new Error("Invalid ID");
    await db.collection(COLLECTION_PATH).doc(id).delete();
  },
};
