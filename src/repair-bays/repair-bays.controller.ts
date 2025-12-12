import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  Query,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery,
  ApiBadRequestResponse,
  ApiNotFoundResponse 
} from '@nestjs/swagger';
import { RepairBaysService } from './repair-bays.service';
import { CreateRepairBayDto } from './dto/create-repair-bay.dto';
import { UpdateRepairBayDto } from './dto/update-repair-bay.dto';

@ApiTags('Repair Bays')
@Controller('repair-bays')
export class RepairBaysController {
  constructor(private readonly repairBaysService: RepairBaysService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un créneau de réparation' })
  @ApiResponse({ status: 201, description: 'Créneau créé avec succès' })
  @ApiBadRequestResponse({ description: 'Données invalides' })
  async create(@Body() createDto: CreateRepairBayDto) {
    return this.repairBaysService.createRepairBay(
      createDto.garageId,
      createDto.bayNumber,
      createDto.name,
      createDto.heureOuverture,
      createDto.heureFermeture,
      createDto.isActive ?? true
    );
  }

  @Get('garage/:garageId')
  @ApiOperation({ summary: 'Obtenir tous les créneaux d\'un garage' })
  @ApiParam({ name: 'garageId', description: 'ID du garage' })
  @ApiResponse({ status: 200, description: 'Liste des créneaux' })
  @ApiNotFoundResponse({ description: 'Garage non trouvé' })
  async getBaysByGarage(@Param('garageId') garageId: string) {
    return this.repairBaysService.getBaysByGarage(garageId);
  }

  @Get('garage/:garageId/available')
  @ApiOperation({ summary: 'Obtenir les créneaux disponibles pour une période donnée' })
  @ApiParam({ name: 'garageId', description: 'ID du garage' })
  @ApiQuery({ name: 'date', description: 'Date (YYYY-MM-DD)', example: '2025-11-28' })
  @ApiQuery({ name: 'heureDebut', description: 'Heure de début (HH:mm)', example: '09:00' })
  @ApiQuery({ name: 'heureFin', description: 'Heure de fin (HH:mm)', example: '11:00' })
  @ApiResponse({ status: 200, description: 'Liste des créneaux disponibles' })
  async getAvailableBays(
    @Param('garageId') garageId: string,
    @Query('date') dateStr: string,
    @Query('heureDebut') heureDebut: string,
    @Query('heureFin') heureFin: string,
  ) {
    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      throw new Error('Date invalide');
    }

    return this.repairBaysService.getAvailableBays(
      garageId,
      date,
      heureDebut,
      heureFin,
      this.repairBaysService['reservationModel']
    );
  }

  @Get('garage/:garageId/count')
  @ApiOperation({ summary: 'Compter le nombre de créneaux d\'un garage' })
  @ApiParam({ name: 'garageId', description: 'ID du garage' })
  @ApiResponse({ status: 200, description: 'Nombre de créneaux' })
  async countByGarage(@Param('garageId') garageId: string) {
    const count = await this.repairBaysService.countByGarage(garageId);
    return { garageId, count };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un créneau par ID' })
  @ApiParam({ name: 'id', description: 'ID du créneau' })
  @ApiResponse({ status: 200, description: 'Créneau trouvé' })
  @ApiNotFoundResponse({ description: 'Créneau non trouvé' })
  async findOne(@Param('id') id: string) {
    return this.repairBaysService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un créneau' })
  @ApiParam({ name: 'id', description: 'ID du créneau' })
  @ApiResponse({ status: 200, description: 'Créneau mis à jour' })
  @ApiNotFoundResponse({ description: 'Créneau non trouvé' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateRepairBayDto
  ) {
    return this.repairBaysService.updateBay(id, updateDto);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Activer/Désactiver un créneau' })
  @ApiParam({ name: 'id', description: 'ID du créneau' })
  @ApiResponse({ status: 200, description: 'État du créneau modifié' })
  @ApiNotFoundResponse({ description: 'Créneau non trouvé' })
  async toggleActive(@Param('id') id: string) {
    return this.repairBaysService.toggleActive(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un créneau' })
  @ApiParam({ name: 'id', description: 'ID du créneau' })
  @ApiResponse({ status: 200, description: 'Créneau supprimé' })
  @ApiNotFoundResponse({ description: 'Créneau non trouvé' })
  async remove(@Param('id') id: string) {
    await this.repairBaysService.deleteBay(id);
    return { message: 'Créneau de réparation supprimé avec succès' };
  }
}
