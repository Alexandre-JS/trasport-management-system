#!/usr/bin/env node
/**
 * Publica um arquivo de ficheiros estáticos diretamente em public_html pela
 * API oficial da Hostinger. Não instala dependências, não executa build no
 * servidor e não cria um processo Node/Passenger.
 *
 * Uso:
 *   HOSTINGER_API_TOKEN=… node deploy/hostinger-static-deploy.mjs <dominio> <zip>
 */
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.HOSTINGER_API_BASE || 'https://developers.hostinger.com';
const TOKEN = process.env.HOSTINGER_API_TOKEN;
const [domain, zipPath] = process.argv.slice(2);
const configuredUploadTries = Number(process.env.HOSTINGER_UPLOAD_TRIES || 12);
const UPLOAD_TRIES =
  Number.isInteger(configuredUploadTries) && configuredUploadTries > 0
    ? configuredUploadTries
    : 12;

if (!TOKEN) die('Define a variável de ambiente HOSTINGER_API_TOKEN');
if (!domain || !zipPath) {
  die('Uso: node deploy/hostinger-static-deploy.mjs <dominio> <zip>');
}
if (!fs.existsSync(zipPath)) die(`Zip não encontrado: ${zipPath}`);
if (path.extname(zipPath).toLowerCase() !== '.zip') {
  die('O artefacto estático deve ser um ficheiro .zip');
}

function die(message) {
  console.error(`ERRO: ${message}`);
  process.exit(1);
}

async function withRetry(label, operation, tries = 5) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= tries) throw error;
      const delay = Math.min(15_000 * attempt, 60_000);
      console.log(
        `  (${label}: tentativa ${attempt} falhou — ${error.message}; retry em ${delay / 1000}s)`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function api(method, urlPath, body, { retryNetwork = true } = {}) {
  const request = () =>
    fetch(`${BASE}${urlPath}`, {
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(60_000),
    });
  const response = retryNetwork
    ? await withRetry(`${method} ${urlPath}`, request)
    : await request();
  const responseText = await response.text();
  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    data = responseText;
  }

  if (!response.ok) {
    throw new Error(
      `${method} ${urlPath} → HTTP ${response.status}: ${responseText.slice(0, 500)}`,
    );
  }
  return data;
}

async function resolveUsername() {
  const data = await api(
    'GET',
    `/api/hosting/v1/websites?domain=${encodeURIComponent(domain)}`,
  );
  const website = data?.data?.[0];
  if (!website?.username) {
    die(`Nenhum website encontrado para o domínio ${domain}`);
  }
  return website.username;
}

async function uploadArchive(username) {
  const credentials = await api(
    'POST',
    '/api/hosting/v1/files/upload-urls',
    { username, domain },
  );
  const {
    url,
    auth_key: authKey,
    rest_auth_key: restAuthKey,
  } = credentials;
  if (!url || !authKey || !restAuthKey) {
    throw new Error('A Hostinger devolveu credenciais de upload inválidas');
  }

  const file = fs.readFileSync(zipPath);
  const filename = path.basename(zipPath);
  const target = `${url.replace(/\/$/, '')}/${filename}?override=true`;

  await withRetry(
    'upload',
    async () => {
      const create = await fetch(target, {
        method: 'POST',
        headers: {
          'X-Auth': authKey,
          'X-Auth-Rest': restAuthKey,
          'upload-length': String(file.length),
          'upload-offset': '0',
        },
        signal: AbortSignal.timeout(60_000),
      });
      if (create.status !== 201) {
        throw new Error(
          `Pré-upload falhou: HTTP ${create.status}: ${(await create.text()).slice(0, 300)}`,
        );
      }

      const upload = await fetch(target, {
        method: 'PATCH',
        headers: {
          'X-Auth': authKey,
          'X-Auth-Rest': restAuthKey,
          'Tus-Resumable': '1.0.0',
          'Upload-Offset': '0',
          'Content-Type': 'application/offset+octet-stream',
        },
        body: file,
        signal: AbortSignal.timeout(5 * 60_000),
      });
      if (!upload.ok) {
        throw new Error(
          `Upload TUS falhou: HTTP ${upload.status}: ${(await upload.text()).slice(0, 300)}`,
        );
      }
    },
    UPLOAD_TRIES,
  );

  console.log(
    `✓ Upload de ${filename} (${(file.length / 1024 / 1024).toFixed(1)} MB) concluído`,
  );
  return filename;
}

async function deploy(username, archiveName) {
  // A operação sobrescreve public_html e é síncrona. Não repetimos a chamada
  // automaticamente se a ligação cair depois de o servidor a ter recebido.
  const result = await api(
    'POST',
    `/api/hosting/v1/accounts/${username}/websites/${domain}/deploy`,
    { archive_path: archiveName },
    { retryNetwork: false },
  );
  console.log(`✓ Conteúdo estático publicado em ${domain}`);
  return result;
}

async function clearCache(username) {
  try {
    await api(
      'DELETE',
      `/api/hosting/v1/accounts/${username}/websites/${domain}/cache/clear`,
    );
    console.log('✓ Cache da Hostinger limpo');
  } catch (error) {
    console.log(`AVISO: não foi possível limpar o cache (${error.message})`);
  }
}

const username = await resolveUsername();
console.log(`✓ Domínio ${domain} → conta ${username}`);
const archiveName = await uploadArchive(username);
await deploy(username, archiveName);
await clearCache(username);
