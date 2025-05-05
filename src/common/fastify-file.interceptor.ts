import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import type { FastifyRequest } from 'fastify';
import * as fastifyMultipart from '@fastify/multipart';
import { BadRequestException } from '@nestjs/common/exceptions';
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
      const file = await request.file();
      if (file && file.fieldname === this.fieldName) {
        request.uploadedFile = file;
      } else {
        request.uploadedFile = undefined;
      }
    } catch (error) {
      throw new BadRequestException(`File processing error: ${error.message}`);
    }

    return next.handle();
  }
}
