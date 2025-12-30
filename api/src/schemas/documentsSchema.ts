import { z } from 'zod';

export const DocumentLogSchema = z.object({
  id: z.string().optional(),
  date: z.date({ error: "Date is required" }), // ISO string
  fileName: z.string().min(1, "File name is required"),
  type: z.string().min(1, "Type is required"), // e.g., 'Driver' | 'Vehicle'
  entityName: z.string().min(1, "Entity name is required"), // Driver Name or Bus Number
  user: z.string().min(1, "User is required"),
});

export type DocumentLog = z.infer<typeof DocumentLogSchema>;
