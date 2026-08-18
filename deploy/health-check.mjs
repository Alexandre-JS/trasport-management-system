#!/usr/bin/env node

/**
 * Confirma que os dois serviços voltaram a responder depois do deploy.
 * Repete durante alguns minutos porque o Passenger pode demorar a arrancar.
 */

const targets = [
  {
    name: 'API',
    url: process.env.API_HEALTH_URL ||
      'https://api.lumactraspots.com/api/v1/auth/health',
    expected: 'ready',
  },
  {
    name: 'API CORS para o Web',
    url: process.env.API_HEALTH_URL ||
      'https://api.lumactraspots.com/api/v1/auth/health',
    expected: 'ready',
    origin: process.env.WEB_ORIGIN || 'https://lumactraspots.com',
  },
  {
    name: 'Web',
    url: process.env.WEB_HEALTH_URL || 'https://lumactraspots.com/login',
  },
];

const attempts = Number(process.env.HEALTH_CHECK_ATTEMPTS || 18);
const intervalMs = Number(process.env.HEALTH_CHECK_INTERVAL_MS || 10_000);

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function check(target) {
  let lastError = 'sem resposta';

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(target.url, {
        cache: 'no-store',
        redirect: 'follow',
        headers: {
          'User-Agent': 'lumac-deploy-health-check/1.0',
          ...(target.origin ? { Origin: target.origin } : {}),
        },
        signal: AbortSignal.timeout(15_000),
      });
      const body = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      if (target.expected && !body.toLowerCase().includes(target.expected)) {
        throw new Error(`resposta não contém "${target.expected}"`);
      }
      if (
        target.origin &&
        response.headers.get('access-control-allow-origin') !== target.origin
      ) {
        throw new Error(`CORS não autorizou ${target.origin}`);
      }

      console.log(`✓ ${target.name} saudável: ${target.url}`);
      return;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.log(
        `  ${target.name}: tentativa ${attempt}/${attempts} falhou (${lastError})`,
      );
      if (attempt < attempts) await wait(intervalMs);
    }
  }

  throw new Error(`${target.name} não recuperou: ${lastError}`);
}

for (const target of targets) {
  await check(target);
}

console.log('✓ Deploy confirmado nos dois serviços');
