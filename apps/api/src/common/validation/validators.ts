import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Política única de palavras-passe (criação, reposição e alteração):
 * 8–128 caracteres com maiúsculas, minúsculas e números.
 */
export function IsStrongPassword() {
  return applyDecorators(
    IsString(),
    MinLength(8, { message: 'A palavra-passe deve ter pelo menos 8 caracteres.' }),
    MaxLength(128, { message: 'A palavra-passe deve ter no máximo 128 caracteres.' }),
    Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: 'A palavra-passe deve conter maiúsculas, minúsculas e números.',
    }),
  );
}

/**
 * Telefone flexível: dígitos com indicativo opcional, espaços, hífenes e
 * parênteses (7–20 caracteres). O telefone também serve de identificador de
 * login, por isso lixo aqui vira conta inacessível.
 */
export function IsPhone() {
  return applyDecorators(
    Transform(({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim() : value,
    ),
    IsString(),
    Matches(/^\+?[\d\s\-()]{7,20}$/, {
      message:
        'Telefone inválido — use apenas dígitos, espaços, hífenes e o indicativo (+).',
    }),
  );
}

/** Email aparado e em minúsculas antes de validar/gravar. */
export function IsNormalizedEmail() {
  return applyDecorators(
    Transform(({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim().toLowerCase() : value,
    ),
    IsEmail({}, { message: 'Email inválido.' }),
  );
}
