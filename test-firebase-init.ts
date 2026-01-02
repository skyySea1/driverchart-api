import admin from "firebase-admin";
import { env } from "./src/utils/env";

console.log("Testing Firebase Admin Initialization...");

try {
  // Same logic as src/services/firebaseService.ts
  const privateKey = env.FIREBASE_PRIVATE_KEY
    ? env.FIREBASE_PRIVATE_KEY.replace(/^"|"$/g, '').replace(/\\n/g, '\n')
    : undefined;

  console.log("Parsed Private Key Length:", privateKey?.length ?? 0);
  console.log("Parsed Private Key Header:", privateKey?.substring(0, 30));

  if (!env.FIREBASE_CLIENT_EMAIL || !privateKey) {
    throw new Error("Missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY");
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
    projectId: env.FIREBASE_PROJECT_ID,
  });

  console.log("✅ SUCCESS: Firebase Admin initialized correctly with local .env!");
} catch (error) {
  console.error("❌ FAILURE: Initialization failed.");
  console.error(error);
}
