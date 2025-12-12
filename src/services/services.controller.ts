import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Query, 
  Delete, 
  Param, 
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiNotFoundResponse, 
  ApiBadRequestResponse, 
  ApiBearerAuth, 
  ApiParam, 
  ApiQuery,
  ApiForbiddenResponse
} from '@nestjs/swagger';
import { CreateServiceDto, SERVICE_TYPES } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Services')
@ApiBearerAuth()
@Controller('services')
@UseGuards(JwtAuthGuard) // All services routes require authentication
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.propGarage)
  @ApiOperation({ 
    summary: 'Créer un service pour un garage', 
    description: 'Associe un service à un garage spécifique (seulement pour propGarage)' 
  })
  @ApiResponse({ status: 201, description: 'Service créé avec succès' })
  @ApiBadRequestResponse({ description: 'Données invalides ou garage non trouvé' })
  @ApiNotFoundResponse({ description: 'Garage non trouvé' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createDto: CreateServiceDto,
    @CurrentUser() user: any
  ) {
    return this.servicesService.create(createDto, user.userId);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Lister les services d\'un garage', 
    description: 'Affiche tous les services liés à un garage (accessible à tous les utilisateurs authentifiés)' 
  })
  @ApiQuery({ name: 'garage', description: 'ID du garage', example: '606cda9b1234567890123456' })
  @ApiResponse({ status: 200, description: 'Liste des services retrouvée' })
  @ApiBadRequestResponse({ description: 'ID garage invalide' })
  @ApiBearerAuth()
  findAll(@Query('garage') garageId: string) {
    return this.servicesService.findByGarage(garageId);
  }

  @Get('garage/:garageId')
  @ApiOperation({ 
    summary: 'Lister les services d\'un garage par ID', 
    description: 'Récupère tous les services d\'un garage spécifique' 
  })
  @ApiParam({ name: 'garageId', description: 'ID du garage', example: '606cda9b1234567890123456' })
  @ApiResponse({ status: 200, description: 'Services du garage retrouvés' })
  @ApiNotFoundResponse({ description: 'Garage non trouvé' })
  @ApiBadRequestResponse({ description: 'ID garage invalide' })
  @ApiBearerAuth()
  findByGarageId(@Param('garageId') garageId: string) {
    return this.servicesService.findByGarageId(garageId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.propGarage)
  @ApiOperation({ summary: 'Modifier un service par ID', description: 'Seul le propGarage peut modifier ses services' })
  @ApiParam({ name: 'id', description: 'ID du service', example: '606cda9b1234567890123457' })
  @ApiResponse({ status: 200, description: 'Service modifié avec succès' })
  @ApiNotFoundResponse({ description: 'Service non trouvé' })
  @ApiBadRequestResponse({ description: 'Données invalides' })
  @ApiForbiddenResponse({ description: 'Accès non autorisé' })
  @ApiBearerAuth()
  update(
    @Param('id') id: string, 
    @Body() updateDto: UpdateServiceDto,
    @CurrentUser() user: any
  ) {
    return this.servicesService.update(id, updateDto, user.userId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.propGarage)
  @ApiOperation({ summary: 'Supprimer un service par ID', description: 'Seul le propGarage peut supprimer ses services' })
  @ApiParam({ name: 'id', description: 'ID du service', example: '606cda9b1234567890123457' })
  @ApiResponse({ status: 200, description: 'Service supprimé avec succès' })
  @ApiNotFoundResponse({ description: 'Service non trouvé' })
  @ApiForbiddenResponse({ description: 'Accès non autorisé' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.servicesService.remove(id, user.userId);
    return { message: 'Service supprimé avec succès' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un service par ID' })
  @ApiParam({ name: 'id', description: 'ID du service', example: '606cda9b1234567890123457' })
  @ApiResponse({ status: 200, description: 'Service trouvé' })
  @ApiNotFoundResponse({ description: 'Service non trouvé' })
  @ApiBearerAuth()
  async findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Get('search')
  @ApiOperation({ 
    summary: 'Rechercher des services par type', 
    description: 'Recherche des services disponibles par type dans un rayon donné' 
  })
  @ApiQuery({ name: 'type', description: 'Type de service', enum: SERVICE_TYPES, example: 'vidange' })
  @ApiQuery({ name: 'garageId', description: 'ID du garage (optionnel)', required: false })
  @ApiQuery({ name: 'page', description: 'Numéro de page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', description: 'Nombre d\'éléments par page', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Services trouvés' })
  @ApiBearerAuth()
  async search(
    @Query('type') type: string,
    @Query('garageId') garageId?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    return this.servicesService.search(type, garageId, parseInt(page), parseInt(limit));
  }
}
