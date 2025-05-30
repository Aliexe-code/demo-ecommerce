import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AuthRolesGuard } from '../users/guards/auth-roles.guard';
import { CreateProductDto } from './dtos/createProduct.dto';
import { UpdateProductDto } from './dtos/updateProduct.dto';
import { UserType } from '@prisma/client';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import type { JWTPayloadType } from '../users/entities/types';

describe('Product Integration Tests', () => {
  let productService: ProductService;
  let productController: ProductController;
  let prismaService: PrismaService;
  let usersService: UsersService;

  // Mock data
  const mockUser = {
    message: 'User found successfully',
    userData: {
      id: 'user-123',
      email: 'admin@example.com',
      name: 'Admin User',
      age: 30,
      userType: UserType.ADMIN,
      profilePic: null,
    },
  };

  const mockJWTPayload: JWTPayloadType = {
    id: 'user-123',
    email: 'admin@example.com',
  };

  const mockCreateProductDto: CreateProductDto = {
    title: 'Integration Test Product',
    description: 'This is an integration test product',
    price: 199.99,
  };

  const mockCreatedProduct = {
    id: 'product-integration-123',
    title: 'integration test product', // lowercase
    description: 'This is an integration test product',
    price: 199.99,
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProductWithRelations = {
    id: 'product-integration-123',
    title: 'integration test product',
    description: 'This is an integration test product',
    price: 199.99,
    userId: 'user-123',
    user: {
      name: 'Admin User',
      email: 'admin@example.com',
    },
    reviews: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        ProductService,
        {
          provide: PrismaService,
          useValue: {
            products: {
              create: vi.fn(),
              findMany: vi.fn(),
              findUnique: vi.fn(),
              update: vi.fn(),
              delete: vi.fn(),
            },
          },
        },
        {
          provide: UsersService,
          useValue: {
            getCurrentUser: vi.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthRolesGuard)
      .useValue({
        canActivate: vi.fn(() => true),
      })
      .compile();

    productService = module.get<ProductService>(ProductService);
    productController = module.get<ProductController>(ProductController);
    prismaService = module.get<PrismaService>(PrismaService);
    usersService = module.get<UsersService>(UsersService);
  });

  describe('Product Creation Flow', () => {
    it('should create a product through the complete flow', async () => {
      // Arrange
      vi.spyOn(usersService, 'getCurrentUser').mockResolvedValue(mockUser);
      vi.spyOn(prismaService.products, 'create').mockResolvedValue(
        mockCreatedProduct,
      );

      // Act - Test the complete flow: Controller -> Service -> Database
      const result = await productController.createNewProduct(
        mockCreateProductDto,
        mockJWTPayload,
      );

      // Assert
      expect(usersService.getCurrentUser).toHaveBeenCalledWith('user-123');
      expect(prismaService.products.create).toHaveBeenCalledWith({
        data: {
          title: 'integration test product', // Should be lowercase
          description: 'This is an integration test product',
          price: 199.99,
          userId: 'user-123',
        },
      });

      expect(result).toEqual({
        message: 'Product created successfully',
        product: {
          id: 'product-integration-123',
          title: 'integration test product',
          description: 'This is an integration test product',
          price: 199.99,
          userId: 'user-123',
        },
      });
    });

    it('should handle user not found during product creation', async () => {
      // Arrange
      vi.spyOn(usersService, 'getCurrentUser').mockRejectedValue(
        new NotFoundException('User not found'),
      );

      // Act & Assert
      await expect(
        productController.createNewProduct(
          mockCreateProductDto,
          mockJWTPayload,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(usersService.getCurrentUser).toHaveBeenCalledWith('user-123');
      expect(prismaService.products.create).not.toHaveBeenCalled();
    });
  });

  describe('Product Retrieval Flow', () => {
    it('should get all products with filters through complete flow', async () => {
      // Arrange
      const mockProducts = [mockProductWithRelations];
      vi.spyOn(prismaService.products, 'findMany').mockResolvedValue(
        mockProducts,
      );

      // Act
      const result = await productController.getAllProducts(
        'integration',
        '100',
        '300',
      );

      // Assert
      expect(prismaService.products.findMany).toHaveBeenCalledWith({
        where: {
          title: {
            contains: 'integration',
            mode: 'insensitive',
          },
          price: {
            gte: 100,
            lte: 300,
          },
        },
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

      expect(result).toEqual({
        message: 'Products found successfully',
        products: mockProducts,
      });
    });

    it('should get product by ID through complete flow', async () => {
      // Arrange
      vi.spyOn(prismaService.products, 'findUnique').mockResolvedValue(
        mockProductWithRelations,
      );

      // Act
      const result = await productController.getProductById({
        id: 'product-integration-123',
      });

      // Assert
      expect(prismaService.products.findUnique).toHaveBeenCalledWith({
        where: { id: 'product-integration-123' },
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

      expect(result).toEqual(mockProductWithRelations);
    });
  });

  describe('Product Update Flow', () => {
    it('should update a product through complete flow', async () => {
      // Arrange
      const updateDto: UpdateProductDto = {
        title: 'Updated Integration Product',
        price: 299.99,
      };

      const updatedProduct = {
        ...mockCreatedProduct,
        title: 'updated integration product',
        price: 299.99,
      };

      // Mock the service's getProductById method (used internally by updateProduct)
      vi.spyOn(productService, 'getProductById').mockResolvedValue(
        mockProductWithRelations,
      );
      vi.spyOn(prismaService.products, 'update').mockResolvedValue(
        updatedProduct,
      );

      // Act
      const result = await productController.updateProduct(
        'product-integration-123',
        updateDto,
      );

      // Assert
      expect(productService.getProductById).toHaveBeenCalledWith(
        'product-integration-123',
      );
      expect(prismaService.products.update).toHaveBeenCalledWith({
        where: { id: 'product-integration-123' },
        data: {
          title: 'Updated Integration Product',
          description: 'This is an integration test product', // Should keep existing
          price: 299.99,
        },
      });

      expect(result).toEqual({
        message: 'Product updated successfully',
        product: {
          id: 'product-integration-123',
          title: 'updated integration product',
          description: 'This is an integration test product',
          price: 299.99,
          userId: 'user-123',
        },
      });
    });

    it('should handle product not found during update', async () => {
      // Arrange
      const updateDto: UpdateProductDto = { title: 'Non-existent Product' };
      vi.spyOn(productService, 'getProductById').mockResolvedValue(null);

      // Act & Assert
      await expect(
        productController.updateProduct('non-existent-id', updateDto),
      ).rejects.toThrow('Product not found');

      expect(productService.getProductById).toHaveBeenCalledWith(
        'non-existent-id',
      );
      expect(prismaService.products.update).not.toHaveBeenCalled();
    });
  });

  describe('Product Deletion Flow', () => {
    it('should delete a product through complete flow', async () => {
      // Arrange
      vi.spyOn(productService, 'getProductById').mockResolvedValue(
        mockProductWithRelations,
      );
      vi.spyOn(prismaService.products, 'delete').mockResolvedValue(
        mockCreatedProduct,
      );

      // Act
      const result = await productController.deleteProduct(
        'product-integration-123',
      );

      // Assert
      expect(productService.getProductById).toHaveBeenCalledWith(
        'product-integration-123',
      );
      expect(prismaService.products.delete).toHaveBeenCalledWith({
        where: { id: 'product-integration-123' },
      });

      expect(result).toEqual({
        message: 'Product deleted successfully',
      });
    });

    it('should handle product not found during deletion', async () => {
      // Arrange
      vi.spyOn(productService, 'getProductById').mockResolvedValue(null);

      // Act & Assert
      await expect(
        productController.deleteProduct('non-existent-id'),
      ).rejects.toThrow('Product not found');

      expect(productService.getProductById).toHaveBeenCalledWith(
        'non-existent-id',
      );
      expect(prismaService.products.delete).not.toHaveBeenCalled();
    });
  });

  describe('Service-Controller Integration', () => {
    it('should properly integrate service and controller layers', async () => {
      // Arrange
      vi.spyOn(usersService, 'getCurrentUser').mockResolvedValue(mockUser);
      vi.spyOn(prismaService.products, 'create').mockResolvedValue(
        mockCreatedProduct,
      );

      // Act - Test that controller properly delegates to service
      const controllerResult = await productController.createNewProduct(
        mockCreateProductDto,
        mockJWTPayload,
      );

      // Also test service directly
      const serviceResult = await productService.createProduct(
        mockCreateProductDto,
        'user-123',
      );

      // Assert - Both should produce the same result
      expect(controllerResult).toEqual(serviceResult);
    });
  });
});
