import { PrismaService } from '../prisma/prisma.service';
import { ProductService } from '../products/product.service';
import { UsersService } from '../users/users.service';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateReviewDto } from './dtos/create-review.dto';
import { Review, UserType } from '@prisma/client';
import { UpdateReviewDto } from './dtos/update-review.dto';
import { JWTPayloadType } from '@/users/entities';
import { PaginationDto } from './dtos/pagination-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productservice: ProductService,
    private readonly userService: UsersService,
  ) {}

  public async createReview(
    productId: string,
    userId: string,
    dto: CreateReviewDto,
  ): Promise<{ message: string; review: Review }> {
    const product = await this.productservice.getProductById(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const user = await this.userService.getCurrentUser(userId);
    if (!user?.userData?.id) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const review = await this.prisma.review.create({
      data: {
        rating: dto.rating,
        comment: dto.comment,
        productId: product.id,
        userId: user.userData.id,
      },
    });

    return {
      message: 'Review created successfully',
      review,
    };
  }

  public async getAllReviews(paginationDto: PaginationDto) {
    const { page = 1, limit = 5 } = paginationDto;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          product: {
            select: {
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.review.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      message: 'Reviews found successfully',
      reviews,
      metadata: {
        total,
        page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
  public async getReviewById(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            title: true,
          },
        },
      },
    });
    return {
      message: 'Review found successfully',
      review,
    };
  }

  public async updateReview(id: string, userId: string, dto: UpdateReviewDto) {
    const review = await this.getReviewByid(id);
    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
    if (review.userId !== userId) {
      throw new UnauthorizedException(
        'You are not authorized to update this review',
      );
    }
    const updatedReview = await this.prisma.review.update({
      where: { id },
      data: dto,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            title: true,
          },
        },
      },
    });
    return {
      message: 'Review updated successfully',
      review: updatedReview,
    };
  }

  public async deleteReview(id: string, payload: JWTPayloadType) {
    const review = await this.prisma.review.findUnique({ where: { id } });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (
      currentUser?.userType === UserType.ADMIN ||
      review.userId === payload.id
    ) {
      await this.prisma.review.delete({ where: { id } });
      return { message: 'Review deleted successfully' };
    }

    throw new UnauthorizedException(
      'You are not authorized to delete this review',
    );
  }

  private async getReviewByid(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    return review;
  }
}
