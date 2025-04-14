import {
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

interface ExceptionResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
  errors?: Array<{
    field: string;
    errors: string[];
  }>;
}

interface ErrorResponse {
  statusCode: number;
  message: string;
  timestamp: string;
  path: string;
  errors?: Array<{
    field: string;
    errors: string[];
  }>;
}

@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let validationErrors: Array<{
      field: string;
      errors: string[];
    }> | null = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const response = exceptionResponse as ExceptionResponse;
        message = response.message
          ? typeof response.message === 'string'
            ? response.message
            : response.message.join(', ')
          : message;
        validationErrors = response.errors || null;
      } else if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    if (status >= HttpStatus.BAD_REQUEST) {
      const errorMessage = validationErrors
        ? `${message} - ${validationErrors
            .map((e) => `${e.field}: ${e.errors.join(', ')}`)
            .join('; ')}`
        : message;
      this.logger.error(
        `[${request.method} ${request.url}] Status: ${status} - ${errorMessage}`,
      );
    }

    const responseBody: ErrorResponse = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (validationErrors) {
      responseBody.errors = validationErrors;
    }

    response.status(status).send(responseBody);
  }
}
