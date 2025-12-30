import { z } from 'zod';

export const ExpirationAlertSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['critical', 'warning', 'info']),
  message: z.string().min(1),
  entity: z.string().optional(),
  dueDate: z.string().min(1), // ISO string YYYY-MM-DD
});

export type ExpirationAlert = z.infer<typeof ExpirationAlertSchema>;

export const ExpirationForecastSchema = z.object({
  driverId: z.string(),
  driverName: z.string(),
  items: z.array(z.object({
    type: z.string(),
    itemName: z.string(),
    expiryDate: z.string(),
    daysRemaining: z.number(),
    status: z.enum(['expired', 'critical', 'warning', 'valid']),
  })),
});

export type ExpirationForecast = z.infer<typeof ExpirationForecastSchema>;
