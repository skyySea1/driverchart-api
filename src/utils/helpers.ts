import { z } from "zod";
import dayjs from "dayjs";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const futureIsoDate = (message = "Date must be in the future") =>
  z.string()
    .min(1, { message })
    .regex(DATE_REGEX, "Invalid date format, expected YYYY-MM-DD")
    .refine((dateStr) => dayjs(dateStr).isValid(), { message: "Invalid date" })
    .refine((dateStr) => dayjs(dateStr).isAfter(dayjs()), { message });

export const pastIsoDate = (message = "Date must be in the past") =>
  z.string()
    .min(1, { message })
    .regex(DATE_REGEX, "Invalid date format, expected YYYY-MM-DD")
    .refine((dateStr) => dayjs(dateStr).isValid(), { message: "Invalid date" })
    .refine((dateStr) => dayjs(dateStr).isBefore(dayjs()), { message });

// Relaxed phone validation to accept international numbers or US format
export const usPhoneNumber = (
  message = "Phone must be in format (XXX) XXX-XXXX or XXX-XXX-XXXX"
) => z.string().min(5, "Phone number is too short"); 

/**
 * Validates a U.S. Social Security Number for basic structural validity
 * consistent with DOT requirements (e.g., 49 CFR parts 383 and 391).
 * Ensures 9 digits, disallows all-zero SSNs, invalid area/group/serial
 * combinations, and reserved prefixes (such as 000, 666, and 9xx).
 * Note: this does not verify issuance with SSA, only format and basic rules.
 */
export const validateSSN = (ssnNumber: string): boolean => {
  if (!ssnNumber) return false;

  const cleaned = ssnNumber.replace(/\D/g, "");

  if (cleaned.length !== 9) return false;
  if (cleaned === "000000000") return false;
  if (cleaned.startsWith("666")) return false;
  if (cleaned.startsWith("9")) return false;
  if (cleaned.substring(0, 3) === "000") return false;
  if (cleaned.substring(3, 5) === "00") return false;
  if (cleaned.substring(5, 9) === "0000") return false;

  return true;
};

/**
 * Formats SSN to XXX-XX-XXXX format.
 * Accepts numeric input and auto-formats.
 */
export const formatSSN = (value: string): string => {
  if (!value) return "";

  const cleaned = value.replace(/\D/g, "");

  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 5) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 9)}`;
};
