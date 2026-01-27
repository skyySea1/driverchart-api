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
      onRequest: [fastify.authenticate],
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

  server.get(
    "/currentUser",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "Get current user",
        tags: ["Users"],
        response: {
          200: UserSchema,
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const user = await userService.getCurrentUser(request.user.uid);
      if (!user) {
        return reply.status(404).send({ message: "User not found" });
      }
      return user;
    }
  );
  server.post(
    "/",
    {
      onRequest: [fastify.authenticate],
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

  server.put(
    "/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "Update a user",
        tags: ["Users"],
        params: z.object({ id: z.string() }),
        body: UserSchema.partial(),
        response: {
          200: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      await userService.updateUser(id, request.body);
      return reply.status(200).send({ message: "User updated successfully" });
    }
  );

  server.delete(
    "/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "Delete a user",
        tags: ["Users"],
        params: z.object({ id: z.string() }),
        response: {
          200: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      await userService.deleteUser(id);
      return reply.status(200).send({ message: "User deleted successfully" });
    }
  );
}
