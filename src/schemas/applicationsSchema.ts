import { z } from "zod";

export const ApplicationSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  status: z.enum(["Pending", "Approved", "Rejected"]).default("Pending"),
  appliedDate: z.string().optional(),
  experienceYears: z.number().optional().default(0),
  cdlNumber: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export type Application = z.infer<typeof ApplicationSchema>;
