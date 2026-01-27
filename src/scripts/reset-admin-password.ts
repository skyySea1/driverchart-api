import { auth, db } from "../services/firebaseService";
import { env } from "../utils/env";

const TARGET_EMAIL = "admin@example.com";
const NEW_PASSWORD = "desenv";

async function resetPassword() {
  console.log(`Resetting password for ${TARGET_EMAIL}...`);
  try {
    const user = await auth.getUserByEmail(TARGET_EMAIL);
    await auth.updateUser(user.uid, {
      password: NEW_PASSWORD,
    });
    console.log("✅ Password updated successfully.");
    process.exit(0);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
        console.log("User not found. It will be created by seed script.");
    } else {
        console.error("Error resetting password:", error);
    }
    process.exit(1);
  }
}

resetPassword();
