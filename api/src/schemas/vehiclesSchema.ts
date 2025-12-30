import { z } from 'zod';

export const VehicleSchema = z.object({
  id: z.string().optional(),
  busNumber: z.string().min(1, "Bus number is required"),
  vin: z.string().min(1, "VIN is required"),
  vehicleStatus: z.enum(['Active', 'Maintenance', 'Inactive']).default('Active'),
  lastAnnualInspection: z.coerce.date({ error: "Last inspection date is required" }),
  mileage: z.number().nonnegative().default(0),
  inspectionFile: z.string().optional(),
  createdAt: z.string().optional(),
});

export type Vehicle = z.infer<typeof VehicleSchema>;
