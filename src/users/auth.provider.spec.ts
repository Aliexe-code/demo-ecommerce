import { Test, TestingModule } from '@nestjs/testing';
import { AuthProvider } from './auth.provider';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as argon2 from 'argon2';

// Mock argon2 with spyOn instead of vi.mock
vi.spyOn(argon2, 'hash').mockImplementation(() => Promise.resolve('hashed_password'));
vi.spyOn(argon2, 'verify').mockImplementation(() => Promise.resolve(true));

const mockPrismaService = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
};

// Rest of your existing test code...
