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

@Injectable()
export class AuthProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  public async register(registerUserDto: RegisterDto): Promise<Response> {
    const { email, password, name, age } = registerUserDto;
    const userInDb = await this.prisma.user.findUnique({ where: { email } });
    if (userInDb) {
      throw new BadRequestException('Invalid email , user already exists');
    }
    const hashedPassword = await this.hashPassword(password);
    const newUser = this.prisma.user.create({
      data: { email, name, password: hashedPassword, age },
    });

    const accessToken: string = await this.generateJWT({
      id: (await newUser).id,
      email: (await newUser).email,
    });
    return {
      message: 'User registered successfully',
      accessToken,
      user: {
        id: (await newUser).id,
        email: (await newUser).email,
        name: (await newUser).name,
      },
    };
  }

  public async login(loginDto: LoginDto): Promise<Response> {
    const { email, password } = loginDto;
    if (!email || !password)
      throw new BadRequestException('Email and password are required');
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('Invalid email or password');
    const match = await argon2.verify(user.password, password);
    if (!match) throw new UnauthorizedException('Invalid email or password');

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
        age: user.age,
      },
    };
  }
  public async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password);
  }
  private generateJWT(payload: JWTPayloadType): Promise<string> {
    return this.jwtService.signAsync(payload);
  }
}
