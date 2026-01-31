import { db } from "../services/firebaseService";
import { env } from "../utils/env";

const COLLECTION_ID = env.COLLECTION_ID;
const COLLECTION_PATH = `artifacts/${COLLECTION_ID}/public/data/users`;

async function inspectUsers() {
  console.log("Inspecting collection:", COLLECTION_PATH);
  const snapshot = await db.collection(COLLECTION_PATH).get();
  if (snapshot.empty) {
    console.log("No users found in collection.");
    return;
  }

  snapshot.forEach((doc) => {
    console.log("--- User ---");
    console.log("ID:", doc.id);
    console.log("Data:", JSON.stringify(doc.data(), null, 2));
  });
}

inspectUsers().catch(console.error);
