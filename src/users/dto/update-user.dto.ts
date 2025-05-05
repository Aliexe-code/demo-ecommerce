import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  name?: string;
}
