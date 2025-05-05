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
import { Reflector } from '@nestjs/core';
import { UserType } from '@prisma/client';
import { UsersService } from '../users.service';

@Injectable()
export class AuthRolesGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
    private readonly userService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const roles: UserType[] = this.reflector.getAllAndOverride('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) return false;

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

        const user = await this.userService.getCurrentUser(payload.id);
        if (!user) return false;

        if (roles.includes(user.userData.userType)) {
          request['user'] = payload;
        }
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
