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
import { ProductService } from './product.service';
import { AuthRolesGuard } from '../users/guards/auth-roles.guard';
import { UserType } from '@prisma/client';
import { CreateProductDto } from './dtos/createProduct.dto';
import { CurrentUser } from '../users/decorators/current-user.decorators';
import type { JWTPayloadType } from '../users/entities/types';
import { Roles } from '../users/decorators/role-user.decorators';
import { UpdateProductDto } from './dtos/updateProduct.dto';
@Controller('api/products')
export class ProductController {
  constructor(private readonly productservice: ProductService) {}

  @Post()
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  public createNewProduct(
    @Body() body: CreateProductDto,
    @CurrentUser() payload: JWTPayloadType,
  ) {
    return this.productservice.createProduct(body, payload.id);
  }

  @Get()
  public getAllProducts(
    @Query('title') title?: string,
    @Query('minprice') minPrice?: string,
    @Query('maxprice') maxPrice?: string,
  ) {
    const min = minPrice ? parseFloat(minPrice) : undefined;
    const max = maxPrice ? parseFloat(maxPrice) : undefined;
    return this.productservice.getAllProducts(title, min, max);
  }

  @Get(':id')
  public getProductById(@Param() params: { id: string }) {
    return this.productservice.getProductById(params.id);
  }

  @Put(':id')
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  public updateProduct(
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
  ) {
    return this.productservice.updateProduct(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  public deleteProduct(@Param('id') id: string) {
    return this.productservice.deleteProduct(id);
  }
}
