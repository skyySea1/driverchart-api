
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applicationService } from '../services/applicationService';
import fastify from 'fastify';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import applicationRoutes from '../routes/applications/index';
import { z } from 'zod';

// Mock service
vi.mock('../services/applicationService', () => ({
  applicationService: {
    create: vi.fn(),
    getAll: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
}));

describe('Application Routes', () => {
  const app = fastify();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  
  // Mock authentication decorator
  app.decorate('authenticate', async () => {});

  app.register(applicationRoutes, { prefix: '/applications' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create an application successfully', async () => {
    (applicationService.create as any).mockResolvedValue('new-app-id');

    const payload = {
      "id": "",
      "personalInfo": {
        "firstName": "marcell",
        "middleName": "opacio",
        "lastName": "henrique",
        "dob": "2000-10-11",
        "email": "henrir1020@gmail.com",
        "phone": "(555)789-4567",
        "ssnNumber": "123-45-7894"
      },
      "addresses": [
        {
          "street": "1234565asdas",
          "city": "orlando",
          "state": "FL",
          "zip": "32801",
          "fromDate": "2025-12-31",
          "toDate": "2026-01-19"
        }
      ],
      "licenses": [
        {
          "number": "A123456",
          "state": "FL",
          "class": "A",
          "endorsements": "P",
          "restrictions": "NONE",
          "expirationDate": "2027-10-11"
        }
      ],
      "vehicleExperience": [
        {
          "type": "Passenger Bus",
          "totalMileage": "10000"
        }
      ],
      "accidents": [],
      "violations": [],
      "employmentHistory": [],
      "notes": "sdfg",
      "status": "Pending",
      "appliedDate": "2026-01-19"
    };

    const response = await app.inject({
      method: 'POST',
      url: '/applications',
      payload: payload
    });

    console.log("Response Status:", response.statusCode);
    console.log("Response Body:", response.body);

    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body)).toEqual({ id: 'new-app-id' });
  });
});
