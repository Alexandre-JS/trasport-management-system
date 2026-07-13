const INSECURE_PLACEHOLDER = 'change-me';

/**
 * Resolve a required secret. In production the app refuses to boot when the
 * secret is missing or still set to the insecure placeholder shipped in
 * `.env.example`. In development we fall back to a clearly-insecure default so
 * local setup stays frictionless.
 */
function resolveSecret(
  envValue: string | undefined,
  envKey: string,
  isProduction: boolean,
): string {
  const isMissingOrInsecure =
    !envValue || envValue.includes(INSECURE_PLACEHOLDER);

  if (isMissingOrInsecure && isProduction) {
    throw new Error(
      `[config] ${envKey} must be set to a strong, unique secret in production ` +
        `(it is missing or still using the "${INSECURE_PLACEHOLDER}" placeholder).`,
    );
  }

  return envValue ?? `dev-only-${INSECURE_PLACEHOLDER}-${envKey.toLowerCase()}`;
}

export default () => {
  const env = process.env.NODE_ENV ?? 'development';
  const isProduction = env === 'production';

  return {
    app: {
      env,
      port: Number(process.env.PORT ?? 3000),
      prefix: process.env.API_PREFIX ?? 'api/v1',
      corsOrigin: (
        process.env.CORS_ORIGIN ??
        'http://localhost:3001,http://localhost:8100,http://localhost:8200'
      )
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    },
    jwt: {
      accessSecret: resolveSecret(
        process.env.JWT_ACCESS_SECRET,
        'JWT_ACCESS_SECRET',
        isProduction,
      ),
      refreshSecret: resolveSecret(
        process.env.JWT_REFRESH_SECRET,
        'JWT_REFRESH_SECRET',
        isProduction,
      ),
      accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    },
  };
};
