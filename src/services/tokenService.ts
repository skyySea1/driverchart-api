import { db } from "./firebaseService";
import { randomUUID } from "node:crypto";
import dayjs from "dayjs";
import { z } from "zod";

const APP_ID = process.env.FIREBASE_APP_ID || "dot-compliance-app";
const TOKENS_PATH = `artifacts/${APP_ID}/public/data/upload_tokens`;

export const TokenMetadataSchema = z.object({
  id: z.string(),
  driverId: z.string(),
  documentType: z.string(),
  createdAt: z.string(),
  expiresAt: z.string(),
  used: z.boolean(),
  usedAt: z.string().optional(),
});

export type TokenMetadata = z.infer<typeof TokenMetadataSchema>;

export const tokenService = {
  async generateToken(driverId: string, documentType: string, expiresInHours = 48): Promise<string> {
    const id = randomUUID();
    const now = dayjs();
    const expiresAt = now.add(expiresInHours, "hour").toISOString();

    const tokenData: TokenMetadata = {
      id,
      driverId,
      documentType,
      createdAt: now.toISOString(),
      expiresAt,
      used: false,
    };

    await db.collection(TOKENS_PATH).doc(id).set(tokenData);
    return id;
  },

  async validateToken(token: string): Promise<TokenMetadata> {
    const doc = await db.collection(TOKENS_PATH).doc(token).get();

    if (!doc.exists) {
      throw new Error("Invalid token");
    }

    const data = TokenMetadataSchema.parse(doc.data());

    if (data.used) {
      throw new Error("Token already used");
    }

    if (dayjs(data.expiresAt).isBefore(dayjs())) {
      throw new Error("Token expired");
    }

    return data;
  },

  async markTokenUsed(token: string): Promise<void> {
    await db.collection(TOKENS_PATH).doc(token).update({
      used: true,
      usedAt: dayjs().toISOString(),
    });
    // Note: To implement auto-deletion, we could rely on a periodic cleanup job
    // or Firestore TTL policies if configured on the collection.
  },
};
