import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { FastifyRequest } from 'fastify';
import * as fastifyMultipart from '@fastify/multipart';

@Injectable()
export class FastifyFileInterceptor implements NestInterceptor {
  constructor(private readonly fieldName: string) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context
      .switchToHttp()
      .getRequest<
        FastifyRequest & { uploadedFile?: fastifyMultipart.MultipartFile }
      >();

    try {
      // Check if the request has a file for the specified field
      const file = await request.file();
      if (file && file.fieldname === this.fieldName) {
        request.uploadedFile = file;
      } else {
        request.uploadedFile = undefined;
      }
    } catch (err) {
      throw new Error(`File processing error: ${(err as Error).message}`);
    }

    return next.handle();
  }
}
