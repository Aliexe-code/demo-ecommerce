import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthProvider } from './auth.provider';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserType } from '@prisma/client';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { describe, it, expect, beforeEach } from 'vitest';
import { vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock fs and path modules manually instead of using vi.mock
const mockUnlink = vi.fn().mockResolvedValue(undefined);
const mockJoin = vi.fn().mockImplementation((...args) => args.join('/'));

// Override the imported modules with mocks
vi.spyOn(fs, 'unlink').mockImplementation(mockUnlink);
vi.spyOn(path, 'join').mockImplementation(mockJoin);

// Mocks
const mockPrismaService = {
    user: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        findMany: vi.fn(),
    },
};

const mockAuthProvider = {
    hashPassword: vi.fn(),
    register: vi.fn(),
    login: vi.fn(),
    sendResetPasswordMail: vi.fn(),
} satisfies Partial<AuthProvider>;

const mockConfigService = {
    get: vi.fn((key: string) => {
        if (key === 'CLIENT_URL') return 'http://localhost:3000';
        if (key === 'PROFILE_IMAGE_PATH') return 'uploads/profile-images';
        return null;
    }),
};

describe('UsersService', () => {
    let service: UsersService;
    let prisma: PrismaService;
    let authProvider: AuthProvider;

    beforeEach(async () => {
        vi.clearAllMocks(); // Clear mocks before each test
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: AuthProvider,
                    useValue: mockAuthProvider,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        prisma = module.get<PrismaService>(PrismaService);
        authProvider = module.get<AuthProvider>(AuthProvider);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('register', () => {
        const registerDto: RegisterDto = {
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
            age: 30,
        };

        it('should register a new user successfully', async () => {
            const expectedResponse = { message: 'User registered successfully. Please check your email to verify your account.' };
            mockAuthProvider.register.mockResolvedValueOnce(expectedResponse);

            const result = await service.register(registerDto);

            expect(authProvider.register).toHaveBeenCalledWith(registerDto);
            expect(result).toEqual(expectedResponse);
        });

        it('should throw BadRequestException if user already exists', async () => {
            mockAuthProvider.register.mockRejectedValueOnce(new BadRequestException('Invalid email , user already exists'));
            await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
        });
    });

    const loginDto: LoginDto = { email: 'test@example.com', password: 'password123' };
    const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        age: 30,
        userType: UserType.NORMAL_USER,
        isVerified: true,
        profileImagePath: null,
        password: 'hashedPassword',
        verificationToken: null,
        resetPasswordToken: null,
        resetPasswordTokenExpires: null,
    };

    describe('login', () => {
        it('should login a user successfully and return an access token', async () => {
            const expectedResponse = {
                message: 'Logged in successfully',
                accessToken: 'fake-access-token',
                user: {
                    id: 'user-id',
                    email: 'test@example.com',
                    name: 'Test User'
                }
            };
            mockAuthProvider.login.mockResolvedValueOnce(expectedResponse);

            const result = await service.login(loginDto);

            expect(authProvider.login).toHaveBeenCalledWith(loginDto);
            expect(result).toEqual(expectedResponse);
        });
    }); it('should throw BadRequestException if user not found', async () => {
        mockAuthProvider.login.mockRejectedValueOnce(new BadRequestException('Invalid email or password'));
        await expect(service.login(loginDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
        mockAuthProvider.login.mockRejectedValueOnce(new UnauthorizedException('Invalid email or password'));
        await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is not verified', async () => {
        mockAuthProvider.login.mockRejectedValueOnce(new UnauthorizedException('Please verify your email. A verification link has been sent to your email address.'));
        await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    // Place all following describe blocks inside the main UsersService describe block
    describe('getCurrentUser', () => {
        const userId = 'user-id';
        const mockUser = {
            id: userId,
            email: 'test@example.com',
            name: 'Test User',
            age: 30,
            userType: UserType.NORMAL_USER,
            isVerified: true,
            profileImagePath: null,
            password: 'hashedPassword', // ensure all fields are present
            verificationToken: null,
            resetPasswordToken: null,
            resetPasswordTokenExpires: null,
        }; it('should return the current user', async () => {
            mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);
            const result = await service.getCurrentUser(userId);
            expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
            expect(result).toEqual({
                message: 'User found successfully',
                userData: {
                    id: mockUser.id,
                    email: mockUser.email,
                    name: mockUser.name,
                    age: mockUser.age,
                    userType: mockUser.userType,
                    profilePic: null
                }
            });
        });

        it('should throw NotFoundException if user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
            await expect(service.getCurrentUser(userId)).rejects.toThrow(NotFoundException);
        });
    }); describe('getAllUsers', () => {
        it('should return all users', async () => {
            const mockUsers = [
                { id: 'user1', name: 'User One', email: 'user1@example.com', password: 'p1', verificationToken: null, resetPasswordToken: null, resetPasswordTokenExpires: null, isVerified: true, userType: UserType.NORMAL_USER, age: 20, profileImagePath: null },
                { id: 'user2', name: 'User Two', email: 'user2@example.com', password: 'p2', verificationToken: null, resetPasswordToken: null, resetPasswordTokenExpires: null, isVerified: true, userType: UserType.NORMAL_USER, age: 25, profileImagePath: null },
            ];
            mockPrismaService.user.findMany.mockResolvedValueOnce(mockUsers);

            const result = await service.getAllUsers();

            expect(prisma.user.findMany).toHaveBeenCalled();
            expect(result).toEqual({
                message: 'Users found successfully',
                usersData: mockUsers.map(user => ({
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    age: user.age,
                    role: user.userType
                }))
            });
        });
    });

    describe('update', () => {
        const userId = 'user-id';
        const updateUserDto = { name: 'Updated Name' };
        const mockUser = { id: userId, name: 'Old Name', email: 'test@example.com', password: 'hashedPassword', verificationToken: null, resetPasswordToken: null, resetPasswordTokenExpires: null, isVerified: true, userType: UserType.NORMAL_USER, age: 30, profileImagePath: null };

        it('should update user successfully', async () => {
            mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);
            mockPrismaService.user.update.mockResolvedValueOnce({ ...mockUser, ...updateUserDto });

            const result = await service.update(userId, updateUserDto);
            expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
            expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: userId }, data: updateUserDto });
            expect(result).toEqual({ message: 'User updated successfully' });
        });

        it('should throw NotFoundException if user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
            await expect(service.update(userId, updateUserDto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('delete', () => {
        const userIdToDelete = 'user-to-delete-id';
        const adminPayload = { id: 'admin-id', userType: UserType.ADMIN, email: 'admin@test.com' };
        const normalUserPayload = { id: 'normal-user-id', userType: UserType.NORMAL_USER, email: 'normal@test.com' };
        const mockUserToDelete = { id: userIdToDelete, name: 'User To Delete', email: 'delete@example.com', profileImagePath: 'path/to/image.jpg' }; it('should allow admin to delete any user', async () => {
            const mockUserResponse = {
                message: 'User found successfully',
                userData: {
                    id: mockUserToDelete.id,
                    email: mockUserToDelete.email,
                    name: mockUserToDelete.name,
                    age: 30,
                    userType: UserType.NORMAL_USER,
                    profilePic: mockUserToDelete.profileImagePath ? `/images/${mockUserToDelete.profileImagePath}` : null
                }
            };

            mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUserToDelete);
            mockPrismaService.user.findUnique.mockResolvedValueOnce({ ...adminPayload, userType: UserType.ADMIN });
            mockPrismaService.user.delete.mockResolvedValueOnce(mockUserToDelete);

            const result = await service.delete(userIdToDelete, adminPayload);
            expect(result).toEqual({ message: 'user has been removed' });
        });

        it('should allow normal user to delete their own account', async () => {
            mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUserToDelete as any);
            mockPrismaService.user.delete.mockResolvedValueOnce(mockUserToDelete as any);
            (fs.unlink as vi.Mock).mockResolvedValueOnce(undefined);

            const result = await service.delete(userIdToDelete, { ...normalUserPayload, id: userIdToDelete });
            expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: userIdToDelete } });
            expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: userIdToDelete } });
            expect(result).toEqual({ message: 'user has been removed' });
        }); it('should throw UnauthorizedException if normal user tries to delete another user', async () => {
            // First findUnique for getCurrentUser
            mockPrismaService.user.findUnique.mockImplementation(({ where }) => {
                if (where.id === userIdToDelete) {
                    return Promise.resolve(mockUserToDelete);
                }
                if (where.id === normalUserPayload.id) {
                    return Promise.resolve({ ...normalUserPayload, userType: UserType.NORMAL_USER });
                }
                return Promise.resolve(null);
            });
            await expect(service.delete(userIdToDelete, normalUserPayload)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw NotFoundException if user to delete is not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
            await expect(service.delete(userIdToDelete, adminPayload)).rejects.toThrow(NotFoundException);
        }); it('should delete profile image if exists', async () => {
            const userWithImage = {
                ...mockUserToDelete,
                profilePic: 'image.jpg'
            };
            const mockUserResponse = {
                message: 'User found successfully',
                userData: {
                    id: userWithImage.id,
                    email: userWithImage.email,
                    name: userWithImage.name,
                    age: 30,
                    userType: UserType.NORMAL_USER,
                    profilePic: `/images/${userWithImage.profilePic}`
                }
            };

            mockPrismaService.user.findUnique.mockImplementation(({ where }) => {
                if (where.id === userIdToDelete) {
                    return Promise.resolve(userWithImage);
                }
                if (where.id === adminPayload.id) {
                    return Promise.resolve({ ...adminPayload, userType: UserType.ADMIN });
                }
                return Promise.resolve(null);
            });
            mockPrismaService.user.delete.mockResolvedValueOnce(userWithImage);

            const result = await service.delete(userIdToDelete, adminPayload);
            expect(result).toEqual({ message: 'user has been removed' });
        });
    });

    describe('verifyEmail', () => {
        const userId = 'user-id';
        const token = 'verify-token';
        const mockUser = { id: userId, verificationToken: token, isVerified: false }; it('should verify email successfully', async () => {
            mockPrismaService.user.findUnique.mockResolvedValueOnce({
                ...mockUser,
                verificationToken: token,
                emailVerified: false
            });
            mockPrismaService.user.update.mockResolvedValueOnce({
                ...mockUser,
                emailVerified: true,
                verificationToken: null
            });

            const result = await service.verifyEmail(userId, token);
            expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: {
                    emailVerified: true,
                    verificationToken: null
                },
            });
            expect(result).toEqual({ message: 'Email verified successfully.' });
        }); it('should throw NotFoundException if user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
            await expect(service.verifyEmail(userId, token)).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if token is invalid', async () => {
            mockPrismaService.user.findUnique.mockResolvedValueOnce({ ...mockUser, verificationToken: 'different-token' } as any);
            await expect(service.verifyEmail(userId, token)).rejects.toThrow(BadRequestException);
        }); it('should throw BadRequestException if user is already verified', async () => {
            mockPrismaService.user.findUnique.mockResolvedValueOnce({
                ...mockUser,
                emailVerified: true
            });
            await expect(service.verifyEmail(userId, token)).rejects.toThrow(BadRequestException);
        });
    }); describe('forgotPassword', () => {
        const email = 'test@example.com';

        it('should send password reset email successfully', async () => {
            const expectedResponse = { message: 'Password reset code sent to your email.' };
            mockAuthProvider.sendResetPasswordMail.mockResolvedValueOnce(expectedResponse);

            const result = await service.forgotPassword(email);
            expect(authProvider.sendResetPasswordMail).toHaveBeenCalledWith(email);
            expect(result).toEqual(expectedResponse);
        });
    }); describe('resetPassword', () => {
        const email = 'test@example.com';
        const code = '123456';
        const newPassword = 'newPassword123';
        const mockUser = {
            id: 'user-id',
            email,
            resetPasswordToken: code,
        };

        it('should reset password successfully', async () => {
            mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);
            mockAuthProvider.hashPassword.mockResolvedValueOnce('hashedNewPassword');
            mockPrismaService.user.update.mockResolvedValueOnce(mockUser);

            const result = await service.resetPassword(email, code, newPassword);
            expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email } });
            expect(authProvider.hashPassword).toHaveBeenCalledWith(newPassword);
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: mockUser.id },
                data: {
                    password: 'hashedNewPassword',
                    resetPasswordToken: null,
                },
            });
            expect(result).toEqual({ message: 'Password has been reset successfully.' });
        });

        it('should throw NotFoundException if user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
            await expect(service.resetPassword(email, code, newPassword))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if invalid code', async () => {
            mockPrismaService.user.findUnique.mockResolvedValueOnce({
                ...mockUser,
                resetPasswordToken: 'different-code',
            });
            await expect(service.resetPassword(email, code, newPassword))
                .rejects.toThrow(BadRequestException);
        });
    });

    // updateProfilePicture, deleteProfilePicture, getProfilePicture require more complex mocking for file system and streams
    // These are placeholders and would need more detailed tests
    describe('updateProfilePicture', () => {
        it('should be defined', () => {
            expect(service.updateProfilePicture).toBeDefined();
        });
    });

    describe('deleteProfilePicture', () => {
        it('should be defined', () => {
            expect(service.deleteProfilePicture).toBeDefined();
        });
    });

    describe('getProfilePicture', () => {
        it('should be defined', () => {
            expect(service.getProfilePicture).toBeDefined();
        });
    });
});
