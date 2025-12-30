import { FastifyInstance } from 'fastify';

export default async function infoRoute(fastify: FastifyInstance) {
  fastify.get('/info', async () => {
    return {
      name: 'CharterSafe API',
      description: 'US DOT Compliance Management System API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    };
  });
}
