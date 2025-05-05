import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import type { JWTPayloadType } from '../entities/types';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): JWTPayloadType => {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    return request['user'] as JWTPayloadType;
  },
);
