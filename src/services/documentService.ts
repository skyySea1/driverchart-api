import { db, storage } from "./firebaseService";
import {
  DocumentLogSchema,
  type DocumentLog,
} from "../schemas/documentsSchema";
import {
  AuditLogSchema,
  type AuditLog,
} from "../schemas/auditSchema";
import { pipeline } from "node:stream/promises";

// review how pipeline works
const APP_ID = process.env.FIREBASE_APP_ID || "dot-compliance-app";
const DOCUMENT_LOGS_PATH = `artifacts/${APP_ID}/public/data/document_logs`;
const AUDIT_LOGS_PATH = `artifacts/${APP_ID}/public/data/audit_logs`;
const MEMOS_PATH = `artifacts/${APP_ID}/public/data/memos`;

export const documentService = {
  async getAll(): Promise<DocumentLog[]> {
    if (!DOCUMENT_LOGS_PATH) throw new Error("Invalid collection path");

    const snapshot = await db.collection(DOCUMENT_LOGS_PATH).get();
    return snapshot.docs.map((doc) =>
      DocumentLogSchema.parse({ id: doc.id, ...doc.data() })
    );
  },

  async createLog(data: DocumentLog): Promise<string> {
    if (!data) throw new Error("Invalid document log data");

    const validatedData = DocumentLogSchema.parse(data);
    const docRef = await db.collection(DOCUMENT_LOGS_PATH).add(validatedData);
    return docRef.id;
  },

  async getByEntity(entityName: string): Promise<DocumentLog[]> {
    if (!entityName) throw new Error("Invalid entity name");

    const snapshot = await db
      .collection(DOCUMENT_LOGS_PATH)
      .where("entityName", "==", entityName)
      .get();
    return snapshot.docs.map((doc) =>
      DocumentLogSchema.parse({ id: doc.id, ...doc.data() })
    );
  },

  async createAuditLog(data: AuditLog): Promise<string> {
    if (!data) throw new Error("Invalid audit log data");

    const validatedData = AuditLogSchema.parse(data);
    const docRef = await db.collection(AUDIT_LOGS_PATH).add(validatedData);
    return docRef.id;
  },

  async getAuditByEntity(entityId: string): Promise<AuditLog[]> {
    if (!entityId) throw new Error("Invalid entity ID");

    const snapshot = await db
      .collection(AUDIT_LOGS_PATH)
      .where("entityId", "==", entityId)
      .get();
    return snapshot.docs.map((doc) =>
      AuditLogSchema.parse({ id: doc.id, ...doc.data() })
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async uploadFile(fileStream: any, mimeType: string, filePath: string): Promise<string> {
    const bucket = storage.bucket();
    const fileRef = bucket.file(filePath);

    const writeStream = fileRef.createWriteStream({
      metadata: {
        contentType: mimeType,
      },
    });

    await pipeline(fileStream, writeStream);
    await fileRef.makePublic();

    return fileRef.publicUrl();
  },

  async saveMemo(data: { title: string; fileUrl: string; type: 'memo' | 'policy' }): Promise<string> {
    const docRef = await db.collection(MEMOS_PATH).add({
      ...data,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  },

  async getAllMemos(): Promise<any[]> {
    const snapshot = await db.collection(MEMOS_PATH).orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async deleteMemo(id: string): Promise<void> {
    if (!id) throw new Error("Invalid ID");
    await db.collection(MEMOS_PATH).doc(id).delete();
  },

  async copyFile(sourcePath: string, destPath: string): Promise<string> {
    const bucket = storage.bucket();
    // Clean paths
    // Firebase storage paths often include the bucket prefix? No, usually just object path.
    // If the URL is full, we might need to extract path. But here we assume internal path usage.
    
    // Safety check: ensure paths don't start with /
    const safeSource = sourcePath.startsWith('/') ? sourcePath.slice(1) : sourcePath;
    const safeDest = destPath.startsWith('/') ? destPath.slice(1) : destPath;

    const sourceFile = bucket.file(safeSource);
    const destFile = bucket.file(safeDest);

    // Copy the file
    await sourceFile.copy(destFile);

    // Make the destination public to get a URL
    await destFile.makePublic();
    
    return destFile.publicUrl();
  },

  getStoragePathFromUrl(url: string): string {
    if (!url) return "";
    try {
       // Handle Firebase Storage URLs
       // Format: https://storage.googleapis.com/BUCKET_NAME/OBJECT_PATH
       // or http://localhost:9199/v0/b/BUCKET_NAME/o/OBJECT_PATH?token=...
       
       const decoded = decodeURIComponent(url);
       
       // Handle Emulator/Local
       if (decoded.includes("/o/")) {
         const path = decoded.split("/o/")[1];
         return path.split("?")[0];
       }
       
       // Handle Production (assuming standard public URL format logic if different)
       // Usually: https://storage.googleapis.com/bucket/path/to/file
       // But makePublic() returns a specific format.
       // Let's assume the path starts after the bucket name if accessible, or we use a known prefix?
       // This is tricky without knowing the exact URL structure returned by `publicUrl()`.
       // `file.publicUrl()` usually returns `https://storage.googleapis.com/${bucket.name}/${file.name}`
       
       // Heuristic: Remove domain and bucket if possible
       const parts = decoded.split("/");
       // Find known prefix "artifacts"
       const artifactIndex = parts.indexOf("artifacts");
       if (artifactIndex !== -1) {
          return parts.slice(artifactIndex).join("/").split("?")[0];
       }
       
       return "";
    } catch (e) {
      return "";
    }
  }
};
