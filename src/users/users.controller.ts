import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthGuard } from './guards/auth.guard';
import type { JWTPayloadType } from './entities/types';
import { CurrentUser } from './decorators/current-user.decorators';
import { Roles } from './decorators/role-user.decorators';
import { UserType } from '@prisma/client';
import { AuthRolesGuard } from './guards/auth-roles.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import type { FastifyRequest, FastifyReply } from 'fastify';
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('auth/register')
  public register(@Body() registerUserDto: RegisterDto) {
    return this.usersService.register(registerUserDto);
  }

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  public login(@Body() loginDto: LoginDto) {
    return this.usersService.login(loginDto);
  }

  @Get('current-user')
  @UseGuards(AuthGuard)
  public getCurrentUser(@CurrentUser() payload: JWTPayloadType) {
    return this.usersService.getCurrentUser(payload.id);
  }
  @Get()
  @Roles(UserType.ADMIN)
  @UseGuards(AuthRolesGuard)
  public getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Put()
  @Roles(UserType.ADMIN, UserType.NORMAL_USER)
  @UseGuards(AuthRolesGuard)
  public updateUser(
    @CurrentUser() payload: JWTPayloadType,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<{ message: string }> {
    return this.usersService.update(payload.id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserType.ADMIN, UserType.NORMAL_USER)
  @UseGuards(AuthRolesGuard)
  public deleteUser(
    @Param('id') id: string,
    @CurrentUser() payload: JWTPayloadType,
  ) {
    return this.usersService.delete(id, payload);
  }

  @Post('upload-image')
  @UseGuards(AuthGuard)
  public async uploadProfileImage(
    @Req() request: FastifyRequest,
    @CurrentUser() payload: JWTPayloadType,
  ) {
    if (!request.isMultipart()) {
      throw new BadRequestException('Request is not multipart');
    }

    const data = await request.file();
    if (!data) {
      throw new BadRequestException('No file provided');
    }

    return this.usersService.updateProfilePicture(payload.id, data);
  }

  @Delete('delete-image')
  @UseGuards(AuthGuard)
  public async deleteProfileImage(@CurrentUser() payload: JWTPayloadType) {
    return this.usersService.deleteProfilePicture(payload.id);
  }

  @Get('profile-image')
  @UseGuards(AuthGuard)
  public async getProfileImage(
    @CurrentUser() payload: JWTPayloadType,
    @Res() reply: FastifyReply,
  ) {
    return this.usersService.getProfilePicture(payload.id, reply);
  }
  @Get('verify-email/:id/:token')
  public async verifyEmail(
    @Param('id') id: string,
    @Param('token') token: string,
  ) {
    return this.usersService.verifyEmail(id, token);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  public async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.usersService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  public async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.usersService.resetPassword(
      resetPasswordDto.email,
      resetPasswordDto.code,
      resetPasswordDto.password,
    );
  }
}
