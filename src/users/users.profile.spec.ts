import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthProvider } from './auth.provider';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { FastifyReply } from 'fastify';
import type { MultipartFile } from '@fastify/multipart';
import * as fs from 'fs';
import { join } from 'path';
import type { BusboyFileStream } from '@fastify/busboy';

const mockPrismaService = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

// Mock fs functions
vi.spyOn(fs, 'existsSync').mockImplementation(() => false);
vi.spyOn(fs, 'createWriteStream').mockImplementation(() => ({ on: vi.fn() } as any));
vi.spyOn(fs, 'unlink').mockImplementation((_path, callback) => {
  if (callback) callback(null);
  return Promise.resolve();
});
vi.spyOn(fs, 'unlinkSync').mockImplementation(() => undefined);
vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);

// Rest of your existing test code...
