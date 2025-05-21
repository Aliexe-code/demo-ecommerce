import {
  IsNotEmpty,
  IsString,
  MinLength,
  Length,
  IsNumberString,
  IsEmail,
} from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsNumberString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'Verification code must be exactly 6 digits' })
  code: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
