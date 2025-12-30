import admin from 'firebase-admin';
import { env } from './env';

// Initialize Firebase Admin with credentials from environment variables if available
if (!admin.apps.length) {
  try {
    let credential;

    if (env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
      console.log('Initializing Firebase Admin with Service Account from ENV variables');
      credential = admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      });
    } else {
      console.log('Initializing Firebase Admin with Application Default Credentials');
      credential = admin.credential.applicationDefault();
    }

    admin.initializeApp({
      credential,
      projectId: env.FIREBASE_PROJECT_ID,
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
