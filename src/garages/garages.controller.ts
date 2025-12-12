import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  HttpException,
  HttpStatus,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiNotFoundResponse, ApiBadGatewayResponse, ApiQuery } from '@nestjs/swagger';
import { CreateGarageDto } from './dto/create-garage.dto';
import { UpdateGarageDto } from './dto/update-garage.dto';
import { GaragesService } from './garages.service';
import { ServicesService } from '../services/services.service';
import { ReservationsService } from '../reservation/reservations.service';
import { RepairBaysService } from '../repair-bays/repair-bays.service';

@ApiTags('Garages')
@Controller('garages')
export class GaragesController {
  constructor(
    private readonly garagesService: GaragesService,
    private readonly servicesService: ServicesService,
    private readonly reservationsService: ReservationsService,
    private readonly repairBaysService: RepairBaysService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Créer un garage avec créneaux',
    description: 'Crée une nouvelle entrée garage dans la base de données avec ses créneaux de réparation',
  })
  @ApiResponse({ status: 201, description: 'Garage et créneaux créés avec succès' })
  @ApiBadGatewayResponse({ description: 'Erreur de création du garage' })
  @ApiQuery({ 
    name: 'numberOfBays', 
    required: false, 
    type: Number, 
    description: 'Nombre de créneaux de réparation (par défaut: 1)' 
  })
  create(
    @Body() createDto: CreateGarageDto,
    @Query('numberOfBays') numberOfBays?: number
  ) {
    const bays = numberOfBays || createDto.numberOfBays || 1; // ✅ Prendre du query ou du body
    return this.garagesService.create(createDto, bays);
  }


  @Get()
  @ApiOperation({ summary: 'Lister tous les garages' })
  @ApiResponse({ status: 200, description: 'Liste de tous les garages' })
  @ApiBadGatewayResponse({ description: 'Erreur lors de la récupération' })
  findAll() {
    return this.garagesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un garage par ID' })
  @ApiResponse({ status: 200, description: 'Garage trouvé' })
  @ApiNotFoundResponse({ description: 'Garage non trouvé' })
  @ApiBadGatewayResponse({ description: 'Erreur lors de la récupération' })
  findOne(@Param('id') id: string) {
    return this.garagesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un garage par ID' })
  @ApiResponse({ status: 200, description: 'Garage mis à jour' })
  @ApiNotFoundResponse({ description: 'Garage non trouvé' })
  @ApiBadGatewayResponse({ description: 'Erreur lors de la mise à jour' })
  update(@Param('id') id: string, @Body() updateDto: UpdateGarageDto) {
    return this.garagesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un garage, ses services, réservations et créneaux' })
  @ApiResponse({ status: 200, description: 'Garage, services, réservations et créneaux supprimés' })
  @ApiNotFoundResponse({ description: 'Garage non trouvé' })
  @ApiBadGatewayResponse({ description: 'Erreur lors de la suppression' })
  async remove(@Param('id') id: string) {
    try {
      // Delete all reservations linked to this garage
      await this.reservationsService.deleteAllByGarage(id);

      // Delete all services linked to this garage
      await this.servicesService.deleteAllByGarage(id);

      // Delete all repair bays linked to this garage
      await this.repairBaysService.deleteAllByGarage(id);

      // Then delete the garage
      await this.garagesService.remove(id);

      return { message: 'Garage, services, réservations et créneaux supprimés avec succès' };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erreur interne',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
