import { z } from "zod";

// Espelham a política da API (common/validation/validators.ts) para o
// utilizador ter feedback imediato em vez de erro do servidor.
export const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(128, "Máximo 128 caracteres")
  .regex(
    /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Deve conter maiúsculas, minúsculas e números",
  );

export const phonePattern = /^\+?[\d\s\-()]{7,20}$/;

export const optionalPhoneSchema = z
  .string()
  .optional()
  .refine(
    (value) => !value?.trim() || phonePattern.test(value.trim()),
    "Telefone inválido — use dígitos, espaços e o indicativo (+)",
  );
