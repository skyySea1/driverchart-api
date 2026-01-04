import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { auth } from "../services/firebaseService";

export const authPlugin = fp(async (fastify: FastifyInstance) => {
  fastify.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return reply.status(401).send({ message: "Missing or invalid authorization header" });
      }

      const token = authHeader.split(" ")[1];
      const decodedToken = await auth.verifyIdToken(token);
      request.user = decodedToken;
    } catch (error) {
      request.log.error(error);
      return reply.status(401).send({ message: "Unauthorized: Invalid token" });
    }
  });
});
