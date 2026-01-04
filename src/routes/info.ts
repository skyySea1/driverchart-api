import { FastifyInstance } from 'fastify';
import { env } from '../utils/env';

export default async function infoRoute(fastify: FastifyInstance) {
  fastify.get('/', async () => {
    const  envInfo = process.env.VERCEL 
      ? `Vercel (${process.env.VERCEL_ENV})` 
      : `Local (${env.NODE_ENVIRONMENT})`;
    return {
      name: 'CharterSafe API',
      description: 'US DOT Compliance Management System API',
      version: '1.0.0',
          status: "ok",
          environment: envInfo || 'unknown',
      timestamp: new Date().toISOString(),
    };
  });
}
