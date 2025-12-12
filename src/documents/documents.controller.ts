import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, Req, UploadedFiles } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../common/config/multer.config';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DocumentExpirationScheduler } from './services/document-expiration.scheduler';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly service: DocumentsService,
    private readonly expirationScheduler: DocumentExpirationScheduler,
  ) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'fichier', maxCount: 1 },
      ],
      multerConfig,
    ),
  )
  create(
    @Body() createDto: CreateDocumentDto,
    @UploadedFiles()
    files: {
      image?: Express.Multer.File[];
      fichier?: Express.Multer.File[];
    },
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const { image, fichier } = files ?? {};
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    if (image && image[0]) {
      createDto.image = `${baseUrl}/uploads/documents/${image[0].filename}`;
    }

    if (fichier && fichier[0]) {
      createDto.fichier = `/uploads/documents/${fichier[0].filename}`;
    }

    return this.service.create(createDto, user.userId, user.role);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.userId, user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user.userId, user.role);
  }

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'fichier', maxCount: 1 },
      ],
      multerConfig,
    ),
  )
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDocumentDto,
    @UploadedFiles()
    files: {
      image?: Express.Multer.File[];
      fichier?: Express.Multer.File[];
    },
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    const { image, fichier } = files ?? {};
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    if (image && image[0]) {
      updateDto.image = `${baseUrl}/uploads/documents/${image[0].filename}`;
    }

    if (fichier && fichier[0]) {
      updateDto.fichier = `/uploads/documents/${fichier[0].filename}`;
    }

    return this.service.update(id, updateDto, user.userId, user.role);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user.userId, user.role);
  }

  /**
   * Test endpoint pour admins - Exécute le scheduler manuellement
   * POST /documents/test-expiration-check
   */
  @Post('test-expiration-check')
  async testExpirationCheck(@CurrentUser() user: any) {
    // Only allow admins to run this test
    if (user.role !== 'admin') {
      return {
        error: 'Only admins can run this test',
        status: 403,
      };
    }

    try {
      await this.expirationScheduler.checkDocumentExpiration();
      return {
        message: 'Document expiration check executed successfully',
        status: 200,
      };
    } catch (error) {
      return {
        error: error.message,
        status: 500,
      };
    }
  }

  /**
   * Check if user will get notifications - Pour tous les users
   * GET /documents/check-my-expiring-documents
   */
  @Get('check-my-expiring-documents')
  async checkMyExpiringDocuments(@CurrentUser() user: any) {
    try {
      const expiringDocuments = await this.service.findExpiringDocuments(
        user.userId,
        7, // 7 days window
      );

      return {
        success: true,
        message: `Vous avez ${expiringDocuments.length} document(s) qui expire(nt) bientôt`,
        data: expiringDocuments.map((doc: any) => ({
          id: doc._id,
          type: doc.type,
          dateExpiration: doc.dateExpiration,
          daysUntilExpiration: Math.ceil(
            (new Date(doc.dateExpiration).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
          ),
          willReceiveNotification: true,
        })),
        count: expiringDocuments.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: 500,
      };
    }
  }
}
