import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCompression from '@fastify/compress';
import { Logger, BadRequestException, ValidationPipe } from '@nestjs/common';
import fastifyHelmet from '@fastify/helmet';
import { performance } from 'perf_hooks';
import { FastifyRequest } from 'fastify';
import { AllExceptionsFilter } from '../common/http-exception.filter';
import { ValidationError } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      ignoreTrailingSlash: true,
      disableRequestLogging: true,
      logger: false,
    }),
    { bufferLogs: true, logger: false },
  );

  const logger = new Logger('App');

  app.useGlobalFilters(new AllExceptionsFilter(logger));

  app
    .getHttpAdapter()
    .getInstance()
    .addHook('onRequest', (req: TimedFastifyRequest, reply, done) => {
      req.startTime = performance.now();
      done();
    });

  app
    .getHttpAdapter()
    .getInstance()
    .addHook('onSend', (req: TimedFastifyRequest, reply, payload, done) => {
      const start = req.startTime || performance.now();
      const duration = performance.now() - start;
      const statusCode = reply.statusCode;

      if (statusCode < 400) {
        logger.log(
          `[${req.method} ${req.url}] Status: ${statusCode}, Latency: ${duration.toFixed(3)}ms`,
        );
      }

      done(null, payload);
    });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const formattedErrors = errors.map((error) => ({
          field: error.property,
          errors: Object.values(error.constraints || {}),
        }));
        return new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors: formattedErrors,
        });
      },
    }),
  );

  await app.register(fastifyHelmet, { contentSecurityPolicy: false });
  await app.register(fastifyCompression, {
    encodings: ['gzip', 'deflate'],
    threshold: 1024,
  });

  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useLogger(logger);
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
  logger.log(
    `Server is running at http://localhost:${process.env.PORT ?? 3000}`,
  );

  interface TimedFastifyRequest extends FastifyRequest {
    startTime?: number;
  }
}

void bootstrap();
