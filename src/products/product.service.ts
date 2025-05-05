import { UsersService } from '@/users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dtos/createProduct.dto';
import { ProductResponse } from './entities/types';
import { UpdateProductDto } from './dtos/updateProduct.dto';
import { Prisma } from '@prisma/client'; // Add this import

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UsersService,
  ) {}

  public async createProduct(
    dto: CreateProductDto,
    userId: string,
  ): Promise<ProductResponse> {
    const user = await this.userService.getCurrentUser(userId);

    const newProduct = await this.prisma.products.create({
      data: {
        title: dto.title.toLowerCase(),
        description: dto.description,
        price: dto.price,
        userId: user.userData.id,
      },
    });

    return {
      message: 'Product created successfully',
      product: {
        id: newProduct.id,
        title: newProduct.title,
        description: newProduct.description ?? '',
        price: newProduct.price,
        userId: newProduct.userId,
      },
    };
  }

  public async getAllProducts(
    title?: string,
    minPrice?: number,
    maxPrice?: number,
  ) {
    const where: Prisma.ProductsWhereInput = {
      ...(title && {
        title: {
          contains: title.toLowerCase(),
          mode: Prisma.QueryMode.insensitive,
        },
      }),
      price: {
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
      },
    };

    // Remove empty price object if no price filters
    if (!minPrice && !maxPrice) {
      delete where.price;
    }

    const products = await this.prisma.products.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        reviews: true,
      },
    });
    return {
      message: 'Products found successfully',
      products,
    };
  }

  public getProductById(id: string) {
    return this.prisma.products.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        reviews: true,
      },
    });
  }

  public async updateProduct(id: string, dto: UpdateProductDto) {
    const product = await this.getProductById(id);
    if (!product) throw new Error('Product not found');
    const updatedProduct = await this.prisma.products.update({
      where: { id },
      data: {
        title: dto.title ?? product.title,
        description: dto.description ?? product.description,
        price: dto.price ?? product.price,
      },
    });
    return {
      message: 'Product updated successfully',
      product: {
        id: updatedProduct.id,
        title: updatedProduct.title,
        description: updatedProduct.description ?? '',
        price: updatedProduct.price,
        userId: updatedProduct.userId,
      },
    };
  }

  public async deleteProduct(id: string) {
    const product = await this.getProductById(id);
    if (!product) throw new Error('Product not found');
    await this.prisma.products.delete({ where: { id } });
    return { message: 'Product deleted successfully' };
  }
}
