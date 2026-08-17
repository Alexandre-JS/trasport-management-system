import { z } from "zod";

// Espelham a política da API (common/validation/validators.ts) para o
// utilizador ter feedback imediato em vez de erro do servidor.
export const passwordSchema = z
  .string()
  .min(8, "Minimum 8 characters")
  .max(128, "Maximum 128 characters")
  .regex(
    /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Must contain uppercase letters, lowercase letters, and numbers",
  );

export const phonePattern = /^\+?[\d\s\-()]{7,20}$/;

export const optionalPhoneSchema = z
  .string()
  .optional()
  .refine(
    (value) => !value?.trim() || phonePattern.test(value.trim()),
    "Invalid phone number — use digits, spaces, and the country code (+)",
  );
