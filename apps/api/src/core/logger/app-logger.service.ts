import { Injectable, LoggerService } from '@nestjs/common';

@Injectable()
export class AppLoggerService implements LoggerService {
  log(message: string, context?: string) {
    this.write('log', message, context);
  }

  error(message: string, trace?: string, context?: string) {
    this.write('error', message, context, trace);
  }

  warn(message: string, context?: string) {
    this.write('warn', message, context);
  }

  debug(message: string, context?: string) {
    this.write('debug', message, context);
  }

  verbose(message: string, context?: string) {
    this.write('verbose', message, context);
  }

  private write(
    level: string,
    message: string,
    context?: string,
    trace?: string,
  ) {
    process.stdout.write(
      `${JSON.stringify({
        level,
        message,
        context,
        trace,
        timestamp: new Date().toISOString(),
      })}\n`,
    );
  }
}
