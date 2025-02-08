/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../src/users/users.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  // Create a shared mock for prisma.user
  const mockPrismaUser = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: mockPrismaUser,
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a user', async () => {
    // Note: Including `id` because CreateUserDto requires it.
    const dto = { id: 1, name: 'John Doe', email: 'john@example.com' };
    (prisma.user.create as jest.Mock).mockResolvedValue(dto);

    const result = await service.create(dto);
    expect(result).toEqual(dto);
    expect(prisma.user.create).toHaveBeenCalledWith({ data: dto });
  });

  it('should return all users', async () => {
    const users = [{ id: 1, name: 'John Doe', email: 'john@example.com' }];
    (prisma.user.findMany as jest.Mock).mockResolvedValue(users);

    expect(await service.findAll()).toEqual(users);
  });

  it('should return a user by id', async () => {
    const user = { id: 1, name: 'John Doe', email: 'john@example.com' };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);

    expect(await service.findOne(1)).toEqual(user);
  });

  it('should throw NotFoundException if user not found', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
  });

  it('should update a user', async () => {
    const updateDto = { name: 'Updated Name' };
    // Provide a full user object including id and email.
    const user = { id: 1, name: 'Updated Name', email: 'john@example.com' };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
    (prisma.user.update as jest.Mock).mockResolvedValue(user);

    expect(await service.update(1, updateDto)).toEqual(user);
  });

  it('should delete a user', async () => {
    const user = { id: 1, name: 'John Doe', email: 'john@example.com' };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
    (prisma.user.delete as jest.Mock).mockResolvedValue(user);

    expect(await service.remove(1)).toEqual(user);
  });
});
