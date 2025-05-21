import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { createWriteStream, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import type { MultipartFile } from '@fastify/multipart';
import type { FastifyReply } from 'fastify';
import { PrismaService } from '../prisma/prisma.service';
import { JWTPayloadType } from './entities/types';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserType } from '@prisma/client';
import { AuthProvider } from './auth.provider';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class UsersService {
  private readonly uploadDir = join(process.cwd(), 'images');

  constructor(
    private prisma: PrismaService,
    private authProvider: AuthProvider,
  ) {}

  public async register(registerDto: RegisterDto) {
    return this.authProvider.register(registerDto);
  }

  public async login(loginDto: LoginDto) {
    return this.authProvider.login(loginDto);
  }

  public async getCurrentUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) throw new NotFoundException('User not found');
    return {
      message: 'User found successfully',
      userData: {
        id: user.id,
        email: user.email,
        name: user.name,
        age: user.age,
        userType: user.userType,
        profilePic: user.profilePic ? `/images/${user.profilePic}` : null,
      },
    };
  }

  public async getAllUsers() {
    const users = await this.prisma.user.findMany();
    if (!users) throw new NotFoundException('Users not found');
    return {
      message: 'Users found successfully',
      usersData: users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        age: user.age,
        role: user.userType,
      })),
    };
  }

  public async update(id: string, updateUserDto: UpdateUserDto) {
    const { password, name } = updateUserDto;
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new BadRequestException('User not found');
    const data: { name?: string; password?: string } = {};
    if (name) data.name = name;
    if (password)
      data.password = await this.authProvider.hashPassword(password);
    await this.prisma.user.update({
      where: { id },
      data,
    });
    return {
      message: 'User updated successfully',
    };
  }

  public async delete(id: string, payload: JWTPayloadType) {
    const user = await this.getCurrentUser(id);
    if (!user) throw new BadRequestException('User not found');
    const currentUser = await this.prisma.user.findUnique({
      where: { id: payload.id },
    });
    if (
      currentUser?.userType === UserType.ADMIN ||
      user.userData.id === payload?.id
    ) {
      await this.prisma.user.delete({ where: { id } });
      return { message: 'user has been removed' };
    }
    throw new UnauthorizedException('You are not allowed');
  }

  public async updateProfilePicture(userId: string, file: MultipartFile) {
    // Ensure user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    // Delete old profile picture if exists
    if (user.profilePic) {
      await this.deleteProfilePictureFile(user.profilePic);
    }

    // Ensure images directory exists
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }

    // Create unique filename
    const prefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${prefix}-${file.filename}`;
    const path = join(this.uploadDir, filename);

    // Save file to disk
    await new Promise<void>((resolve, reject) => {
      const writeStream = createWriteStream(path);
      file.file
        .pipe(writeStream)
        .on('error', reject)
        .on('finish', () => resolve());
    });

    // Update user profile picture in database
    await this.prisma.user.update({
      where: { id: userId },
      data: { profilePic: filename },
    });

    return {
      message: 'Profile picture updated successfully',
      filename: filename,
      imageUrl: `/images/${filename}`,
    };
  }

  public async deleteProfilePicture(userId: string) {
    // Ensure user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    // Check if user has a profile picture
    if (!user.profilePic) {
      throw new BadRequestException('User does not have a profile picture');
    }

    // Delete the file
    await this.deleteProfilePictureFile(user.profilePic);

    // Update user in database
    await this.prisma.user.update({
      where: { id: userId },
      data: { profilePic: null },
    });

    return {
      message: 'Profile picture deleted successfully',
    };
  }

  public async getProfilePicture(userId: string, reply: FastifyReply) {
    // Ensure user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    // Check if user has a profile picture
    if (!user.profilePic) {
      throw new BadRequestException('User does not have a profile picture');
    }

    const filePath = join(this.uploadDir, user.profilePic);

    // Check if file exists
    if (!existsSync(filePath)) {
      throw new BadRequestException('Profile picture file not found');
    }

    // Return the file
    return reply.sendFile(user.profilePic, this.uploadDir);
  }

  public async deleteProfilePictureFile(filename: string) {
    try {
      const filePath = join(this.uploadDir, filename);
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch (error) {
      // Just log the error but don't throw, as we still want to update the database
      console.error('Error deleting profile picture file:', error);
    }
  }

  public async forgotPassword(email: string) {
    return this.authProvider.sendResetPasswordMail(email);
  }

  public async resetPassword(email: string, code: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (!user.resetPasswordToken) {
      throw new BadRequestException('Invalid or expired verification code.');
    }

    if (user.resetPasswordToken !== code) {
      throw new BadRequestException('Invalid verification code.');
    }

    const hashedPassword = await this.authProvider.hashPassword(password);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null, // Clear the code after password reset
      },
    });

    return { message: 'Password has been reset successfully.' };
  }

  public async verifyEmail(userId: string, verificationToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified.');
    }

    if (user.verificationToken !== verificationToken) {
      throw new BadRequestException('Invalid verification token.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        verificationToken: null, // Clear the token after verification
      },
    });

    return { message: 'Email verified successfully.' };
  }
}
