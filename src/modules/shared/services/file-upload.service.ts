import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs/promises';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  FILE_VALIDATION_ERRORS,
} from '../validators/file-validators';

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class FileUploadService {
  private readonly uploadDir: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get<string>(
      'fileUpload.destination',
      './uploads/payment-requests',
    );
  }

  validateFile(file: UploadedFile): void {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(FILE_VALIDATION_ERRORS.INVALID_TYPE);
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(FILE_VALIDATION_ERRORS.SIZE_EXCEEDED);
    }
  }

  async saveFile(
    file: UploadedFile,
    paymentRequestId: number | string,
  ): Promise<{
    storedFileName: string;
    fileStoragePath: string;
  }> {
    this.validateFile(file);
    const dir = path.join(this.uploadDir, String(paymentRequestId));
    await fs.mkdir(dir, { recursive: true });

    const storedFileName = `${uuidv4()}_${file.originalname}`;
    const fileStoragePath = path.join(dir, storedFileName);
    await fs.writeFile(fileStoragePath, file.buffer);

    return { storedFileName, fileStoragePath };
  }
}
