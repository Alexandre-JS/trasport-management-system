#!/usr/bin/env node
/**
 * Diagnóstico da app na Hostinger a partir do CI (onde vive o token):
 *  1. imprime o estado dos últimos builds e os logs do mais recente;
 *  2. executa comandos de leitura no servidor via cron job temporário
 *     (a hospedagem partilhada não tem exec direto; o cron corre o comando
 *     via `timeout` sem shell — máx. 255 chars, sem metacaracteres).
 *
 * Uso: HOSTINGER_API_TOKEN=… DEBUG_CMDS=$'ls -la /caminho\ntail -n 80 /caminho/stderr.log' \
 *        node deploy/hostinger-debug.mjs [dominio]
 *
 * ATENÇÃO: o output vai para o log do workflow (repo público) — usar apenas
 * comandos que não exponham segredos (nunca cat de .env).
 */
const BASE = process.env.HOSTINGER_API_BASE || 'https://developers.hostinger.com';
const TOKEN = process.env.HOSTINGER_API_TOKEN;
const domain = process.argv[2] || 'api.lumactraspots.com';
const cmds = (process.env.DEBUG_CMDS || '').split('\n').map((s) => s.trim()).filter(Boolean);

if (!TOKEN) {
  console.error('ERRO: falta HOSTINGER_API_TOKEN');
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
  if (!res.ok) throw new Error(`${method} ${urlPath} → HTTP ${res.status}: ${text.slice(0, 400)}`);
  return data;
}

const sites = await api('GET', `/api/hosting/v1/websites?domain=${encodeURIComponent(domain)}`);
const username = sites?.data?.[0]?.username;
if (!username) throw new Error(`domínio ${domain} não encontrado`);
console.log(`conta: ${username}`);

console.log('\n===== ÚLTIMOS BUILDS =====');
const builds = await api(
  'GET',
  `/api/hosting/v1/accounts/${username}/websites/${domain}/nodejs/builds?page=1&per_page=3`
);
const list = builds?.data || builds || [];
for (const b of list) {
  console.log(`${b.uuid} | ${b.state} | ${b.created_at || ''}`);
}

if (list[0]?.uuid) {
  console.log('\n===== LOGS DO BUILD MAIS RECENTE =====');
  try {
    const logs = await api(
      'GET',
      `/api/hosting/v1/accounts/${username}/websites/${domain}/nodejs/builds/${list[0].uuid}/logs`
    );
    console.log(typeof logs === 'string' ? logs : JSON.stringify(logs, null, 2));
  } catch (err) {
    console.log(`(logs indisponíveis: ${err.message})`);
  }
}

for (const cmd of cmds) {
  console.log(`\n===== CMD: ${cmd} =====`);
  const created = await api('POST', `/api/hosting/v1/accounts/${username}/cron-jobs`, {
    username,
    time: '* * * * *',
    command: cmd,
  });
  const uid = created?.uid || created?.data?.uid;
  if (!uid) {
    console.log(`não consegui criar o cron: ${JSON.stringify(created).slice(0, 300)}`);
    continue;
  }
  let output = '';
  const deadline = Date.now() + 3 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 15000));
    try {
      const out = await api('GET', `/api/hosting/v1/accounts/${username}/cron-jobs/${uid}/output`);
      output = typeof out === 'string' ? out : JSON.stringify(out, null, 2);
      if (output && output !== '""' && output !== '{}' && output !== 'null') break;
    } catch {
      /* ainda não correu */
    }
  }
  console.log(output || '(sem output em 3 min)');
  try {
    await api('DELETE', `/api/hosting/v1/accounts/${username}/cron-jobs/${uid}`);
  } catch (err) {
    console.log(`AVISO: apagar o cron ${uid} falhou (${err.message}) — apagar à mão no hPanel`);
  }
}
