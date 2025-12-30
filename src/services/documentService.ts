import { db } from '../utils/firebase';
import { DocumentLogSchema, type DocumentLog } from '../schemas/documentsSchema';

const APP_ID = process.env.FIREBASE_APP_ID || 'dot-compliance-app';
const COLLECTION_PATH = `artifacts/${APP_ID}/public/data/document_logs`;
// added schema parsing to ensure data integrity and validation
// todo add error handling for create and update operations

export const documentService = {

  async getAll(): Promise<DocumentLog[]> {
    if (!COLLECTION_PATH) throw new Error("Invalid collection path");
    
    const snapshot = await db.collection(COLLECTION_PATH).get();
    return snapshot.docs.map(doc => DocumentLogSchema.parse({ id: doc.id, ...doc.data() } ));
  },

  async createLog(data: DocumentLog): Promise<string> {
    if (!data) throw new Error("Invalid document log data");
    
    const validatedData = DocumentLogSchema.parse(data);
    const docRef = await db.collection(COLLECTION_PATH).add(validatedData);
    return docRef.id;
  },

  async getByEntity(entityName: string): Promise<DocumentLog[]> {
    if (!entityName) throw new Error("Invalid entity name");

    const snapshot = await db.collection(COLLECTION_PATH).where('entityName', '==', entityName).get();
    return snapshot.docs.map(doc => DocumentLogSchema.parse({ id: doc.id, ...doc.data() } ));
  }
};
