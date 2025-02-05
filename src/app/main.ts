import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCompression from '@fastify/compress';
import { Logger } from 'nestjs-pino';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      ignoreTrailingSlash: true,
      disableRequestLogging: true,
      bodyLimit: 1048576 * 2,
    }),
    { bufferLogs: true },
  );
  app.useGlobalPipes(new ValidationPipe());

  // Compression
  await app.register(fastifyCompression, {
    encodings: ['gzip', 'deflate'],
    threshold: 1024,
  });

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Logger
  app.useLogger(app.get(Logger));

  // Start the app
  await app.listen(process.env.PORT ?? 3000);
  app
    .get(Logger)
    .log(`Server is running at http://localhost:${process.env.PORT ?? 3000}`);
}

void bootstrap();
