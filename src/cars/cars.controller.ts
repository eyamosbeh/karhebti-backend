import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { CarsService } from './cars.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ImageValidationService } from '../ai/image-validation.service';


@ApiTags('Cars')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cars')
export class CarsController {
  constructor(
    private readonly carsService: CarsService,
    private readonly imageValidationService: ImageValidationService,
  ) {}

  @Post(':id/image')
  @ApiOperation({ summary: 'Upload car image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      })
    ) file: Express.Multer.File,
    @CurrentUser() user: any
  ) {
    // Validate that the image contains a car using Gemini AI
    await this.imageValidationService.validateCarImageOrThrow(file);
    
    // If validation passes, proceed with upload
    return this.carsService.uploadImage(id, file, user.userId, user.role);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une voiture' })
  @ApiResponse({ status: 201, description: 'Voiture créée' })
  create(@Body() createCarDto: CreateCarDto, @CurrentUser() user: any) {
    return this.carsService.create(createCarDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les voitures' })
  @ApiResponse({ status: 200, description: 'Liste des voitures (utilisateur: ses voitures uniquement)' })
  findAll(@CurrentUser() user: any) {
    return this.carsService.findAll(user.userId, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une voiture' })
  @ApiResponse({ status: 200, description: 'Détails de la voiture' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Voiture non trouvée' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.carsService.findOne(id, user.userId, user.role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une voiture' })
  @ApiResponse({ status: 200, description: 'Voiture modifiée' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Voiture non trouvée' })
  update(
    @Param('id') id: string,
    @Body() updateCarDto: UpdateCarDto,
    @CurrentUser() user: any,
  ) {
    return this.carsService.update(id, updateCarDto, user.userId, user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une voiture' })
  @ApiResponse({ status: 200, description: 'Voiture supprimée' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Voiture non trouvée' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.carsService.remove(id, user.userId, user.role);
  }

  // Marketplace endpoints
  @Get('marketplace/available')
  @ApiOperation({ summary: 'Get available cars for swiping (marketplace)' })
  @ApiResponse({ status: 200, description: 'List of available cars for sale' })
  getAvailableCars(@CurrentUser() user: any) {
    return this.carsService.getAvailableCarsForSwipe(user.userId);
  }

  @Post(':id/list-for-sale')
  @ApiOperation({ summary: 'List a car for sale on marketplace' })
  @ApiResponse({ status: 200, description: 'Car listed for sale' })
  listForSale(@Param('id') id: string, @CurrentUser() user: any) {
    return this.carsService.listCarForSale(id, user.userId);
  }

  @Post(':id/unlist')
  @ApiOperation({ summary: 'Remove car from marketplace' })
  @ApiResponse({ status: 200, description: 'Car removed from marketplace' })
  unlistCar(@Param('id') id: string, @CurrentUser() user: any) {
    return this.carsService.unlistCar(id, user.userId);
  }

}
