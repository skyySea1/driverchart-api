import admin from 'firebase-admin';
import { env } from './env';

// Initialize Firebase Admin with credentials from environment variables if available
// Otherwise, it might use GOOGLE_APPLICATION_CREDENTIALS path
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: env.FIREBASE_PROJECT_ID,
    });
    console.log('Firebase Admin initialized with Service Account');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
