import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLoggerService } from '../../core/logger/app-logger.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = isHttpException
      ? exception.getResponse()
      : 'Internal server error';
    // Achatar o formato do Nest ({ message, error, statusCode }) para que os
    // clientes recebam sempre `message` como string ou lista — sem aninhamento.
    const message =
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
        ? (exceptionResponse as { message: string | string[] }).message
        : exceptionResponse;
    const rateLimited = status === HttpStatus.TOO_MANY_REQUESTS;
    const retryAfterHeader = response.getHeader('Retry-After');
    const retryAfterSeconds = rateLimited
      ? Math.max(1, Number(retryAfterHeader) || 60)
      : undefined;

    if (rateLimited) {
      this.logger.warn('Request temporarily rate limited', HttpExceptionFilter.name);
    } else {
      this.logger.error(
        'Request failed',
        exception instanceof Error ? exception.stack : undefined,
        HttpExceptionFilter.name,
      );
    }

    response.status(status).json({
      statusCode: status,
      message: rateLimited
        ? 'Please wait before trying again.'
        : message,
      ...(retryAfterSeconds ? { retryAfterSeconds } : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
