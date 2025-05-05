import { CurrentUser } from './../users/decorators/current-user.decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { AuthRolesGuard } from '@/users/guards/auth-roles.guard';
import { UserType } from '@prisma/client';
import { CreateReviewDto } from './dtos/create-review.dto';
import type { JWTPayloadType } from '@/users/entities';
import { Roles } from '@/users/decorators/role-user.decorators';
import { UpdateReviewDto } from './dtos/update-review.dto';
import { PaginationDto } from './dtos/pagination-review.dto';
@Controller('api/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post(':productId')
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN, UserType.NORMAL_USER)
  public createNewReview(
    @Param('productId') productId: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() payload: JWTPayloadType,
  ) {
    return this.reviewsService.createReview(productId, payload.id, dto);
  }

  @Get()
  public getAllReviews(@Query() paginationDto: PaginationDto) {
    return this.reviewsService.getAllReviews(paginationDto);
  }

  @Get(':id')
  public getReviewById(@Param('id') id: string) {
    return this.reviewsService.getReviewById(id);
  }

  @Put(':id')
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN, UserType.NORMAL_USER)
  public updateReview(
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
    @CurrentUser() payload: JWTPayloadType,
  ) {
    return this.reviewsService.updateReview(id, payload.id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN, UserType.NORMAL_USER)
  public deleteReview(
    @Param('id') id: string,
    @CurrentUser() payload: JWTPayloadType,
  ) {
    return this.reviewsService.deleteReview(id, payload);
  }
}
