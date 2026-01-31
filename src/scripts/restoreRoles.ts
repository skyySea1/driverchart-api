import { db } from "../services/firebaseService";
import { env } from "../utils/env";

const COLLECTION_ID = env.COLLECTION_ID;
const COLLECTION_PATH = `artifacts/${COLLECTION_ID}/public/data/users`;

async function restoreCapitalizedRoles() {
  console.log("Restoring Capitalized roles in collection:", COLLECTION_PATH);
  const snapshot = await db.collection(COLLECTION_PATH).get();

  if (snapshot.empty) {
    console.log("No users found.");
    return;
  }

  const batch = db.batch();
  let count = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    const updates: any = {};

    // Normalize Role to Capitalized if it's currently lowercase
    if (data.role && typeof data.role === "string") {
      const lower = data.role.toLowerCase();
      let capitalized = "";

      switch (lower) {
        case "admin":
          capitalized = "Admin";
          break;
        case "manager":
          capitalized = "Manager";
          break;
        case "dispatcher":
          capitalized = "Dispatcher";
          break;
        case "auditor":
          capitalized = "Auditor";
          break;
        case "viewer":
          capitalized = "Viewer";
          break;
      }

      if (capitalized && data.role !== capitalized) {
        updates.role = capitalized;
      }
    }

    if (Object.keys(updates).length > 0) {
      console.log(`Updating user ${doc.id} (${data.email}):`, updates);
      batch.update(doc.ref, updates);
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`Successfully restored capitalized roles for ${count} users.`);
  } else {
    console.log("No users needed role restoration.");
  }
}

restoreCapitalizedRoles().catch(console.error);
