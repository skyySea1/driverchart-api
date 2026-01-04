import { db } from "../services/firebaseService";
import { env } from "../utils/env";

const APP_ID = env.APP_ID;
const collections = [
  `artifacts/${APP_ID}/public/data/drivers`,
  `artifacts/${APP_ID}/public/data/vehicles`,
  `artifacts/${APP_ID}/public/data/applications`,
  `artifacts/${APP_ID}/public/data/alerts`,
  `artifacts/${APP_ID}/public/data/documents`,
];

async function deleteCollection(path: string) {
  console.log(`Cleaning collection: ${path}...`);
  const snapshot = await db.collection(path).get();
  
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`Done: ${snapshot.size} documents deleted.`);
}

async function clear() {
  console.log(`⚠️  STARTING DATABASE CLEANUP FOR APP_ID: ${APP_ID} ⚠️`);
  
  try {
    for (const col of collections) {
      await deleteCollection(col);
    }
    console.log("✅ Database cleared successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error clearing database:", error);
    process.exit(1);
  }
}

clear();
