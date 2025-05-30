import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { CreateProductDto } from './dtos/createProduct.dto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { UserType } from '@prisma/client';

describe('ProductService', () => {
  let service: ProductService;
  let prismaService: PrismaService;
  let usersService: UsersService;

  // Mock data
  const mockUser = {
    message: 'User found successfully',
    userData: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      age: 25,
      userType: UserType.ADMIN,
      profilePic: null,
    },
  };

  const mockCreateProductDto: CreateProductDto = {
    title: 'Test Product',
    description: 'This is a test product description',
    price: 99.99,
  };

  const mockCreatedProduct = {
    id: 'product-123',
    title: 'test product', // Note: lowercase as per service logic
    description: 'This is a test product description',
    price: 99.99,
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
    }).compile();

    service = module.get<ProductService>(ProductService);
    prismaService = module.get<PrismaService>(PrismaService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      // Arrange
      vi.spyOn(usersService, 'getCurrentUser').mockResolvedValue(mockUser);
      vi.spyOn(prismaService.products, 'create').mockResolvedValue(
        mockCreatedProduct,
      );

      // Act
      const result = await service.createProduct(
        mockCreateProductDto,
        'user-123',
      );

      // Assert
      expect(usersService.getCurrentUser).toHaveBeenCalledWith('user-123');
      expect(prismaService.products.create).toHaveBeenCalledWith({
        data: {
          title: 'test product', // Should be lowercase
          description: 'This is a test product description',
          price: 99.99,
          userId: 'user-123',
        },
      });

      expect(result).toEqual({
        message: 'Product created successfully',
        product: {
          id: 'product-123',
          title: 'test product',
          description: 'This is a test product description',
          price: 99.99,
          userId: 'user-123',
        },
      });
    });

    it('should convert title to lowercase', async () => {
      // Arrange
      const dtoWithUppercaseTitle: CreateProductDto = {
        ...mockCreateProductDto,
        title: 'UPPERCASE TITLE',
      };

      const mockProductWithLowercaseTitle = {
        ...mockCreatedProduct,
        title: 'uppercase title',
      };

      vi.spyOn(usersService, 'getCurrentUser').mockResolvedValue(mockUser);
      vi.spyOn(prismaService.products, 'create').mockResolvedValue(
        mockProductWithLowercaseTitle,
      );

      // Act
      await service.createProduct(dtoWithUppercaseTitle, 'user-123');

      // Assert
      expect(prismaService.products.create).toHaveBeenCalledWith({
        data: {
          title: 'uppercase title', // Should be converted to lowercase
          description: 'This is a test product description',
          price: 99.99,
          userId: 'user-123',
        },
      });
    });

    it('should handle null description gracefully', async () => {
      // Arrange
      const mockProductWithNullDescription = {
        ...mockCreatedProduct,
        description: null,
      };

      vi.spyOn(usersService, 'getCurrentUser').mockResolvedValue(mockUser);
      vi.spyOn(prismaService.products, 'create').mockResolvedValue(
        mockProductWithNullDescription,
      );

      // Act
      const result = await service.createProduct(
        mockCreateProductDto,
        'user-123',
      );

      // Assert
      expect(result.product.description).toBe(''); // Should convert null to empty string
    });

    it('should throw error when user is not found', async () => {
      // Arrange
      vi.spyOn(usersService, 'getCurrentUser').mockRejectedValue(
        new NotFoundException('User not found'),
      );

      // Act & Assert
      await expect(
        service.createProduct(mockCreateProductDto, 'invalid-user-id'),
      ).rejects.toThrow(NotFoundException);

      expect(usersService.getCurrentUser).toHaveBeenCalledWith(
        'invalid-user-id',
      );
      expect(prismaService.products.create).not.toHaveBeenCalled();
    });

    it('should throw error when database operation fails', async () => {
      // Arrange
      vi.spyOn(usersService, 'getCurrentUser').mockResolvedValue(mockUser);
      vi.spyOn(prismaService.products, 'create').mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(
        service.createProduct(mockCreateProductDto, 'user-123'),
      ).rejects.toThrow('Database connection failed');

      expect(usersService.getCurrentUser).toHaveBeenCalledWith('user-123');
      expect(prismaService.products.create).toHaveBeenCalled();
    });

    it('should use the correct user ID from getCurrentUser response', async () => {
      // Arrange
      const differentUserData = {
        ...mockUser,
        userData: {
          ...mockUser.userData,
          id: 'different-user-id',
        },
      };

      vi.spyOn(usersService, 'getCurrentUser').mockResolvedValue(
        differentUserData,
      );
      vi.spyOn(prismaService.products, 'create').mockResolvedValue({
        ...mockCreatedProduct,
        userId: 'different-user-id',
      });

      // Act
      await service.createProduct(mockCreateProductDto, 'user-123');

      // Assert
      expect(prismaService.products.create).toHaveBeenCalledWith({
        data: {
          title: 'test product',
          description: 'This is a test product description',
          price: 99.99,
          userId: 'different-user-id', // Should use the ID from getCurrentUser response
        },
      });
    });
  });

  describe('getAllProducts', () => {
    const mockProducts = [
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
      {
        id: 'product-2',
        title: 'mouse',
        description: 'Wireless mouse',
        price: 50.0,
        userId: 'user-2',
        user: { name: 'Jane Smith', email: 'jane@example.com' },
        reviews: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return all products without filters', async () => {
      // Arrange
      vi.spyOn(prismaService.products, 'findMany').mockResolvedValue(
        mockProducts,
      );

      // Act
      const result = await service.getAllProducts();

      // Assert
      expect(prismaService.products.findMany).toHaveBeenCalledWith({
        where: {},
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

    it('should filter products by title', async () => {
      // Arrange
      const filteredProducts = [mockProducts[0]]; // Only laptop
      vi.spyOn(prismaService.products, 'findMany').mockResolvedValue(
        filteredProducts,
      );

      // Act
      const result = await service.getAllProducts('laptop');

      // Assert
      expect(prismaService.products.findMany).toHaveBeenCalledWith({
        where: {
          title: {
            contains: 'laptop',
            mode: 'insensitive',
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

      expect(result.products).toEqual(filteredProducts);
    });

    it('should filter products by minimum price', async () => {
      // Arrange
      const filteredProducts = [mockProducts[0]]; // Only laptop (>= 100)
      vi.spyOn(prismaService.products, 'findMany').mockResolvedValue(
        filteredProducts,
      );

      // Act
      const result = await service.getAllProducts(undefined, 100);

      // Assert
      expect(prismaService.products.findMany).toHaveBeenCalledWith({
        where: {
          price: {
            gte: 100,
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

      expect(result.products).toEqual(filteredProducts);
    });

    it('should filter products by maximum price', async () => {
      // Arrange
      const filteredProducts = [mockProducts[1]]; // Only mouse (<= 100)
      vi.spyOn(prismaService.products, 'findMany').mockResolvedValue(
        filteredProducts,
      );

      // Act
      const result = await service.getAllProducts(undefined, undefined, 100);

      // Assert
      expect(prismaService.products.findMany).toHaveBeenCalledWith({
        where: {
          price: {
            lte: 100,
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

      expect(result.products).toEqual(filteredProducts);
    });

    it('should filter products by price range', async () => {
      // Arrange
      vi.spyOn(prismaService.products, 'findMany').mockResolvedValue(
        mockProducts,
      );

      // Act
      const result = await service.getAllProducts(undefined, 50, 2000);

      // Assert
      expect(prismaService.products.findMany).toHaveBeenCalledWith({
        where: {
          price: {
            gte: 50,
            lte: 2000,
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

      expect(result.products).toEqual(mockProducts);
    });

    it('should filter products by title and price range', async () => {
      // Arrange
      vi.spyOn(prismaService.products, 'findMany').mockResolvedValue([
        mockProducts[0],
      ]);

      // Act
      const result = await service.getAllProducts('laptop', 1000, 2000);

      // Assert
      expect(prismaService.products.findMany).toHaveBeenCalledWith({
        where: {
          title: {
            contains: 'laptop',
            mode: 'insensitive',
          },
          price: {
            gte: 1000,
            lte: 2000,
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

      expect(result.products).toEqual([mockProducts[0]]);
    });
  });

  describe('getProductById', () => {
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

    it('should return a product by id', async () => {
      // Arrange
      vi.spyOn(prismaService.products, 'findUnique').mockResolvedValue(
        mockProduct,
      );

      // Act
      const result = await service.getProductById('product-123');

      // Assert
      expect(prismaService.products.findUnique).toHaveBeenCalledWith({
        where: { id: 'product-123' },
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

      expect(result).toEqual(mockProduct);
    });

    it('should return null when product is not found', async () => {
      // Arrange
      vi.spyOn(prismaService.products, 'findUnique').mockResolvedValue(null);

      // Act
      const result = await service.getProductById('non-existent-id');

      // Assert
      expect(prismaService.products.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
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

      expect(result).toBeNull();
    });
  });

  describe('updateProduct', () => {
    const mockExistingProduct = {
      id: 'product-123',
      title: 'old title',
      description: 'old description',
      price: 50.0,
      userId: 'user-123',
      user: { name: 'Test User', email: 'test@example.com' },
      reviews: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockUpdatedProduct = {
      id: 'product-123',
      title: 'new title',
      description: 'new description',
      price: 75.0,
      userId: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updateDto = {
      title: 'new title',
      description: 'new description',
      price: 75.0,
    };

    it('should update a product successfully', async () => {
      // Arrange
      vi.spyOn(service, 'getProductById').mockResolvedValue(
        mockExistingProduct,
      );
      vi.spyOn(prismaService.products, 'update').mockResolvedValue(
        mockUpdatedProduct,
      );

      // Act
      const result = await service.updateProduct('product-123', updateDto);

      // Assert
      expect(service.getProductById).toHaveBeenCalledWith('product-123');
      expect(prismaService.products.update).toHaveBeenCalledWith({
        where: { id: 'product-123' },
        data: {
          title: 'new title',
          description: 'new description',
          price: 75.0,
        },
      });

      expect(result).toEqual({
        message: 'Product updated successfully',
        product: {
          id: 'product-123',
          title: 'new title',
          description: 'new description',
          price: 75.0,
          userId: 'user-123',
        },
      });
    });

    it('should update only provided fields', async () => {
      // Arrange
      const partialUpdateDto = { title: 'updated title only' };
      const partiallyUpdatedProduct = {
        ...mockExistingProduct,
        title: 'updated title only',
      };

      vi.spyOn(service, 'getProductById').mockResolvedValue(
        mockExistingProduct,
      );
      vi.spyOn(prismaService.products, 'update').mockResolvedValue(
        partiallyUpdatedProduct,
      );

      // Act
      const result = await service.updateProduct(
        'product-123',
        partialUpdateDto,
      );

      // Assert
      expect(prismaService.products.update).toHaveBeenCalledWith({
        where: { id: 'product-123' },
        data: {
          title: 'updated title only',
          description: 'old description', // Should keep existing value
          price: 50.0, // Should keep existing value
        },
      });

      expect(result.product.title).toBe('updated title only');
    });

    it('should throw error when product is not found', async () => {
      // Arrange
      vi.spyOn(service, 'getProductById').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateProduct('non-existent-id', updateDto),
      ).rejects.toThrow('Product not found');

      expect(service.getProductById).toHaveBeenCalledWith('non-existent-id');
      expect(prismaService.products.update).not.toHaveBeenCalled();
    });

    it('should handle null description in updated product', async () => {
      // Arrange
      const updatedProductWithNullDescription = {
        ...mockUpdatedProduct,
        description: null,
      };

      vi.spyOn(service, 'getProductById').mockResolvedValue(
        mockExistingProduct,
      );
      vi.spyOn(prismaService.products, 'update').mockResolvedValue(
        updatedProductWithNullDescription,
      );

      // Act
      const result = await service.updateProduct('product-123', updateDto);

      // Assert
      expect(result.product.description).toBe(''); // Should convert null to empty string
    });
  });

  describe('deleteProduct', () => {
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

    it('should delete a product successfully', async () => {
      // Arrange
      vi.spyOn(service, 'getProductById').mockResolvedValue(mockProduct);
      vi.spyOn(prismaService.products, 'delete').mockResolvedValue(mockProduct);

      // Act
      const result = await service.deleteProduct('product-123');

      // Assert
      expect(service.getProductById).toHaveBeenCalledWith('product-123');
      expect(prismaService.products.delete).toHaveBeenCalledWith({
        where: { id: 'product-123' },
      });

      expect(result).toEqual({
        message: 'Product deleted successfully',
      });
    });

    it('should throw error when product is not found', async () => {
      // Arrange
      vi.spyOn(service, 'getProductById').mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteProduct('non-existent-id')).rejects.toThrow(
        'Product not found',
      );

      expect(service.getProductById).toHaveBeenCalledWith('non-existent-id');
      expect(prismaService.products.delete).not.toHaveBeenCalled();
    });

    it('should handle database errors during deletion', async () => {
      // Arrange
      vi.spyOn(service, 'getProductById').mockResolvedValue(mockProduct);
      vi.spyOn(prismaService.products, 'delete').mockRejectedValue(
        new Error('Database constraint violation'),
      );

      // Act & Assert
      await expect(service.deleteProduct('product-123')).rejects.toThrow(
        'Database constraint violation',
      );

      expect(service.getProductById).toHaveBeenCalledWith('product-123');
      expect(prismaService.products.delete).toHaveBeenCalledWith({
        where: { id: 'product-123' },
      });
    });
  });
});
