import { HttpErrorResponse } from '@angular/common/http';

/**
 * Converte erros HTTP em mensagens claras para o motorista, distinguindo
 * falta de rede, credenciais erradas, falta de permissão e servidor em baixo.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    // status 0 = pedido nem chegou ao servidor (sem rede, DNS, CORS…)
    if (error.status === 0) {
      return navigator.onLine === false
        ? 'Sem ligação à internet. Verifique os dados móveis ou o Wi-Fi.'
        : 'Não foi possível contactar o servidor. Tente novamente em instantes.';
    }

    if ([502, 503, 504].includes(error.status)) {
      return 'O servidor está temporariamente indisponível. Tente novamente em instantes.';
    }

    if (error.status >= 500) {
      return 'Erro no servidor. Tente novamente; se persistir, contacte a empresa.';
    }

    if (error.status === 401) {
      return 'Sessão inválida ou credenciais erradas. Inicie sessão novamente.';
    }

    if (error.status === 403) {
      return 'Esta conta não tem acesso à app do motorista. Contacte a empresa.';
    }

    if (error.status === 429) {
      return 'Demasiadas tentativas. Aguarde um momento e tente novamente.';
    }

    const serverMessage = extractServerMessage(error);
    if (serverMessage) {
      return serverMessage;
    }
  }

  return fallback;
}

function extractServerMessage(error: HttpErrorResponse): string | null {
  const body = error.error as
    | { message?: string | string[] | { message?: string | string[] } }
    | undefined;

  const raw =
    body?.message &&
    typeof body.message === 'object' &&
    !Array.isArray(body.message)
      ? body.message.message
      : body?.message;

  if (Array.isArray(raw)) {
    return raw.length > 0 ? raw.join(' · ') : null;
  }

  return typeof raw === 'string' && raw.trim() ? raw : null;
}
