import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { APP_VERSION } from './version';

/**
 * Página de status na raiz do domínio (fora do prefixo /api/v1 — ver o
 * `exclude` do setGlobalPrefix no main.ts). Quem abrir a URL da API no
 * browser vê que o serviço está operacional em vez de um 404 em JSON.
 * Não expõe nada além do nome e da versão (já públicos em /api/v1/version).
 */
@ApiExcludeController()
@Controller()
export class AppRootController {
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'no-store')
  root(): string {
    return `<!doctype html>
<html lang="pt">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>LUMAC — API</title>
<style>
  :root { color-scheme: light dark; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    min-height: 100vh;
    display: grid;
    place-items: center;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    background: linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #0f172a 100%);
    color: #e2e8f0;
    padding: 24px;
  }
  .card {
    width: 100%;
    max-width: 420px;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 16px;
    padding: 40px 32px;
    text-align: center;
    backdrop-filter: blur(8px);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
  }
  .logo {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.35em;
    color: #38bdf8;
    text-transform: uppercase;
  }
  h1 { margin-top: 12px; font-size: 22px; font-weight: 600; color: #f8fafc; }
  p.desc { margin-top: 8px; font-size: 14px; line-height: 1.6; color: #94a3b8; }
  .status {
    margin-top: 24px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #4ade80;
    background: rgba(74, 222, 128, 0.1);
    border: 1px solid rgba(74, 222, 128, 0.25);
    border-radius: 999px;
    padding: 8px 16px;
  }
  .dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #4ade80;
    box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.6);
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.5); }
    70% { box-shadow: 0 0 0 8px rgba(74, 222, 128, 0); }
    100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
  }
  .meta { margin-top: 24px; font-size: 12px; color: #64748b; }
  .meta strong { color: #94a3b8; font-weight: 600; }
</style>
</head>
<body>
  <main class="card">
    <div class="logo">Lumac Transportes</div>
    <h1>API do Sistema de Gestão de Transporte</h1>
    <p class="desc">
      Serviço de dados do SGRTC — usado pelo painel de operações,
      pelo portal do cliente e pela app do motorista.
    </p>
    <div class="status"><span class="dot"></span> Operacional</div>
    <p class="meta">SGRTC API · versão <strong>${APP_VERSION}</strong></p>
  </main>
</body>
</html>`;
  }
}
