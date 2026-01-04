import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { env } from "../../utils/env";

export default async function (fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.post(
    "/login",
    {
      schema: {
        description: "Login with username and password to get a Bearer token",
        tags: ["Authentication"],
        body: z.object({
          username: z.string().email("Username must be a valid email"),
          password: z.string().min(1, "Password is required"),
        }),
        response: {
          200: z.object({ token: z.string() }),
          401: z.object({ error: z.string(), message: z.string() }),
          500: z.object({ error: z.string(), message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { username, password } = request.body;
      const apiKey = env.FIREBASE_WEB_API_KEY;

      if (!apiKey) {
        return reply.status(500).send({ 
          error: "Internal Server Error", 
          message: "Firebase Web API Key not configured on server" 
        });
      }

      try {
        // Exchange credentials for an ID Token via Google Identity Toolkit
        const response = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: username,
              password: password,
              returnSecureToken: true,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          return reply.status(401).send({ 
            error: "Unauthorized", 
            message: data.error?.message || "Invalid credentials" 
          });
        }

        return { token: data.idToken };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ 
          error: "Internal Server Error", 
          message: "Failed to communicate with Auth service" 
        });
      }
    }
  );
}
