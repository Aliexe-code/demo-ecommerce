import {
  IsEmail,
  IsEnum,
  IsString,
  MinLength,
  IsInt,
  Min,
  Max,
  IsOptional,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { UserType } from '@prisma/client';
export class RegisterDto {
  @IsString({ message: 'Name must be a text value' })
  @MinLength(2, {
    message: 'Name must be at least 2 characters long and contain letters',
  })
  @Matches(/.*[a-zA-Z].*/, {
    message: 'Name must contain at least one letter',
  })
  name: string;

  @IsEmail(
    {},
    {
      message: 'Please provide a valid email address (e.g., user@example.com)',
    },
  )
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsInt({ message: 'Age must be a whole number' })
  @Min(0, { message: 'Age cannot be negative' })
  @Max(120, { message: 'Age cannot be more than 120' })
  age?: number;

  @IsOptional()
  @IsEnum(UserType, {
    message: 'userType must be one of: admin, user',
  })
  userType?: UserType;
}
