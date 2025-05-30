import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { AuthRolesGuard } from '../users/guards/auth-roles.guard';
import { CreateProductDto } from './dtos/createProduct.dto';
import { UpdateProductDto } from './dtos/updateProduct.dto';
import { UserType } from '@prisma/client';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { JWTPayloadType } from '../users/entities/types';

describe('ProductController', () => {
  let controller: ProductController;
  let productService: ProductService;

  // Mock data
  const mockJWTPayload: JWTPayloadType = {
    id: 'user-123',
    email: 'admin@example.com',
  };

  const mockCreateProductDto: CreateProductDto = {
    title: 'Test Product',
    description: 'This is a test product description',
    price: 99.99,
  };

  const mockUpdateProductDto: UpdateProductDto = {
    title: 'Updated Product',
    price: 149.99,
  };

  const mockProductResponse = {
    message: 'Product created successfully',
    product: {
      id: 'product-123',
      title: 'test product',
      description: 'This is a test product description',
      price: 99.99,
      userId: 'user-123',
    },
  };

  const mockProductsResponse = {
    message: 'Products found successfully',
    products: [
      {
        id: 'product-1',
        title: 'laptop',
        description: 'Gaming laptop',
        price: 1500.0,
        userId: 'user-1',
        user: { name: 'John Doe', email: 'john@example.com' },
        reviews: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  const mockProduct = {
    id: 'product-123',
    title: 'test product',
    description: 'Test description',
    price: 99.99,
    userId: 'user-123',
    user: { name: 'Test User', email: 'test@example.com' },
    reviews: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: {
            createProduct: vi.fn(),
            getAllProducts: vi.fn(),
            getProductById: vi.fn(),
            updateProduct: vi.fn(),
            deleteProduct: vi.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthRolesGuard)
      .useValue({
        canActivate: vi.fn(() => true), // Mock guard to always allow access
      })
      .compile();

    controller = module.get<ProductController>(ProductController);
    productService = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createNewProduct', () => {
    it('should create a new product successfully', async () => {
      // Arrange
      vi.spyOn(productService, 'createProduct').mockResolvedValue(
        mockProductResponse,
      );

      // Act
      const result = await controller.createNewProduct(
        mockCreateProductDto,
        mockJWTPayload,
      );

      // Assert
      expect(productService.createProduct).toHaveBeenCalledWith(
        mockCreateProductDto,
        'user-123',
      );
      expect(result).toEqual(mockProductResponse);
    });

    it('should pass the correct user ID from JWT payload', async () => {
      // Arrange
      const differentPayload: JWTPayloadType = {
        id: 'different-user-id',
        email: 'different@example.com',
      };
      vi.spyOn(productService, 'createProduct').mockResolvedValue(
        mockProductResponse,
      );

      // Act
      await controller.createNewProduct(mockCreateProductDto, differentPayload);

      // Assert
      expect(productService.createProduct).toHaveBeenCalledWith(
        mockCreateProductDto,
        'different-user-id',
      );
    });
  });

  describe('getAllProducts', () => {
    it('should return all products without filters', async () => {
      // Arrange
      vi.spyOn(productService, 'getAllProducts').mockResolvedValue(
        mockProductsResponse,
      );

      // Act
      const result = await controller.getAllProducts();

      // Assert
      expect(productService.getAllProducts).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
      );
      expect(result).toEqual(mockProductsResponse);
    });

    it('should filter products by title', async () => {
      // Arrange
      vi.spyOn(productService, 'getAllProducts').mockResolvedValue(
        mockProductsResponse,
      );

      // Act
      const result = await controller.getAllProducts('laptop');

      // Assert
      expect(productService.getAllProducts).toHaveBeenCalledWith(
        'laptop',
        undefined,
        undefined,
      );
      expect(result).toEqual(mockProductsResponse);
    });

    it('should filter products by price range', async () => {
      // Arrange
      vi.spyOn(productService, 'getAllProducts').mockResolvedValue(
        mockProductsResponse,
      );

      // Act
      const result = await controller.getAllProducts(undefined, '100', '500');

      // Assert
      expect(productService.getAllProducts).toHaveBeenCalledWith(
        undefined,
        100,
        500,
      );
      expect(result).toEqual(mockProductsResponse);
    });

    it('should handle invalid price strings gracefully', async () => {
      // Arrange
      vi.spyOn(productService, 'getAllProducts').mockResolvedValue(
        mockProductsResponse,
      );

      // Act
      await controller.getAllProducts(undefined, 'invalid', 'also-invalid');

      // Assert
      expect(productService.getAllProducts).toHaveBeenCalledWith(
        undefined,
        NaN,
        NaN,
      );
    });

    it('should filter products by title and price range', async () => {
      // Arrange
      vi.spyOn(productService, 'getAllProducts').mockResolvedValue(
        mockProductsResponse,
      );

      // Act
      const result = await controller.getAllProducts('laptop', '1000', '2000');

      // Assert
      expect(productService.getAllProducts).toHaveBeenCalledWith(
        'laptop',
        1000,
        2000,
      );
      expect(result).toEqual(mockProductsResponse);
    });
  });

  describe('getProductById', () => {
    it('should return a product by id', async () => {
      // Arrange
      vi.spyOn(productService, 'getProductById').mockResolvedValue(mockProduct);

      // Act
      const result = await controller.getProductById({ id: 'product-123' });

      // Assert
      expect(productService.getProductById).toHaveBeenCalledWith('product-123');
      expect(result).toEqual(mockProduct);
    });

    it('should handle different product IDs', async () => {
      // Arrange
      const differentProduct = { ...mockProduct, id: 'different-id' };
      vi.spyOn(productService, 'getProductById').mockResolvedValue(
        differentProduct,
      );

      // Act
      const result = await controller.getProductById({ id: 'different-id' });

      // Assert
      expect(productService.getProductById).toHaveBeenCalledWith(
        'different-id',
      );
      expect(result).toEqual(differentProduct);
    });

    it('should return null when product is not found', async () => {
      // Arrange
      vi.spyOn(productService, 'getProductById').mockResolvedValue(null);

      // Act
      const result = await controller.getProductById({ id: 'non-existent-id' });

      // Assert
      expect(productService.getProductById).toHaveBeenCalledWith(
        'non-existent-id',
      );
      expect(result).toBeNull();
    });
  });

  describe('updateProduct', () => {
    const mockUpdateResponse = {
      message: 'Product updated successfully',
      product: {
        id: 'product-123',
        title: 'updated product',
        description: 'Updated description',
        price: 149.99,
        userId: 'user-123',
      },
    };

    it('should update a product successfully', async () => {
      // Arrange
      vi.spyOn(productService, 'updateProduct').mockResolvedValue(
        mockUpdateResponse,
      );

      // Act
      const result = await controller.updateProduct(
        'product-123',
        mockUpdateProductDto,
      );

      // Assert
      expect(productService.updateProduct).toHaveBeenCalledWith(
        'product-123',
        mockUpdateProductDto,
      );
      expect(result).toEqual(mockUpdateResponse);
    });

    it('should handle partial updates', async () => {
      // Arrange
      const partialUpdateDto = { title: 'Only title updated' };
      vi.spyOn(productService, 'updateProduct').mockResolvedValue(
        mockUpdateResponse,
      );

      // Act
      const result = await controller.updateProduct(
        'product-123',
        partialUpdateDto,
      );

      // Assert
      expect(productService.updateProduct).toHaveBeenCalledWith(
        'product-123',
        partialUpdateDto,
      );
      expect(result).toEqual(mockUpdateResponse);
    });

    it('should handle different product IDs', async () => {
      // Arrange
      vi.spyOn(productService, 'updateProduct').mockResolvedValue(
        mockUpdateResponse,
      );

      // Act
      await controller.updateProduct(
        'different-product-id',
        mockUpdateProductDto,
      );

      // Assert
      expect(productService.updateProduct).toHaveBeenCalledWith(
        'different-product-id',
        mockUpdateProductDto,
      );
    });
  });

  describe('deleteProduct', () => {
    const mockDeleteResponse = {
      message: 'Product deleted successfully',
    };

    it('should delete a product successfully', async () => {
      // Arrange
      vi.spyOn(productService, 'deleteProduct').mockResolvedValue(
        mockDeleteResponse,
      );

      // Act
      const result = await controller.deleteProduct('product-123');

      // Assert
      expect(productService.deleteProduct).toHaveBeenCalledWith('product-123');
      expect(result).toEqual(mockDeleteResponse);
    });

    it('should handle different product IDs', async () => {
      // Arrange
      vi.spyOn(productService, 'deleteProduct').mockResolvedValue(
        mockDeleteResponse,
      );

      // Act
      const result = await controller.deleteProduct('different-product-id');

      // Assert
      expect(productService.deleteProduct).toHaveBeenCalledWith(
        'different-product-id',
      );
      expect(result).toEqual(mockDeleteResponse);
    });
  });
});
