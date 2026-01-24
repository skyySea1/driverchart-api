import admin from "firebase-admin";
import { env } from "../utils/env";

const envInfo = process.env.VERCEL 
  ? `Vercel (${process.env.VERCEL_ENV})` 
  : `Local (${env.NODE_ENVIRONMENT})`;

// Initialize Firebase Admin with credentials from environment variables if available
if (!admin.apps.length) {
  try {
    let credential;

    if (
      env.FIREBASE_CLIENT_EMAIL &&
      env.FIREBASE_PRIVATE_KEY &&
      env.FIREBASE_PROJECT_ID
    ) {
      console.log(
        `Initializing Firebase Admin with Service Account from ENV variables ${envInfo}...`
      );

      let privateKey = env.FIREBASE_PRIVATE_KEY.replace(/^"|"$/g, "");

      // Check if the key is Base64 encoded
      if (!privateKey.includes("-----BEGIN") && !privateKey.includes("\\n")) {
        try {
          const decoded = Buffer.from(privateKey, "base64").toString("utf-8");
          if (decoded.includes("-----BEGIN")) {
            console.log("Detected Base64 encoded private key. Decoding...");
            privateKey = decoded;
          }
        } catch (e) {
          console.warn("Failed to decode Base64 private key, using as-is");
        }
      }

      // Handle standard escape sequences
      privateKey = privateKey.replace(/\\n/g, "\n");

      credential = admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      });
    } else {
      throw new Error(
        "Missing Firebase credentials. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables."
      );
    }

    admin.initializeApp({
      credential,
      projectId: env.FIREBASE_PROJECT_ID,
      storageBucket: env.FIREBASE_STORAGE_BUCKET,
    });
    console.log("🔥 Firebase Admin initialized successfully 🔥\n");
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    throw error; // Fail fast in production
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
