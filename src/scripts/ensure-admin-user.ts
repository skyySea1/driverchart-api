import { auth, db } from "../services/firebaseService";
import { env } from "../utils/env";

const TARGET_EMAIL = "admin@example.com";
const TARGET_PASSWORD = "desenv";
const TARGET_ROLE = "Admin";
const APP_ID = env.APP_ID;
const USERS_COLLECTION = `artifacts/${APP_ID}/public/data/users`;

async function ensureAdmin() {
  console.log(`\n--- Ensuring Admin User for ${TARGET_EMAIL} ---\n`);

  try {
    let uid;
    try {
      const userRecord = await auth.getUserByEmail(TARGET_EMAIL);
      uid = userRecord.uid;
      console.log(`User exists in Auth. Updating password...`);
      await auth.updateUser(uid, {
        password: TARGET_PASSWORD,
        emailVerified: true,
      });
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        console.log(`User not found in Auth. Creating...`);
        const userRecord = await auth.createUser({
          email: TARGET_EMAIL,
          password: TARGET_PASSWORD,
          displayName: "Admin User",
          emailVerified: true,
        });
        uid = userRecord.uid;
      } else {
        throw e;
      }
    }

    console.log(`Setting Custom Claim: { role: "${TARGET_ROLE}" }...`);
    await auth.setCustomUserClaims(uid, { role: TARGET_ROLE });

    console.log(`Updating Firestore document in ${USERS_COLLECTION}...`);
    const userRef = db.collection(USERS_COLLECTION).doc(uid);
    
    await userRef.set({
      id: uid,
      email: TARGET_EMAIL,
      name: "Admin User",
      firstName: "Admin",
      lastName: "User",
      role: TARGET_ROLE,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log(`\n✅ Successfully ensured ${TARGET_EMAIL} is Admin with explicit password!\n`);
    process.exit(0);
  } catch (error: any) {
    console.error(`\n❌ Error:`, error);
    process.exit(1);
  }
}

ensureAdmin();
