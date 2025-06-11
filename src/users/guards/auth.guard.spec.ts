import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { describe, it, expect, beforeEach } from 'vitest';
import { vi } from 'vitest';

const mockJwtService = {
    verifyAsync: vi.fn(),
};

const mockConfigService = {
    get: vi.fn(),
};

describe('AuthGuard', () => {
    let guard: AuthGuard;
    let jwtService: JwtService;

    beforeEach(async () => {
        vi.clearAllMocks();
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

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    describe('canActivate', () => {
        const mockExecutionContext = {
            switchToHttp: vi.fn().mockReturnValue({
                getRequest: vi.fn(),
            }),
        } as unknown as ExecutionContext;

        it('should allow access with valid token', async () => {
            const mockPayload = { id: 'user-id', email: 'test@example.com' };
            const mockRequest = {
                headers: {
                    authorization: 'Bearer valid-token',
                },
            };

            mockJwtService.verifyAsync.mockResolvedValueOnce(mockPayload);
            mockConfigService.get.mockReturnValueOnce('test-secret');
            (mockExecutionContext.switchToHttp().getRequest as any).mockReturnValue(mockRequest);

            const result = await guard.canActivate(mockExecutionContext);

            expect(result).toBe(true);
            expect(mockRequest['user']).toEqual(mockPayload);
            expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
                secret: 'test-secret',
            });
        });

        it('should throw UnauthorizedException when no token provided', async () => {
            const mockRequest = {
                headers: {},
            };

            (mockExecutionContext.switchToHttp().getRequest as any).mockReturnValue(mockRequest);

            await expect(guard.canActivate(mockExecutionContext))
                .rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException when invalid token format', async () => {
            const mockRequest = {
                headers: {
                    authorization: 'InvalidFormat token',
                },
            };

            (mockExecutionContext.switchToHttp().getRequest as any).mockReturnValue(mockRequest);

            await expect(guard.canActivate(mockExecutionContext))
                .rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException when token verification fails', async () => {
            const mockRequest = {
                headers: {
                    authorization: 'Bearer invalid-token',
                },
            };

            mockJwtService.verifyAsync.mockRejectedValueOnce(new Error('Invalid token'));
            mockConfigService.get.mockReturnValueOnce('test-secret');
            (mockExecutionContext.switchToHttp().getRequest as any).mockReturnValue(mockRequest);

            await expect(guard.canActivate(mockExecutionContext))
                .rejects.toThrow(UnauthorizedException);
        });
    });
});
