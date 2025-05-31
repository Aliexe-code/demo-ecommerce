import { ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthGuard } from './auth.guard';
import { ConfigService } from '@nestjs/config';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: JwtService;

  const mockJwtService = {
    verifyAsync: vi.fn(),
  };

  const mockConfigService = {
    get: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for valid JWT token', async () => {
      const mockToken = 'valid.jwt.token';
      const mockUser = { id: '1', email: 'test@example.com' };
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: `Bearer ${mockToken}`,
            },
          }),
        }),
      } as ExecutionContext;

      mockJwtService.verifyAsync.mockResolvedValueOnce(mockUser);
      mockConfigService.get.mockReturnValue('your-secret-key');

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(
        mockToken,
        expect.any(Object),
      );
    });

    it('should throw UnauthorizedException for invalid JWT token', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Bearer invalid.token',
            },
          }),
        }),
      } as ExecutionContext;

      mockJwtService.verifyAsync.mockRejectedValueOnce(
        new Error('Invalid token'),
      );
      mockConfigService.get.mockReturnValue('your-secret-key');

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'Invalid token',
      );
      expect(mockJwtService.verifyAsync).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when no authorization header is present', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
          }),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'No token provided',
      );
    });

    it('should throw UnauthorizedException for malformed authorization header', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'InvalidHeader',
            },
          }),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'No token provided',
      );
    });

    it('should throw UnauthorizedException when authorization header is not Bearer token', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Basic sometoken',
            },
          }),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'No token provided',
      );
    });

    it('should store user payload in request object', async () => {
      const mockToken = 'valid.jwt.token';
      const mockPayload = { id: '1', email: 'test@example.com' };
      let storedUser;

      const mockContext = {
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
      } as ExecutionContext;

      mockJwtService.verifyAsync.mockResolvedValueOnce(mockPayload);
      mockConfigService.get.mockReturnValue('your-secret-key');

      await guard.canActivate(mockContext);

      const request = mockContext.switchToHttp().getRequest();
      expect(request.user).toEqual(mockPayload);
    });
  });
});
