/**
 * @vitest-environment node
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthProvider } from './auth.provider';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MultipartFile } from '@fastify/multipart';
import type { FastifyReply } from 'fastify';

// Create mock functions
const mockFs = {
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  createWriteStream: vi.fn(),
  unlink: vi.fn(),
  unlinkSync: vi.fn(),
};

const mockPath = {
  join: vi.fn((...args: string[]) => args.join('/')),
};

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

vi.mock('fs', () => mockFs);
vi.mock('path', () => mockPath);

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;
  let authProvider: AuthProvider;

  beforeEach(async () => {
    vi.clearAllMocks();
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

  describe('updateProfilePicture', () => {
    const mockFile: MultipartFile = {
      file: {
        pipe: vi.fn().mockReturnThis(),
        on: vi.fn().mockImplementation((event, callback) => {
          if (event === 'finish') callback();
          return { on: vi.fn() };
        }),
      } as any,
      filename: 'test.jpg',
      mimetype: 'image/jpeg',
      encoding: '7bit',
      fields: {},
      type: 'file',
      fieldname: 'file',
      toBuffer: () => Promise.resolve(Buffer.from('')),
    };

    const testUserId = 'test-user-profile-id';
    const testUser = {
      id: testUserId,
      profilePic: 'old-profile.jpg',
      email: 'test@example.com',
      name: 'Test User',
    };

    beforeEach(() => {
      vi.clearAllMocks();
      mockFs.existsSync.mockReturnValue(true);
      mockFs.createWriteStream.mockReturnValue({
        on: vi.fn(),
        emit: vi.fn(),
      });
    });

    it('should update profile picture successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(testUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...testUser,
        profilePic: expect.stringContaining('.jpg'),
      });

      const result = await service.updateProfilePicture(testUserId, mockFile);

      expect(result).toEqual({
        message: 'Profile picture updated successfully',
        filename: expect.stringContaining('.jpg'),
        imageUrl: expect.stringContaining('/images/'),
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: testUserId },
        data: { profilePic: expect.stringContaining('.jpg') },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.updateProfilePicture(testUserId, mockFile))
        .rejects.toThrow(NotFoundException);
    });

    it('should create upload directory if it does not exist', async () => {
      mockFs.existsSync.mockReturnValueOnce(false);
      mockPrismaService.user.findUnique.mockResolvedValue(testUser);
      mockPrismaService.user.update.mockResolvedValue(testUser);

      await service.updateProfilePicture(testUserId, mockFile);

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    });

    it('should delete old profile picture if exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(testUser);
      mockPrismaService.user.update.mockResolvedValue(testUser);

      await service.updateProfilePicture(testUserId, mockFile);

      expect(mockFs.unlink).toHaveBeenCalledWith(expect.stringContaining('old-profile.jpg'), expect.any(Function));
    });

    it('should handle file write errors', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(testUser);
      
      // Mock write stream error
      const mockWriteStream = {
        on: vi.fn(),
        emit: vi.fn(),
      };
      mockFs.createWriteStream.mockReturnValue(mockWriteStream);

      // Simulate write error
      const file = {
        ...mockFile,
        file: {
          pipe: vi.fn().mockReturnValue(mockWriteStream),
          on: vi.fn().mockImplementation((event, callback) => {
            if (event === 'error') {
              callback(new Error('Write error'));
            }
            return { on: vi.fn() };
          }),
        },
      };

      await expect(service.updateProfilePicture(testUserId, file))
        .rejects.toThrow('Write error');
    });

    it('should handle directory creation errors', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      mockPrismaService.user.findUnique.mockResolvedValue(testUser);

      await expect(service.updateProfilePicture(testUserId, mockFile))
        .rejects.toThrow('Permission denied');
    });
  });

  describe('deleteProfilePicture', () => {
    const testUserId = 'test-user-delete-id';
    const testUser = {
      id: testUserId,
      profilePic: 'profile.jpg',
      email: 'test@example.com',
      name: 'Test User',
    };

    it('should delete profile picture successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(testUser);
      mockPrismaService.user.update.mockResolvedValue({ ...testUser, profilePic: null });
      mockFs.unlink.mockImplementation((path, callback) => {
        if (callback) callback(null);
        return Promise.resolve();
      });

      const result = await service.deleteProfilePicture(testUserId);

      expect(result).toEqual({ message: 'Profile picture deleted successfully' });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: testUserId },
        data: { profilePic: null },
      });
      expect(mockFs.unlink).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteProfilePicture(testUserId))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user has no profile picture', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ 
        ...testUser, 
        profilePic: null,
      });

      await expect(service.deleteProfilePicture(testUserId))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getProfilePicture', () => {
    const testUserId = 'test-user-get-id';
    const testUser = {
      id: testUserId,
      profilePic: 'profile.jpg',
      email: 'test@example.com',
      name: 'Test User',
    };

    const mockReply = {
      sendFile: vi.fn().mockResolvedValue(undefined),
    } as unknown as FastifyReply;

    beforeEach(() => {
      mockFs.existsSync.mockReturnValue(true);
    });

    it('should send profile picture successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(testUser);

      await service.getProfilePicture(testUserId, mockReply);

      expect(mockReply.sendFile).toHaveBeenCalledWith(
        'profile.jpg',
        expect.any(String),
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfilePicture(testUserId, mockReply))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user has no profile picture', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...testUser,
        profilePic: null,
      });

      await expect(service.getProfilePicture(testUserId, mockReply))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if profile picture file not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(testUser);
      mockFs.existsSync.mockReturnValueOnce(false);

      await expect(service.getProfilePicture(testUserId, mockReply))
        .rejects.toThrow(BadRequestException);
    });
  });
});
