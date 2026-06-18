import {
  Controller,
  PayloadTooLargeException,
  Post,
  Req,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthenticatedRequest } from '../dto/auth/AuthenticatedRequest';
import { UploadedFileDTO } from '../dto/upload/UploadedFileDTO';
import { JwtAuthGuard } from '../guards/JwtAuthGuard';
import { UploadImageService } from '../../application/verification/UploadImageService';

interface UploadedImageFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadImageService: UploadImageService) {}

  @UseGuards(JwtAuthGuard)
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: UploadedImageFile | undefined,
    @Req() request: AuthenticatedRequest,
  ): Promise<UploadedFileDTO> {
    if (!file) {
      throw new UnsupportedMediaTypeException('A JPEG, PNG, or WEBP image file is required.');
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new UnsupportedMediaTypeException('Only JPEG, PNG, and WEBP files are allowed.');
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new PayloadTooLargeException('Image size must be 5 MB or less.');
    }

    return this.uploadImageService.upload(file, request.user);
  }
}
