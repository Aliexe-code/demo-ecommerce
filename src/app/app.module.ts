import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { HealthController } from './health.controller';
import { ProductModule } from '@/products/product.module';
import { ReviewsModule } from '@/reviews/reviews.module';
import { UploadsModule } from '@/uploads/uploads.module';

@Module({
  imports: [
    UsersModule,
    PrismaModule,
    ProductModule,
    ReviewsModule,
    UploadsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
  ],
})
export class AppModule {}
