import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { DocumentsOcrService } from './documents-ocr.service';
import { OcrDocumentOptionsDto } from './dto/ocr-document-options.dto';
import { OcrDocumentResponseDto } from './dto/ocr-document-response.dto';

@Controller('documents')
export class DocumentsOcrController {
  constructor(private readonly ocrService: DocumentsOcrService) {}

  @Post('ocr')
  @UseInterceptors(FileInterceptor('file'))
  async ocrDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() options: OcrDocumentOptionsDto,
  ): Promise<OcrDocumentResponseDto> {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    const { typeHint } = options ?? {};
    const data = await this.ocrService.extractDocumentData(file.buffer, typeHint);

    return {
      success: true,
      data,
    };
  }
}
