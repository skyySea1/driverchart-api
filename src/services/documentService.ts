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
  }
};
