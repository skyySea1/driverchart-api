import { db } from "../utils/firebase";
import { UserSchema, type User } from "../schemas/usersSchema";
import { env } from "../utils/env";

const APP_ID = env.APP_ID;
const COLLECTION_PATH = `artifacts/${APP_ID}/public/data/users`;

// added schema parsing to ensure data integrity and validation
// todo add error handling for create and update operations

export const userService = {
  async getAll(): Promise<User[]> {
    if (!COLLECTION_PATH) throw new Error("Invalid collection path");
    const snapshot = await db.collection(COLLECTION_PATH).get();
    return snapshot.docs.map((doc) =>
      UserSchema.parse({ id: doc.id, ...doc.data() })
    );
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
    const docRef = await db.collection(COLLECTION_PATH).add({
      ...validatedData,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  },
};
