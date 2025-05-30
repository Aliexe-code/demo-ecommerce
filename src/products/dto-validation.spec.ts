import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateProductDto } from './dtos/createProduct.dto';
import { UpdateProductDto } from './dtos/updateProduct.dto';
import { describe, it, expect } from 'vitest';

describe('Product DTO Validation Tests', () => {
  describe('CreateProductDto', () => {
    describe('title validation', () => {
      it('should pass with valid title', async () => {
        // Arrange
        const dto = plainToClass(CreateProductDto, {
          title: 'Valid Product Title',
          description: 'This is a valid product description',
          price: 99.99,
        });

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(0);
      });

      it('should fail when title is empty', async () => {
        // Arrange
        const dto = plainToClass(CreateProductDto, {
          title: '',
          description: 'This is a valid product description',
          price: 99.99,
        });

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('title');
        expect(errors[0].constraints).toHaveProperty('isNotEmpty');
      });

      it('should fail when title is too short (less than 3 characters)', async () => {
        // Arrange
        const dto = plainToClass(CreateProductDto, {
          title: 'AB',
          description: 'This is a valid product description',
          price: 99.99,
        });

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('title');
        expect(errors[0].constraints).toHaveProperty('minLength');
      });

      it('should fail when title is not a string', async () => {
        // Arrange
        const dto = plainToClass(CreateProductDto, {
          title: 123,
          description: 'This is a valid product description',
          price: 99.99,
        });

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('title');
        expect(errors[0].constraints).toHaveProperty('isString');
      });

      it('should fail when title is missing', async () => {
        // Arrange
        const dto = plainToClass(CreateProductDto, {
          description: 'This is a valid product description',
          price: 99.99,
        });

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('title');
        expect(errors[0].constraints).toHaveProperty('isNotEmpty');
      });
    });

    describe('description validation', () => {
      it('should pass with valid description', async () => {
        // Arrange
        const dto = plainToClass(CreateProductDto, {
          title: 'Valid Product Title',
          description:
            'This is a valid product description with enough characters',
          price: 99.99,
        });

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(0);
      });

      it('should fail when description is empty', async () => {
        // Arrange
        const dto = plainToClass(CreateProductDto, {
          title: 'Valid Product Title',
          description: '',
          price: 99.99,
        });

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('description');
        expect(errors[0].constraints).toHaveProperty('isNotEmpty');
      });

      it('should fail when description is too short (less than 10 characters)', async () => {
        // Arrange
        const dto = plainToClass(CreateProductDto, {
          title: 'Valid Product Title',
          description: 'Short',
          price: 99.99,
        });

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('description');
        expect(errors[0].constraints).toHaveProperty('minLength');
      });

      it('should fail when description is not a string', async () => {
        // Arrange
        const dto = plainToClass(CreateProductDto, {
          title: 'Valid Product Title',
          description: 123456789012345,
          price: 99.99,
        });

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('description');
        expect(errors[0].constraints).toHaveProperty('isString');
      });

      it('should fail when description is missing', async () => {
        // Arrange
        const dto = plainToClass(CreateProductDto, {
          title: 'Valid Product Title',
          price: 99.99,
        });

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('description');
        expect(errors[0].constraints).toHaveProperty('isNotEmpty');
      });
    });

    describe('price validation', () => {
      it('should pass with valid price', async () => {
        // Arrange
        const dto = plainToClass(CreateProductDto, {
          title: 'Valid Product Title',
          description: 'This is a valid product description',
          price: 99.99,
        });

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(0);
      });

      it('should pass with integer price', async () => {
        // Arrange
        const dto = plainToClass(CreateProductDto, {
          title: 'Valid Product Title',
          description: 'This is a valid product description',
          price: 100,
        });

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(0);
      });

      it('should fail when price is not a number', async () => {
        // Arrange
        const dto = plainToClass(CreateProductDto, {
          title: 'Valid Product Title',
          description: 'This is a valid product description',
          price: 'not-a-number',
        });

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('price');
        expect(errors[0].constraints).toHaveProperty('isNumber');
      });

      it('should fail when price is missing', async () => {
        // Arrange
        const dto = plainToClass(CreateProductDto, {
          title: 'Valid Product Title',
          description: 'This is a valid product description',
        });

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('price');
        expect(errors[0].constraints).toHaveProperty('isNotEmpty');
      });

      it('should transform string numbers to numbers', async () => {
        // Arrange
        const dto = plainToClass(CreateProductDto, {
          title: 'Valid Product Title',
          description: 'This is a valid product description',
          price: '99.99',
        });

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(0);
        expect(dto.price).toBe(99.99);
        expect(typeof dto.price).toBe('number');
      });
    });

    describe('multiple validation errors', () => {
      it('should return multiple errors for multiple invalid fields', async () => {
        // Arrange
        const dto = plainToClass(CreateProductDto, {
          title: 'AB', // Too short
          description: 'Short', // Too short
          price: 'invalid', // Not a number
        });

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(3);

        const titleError = errors.find((e) => e.property === 'title');
        const descriptionError = errors.find(
          (e) => e.property === 'description',
        );
        const priceError = errors.find((e) => e.property === 'price');

        expect(titleError?.constraints).toHaveProperty('minLength');
        expect(descriptionError?.constraints).toHaveProperty('minLength');
        expect(priceError?.constraints).toHaveProperty('isNumber');
      });
    });
  });

  describe('UpdateProductDto', () => {
    describe('partial updates', () => {
      it('should pass with only title update', async () => {
        // Arrange
        const dto = plainToClass(UpdateProductDto, {
          title: 'Updated Title',
        });

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(0);
      });

      it('should pass with only description update', async () => {
        // Arrange
        const dto = plainToClass(UpdateProductDto, {
          description: 'Updated description with enough characters',
        });

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(0);
      });

      it('should pass with only price update', async () => {
        // Arrange
        const dto = plainToClass(UpdateProductDto, {
          price: 199.99,
        });

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(0);
      });

      it('should pass with all fields updated', async () => {
        // Arrange
        const dto = plainToClass(UpdateProductDto, {
          title: 'Updated Product Title',
          description: 'Updated product description with enough characters',
          price: 299.99,
        });

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(0);
      });

      it('should pass with empty object (no updates)', async () => {
        // Arrange
        const dto = plainToClass(UpdateProductDto, {});

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(0);
      });
    });

    describe('validation rules inheritance', () => {
      it('should fail when title is too short', async () => {
        // Arrange
        const dto = plainToClass(UpdateProductDto, {
          title: 'AB', // Too short
        });

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('title');
        expect(errors[0].constraints).toHaveProperty('minLength');
      });

      it('should fail when description is too short', async () => {
        // Arrange
        const dto = plainToClass(UpdateProductDto, {
          description: 'Short', // Too short
        });

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('description');
        expect(errors[0].constraints).toHaveProperty('minLength');
      });

      it('should fail when price is not a number', async () => {
        // Arrange
        const dto = plainToClass(UpdateProductDto, {
          price: 'not-a-number',
        });

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('price');
        expect(errors[0].constraints).toHaveProperty('isNumber');
      });

      it('should transform string numbers to numbers', async () => {
        // Arrange
        const dto = plainToClass(UpdateProductDto, {
          price: '199.99',
        });

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(0);
        expect(dto.price).toBe(199.99);
        expect(typeof dto.price).toBe('number');
      });
    });

    describe('multiple field updates with validation errors', () => {
      it('should return errors for multiple invalid fields', async () => {
        // Arrange
        const dto = plainToClass(UpdateProductDto, {
          title: 'A', // Too short
          description: 'Bad', // Too short
          price: 'invalid', // Not a number
        });

        // Act
        const errors = await validate(dto);

        // Assert
        expect(errors).toHaveLength(3);

        const titleError = errors.find((e) => e.property === 'title');
        const descriptionError = errors.find(
          (e) => e.property === 'description',
        );
        const priceError = errors.find((e) => e.property === 'price');

        expect(titleError?.constraints).toHaveProperty('minLength');
        expect(descriptionError?.constraints).toHaveProperty('minLength');
        expect(priceError?.constraints).toHaveProperty('isNumber');
      });
    });
  });
});
