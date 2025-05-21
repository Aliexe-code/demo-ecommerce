import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { access } from 'fs/promises';

@Controller('api/uploads')
export class UploadsController {
  private readonly uploadDir = join(process.cwd(), 'images');

  @Post()
  async uploadFile(@Req() request: FastifyRequest) {
    if (!request.isMultipart()) {
      throw new BadRequestException('Request is not multipart');
    }

    const data = await request.file();
    if (!data) {
      throw new BadRequestException('No file provided');
    }

    // Ensure images directory exists
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }

    const prefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${prefix}-${data.filename}`;
    const path = join(this.uploadDir, filename);

    await new Promise<void>((resolve, reject) => {
      const writeStream = createWriteStream(path);
      data.file
        .pipe(writeStream)
        .on('error', reject)
        .on('finish', () => resolve());
    });

    return {
      message: 'File uploaded successfully',
      filename: filename,
    };
  }

  @Post('multiple')
  @HttpCode(HttpStatus.OK)
  async uploadMultipleFiles(@Req() request: FastifyRequest) {
    if (!request.isMultipart()) {
      throw new BadRequestException('Request is not multipart');
    }

    // Ensure images directory exists
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }

    const uploadedFiles: Array<{
      fieldname: string;
      filename: string;
      originalName: string;
      mimetype: string;
      url: string;
    }> = [];
    const parts = request.parts();

    for await (const part of parts) {
      if (part.type === 'file') {
        const prefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const filename = `${prefix}-${part.filename}`;
        const path = join(this.uploadDir, filename);

        await new Promise<void>((resolve, reject) => {
          const writeStream = createWriteStream(path);
          part.file
            .pipe(writeStream)
            .on('error', reject)
            .on('finish', () => resolve());
        });

        uploadedFiles.push({
          fieldname: part.fieldname,
          filename: filename,
          originalName: part.filename,
          mimetype: part.mimetype,
          url: `/images/${filename}`,
        });
      }
    }

    if (uploadedFiles.length === 0) {
      throw new BadRequestException('No files provided');
    }

    return {
      message: 'Files uploaded successfully',
      files: uploadedFiles,
    };
  }

  @Get(':filename')
  async getFile(
    @Param('filename') filename: string,
    @Res() reply: FastifyReply,
  ) {
    const filePath = join(this.uploadDir, filename);

    try {
      await access(filePath);
      return reply.sendFile(filename, this.uploadDir);
    } catch {
      throw new BadRequestException('File not found');
    }
  }
}
