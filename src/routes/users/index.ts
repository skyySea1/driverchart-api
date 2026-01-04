import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { UserSchema } from "../../schemas/usersSchema";
import { userService } from "../../services/userService";
import { z } from "zod";

export default async function (fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/",
    {
      schema: {
        description: "Get all users",
        tags: ["Users"],
        response: {
          200: z.array(UserSchema),
        },
      },
    },
    async () => {
      return await userService.getAll();
    }
  );

  server.post(
    "/",
    {
      schema: {
        description: "Create a new user",
        tags: ["Users"],
        body: UserSchema,
        response: {
          201: z.object({ id: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const id = await userService.createUser(request.body);
      return reply.status(201).send({ id });
    }
  );
}
