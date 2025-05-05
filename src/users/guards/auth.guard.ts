import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { FastifyRequest } from 'fastify';
import type { JWTPayloadType } from '../entities/types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}
  async canActivate(context: ExecutionContext) {
    const request: FastifyRequest = context.switchToHttp().getRequest();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (token && type === 'Bearer') {
      try {
        const payload: JWTPayloadType = await this.jwtService.verifyAsync(
          token,
          {
            secret: this.config.get('JWT_SECRET'),
          },
        );
        request['user'] = payload;
      } catch (error) {
        console.error('Error verifying JWT:', error);
        throw new UnauthorizedException('Invalid token');
      }
    } else {
      throw new UnauthorizedException('No token provided');
    }
    return true;
  }
}
