import admin from "firebase-admin";
import { env } from "../utils/env";
import path from "path";
import fs from "fs";

// Initialize Firebase Admin with credentials from environment variables if available
if (!admin.apps.length) {
  try {
    let credential;

    if (env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
      console.log(
        "Initializing Firebase Admin with Service Account from ENV variables"
      );
      
      let privateKey = env.FIREBASE_PRIVATE_KEY.replace(/^"|"$/g, '');

      // Check if the key is Base64 encoded (starts with typical Base64 char and doesn't look like a PEM header)
      // A PEM header starts with "-----BEGIN", which in Base64 is "LS0tLS1CRUdJTi"
      if (!privateKey.includes("-----BEGIN") && !privateKey.includes("\\n")) {
         try {
            const decoded = Buffer.from(privateKey, 'base64').toString('utf-8');
            if (decoded.includes("-----BEGIN")) {
               console.log("Detected Base64 encoded private key. Decoding...");
               privateKey = decoded;
            }
         } catch (e) {
            // Not base64 or failed to decode, proceed with standard handling
         }
      }

      // Handle standard escape sequences
      privateKey = privateKey.replace(/\\n/g, '\n');

      credential = admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      });
    } else {
      const serviceAccountPath = path.resolve(
        process.cwd(),
        "service-account.json"
      );
      if (fs.existsSync(serviceAccountPath)) {
        console.log(
          "\n 🔑 Initializing Firebase Admin with service-account.json \n"
        );
        credential = admin.credential.cert(serviceAccountPath);
      }
      else {
        console.log(
          "Initializing Firebase Admin with Application Default Credentials"
        );
        credential = admin.credential.applicationDefault();
      }
    }

    admin.initializeApp({
      credential,
      projectId: env.FIREBASE_PROJECT_ID,
    });
    console.log("🔥 Firebase Admin initialized successfully 🔥\n");
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
