import {
  Controller, Post, Body, Get, Param, Patch, Delete, Query, UseGuards,
  HttpCode, HttpStatus, ParseIntPipe
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiNotFoundResponse, ApiBadRequestResponse, ApiBearerAuth,
  ApiParam, ApiQuery, ApiBody, ApiForbiddenResponse,
} from '@nestjs/swagger';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationsService } from './reservations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Reservations')
@ApiBearerAuth()
@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une réservation' })
  @ApiResponse({ status: 201, description: 'Réservation créée' })
  @ApiBadRequestResponse({ description: 'Données invalides' })
  @ApiNotFoundResponse({ description: 'Garage ou utilisateur non trouvé' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateReservationDto,
    @CurrentUser() user: any
  ) {
    // Always returns a POPULATED reservation
    return this.reservationsService.create(createDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les réservations' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'garageId', required: false })
  @ApiQuery({ name: 'status', enum: ['en_attente', 'confirmé', 'annulé'], required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Liste des réservations' })
  async findAll(
    @CurrentUser() user: any,
    @Query('userId') userId?: string,
    @Query('garageId') garageId?: string,
    @Query('status') status?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10
  ) {
    return this.reservationsService.findAll({ userId, garageId, status, page, limit }, user);
  }

  @Get('me')
  @ApiOperation({ summary: 'Mes réservations' })
  @ApiQuery({ name: 'status', enum: ['en_attente', 'confirmé', 'annulé'], required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Mes réservations' })
  async findMyReservations(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10
  ) {
    return this.reservationsService.findByUser(user.userId, { status, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: "Détails d'une réservation" })
  @ApiParam({ name: 'id', description: 'ID de la réservation' })
  @ApiResponse({ status: 200, description: 'Réservation trouvée' })
  @ApiNotFoundResponse({ description: 'Réservation non trouvée' })
  @ApiForbiddenResponse({ description: 'Accès non autorisé' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.reservationsService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER, UserRole.propGarage)
  @ApiOperation({ summary: 'Modifier une réservation' })
  @ApiParam({ name: 'id', description: 'ID de la réservation' })
  @ApiResponse({ status: 200, description: 'Réservation modifiée' })
  @ApiNotFoundResponse({ description: 'Réservation non trouvée' })
  @ApiForbiddenResponse({ description: 'Accès non autorisé' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateReservationDto,
    @CurrentUser() user: any
  ) {
    return this.reservationsService.update(id, updateDto, user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER, UserRole.propGarage)
  @ApiOperation({ summary: 'Annuler une réservation' })
  @ApiParam({ name: 'id', description: 'ID de la réservation' })
  @ApiResponse({ status: 200, description: 'Réservation annulée' })
  @ApiNotFoundResponse({ description: 'Réservation non trouvée' })
  @ApiForbiddenResponse({ description: 'Accès non autorisé' })
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.reservationsService.remove(id, user);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.propGarage)
  @ApiOperation({ summary: 'Changer le statut' })
  @ApiParam({ name: 'id', description: 'ID de la réservation' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['en_attente', 'confirmé', 'annulé'],
          example: 'confirmé'
        }
      },
      required: ['status']
    }
  })
  @ApiResponse({ status: 200, description: 'Statut mis à jour' })
  @ApiNotFoundResponse({ description: 'Réservation non trouvée' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @CurrentUser() user: any
  ) {
    return this.reservationsService.updateStatus(id, body.status, user.userId);
  }

  @Get('garage/:garageId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.propGarage)
  @ApiOperation({ summary: "Réservations d'un garage" })
  @ApiParam({ name: 'garageId', description: 'ID du garage' })
  @ApiQuery({ name: 'status', enum: ['en_attente', 'confirmé', 'annulé'], required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Réservations du garage' })
  async findByGarage(
    @Param('garageId') garageId: string,
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10
  ) {
    return this.reservationsService.findByGarage(garageId, { status, page, limit }, user.userId);
  }
}