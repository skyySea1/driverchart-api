import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { driverService } from '../services/driverService';
import { db } from '../services/firebaseService';
import {type Driver } from '../schemas/driversSchema';
import { z } from 'zod';

// Mock Firestore
const mockGet = vi.fn();
const mockAdd = vi.fn();
const mockSet = vi.fn();
const mockDoc = vi.fn(() => ({
  id: 'new-driver-id',
  set: mockSet,
}));

vi.mock('../services/firebaseService', () => ({
  db: {
    collection: vi.fn(() => ({
      where: vi.fn(() => ({
        get: mockGet,
      })),
      add: mockAdd,
      doc: mockDoc,
    })),
  },
  env: { APP_ID: 'test' }
}));

describe('driverService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new driver if email is unique', async () => {
    // Mock empty result for existing email
    mockGet.mockResolvedValue({ empty: true });

    const newDriver: Driver = {
      firstName: 'New',
      lastName: 'Driver',
      email: 'unique@test.com',
      dob: '1990-01-01',
      phone: '1234567890',
      cdl: { documentNumber: '123', state: 'FL' },
      medical: {
        documentNumber: 'MED123',
        registry: ''
      },
      mvr: { documentNumber: 'MVR123' },
      drugAlcohol: { documentNumber: 'DA123' },
      roadTest: { documentNumber: 'RT123', examiner: 'Exam' },
      emergencyContact: { name: 'Contact', phone: '123', relationship: 'Kin' },
      middleName: '',
      ssn: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      hireDate: '',
      hireStatus: 'Active',
      w9Signed: false
    };

    const id = await driverService.createDriver(newDriver);

    expect(id).toBe('new-driver-id');
    expect(mockSet).toHaveBeenCalled();
  });

  it('should return existing ID if email already exists', async () => {
    // Mock existing driver
    mockGet.mockResolvedValue({
      empty: false,
      docs: [{ id: 'existing-id' }]
    });

    const duplicateDriver: Driver = {
      firstName: 'Duplicate',
      lastName: 'Driver',
      email: 'exists@test.com',
      dob: '1990-01-01',
      phone: '1234567890',
      cdl: { documentNumber: '123', state: 'FL' },
      medical: {
        documentNumber: 'MED123',
        registry: ''
      },
      mvr: { documentNumber: 'MVR123' },
      drugAlcohol: { documentNumber: 'DA123' },
      roadTest: { documentNumber: 'RT123', examiner: 'Exam' },
      emergencyContact: { name: 'Contact', phone: '123', relationship: 'Kin' },
      middleName: '',
      ssn: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      hireDate: '',
      hireStatus: 'Active',
      w9Signed: false
    };

    const id = await driverService.createDriver(duplicateDriver as any);

    expect(id).toBe('existing-id');
    expect(mockSet).not.toHaveBeenCalled(); // Should NOT create new doc
  });
});
