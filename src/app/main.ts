import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Logger, BadRequestException, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from '../common/http-exception.filter';
import { ValidationError } from 'class-validator';
import multipart from '@fastify/multipart';
async function bootstrap() {
  console.log('Creating NestJS app...');
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      ignoreTrailingSlash: true,
      disableRequestLogging: true,
      logger: false,
    }),
    {
      bufferLogs: true,
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    },
  );
  app.useLogger(logger);

  app.useGlobalFilters(new AllExceptionsFilter(logger));
  await app.register(multipart, {
    attachFieldsToBody: true,
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors: ValidationError[]) => {
        console.log('Validation Errors:', JSON.stringify(errors, null, 2));
        console.log(
          'Request Body:',
          JSON.stringify(errors[0]?.target, null, 2),
        );
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

  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log('NestJS app listening on port', process.env.PORT ?? 3000);
}

void bootstrap();
