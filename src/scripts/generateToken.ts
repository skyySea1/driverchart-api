import { auth } from "../services/firebaseService";
import { env } from "../utils/env";
import fs from "fs";
import path from "path";

async function generateToken() {
  const uid = "test-admin-user";
  console.log(`Generating token for UID: ${uid}...`);

  try {
    // 1. Create a Custom Token
    const customToken = await auth.createCustomToken(uid, { role: "admin" });
    console.log("Custom Token generated.");

    // 2. Exchange Custom Token for ID Token via Firebase Auth REST API
    // We need the Web API Key for this exchange.
    // If not in env, we might fail. Assuming FIREBASE_API_KEY is available or we use a public one if known.
    // Wait, the backend env might not have the Client API Key (VITE_FIREBASE_API_KEY).
    // I will try to read it from .env or ask user.
    
    // For now, I'll save the Custom Token and a note. 
    // BUT, to be really useful, let's try to fetch the ID token if possible.
    // Since I don't have the Web API Key in backend env usually, I will fallback to just the Custom Token
    // unless I can find the key in the project files.
    
    const tokenPath = path.resolve(process.cwd(), "token.txt");
    fs.writeFileSync(tokenPath, customToken);
    
    console.log(`
✅ Custom Token saved to: ${tokenPath}`);
    console.log("\n⚠️  NOTE: This is a CUSTOM TOKEN.");
    console.log("To use it with the API (Bearer header), you must exchange it for an ID Token first.");
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
