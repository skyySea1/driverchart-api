import { FastifyReply, FastifyRequest } from "fastify";
import { DecodedIdToken } from "firebase-admin/auth";

declare module "fastify" {
  export interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }

  export interface FastifyRequest {
    user: DecodedIdToken;
  }
}
