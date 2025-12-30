import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';

// Swagger plugin for OpenAPI documentation
export const swaggerPlugin = fp(async (fastify: FastifyInstance) => {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'CharterSafe API',
        description: 'US DOT Compliance Management System API',
        version: '1.0.0',
      },
      tags: [
        { name: 'Drivers', description: 'Driver Qualification Files' },
        { name: 'Vehicles', description: 'Fleet Maintenance Registry' },
        { name: 'Documents', description: 'Document Registry & Audit Logs' },
        { name: 'Users', description: 'User Authentication & Management' },
        { name: 'Expiration', description: 'Compliance Expiration Monitoring' },
      ],
    },
    transform: jsonSchemaTransform,
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
  });
});
