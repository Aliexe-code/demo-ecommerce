import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FastifyFileInterceptor } from '../common/fastify-file.interceptor';
import * as fastifyMultipart from '@fastify/multipart';
import * as fs from 'fs/promises';
import * as path from 'path';

@Controller('api/uploads')
export class UploadsController {
  @Post()
  @UseInterceptors(new FastifyFileInterceptor('file'))
  public async uploadFile(
    @UploadedFile() file: fastifyMultipart.MultipartFile,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');

    const buffer = await file.toBuffer();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const uploadPath = path.join('./files', `${uniqueSuffix}-${file.filename}`);

    await fs.mkdir('./files', { recursive: true }); // Ensure directory exists
    await fs.writeFile(uploadPath, buffer);

    console.log('File uploaded:', file.filename);

    return { message: 'File uploaded successfully' };
  }
}
