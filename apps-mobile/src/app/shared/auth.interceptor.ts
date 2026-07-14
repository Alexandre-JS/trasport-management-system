import {
  HttpErrorResponse,
  type HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

const AUTH_PATHS = ['/auth/login', '/auth/refresh'];

/**
 * Anexa o access token e, quando um pedido leva 401 (token de 15 min
 * expirado), renova a sessão pelo refresh token e repete o pedido uma vez.
 * O motorista deixa de ser deslogado a meio do turno.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  const isAuthCall = AUTH_PATHS.some((p) => req.url.includes(p));
  const token = auth.accessToken;

  const authed =
    token && !isAuthCall
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authed).pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        isAuthCall ||
        (authed as { _retried?: boolean })._retried
      ) {
        return throwError(() => error);
      }

      return from(auth.tryRefresh()).pipe(
        switchMap((ok) => {
          if (!ok) {
            return throwError(() => error);
          }
          const retried = req.clone({
            setHeaders: { Authorization: `Bearer ${auth.accessToken}` },
          });
          (retried as { _retried?: boolean })._retried = true;
          return next(retried);
        }),
      );
    }),
  );
};
