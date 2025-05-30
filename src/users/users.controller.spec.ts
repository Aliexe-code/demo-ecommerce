import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './guards/auth.guard';
import { AuthRolesGuard } from './guards/auth-roles.guard';
import { UserType } from '@prisma/client';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

// Mock UsersService
const mockUsersService = {
  register: vi.fn(),
  login: vi.fn(),
  getCurrentUser: vi.fn(),
  getAllUsers: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  updateProfilePicture: vi.fn(),
  deleteProfilePicture: vi.fn(),
  getProfilePicture: vi.fn(),
  verifyEmail: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true }) // Mock AuthGuard
      .overrideGuard(AuthRolesGuard)
      .useValue({ canActivate: () => true }) // Mock RolesGuard
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call usersService.register with the correct data', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        age: 30,
      };
      mockUsersService.register.mockResolvedValueOnce({
        message: 'User registered successfully',
      });

      const result = await controller.register(registerDto);
      expect(service.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual({ message: 'User registered successfully' });
    });
  });

  describe('login', () => {
    it('should call usersService.login with the correct data', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      mockUsersService.login.mockResolvedValueOnce({
        accessToken: 'fake-token',
      });

      const result = await controller.login(loginDto);
      expect(service.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual({ accessToken: 'fake-token' });
    });
  });

  describe('getCurrentUser', () => {
    it('should call usersService.getCurrentUser with the correct payload', async () => {
      const jwtPayload = {
        id: 'user-id',
        email: 'test@example.com',
        userType: UserType.NORMAL_USER,
      };
      const mockUser = {
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
      };
      mockUsersService.getCurrentUser.mockResolvedValueOnce(mockUser);

      const result = await controller.getCurrentUser(jwtPayload);
      expect(service.getCurrentUser).toHaveBeenCalledWith(jwtPayload.id);
      expect(result).toEqual(mockUser);
    });
  });

  describe('getAllUsers', () => {
    it('should call usersService.getAllUsers', async () => {
      const mockUsers = [
        { id: 'user-id', name: 'Test User', email: 'test@example.com' },
      ];
      mockUsersService.getAllUsers.mockResolvedValueOnce(mockUsers);

      const result = await controller.getAllUsers();
      expect(service.getAllUsers).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('updateUser', () => {
    it('should call usersService.update with correct payload and DTO', async () => {
      const jwtPayload = {
        id: 'user-id',
        email: 'test@example.com',
        userType: UserType.NORMAL_USER,
      };
      const updateUserDto = { name: 'Updated Name' };
      mockUsersService.update.mockResolvedValueOnce({
        message: 'User updated successfully',
      });

      const result = await controller.updateUser(jwtPayload, updateUserDto);
      expect(service.update).toHaveBeenCalledWith(jwtPayload.id, updateUserDto);
      expect(result).toEqual({ message: 'User updated successfully' });
    });
  });

  describe('deleteUser', () => {
    it('should call usersService.delete with correct id and payload', async () => {
      const userIdToDelete = 'other-user-id';
      const jwtPayload = {
        id: 'admin-user-id',
        email: 'admin@example.com',
        userType: UserType.ADMIN,
      };
      mockUsersService.delete.mockResolvedValueOnce({
        message: 'user has been removed',
      });

      const result = await controller.deleteUser(userIdToDelete, jwtPayload);
      expect(service.delete).toHaveBeenCalledWith(userIdToDelete, jwtPayload);
      expect(result).toEqual({ message: 'user has been removed' });
    });
  });

  // Basic tests for other endpoints - can be expanded
  describe('uploadProfileImage', () => {
    it('should throw BadRequestException if not multipart', async () => {
      const mockRequest: any = { isMultipart: () => false };
      const jwtPayload = {
        id: 'user-id',
        email: 'test@example.com',
        userType: UserType.NORMAL_USER,
      };
      await expect(
        controller.uploadProfileImage(mockRequest, jwtPayload),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteProfileImage', () => {
    it('should call usersService.deleteProfilePicture', async () => {
      const jwtPayload = {
        id: 'user-id',
        email: 'test@example.com',
        userType: UserType.NORMAL_USER,
      };
      mockUsersService.deleteProfilePicture.mockResolvedValueOnce({
        message: 'Profile picture deleted',
      });
      await controller.deleteProfileImage(jwtPayload);
      expect(service.deleteProfilePicture).toHaveBeenCalledWith(jwtPayload.id);
    });
  });

  describe('getProfileImage', () => {
    it('should call usersService.getProfilePicture', async () => {
      const jwtPayload = {
        id: 'user-id',
        email: 'test@example.com',
        userType: UserType.NORMAL_USER,
      };
      const mockReply: any = { sendFile: vi.fn() }; // Basic mock for FastifyReply
      mockUsersService.getProfilePicture.mockResolvedValueOnce(undefined); // sendFile doesn't typically return a promise in this way
      await controller.getProfileImage(jwtPayload, mockReply);
      expect(service.getProfilePicture).toHaveBeenCalledWith(
        jwtPayload.id,
        mockReply,
      );
    });
  });

  describe('verifyEmail', () => {
    it('should call usersService.verifyEmail', async () => {
      const userId = 'user-id';
      const token = 'verify-token';
      mockUsersService.verifyEmail.mockResolvedValueOnce({
        message: 'Email verified',
      });
      await controller.verifyEmail(userId, token);
      expect(service.verifyEmail).toHaveBeenCalledWith(userId, token);
    });
  });

  describe('forgotPassword', () => {
    it('should call usersService.forgotPassword', async () => {
      const forgotPasswordDto = { email: 'test@example.com' };
      mockUsersService.forgotPassword.mockResolvedValueOnce({
        message: 'Password reset email sent',
      });
      await controller.forgotPassword(forgotPasswordDto);
      expect(service.forgotPassword).toHaveBeenCalledWith(
        forgotPasswordDto.email,
      );
    });
  });

  describe('resetPassword', () => {
    it('should call usersService.resetPassword', async () => {
      const resetPasswordDto = {
        email: 'test@example.com',
        code: '123456',
        password: 'newPassword',
      };
      mockUsersService.resetPassword.mockResolvedValueOnce({
        message: 'Password reset successfully',
      });
      await controller.resetPassword(resetPasswordDto);
      expect(service.resetPassword).toHaveBeenCalledWith(
        resetPasswordDto.email,
        resetPasswordDto.code,
        resetPasswordDto.password,
      );
    });
  });
});
