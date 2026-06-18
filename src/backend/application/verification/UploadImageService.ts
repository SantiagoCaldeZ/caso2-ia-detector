import { Injectable } from '@nestjs/common';
import { AuditEventType } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import { AuthenticatedUserDTO } from '../../api/dto/auth/AuthenticatedRequest';
import { UploadedFileDTO } from '../../api/dto/upload/UploadedFileDTO';
import { VerificationRepository } from '../../infrastructure/persistence/repositories/VerificationRepository';

interface UploadedImageFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class UploadImageService {
  constructor(
    private readonly verificationRepository: VerificationRepository,
  ) {}

  async upload(
    file: UploadedImageFile,
    currentUser: AuthenticatedUserDTO,
  ): Promise<UploadedFileDTO> {
    const traceId = randomUUID();
    const fileId = randomUUID();
    const safeFileName = this.sanitizeFileName(file.originalname);
    const fileExtension = this.getExtensionByMimeType(file.mimetype);
    const storagePath = `uploads/${currentUser.id}/${fileId}.${fileExtension}`;
    const sha256Hash = createHash('sha256').update(file.buffer).digest('hex');

    const created = await this.verificationRepository.createUploadedFile({
      ownerUserId: currentUser.id,
      originalFileName: safeFileName,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      storagePath,
      sha256Hash,
    });

    await this.verificationRepository.createAuditLog({
      userId: currentUser.id,
      eventType: AuditEventType.FILE_UPLOADED,
      message: 'Image uploaded in mock mode.',
      traceId,
      metadata: {
        uploadedFileId: created.id,
        mimeType: created.mimeType,
        sizeBytes: created.sizeBytes,
        mockStorage: true,
      },
    });

    return {
      id: created.id,
      originalFileName: created.originalFileName,
      mimeType: created.mimeType as UploadedFileDTO['mimeType'],
      sizeBytes: created.sizeBytes,
      storagePath: created.storagePath,
      createdAt: created.createdAt.toISOString(),
    };
  }

  private sanitizeFileName(fileName: string): string {
    const trimmed = fileName.trim();

    if (!trimmed) {
      return 'uploaded-image';
    }

    return trimmed.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  }

  private getExtensionByMimeType(mimeType: string): string {
    if (mimeType === 'image/jpeg') {
      return 'jpg';
    }

    if (mimeType === 'image/png') {
      return 'png';
    }

    return 'webp';
  }
}
