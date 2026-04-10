import { auth } from "../services/firebaseService";
import { env } from "../utils/env";
import fs from "fs";
import path from "path";

async function generateToken() {
  const uid = "test-admin-user";
  console.log(`Generating token for UID: ${uid}...`);

  try {
    // 1. Create a Custom Token
    // Use direct endpoint for get token more easily
    const customToken = await auth.createCustomToken(uid, { role: "Admin" });
    console.log("Custom Token generated.");

    // 2. Exchange Custom Token for ID Token via Firebase Auth REST API
    
    const tokenPath = path.resolve(process.cwd(), "token.txt");
    fs.writeFileSync(tokenPath, customToken);
    
    console.log(`
Custom Token saved to: ${tokenPath}`);
    console.log("\n  NOTE: This is a CUSTOM TOKEN.");
    console.log("To use it with the API (Bearer header), you must exchange it for an ID Token first using Identity Toolkit and project secrets/api_keys.");
    console.log("You can do this by signing in with this token in the frontend, or using the Identity Toolkit API:");
    console.log(`curl 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=[YOUR_WEB_API_KEY]' \
-H 'Content-Type: application/json' --data-binary '{"token":"${customToken}","returnSecureToken":true}'`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error generating token:", error);
    process.exit(1);
  }
}

generateToken();
