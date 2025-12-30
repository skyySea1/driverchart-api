import { z } from 'zod';

export const DocumentLogSchema = z.object({
  id: z.string().optional(),
  date: z.string(), // ISO string (e.g., 2024-05-20)
  fileName: z.string().min(1, "File name is required"),
  type: z.string().min(1, "Type is required"), // e.g., 'Driver' | 'Vehicle' | 'Compliance'
  entityName: z.string().min(1, "Entity name is required"), // Driver Name or Bus Number
  user: z.string().min(1, "User is required"),
  userRole: z.string().min(1, "User role is required").optional(),
  fileUrl: z.string().optional(),
});

export type DocumentLog = z.infer<typeof DocumentLogSchema>;
