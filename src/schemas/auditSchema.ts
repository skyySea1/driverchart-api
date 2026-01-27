import { z } from 'zod';

export const AuditLogSchema = z.object({
  id: z.string().optional(),
  entityId: z.string().min(1, "Entity ID is required"), // Driver ID or Vehicle ID
  entityName: z.string().min(1, "Entity name is required"), 
  type: z.enum(['profile_update', 'status_change', 'creation', 'application_update']),
  date: z.string(), // ISO string
  user: z.string().min(1, "User is required"), // User name or email
  description: z.string().min(1, "Description is required"), // e.g., "Updated phone number"
});

export type AuditLog = z.infer<typeof AuditLogSchema>;
