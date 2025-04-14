import {
  IsEmail,
  IsString,
  MinLength,
  IsInt,
  Min,
  Max,
  IsOptional,
  Matches,
} from 'class-validator';

export class CreateUserDto {
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

  @IsOptional()
  @IsInt({ message: 'Age must be a whole number' })
  @Min(0, { message: 'Age cannot be negative' })
  @Max(120, { message: 'Age cannot be more than 120' })
  age?: number;
}
