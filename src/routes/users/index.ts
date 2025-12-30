import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { UserSchema, LoginSchema } from "../../schemas/usersSchema";
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

  server.post(
    "/login",
    {
      schema: {
        description: "Login user",
        tags: ["Users"],
        body: LoginSchema,
        response: {
          200: z.object({ token: z.string(), user: UserSchema }),
          401: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;
      const user = await userService.getByEmail(email);

      // In a real app, we would verify password hash here
      if (!user || password !== "admin123") {
        // Placeholder password check
        return reply.status(401).send({ message: "Invalid credentials" });
      }

      const token = fastify.jwt.sign({ id: user.id, role: user.role });
      return { token, user };
    }
  );
}
