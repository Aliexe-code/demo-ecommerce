import { Test, TestingModule } from '@nestjs/testing';
import { AuthRolesGuard } from './auth-roles.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../users.service';
import { UserType } from '@prisma/client';
import { describe, it, expect, beforeEach } from 'vitest';
import { vi } from 'vitest';

const mockJwtService = {
    verifyAsync: vi.fn(),
};

const mockConfigService = {
    get: vi.fn(),
};

const mockReflector = {
    getAllAndOverride: vi.fn(),
};

const mockUsersService = {
    getCurrentUser: vi.fn(),
};

describe('AuthRolesGuard', () => {
    let guard: AuthRolesGuard;
    let jwtService: JwtService;
    let reflector: Reflector;
    let usersService: UsersService;

    beforeEach(async () => {
        vi.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthRolesGuard,
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
                {
                    provide: Reflector,
                    useValue: mockReflector,
                },
                {
                    provide: UsersService,
                    useValue: mockUsersService,
                },
            ],
        }).compile();

        guard = module.get<AuthRolesGuard>(AuthRolesGuard);
        jwtService = module.get<JwtService>(JwtService);
        reflector = module.get<Reflector>(Reflector);
        usersService = module.get<UsersService>(UsersService);
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    describe('canActivate', () => {
        const mockExecutionContext = {
            switchToHttp: vi.fn().mockReturnValue({
                getRequest: vi.fn(),
            }),
            getHandler: vi.fn(),
            getClass: vi.fn(),
        } as unknown as ExecutionContext;

        beforeEach(() => {
            mockReflector.getAllAndOverride.mockReturnValue([UserType.ADMIN]);
        });

        it('should allow access for user with correct role', async () => {
            const mockPayload = { id: 'user-id', email: 'admin@example.com' };
            const mockRequest = {
                headers: {
                    authorization: 'Bearer valid-token',
                },
            };

            mockJwtService.verifyAsync.mockResolvedValueOnce(mockPayload);
            mockConfigService.get.mockReturnValueOnce('test-secret');
            mockUsersService.getCurrentUser.mockResolvedValueOnce({
                userData: {
                    id: 'user-id',
                    userType: UserType.ADMIN,
                },
            });
            (mockExecutionContext.switchToHttp().getRequest as any).mockReturnValue(mockRequest);

            const result = await guard.canActivate(mockExecutionContext);

            expect(result).toBe(true);
            expect(mockRequest['user']).toEqual(mockPayload);
        });

        it('should return false when no roles defined', async () => {
            mockReflector.getAllAndOverride.mockReturnValueOnce(null);
            const result = await guard.canActivate(mockExecutionContext);
            expect(result).toBe(false);
        });

        it('should throw UnauthorizedException when no token provided', async () => {
            const mockRequest = {
                headers: {},
            };

            (mockExecutionContext.switchToHttp().getRequest as any).mockReturnValue(mockRequest);

            await expect(guard.canActivate(mockExecutionContext))
                .rejects.toThrow(UnauthorizedException);
        });        it('should return false for user with incorrect role', async () => {
            const mockPayload = { id: 'user-id', email: 'user@example.com' };
            const mockRequest = {
                headers: {
                    authorization: 'Bearer valid-token',
                },
                user: undefined,
            };

            mockJwtService.verifyAsync.mockResolvedValueOnce(mockPayload);
            mockConfigService.get.mockReturnValueOnce('test-secret');
            mockUsersService.getCurrentUser.mockResolvedValueOnce({
                message: 'User found successfully',
                userData: {
                    id: 'user-id',
                    userType: UserType.NORMAL_USER,
                },
            });
            (mockExecutionContext.switchToHttp().getRequest as any).mockReturnValue(mockRequest);

            const result = await guard.canActivate(mockExecutionContext);

            expect(result).toBe(false);
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
