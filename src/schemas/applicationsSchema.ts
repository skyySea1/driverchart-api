import { z } from "zod";
import { pastIsoDate, futureIsoDate, usPhoneNumber } from "../utils/helpers";

// Personal Info
const PersonalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional().default(""),
  lastName: z.string().min(1, "Last name is required"),
  dob: pastIsoDate("Date of birth is required"),
  email: z.email("Invalid email address"),
  phone: usPhoneNumber(
    "Phone must be in format (XXX) XXX-XXXX or XXX-XXX-XXXX"
  ),
  ssnNumber: z
    .string()
    // TODO: Add strict SSN regex validation (format XXX-XX-XXXX).
    .or(z.literal("")),
  medicalExpirationDate: z.string().optional(),
});

// Address History (last 3 years)
const AddressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().length(2, "State must be 2 characters"),
  zip: z.string().min(5, "ZIP code is required"),
  fromDate: pastIsoDate("From date is required"),
  toDate: z.string().optional(), // Optional for current address
});

// License
const LicenseSchema = z.object({
  number: z.string().min(1, "License number is required"),
  state: z.string().length(2, "State must be 2 characters"),
  class: z.string().min(1, "License class is required"),
  endorsements: z.string().default(""),
  restrictions: z.string().default(""),
  emissionDate: z.string().optional(),
  emitionDate: z.string().optional(), // Support typo from some frontend versions
  expirationDate: z
    .string()
    .min(1, "Expiration date is required")
    .pipe(futureIsoDate("License must not be expired")),
});

// Accident
const AccidentSchema = z.object({
  date: z.string().min(1, "Accident date is required"),
  location: z.string().min(1, "Location is required"),
  description: z.string().min(1, "Description is required"),
  injuries: z.boolean().default(false),
  fatalities: z.boolean().default(false),
});

// Violation
const ViolationSchema = z.object({
  date: z.string().min(1, "Violation date is required"),
  violation: z.string().min(1, "Violation description is required"),
  location: z.string().min(1, "Location is required"),
  penalty: z.string().min(1, "Penalty is required"),
});

// Employment History
const EmploymentSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().length(2, "State must be 2 characters"),
  zip: z.string().min(5, "ZIP code is required"),
  phone: usPhoneNumber(
    "Phone must be in format (XXX) XXX-XXXX or XXX-XXX-XXXX"
  ),
  position: z.string().min(1, "Position is required"),
  description: z.string().optional().default(""),
  fromDate: pastIsoDate("From date is required"),
  toDate: z.string().optional(), // Optional for current employment
  reasonForLeaving: z.string().default(""),
  wasCDL: z.boolean().default(false),
});

const VehicleExperienceSchema = z.object({
  type: z.string(),
});

export const ApplicationSchema = z.object({
  id: z.string().optional(),
  personalInfo: PersonalInfoSchema,
  addresses: z.array(AddressSchema).min(1, "At least one address is required"),
  licenses: z.array(LicenseSchema).min(1, "At least one license is required"),
  vehicleExperience: z.array(VehicleExperienceSchema).default([]),
  accidents: z.array(AccidentSchema).default([]),
  violations: z.array(ViolationSchema).default([]),
  forfeitures: z.string().optional().default(""),
  deniedLicense: z.boolean().default(false),
  suspendedLicense: z.boolean().default(false),
  denialSuspensionExplanation: z.string().optional().default(""),
  employmentHistory: z.array(EmploymentSchema).default([]),
  notes: z.string().optional().default(""),
  status: z.enum(["Pending", "Approved", "Rejected"]).default("Pending"),
  appliedDate: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),

  // upload fields
  licenseFront: z.any().optional(),
  licenseBack: z.any().optional(),
  medicalCard: z.any().optional(),
  drugTestPositiveOrRefusal: z.boolean().default(false),
  drugTestDocumentation: z.enum(["Yes", "No", "N/A"]).default("N/A"),
  drugTestSignature: z.string().optional().default(""),
  drugTestDate: z.string().optional().default(""),
  authReleaseSignature: z.string().optional().default(""),
  authReleaseDate: z.string().optional().default(""),
  pspDisclosureSignature: z.string().optional().default(""),
  pspDisclosureDate: z.string().optional().default(""),
  fmcsaConsentSignature: z.string().optional().default(""),
  fmcsaConsentDate: z.string().optional().default(""),
});

export type Application = z.infer<typeof ApplicationSchema>;
