import { z } from "zod";

export const ComplianceItemSchema = z.object({
  documentNumber: z.string().default(""),
  expiryDate: z.string().optional(),
  file: z.string().optional(),
});

export const DriverSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().default(""),
  lastName: z.string().min(1, "Last name is required"),
  dob: z.string().min(1, "Date of birth is required"),
  ssnNumber: z.string().default(""),
  phone: z.string().min(1, "Phone number is required"),
  email: z.email("Invalid email address").or(z.literal("")),
  address: z.string().default(""),
  city: z.string().default(""),
  state: z.string().default(""),
  zip: z.string().default(""),
  // Employment
  hireDate: z.string(),
  terminationDate: z.string().optional(),
  hireStatus: z.enum(["Active", "Terminated", "Rehired"]).default("Active"),

  // Banking / Tax / Legal
  bankName: z.string().optional(),
  routingNumber: z.string().optional(),
  accountNumber: z.string().optional(),
  w9Signed: z.boolean().optional().default(false),
  businessName: z.string().optional(),
  taxClassification: z.string().optional(),
  i9EmployerSignature: z.string().optional(),
  ssnDoc: z.string().optional(),
  ssnDocName: z.string().optional(),

  // Compliance Sections
  // flattened extension to avoid potential issues with deep partials on extended objects (rare but possible)
  license: z.object({
    documentNumber: z.string().default(""),
    expiryDate: z.string().optional(),
    file: z.string().optional(),
    state: z.string().default(""),
    value: z.string().optional(),
  }),

  medical: z.object({
    documentNumber: z.string().default(""),
    expiryDate: z.string().optional(),
    file: z.string().optional(),
    registry: z.string().optional().default(""),
  }),

  mvr: ComplianceItemSchema,
  drugAlcohol: ComplianceItemSchema,

  roadTest: z.object({
    documentNumber: z.string().default(""),
    expiryDate: z.string().optional(),
    file: z.string().optional(),
    examiner: z.string().default(""),
    date: z.string().optional(),
  }),

  emergencyContact: z.object({
    name: z.string().default(""),
    phone: z.string().default(""),
    relationship: z.string().default(""),
  }),
  
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),

  // Flagging
  isFlagged: z.boolean().default(false),
  flagReason: z.string().optional(),
  flagDate: z.string().optional(),
});

export type Driver = z.infer<typeof DriverSchema>;