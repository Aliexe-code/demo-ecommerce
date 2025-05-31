import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthRolesGuard } from './auth-roles.guard';
import { UserType } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users.service';

describe('AuthRolesGuard', () => {
  let guard: AuthRolesGuard;
  let reflector: Reflector;
  let jwtService: JwtService;
  let configService: ConfigService;
  let usersService: UsersService;

  const mockJwtService = {
    verifyAsync: vi.fn(),
  };

  const mockConfigService = {
    get: vi.fn(),
  };

  const mockUsersService = {
    getCurrentUser: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthRolesGuard,
        {
          provide: Reflector,
          useValue: {
            get: vi.fn(),
            getAllAndOverride: vi.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    guard = module.get<AuthRolesGuard>(AuthRolesGuard);
    reflector = module.get<Reflector>(Reflector);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    usersService = module.get<UsersService>(UsersService);

    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    const mockToken = 'valid.jwt.token';
    const mockPayload = { id: '1', email: 'test@example.com' };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: `Bearer ${mockToken}`,
          },
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;

    beforeEach(() => {
      mockConfigService.get.mockReturnValue('jwt-secret');
    });

    it('should return false when no roles are defined', async () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
      expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should return true when user has required role', async () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        UserType.ADMIN,
      ]);
      mockJwtService.verifyAsync.mockResolvedValueOnce(mockPayload);
      mockUsersService.getCurrentUser.mockResolvedValueOnce({
        userData: { userType: UserType.ADMIN },
      });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(mockToken, {
        secret: 'jwt-secret',
      });
      expect(mockUsersService.getCurrentUser).toHaveBeenCalledWith(
        mockPayload.id,
      );
    });

    it('should return false when user role does not match required roles', async () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
      mockJwtService.verifyAsync.mockResolvedValueOnce({
        id: 'user-id',
        userType: 'USER',
      });
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { authorization: 'Bearer valid.jwt.token' },
          }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as unknown as ExecutionContext;
      const result = await guard.canActivate(mockContext);
      expect(result).toBe(false);
    });

    it('should throw UnauthorizedException when token verification fails', async () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        UserType.ADMIN,
      ]);
      mockJwtService.verifyAsync.mockRejectedValueOnce(
        new Error('Invalid token'),
      );

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when no token is provided', async () => {
      const contextWithoutToken = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
          }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        UserType.ADMIN,
      ]);

      await expect(guard.canActivate(contextWithoutToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should store user payload in request object when role matches', async () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        UserType.ADMIN,
      ]);
      mockJwtService.verifyAsync.mockResolvedValueOnce(mockPayload);
      mockUsersService.getCurrentUser.mockResolvedValueOnce({
        userData: { userType: UserType.ADMIN },
      });

      let storedUser;
      const mockRequestContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: `Bearer ${mockToken}`,
            },
            set user(value) {
              storedUser = value;
            },
            get user() {
              return storedUser;
            },
          }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      await guard.canActivate(mockRequestContext);

      const request = mockRequestContext.switchToHttp().getRequest();
      expect(request.user).toEqual(mockPayload);
    });
  });
});
