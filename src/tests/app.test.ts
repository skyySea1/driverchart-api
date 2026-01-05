import { describe, it, expect, beforeAll } from 'vitest';
import { buildApp } from '../app';
import { FastifyInstance } from 'fastify';

describe('API Basic Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  it('GET /api/health should return 200 and status ok', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.status).toBe('ok');
  });

  it('GET /api should return API information', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/info',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.name).toBe('CharterSafe API');
  });
});
