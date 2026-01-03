import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildApp } from "../src/app";

// Initialize the app once and reuse it for each request to avoid cold start delays
const appPromise = buildApp();

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const app = await appPromise;
  await app.ready();
  app.server.emit("request", req, res);
}
