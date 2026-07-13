#!/usr/bin/env node
/**
 * Faz deploy de um zip (montado por deploy/stage-zip.sh) para a hospedagem
 * Node.js partilhada da Hostinger, replicando o fluxo da ferramenta oficial
 * `hosting_deployJsApplication` do hostinger-api-mcp:
 *
 *   1. resolve o username da conta a partir do domínio;
 *   2. pede credenciais de upload (POST /api/hosting/v1/files/upload-urls);
 *   3. envia o zip por TUS (POST de criação + PATCH com o conteúdo);
 *   4. lê as build settings do arquivo (…/nodejs/builds/settings/from-archive);
 *   5. dispara o build (…/nodejs/builds) e faz poll até terminar.
 *
 * Uso:  HOSTINGER_API_TOKEN=… node deploy/hostinger-deploy.mjs <dominio> <zip> [--no-wait] [--dry-run]
 *   --dry-run  só valida o token e resolve o username (não envia nada)
 *   --no-wait  dispara o build e sai sem esperar pelo resultado
 */
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.HOSTINGER_API_BASE || 'https://developers.hostinger.com';
const TOKEN = process.env.HOSTINGER_API_TOKEN;

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith('--')));
const [domain, zipPath] = args;

if (!TOKEN) die('Define a variável de ambiente HOSTINGER_API_TOKEN');
if (!domain || (!zipPath && !flags.has('--dry-run'))) {
  die('Uso: node deploy/hostinger-deploy.mjs <dominio> <zip> [--no-wait] [--dry-run]');
}

function die(msg) {
  console.error(`ERRO: ${msg}`);
  process.exit(1);
}

async function api(method, urlPath, body) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`${method} ${urlPath} → HTTP ${res.status}: ${text.slice(0, 500)}`);
  }
  return data;
}

async function resolveUsername() {
  const data = await api('GET', `/api/hosting/v1/websites?domain=${encodeURIComponent(domain)}`);
  const site = data?.data?.[0];
  if (!site?.username) die(`Nenhum website encontrado para o domínio ${domain}`);
  return site.username;
}

async function uploadZip(username) {
  const creds = await api('POST', '/api/hosting/v1/files/upload-urls', { username, domain });
  const { url, auth_key: authKey, rest_auth_key: restAuthKey } = creds;
  if (!url || !authKey || !restAuthKey) {
    throw new Error(`Credenciais de upload inválidas: ${JSON.stringify(creds).slice(0, 300)}`);
  }

  const file = fs.readFileSync(zipPath);
  const basename = path.basename(zipPath);
  const target = `${url.replace(/\/$/, '')}/${basename}?override=true`;
  const authHeaders = {
    'X-Auth': authKey,
    'X-Auth-Rest': restAuthKey,
    'upload-length': String(file.length),
    'upload-offset': '0',
  };

  const create = await fetch(target, { method: 'POST', headers: authHeaders });
  if (create.status !== 201) {
    throw new Error(`Pré-upload falhou: HTTP ${create.status}: ${(await create.text()).slice(0, 300)}`);
  }

  // Não reutilizar authHeaders aqui: o "upload-offset" minúsculo duplicaria o
  // "Upload-Offset" (fetch junta-os em "0, 0" e o servidor rejeita o offset).
  const patch = await fetch(target, {
    method: 'PATCH',
    headers: {
      'X-Auth': authKey,
      'X-Auth-Rest': restAuthKey,
      'Tus-Resumable': '1.0.0',
      'Upload-Offset': '0',
      'Content-Type': 'application/offset+octet-stream',
    },
    body: file,
  });
  if (!patch.ok) {
    throw new Error(`Upload TUS falhou: HTTP ${patch.status}: ${(await patch.text()).slice(0, 300)}`);
  }
  console.log(`✓ Upload de ${basename} (${(file.length / 1024 / 1024).toFixed(1)} MB) concluído`);
  return basename;
}

async function triggerBuild(username, archiveBasename) {
  const settings = await api(
    'GET',
    `/api/hosting/v1/accounts/${username}/websites/${domain}/nodejs/builds/settings/from-archive?archive_path=${encodeURIComponent(archiveBasename)}`
  );
  console.log(`✓ Build settings: ${JSON.stringify(settings).slice(0, 300)}`);

  const result = await api(
    'POST',
    `/api/hosting/v1/accounts/${username}/websites/${domain}/nodejs/builds`,
    {
      ...settings,
      node_version: settings?.node_version || 20,
      source_type: 'archive',
      source_options: { archive_path: archiveBasename },
    }
  );
  console.log(`✓ Build disparado: ${JSON.stringify(result).slice(0, 300)}`);
  return result;
}

const OK_STATES = ['success', 'succeeded', 'completed', 'deployed', 'active'];
const BAD_STATES = ['failed', 'error', 'errored', 'cancelled', 'canceled'];

async function waitForBuild(username, buildUuid) {
  const deadline = Date.now() + 20 * 60 * 1000;
  let lastState = '';
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 15000));
    let builds;
    try {
      builds = await api(
        'GET',
        `/api/hosting/v1/accounts/${username}/websites/${domain}/nodejs/builds?page=1&per_page=5`
      );
    } catch (err) {
      console.log(`  (poll falhou, tento de novo: ${err.message})`);
      continue;
    }
    const list = builds?.data || builds || [];
    const build =
      (buildUuid && list.find?.((b) => b.uuid === buildUuid || b.id === buildUuid)) || list[0];
    const state = String(build?.state || build?.status || '').toLowerCase();
    if (state && state !== lastState) {
      console.log(`  build: ${state}`);
      lastState = state;
    }
    if (OK_STATES.includes(state)) {
      console.log('✓ Deploy concluído com sucesso');
      return;
    }
    if (BAD_STATES.includes(state)) {
      await printLogs(username, build?.uuid || build?.id);
      die(`Build terminou em estado "${state}"`);
    }
  }
  die('Timeout (20 min) à espera do build — verifica no hPanel');
}

async function printLogs(username, buildUuid) {
  if (!buildUuid) return;
  try {
    const logs = await api(
      'GET',
      `/api/hosting/v1/accounts/${username}/websites/${domain}/nodejs/builds/${buildUuid}/logs`
    );
    console.error('--- LOGS DO BUILD ---');
    console.error(typeof logs === 'string' ? logs : JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error(`(não consegui obter os logs: ${err.message})`);
  }
}

const username = await resolveUsername();
console.log(`✓ Domínio ${domain} → conta ${username}`);

if (flags.has('--dry-run')) {
  console.log('Dry-run: token válido e domínio resolvido. Nada foi enviado.');
  process.exit(0);
}

if (!fs.existsSync(zipPath)) die(`Zip não encontrado: ${zipPath}`);

const archiveBasename = await uploadZip(username);
const result = await triggerBuild(username, archiveBasename);

if (flags.has('--no-wait')) {
  console.log('A sair sem esperar pelo build (--no-wait). Acompanha no hPanel.');
  process.exit(0);
}

const buildUuid =
  result?.data?.uuid || result?.uuid || result?.data?.id || result?.id || null;
await waitForBuild(username, buildUuid);
