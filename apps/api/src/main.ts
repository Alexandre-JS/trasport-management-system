import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AppLoggerService } from './core/logger/app-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const configService = app.get(ConfigService);
  const logger = app.get(AppLoggerService);
  const port = configService.get<number>('app.port') ?? 3000;
  const prefix = configService.get<string>('app.prefix') ?? 'api/v1';

  app.useLogger(logger);
  app.setGlobalPrefix(prefix);
  app.enableCors({
    origin: configService.get<string>('app.corsOrigin'),
    credentials: true,
  });
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter(logger));
  app.useGlobalInterceptors(new LoggingInterceptor(logger));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SGRTC API')
    .setDescription(
      'Backend API do Sistema de Gestão e Rastreamento de Transporte de Cargas',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${prefix}/docs`, app, document);

  await app.listen(port);
  logger.log(`API running on port ${port}`, 'Bootstrap');
}
void bootstrap();
