import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { UsersModule } from '@/users/users.module';
import { ProductModule } from '@/products/product.module';
import { JwtModule } from '@nestjs/jwt';
@Module({
  imports: [UsersModule, ProductModule, JwtModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
