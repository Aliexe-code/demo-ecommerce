import { IsNumber, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateReviewDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @MinLength(3)
  comment: string;
}
