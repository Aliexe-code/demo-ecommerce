import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import type { JWTPayloadType, Response } from './entities/types';
import { LoginDto } from './dto/login.dto';
import { MailService } from '@/mail/mail.service';
import { randomBytes } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class AuthProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService:MailService,
    private readonly config:ConfigService
  ) {}

  public async register(registerUserDto: RegisterDto): Promise<Response> {
    const { email, password, name, age } = registerUserDto;
    const userInDb = await this.prisma.user.findUnique({ where: { email } });
    if (userInDb) {
      throw new BadRequestException('Invalid email , user already exists');
    }
    const hashedPassword = await this.hashPassword(password);
    const verificationToken = randomBytes(32).toString('hex');
    const createdUser = await this.prisma.user.create({
      data: { email, name, password: hashedPassword, age, verificationToken },
    });

    const link = this.generateLink(createdUser.id, verificationToken);
    await this.mailService.sendVerifyMail(createdUser.email, link);


  return {
      message: 'User registered successfully. Please check your email to verify your account.'}}

  public async login(loginDto: LoginDto): Promise<Response> {
    const { email, password } = loginDto;
    if (!email || !password)
      throw new BadRequestException('Email and password are required');
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('Invalid email or password');
    const match = await argon2.verify(user.password, password);
    if (!match) throw new UnauthorizedException('Invalid email or password');
    
    if(!user.emailVerified){
     let verificationToken = user.verificationToken;
     if(!verificationToken) {
      user.verificationToken = randomBytes(32).toString('hex');
      const result = await this.prisma.user.update({
        where: { id: user.id },
        data: { verificationToken },
      });
      verificationToken = result.verificationToken;
     }
     if (verificationToken) {
       const link = this.generateLink(user.id, verificationToken);
       await this.mailService.sendVerifyMail(user.email, link);
       throw new UnauthorizedException('Please verify your email. A verification link has been sent to your email address.');
       return {message:"verification token has been sent to your email"}
     }

    }

    const accessToken: string = await this.generateJWT({
      id: user.id,
      email: user.email,
    });
    return {
      message: 'Logged in successfully',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
  public async sendResetPasswordMail(email:string){
    const user = await this.prisma.user.findUnique({where:{email}});
    if (!user) {
      throw new BadRequestException('User with this email does not exist');
    }
    
    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Update user with reset password token (store the 6-digit code)
    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: resetCode }
    });
    
    // Send reset password email with code
    try {
      await this.mailService.sendResetPasswordMail(email, resetCode);
      return { message: 'Password reset code has been sent to your email' };
    } catch (error) {
      console.error('Failed to send reset password email:', error);
      throw new BadRequestException('Failed to send reset password email');
    }
  }
  public async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password);
  }
  private generateJWT(payload: JWTPayloadType): Promise<string> {
    return this.jwtService.signAsync(payload);
  }
  private generateLink(userId:string,verificationToken:string): string {
    return `${this.config.get<string>("DOMAIN")}/api/users/verify-email/${userId}/${verificationToken}`;
  }
}
