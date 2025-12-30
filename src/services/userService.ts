<<<<<<< HEAD
import { db, auth } from "./firebaseService";
import { UserSchema, type User } from "../schemas/usersSchema";
import { env } from "../utils/env";

const COLLECTION_ID = env.COLLECTION_ID;
const COLLECTION_PATH = `artifacts/${COLLECTION_ID}/public/data/users`;
=======
import { db, auth } from "../utils/firebase";
import { UserSchema, type User } from "../schemas/usersSchema";
import { env } from "../utils/env";

const APP_ID = env.APP_ID;
const COLLECTION_PATH = `artifacts/${APP_ID}/public/data/users`;

// added schema parsing to ensure data integrity and validation
// todo add error handling for create and update operations
>>>>>>> 505d436 (new api)

export const userService = {
  async getAll(): Promise<User[]> {
    if (!COLLECTION_PATH) throw new Error("Invalid collection path");
    const snapshot = await db.collection(COLLECTION_PATH).get();
<<<<<<< HEAD
    const users: User[] = [];
    snapshot.forEach((doc) => {
      try {
        users.push(UserSchema.parse({ id: doc.id, ...doc.data() }));
      } catch (e) {
        console.warn(`Skipping invalid user doc ${doc.id}:`, e);
      }
    });
    return users;
  },

  async getCurrentUser(uid: string): Promise<User | null> {
    if (!uid) throw new Error("Invalid UID");
    const doc = await db.collection(COLLECTION_PATH).doc(uid).get();
    if (!doc.exists) return null;
    return UserSchema.parse({ id: doc.id, ...doc.data() });
=======
    return snapshot.docs.map((doc) =>
      UserSchema.parse({ id: doc.id, ...doc.data() })
    );
>>>>>>> 505d436 (new api)
  },

  async getById(id: string): Promise<User | null> {
    if (!id) throw new Error("Invalid ID");
    const doc = await db.collection(COLLECTION_PATH).doc(id).get();
    if (!doc.exists) return null;
    return UserSchema.parse({ id: doc.id, ...doc.data() });
  },

  async getByEmail(email: string): Promise<User | null> {
    if (!email) throw new Error("Invalid email");
    const snapshot = await db
      .collection(COLLECTION_PATH)
      .where("email", "==", email)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return UserSchema.parse({ id: doc.id, ...doc.data() });
  },

  async createUser(data: User): Promise<string> {
    if (!data) throw new Error("Invalid user data");
    const validatedData = UserSchema.parse(data);
<<<<<<< HEAD

    // 1. Create in Firebase Auth
    if (!validatedData.password) {
      throw new Error("Password is required for new users");
    }

    const authUser = await auth.createUser({
      email: validatedData.email,
      password: validatedData.password,
      displayName: validatedData.name,
    });

    // 2. Set Role Claim
    await auth.setCustomUserClaims(authUser.uid, { role: validatedData.role });

    // 3. Create in Firestore (using Auth UID as ID)
    // Remove password from object before saving to DB
    const { password, ...userData } = validatedData;

    await db
      .collection(COLLECTION_PATH)
      .doc(authUser.uid)
      .set({
        ...userData,
        id: authUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

    return authUser.uid;
  },

  async updateUser(id: string, data: Partial<User>): Promise<void> {
    if (!id) throw new Error("Invalid ID");

    // Zod Partial Parse
    const validatedData = UserSchema.partial().parse(data);
    const { password, ...dbData } = validatedData;

    // 1. Update Auth (if sensitive data changed)
    if (password || dbData.email || dbData.name) {
      await auth.updateUser(id, {
        email: dbData.email,
        password: password,
        displayName: dbData.name,
      });
    }

    // 2. Update Role Claim (if changed)
    if (dbData.role) {
      await auth.setCustomUserClaims(id, { role: dbData.role });
    }

    // 3. Update Firestore
    await db
      .collection(COLLECTION_PATH)
      .doc(id)
      .update({
        ...dbData,
        updatedAt: new Date().toISOString(),
      });
  },

  async deleteUser(id: string): Promise<void> {
    if (!id) throw new Error("Invalid ID");

    // 1. Delete from Auth
    await auth.deleteUser(id);

    // 2. Delete from Firestore
    await db.collection(COLLECTION_PATH).doc(id).delete();
=======
    const docRef = await db.collection(COLLECTION_PATH).add({
      ...validatedData,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
>>>>>>> 505d436 (new api)
  },

  async setUserRole(uid: string, role: string): Promise<void> {
    if (!uid || !role) throw new Error("Invalid UID or Role");

    // 1. Set Custom Claim in Firebase Auth (Security Source of Truth)
    await auth.setCustomUserClaims(uid, { role });

    // 2. Update Firestore Document (UI Source of Truth)
    // We try to find the document by ID (assuming ID matches UID)
    const docRef = db.collection(COLLECTION_PATH).doc(uid);
    const doc = await docRef.get();
<<<<<<< HEAD

    if (doc.exists) {
      await docRef.update({ role, updatedAt: new Date().toISOString() });
    } else {
      console.warn(
        `Firestore document for user ${uid} not found. Only Auth Claim set.`
      );
=======
    
    if (doc.exists) {
       await docRef.update({ role, updatedAt: new Date().toISOString() });
    } else {
       console.warn(`Firestore document for user ${uid} not found. Only Auth Claim set.`);
>>>>>>> 505d436 (new api)
    }
  },
};
