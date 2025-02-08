import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  id: number;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  name?: string;
}
