import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './guards/auth.guard';
import type { JWTPayloadType } from './entities/types';
import { CurrentUser } from './decorators/current-user.decorators';
import { Roles } from './decorators/role-user.decorators';
import { UserType } from '@prisma/client';
import { AuthRolesGuard } from './guards/auth-roles.guard';
import { UpdateUserDto } from './dto/update-user.dto';
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
}
