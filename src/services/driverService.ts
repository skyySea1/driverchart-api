import { db } from "./firebaseService";
import { DriverSchema, type Driver } from "../schemas/driversSchema";
import { env } from "../utils/env";
import { documentService } from "./documentService";
import dayjs from "dayjs";

const COLLECTION_ID = env.COLLECTION_ID;
const COLLECTION_PATH = `artifacts/${COLLECTION_ID}/public/data/drivers`;

export const driverService = {
  async getAll(): Promise<Driver[]> {
    if (!COLLECTION_PATH) throw new Error("Invalid collection path");
    const snapshot = await db.collection(COLLECTION_PATH).get();

    return snapshot.docs
      .map((doc) => {
        const result = DriverSchema.safeParse({ id: doc.id, ...doc.data() });
        if (!result.success) {
          console.warn(
            `[DriverService] Skipping invalid driver ${doc.id}:`,
            result.error.issues
          );
          return null;
        }
        return result.data;
      })
      .filter((d): d is Driver => d !== null);
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

  async updateDriver(
    id: string,
    data: Partial<Driver>,
    userName?: string,
    userRole?: string
  ): Promise<void> {
    if (!id || !data) throw new Error("Invalid ID, or driver data");

    const validatedData = DriverSchema.partial().parse(data);
    const driverRef = db.collection(COLLECTION_PATH).doc(id);
    const APP_COLLECTION_PATH = `artifacts/${env.COLLECTION_ID}/public/data/applications`;

    // 1. Fetch current state outside transaction for comparison logic 
    // (or we can do it inside, but we must be careful with side effects)
    const currentDoc = await this.getById(id);
    if (!currentDoc) throw new Error("Driver not found");

    const driverName = `${currentDoc.firstName} ${currentDoc.lastName}`;

    // 2. Execute Transaction for atomic updates
    await db.runTransaction(async (transaction) => {
      // Re-read inside transaction to ensure consistency
      const tDoc = await transaction.get(driverRef);
      if (!tDoc.exists) throw new Error("Driver not found");
      const tData = tDoc.data() as Driver;

      // Sync with Application if status changed to 'Active'
      if (
        validatedData.hireStatus === "Active" &&
        tData.hireStatus !== "Active" &&
        tData.applicationId
      ) {
        const appRef = db.collection(APP_COLLECTION_PATH).doc(tData.applicationId);
        transaction.update(appRef, {
          status: "Hired",
          updatedAt: new Date().toISOString(),
        });
      }

      // Update Driver
      transaction.update(driverRef, {
        ...validatedData,
        updatedAt: new Date().toISOString(),
      });
    });

    // 3. Side Effects (Logging) - Executed AFTER successful transaction commit
    const logChange = async (
      type: string,
      oldFile?: string | null,
      newFile?: string | null
    ) => {
      if (newFile && newFile !== oldFile) {
        let cleanFileName = "document";
        try {
          const decoded = decodeURIComponent(newFile);
          cleanFileName = decoded.split("/").pop() || "document";
          cleanFileName = cleanFileName.split("?")[0];
        } catch (e) {
          cleanFileName = newFile.split("/").pop() || "document";
        }

        await documentService.createLog({
          date: dayjs().toISOString(),
          fileName: cleanFileName,
          type: type,
          entityName: driverName,
          user: userName || "System",
          userRole: userRole || "System role",
        });
      }
    };

    await Promise.all([
      logChange("License", currentDoc.license?.file, validatedData.license?.file),
      logChange("Medical Certificate", currentDoc.medical?.file, validatedData.medical?.file),
      logChange("MVR Report", currentDoc.mvr?.file, validatedData.mvr?.file),
      logChange("Drug & Alcohol", currentDoc.drugAlcohol?.file, validatedData.drugAlcohol?.file),
      logChange("Road Test", currentDoc.roadTest?.file, validatedData.roadTest?.file),
    ]);
  },

  async delete(id: string): Promise<void> {
    if (!id) throw new Error("Invalid ID");
    await db.collection(COLLECTION_PATH).doc(id).delete();
  },
};
