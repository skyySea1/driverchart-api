import { auth, db } from "../services/firebaseService";
import { env } from "../utils/env";

const TARGET_EMAIL = "henrir1020@gmail.com";
const TARGET_ROLE = "Admin";
const COLLECTION_ID = env.COLLECTION_ID;
const USERS_COLLECTION = `artifacts/${COLLECTION_ID}/public/data/users`;

async function fixAdmin() {
  console.log(`\n--- Fixing Admin Role for ${TARGET_EMAIL} ---\n`);

  try {
    // 1. Get User from Auth
    console.log(`Searching for user in Firebase Auth...`);
    const userRecord = await auth.getUserByEmail(TARGET_EMAIL);
    const uid = userRecord.uid;
    console.log(`Found user! UID: ${uid}`);

    // 2. Set Custom Claims
    console.log(`Setting Custom Claim: { role: "${TARGET_ROLE}" }...`);
    await auth.setCustomUserClaims(uid, { role: TARGET_ROLE });
    console.log(`Custom Claim set successfully.`);

    // 3. Update/Create Firestore Document
    console.log(`Updating Firestore document in ${USERS_COLLECTION}...`);
    const userRef = db.collection(USERS_COLLECTION).doc(uid);
    const doc = await userRef.get();

    const userData = {
      id: uid,
      email: TARGET_EMAIL,
      name: userRecord.displayName || "Admin",
      firstName: (userRecord.displayName || "Admin").split(" ")[0],
      lastName:
        (userRecord.displayName || "Admin").split(" ").slice(1).join(" ") ||
        "User",
      role: TARGET_ROLE,
      isActive: true,
      updatedAt: new Date().toISOString(),
    };

    if (!doc.exists) {
      console.log(`Document does not exist. Creating new...`);
      await userRef.set({
        ...userData,
        createdAt: new Date().toISOString(),
      });
    } else {
      console.log(`Document exists. Updating role...`);
      await userRef.update({
        role: TARGET_ROLE,
        updatedAt: new Date().toISOString(),
      });
    }

    console.log(`\n✅ Successfully promoted ${TARGET_EMAIL} to Admin!`);
    console.log(
      `Please sign out and sign back in on the web app to refresh your token.\n`
    );

    process.exit(0);
  } catch (error: any) {
    console.error(`\n❌ Error fixing Admin:`, error.message);
    process.exit(1);
  }
}

fixAdmin();
