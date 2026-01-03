import { FastifyInstance } from 'fastify';

export default async function infoRoute(fastify: FastifyInstance) {
  fastify.get('/', async () => {
    return {
      name: 'CharterSafe API',
      description: 'US DOT Compliance Management System API',
      version: '1.0.0',
      status: "ok",
      environment: process.env.ENV || 'development',
      timestamp: new Date().toISOString(),
    };
  });
}
