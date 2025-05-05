import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
@Module({
  controllers: [ProductController],
  providers: [ProductService],
  imports: [UsersModule, PrismaModule, JwtModule],
  exports: [ProductService],
})
export class ProductModule {}
