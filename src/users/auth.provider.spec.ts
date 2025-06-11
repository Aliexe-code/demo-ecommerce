import { Test, TestingModule } from '@nestjs/testing';
import { AuthProvider } from './auth.provider';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '@/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { describe, it, expect, beforeEach } from 'vitest';
import { vi } from 'vitest';
import * as argon2 from 'argon2';
import { UserType } from '@prisma/client';

// Mock argon2
vi.spyOn(argon2, 'hash').mockImplementation(() => Promise.resolve('hashed_password'));
vi.spyOn(argon2, 'verify').mockImplementation(() => Promise.resolve(true));

const mockPrismaService = {
    user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
    },
};

const mockJwtService = {
    signAsync: vi.fn(),
    verifyAsync: vi.fn(),
};

const mockMailService = {
    sendVerifyMail: vi.fn(),
    sendResetPasswordMail: vi.fn(),
};

const mockConfigService = {
    get: vi.fn((key: string) => {
        if (key === 'DOMAIN') return 'http://localhost:3000';
        if (key === 'JWT_SECRET') return 'test-secret';
        return null;
    }),
};

describe('AuthProvider', () => {
    let provider: AuthProvider;
    let prisma: PrismaService;
    let jwtService: JwtService;
    let mailService: MailService;

    beforeEach(async () => {
        vi.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthProvider,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
                {
                    provide: MailService,
                    useValue: mockMailService,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        provider = module.get<AuthProvider>(AuthProvider);
        prisma = module.get<PrismaService>(PrismaService);
        jwtService = module.get<JwtService>(JwtService);
        mailService = module.get<MailService>(MailService);
    });

    describe('register', () => {
        const registerDto = {
            email: 'test@example.com',
            password: 'Password123!',
            name: 'Test User',
            age: 25,
        };

        it('should register a new user successfully', async () => {
            const hashedPassword = 'hashed_password';
            mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
            (argon2.hash as any).mockResolvedValueOnce(hashedPassword);
            mockPrismaService.user.create.mockResolvedValueOnce({
                id: 'user-id',
                ...registerDto,
                password: hashedPassword,
                verificationToken: expect.any(String),
            });

            const result = await provider.register(registerDto);

            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: registerDto.email },
            });
            expect(argon2.hash).toHaveBeenCalledWith(registerDto.password);
            expect(mailService.sendVerifyMail).toHaveBeenCalled();
            expect(result).toEqual({
                message: 'User registered successfully. Please check your email to verify your account.',
            });
        });

        it('should throw BadRequestException if user already exists', async () => {
            mockPrismaService.user.findUnique.mockResolvedValueOnce({ id: 'existing-user' });
            await expect(provider.register(registerDto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('login', () => {
        const loginDto = {
            email: 'test@example.com',
            password: 'Password123!',
        };

        const mockUser = {
            id: 'user-id',
            email: loginDto.email,
            password: 'hashed_password',
            emailVerified: true,
            name: 'Test User',
        };

        it('should login successfully and return access token', async () => {
            mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);
            (argon2.verify as any).mockResolvedValueOnce(true);
            mockJwtService.signAsync.mockResolvedValueOnce('fake-jwt-token');

            const result = await provider.login(loginDto);

            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: loginDto.email },
            });
            expect(argon2.verify).toHaveBeenCalledWith(mockUser.password, loginDto.password);
            expect(result).toEqual({
                message: 'Logged in successfully',
                accessToken: 'fake-jwt-token',
                user: {
                    id: mockUser.id,
                    email: mockUser.email,
                    name: mockUser.name,
                },
            });
        });

        it('should throw BadRequestException if email/password missing', async () => {
            await expect(provider.login({ email: '', password: '' }))
                .rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
            await expect(provider.login(loginDto)).rejects.toThrow(BadRequestException);
        });

        it('should throw UnauthorizedException if password is incorrect', async () => {
            mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);
            (argon2.verify as any).mockResolvedValueOnce(false);
            await expect(provider.login(loginDto)).rejects.toThrow(UnauthorizedException);
        });

        it('should send verification email if user is not verified', async () => {
            const unverifiedUser = { ...mockUser, emailVerified: false };
            mockPrismaService.user.findUnique.mockResolvedValueOnce(unverifiedUser);
            (argon2.verify as any).mockResolvedValueOnce(true);
            mockPrismaService.user.update.mockResolvedValueOnce(unverifiedUser);

            await expect(provider.login(loginDto)).rejects.toThrow(UnauthorizedException);
            expect(mailService.sendVerifyMail).toHaveBeenCalled();
        });
    });

    describe('sendResetPasswordMail', () => {
        const email = 'test@example.com';
        const mockUser = {
            id: 'user-id',
            email,
        };

        it('should send reset password email successfully', async () => {
            mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);
            mockPrismaService.user.update.mockResolvedValueOnce({ ...mockUser, resetPasswordToken: '123456' });

            const result = await provider.sendResetPasswordMail(email);

            expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email } });
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: mockUser.id },
                data: { resetPasswordToken: expect.any(String) },
            });
            expect(mailService.sendResetPasswordMail).toHaveBeenCalled();
            expect(result).toEqual({
                message: 'Password reset code has been sent to your email',
            });
        });

        it('should throw BadRequestException if user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
            await expect(provider.sendResetPasswordMail(email))
                .rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if email sending fails', async () => {
            mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);
            mockPrismaService.user.update.mockResolvedValueOnce({ ...mockUser, resetPasswordToken: '123456' });
            mockMailService.sendResetPasswordMail.mockRejectedValueOnce(new Error('Email sending failed'));

            await expect(provider.sendResetPasswordMail(email))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('hashPassword', () => {
        it('should hash password successfully', async () => {
            const password = 'test-password';
            const hashedPassword = 'hashed_password';
            (argon2.hash as any).mockResolvedValueOnce(hashedPassword);

            const result = await provider.hashPassword(password);

            expect(argon2.hash).toHaveBeenCalledWith(password);
            expect(result).toBe(hashedPassword);
        });
    });
});
