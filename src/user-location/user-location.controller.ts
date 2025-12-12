import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { UserLocationService } from './user-location.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';

/**
 * Contrôleur pour la gestion des positions GPS utilisateur.
 */
@ApiTags('user-location')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user/location')
export class UserLocationController {
  constructor(private readonly service: UserLocationService) {}

  /**
   * Enregistre ou met à jour la position d'un utilisateur.
   */
  @ApiOperation({ summary: 'Enregistrer ou mettre à jour la position GPS utilisateur' })
  @ApiBody({ type: UpdateLocationDto })
  @Post()
  async upsertLocation(@Body() dto: UpdateLocationDto) {
    const loc = await this.service.upsertLocation(dto);
    return { latitude: loc.latitude, longitude: loc.longitude };
  }

  /**
   * Récupère la dernière position connue d'un utilisateur.
   */
  @ApiOperation({ summary: 'Récupérer la dernière position GPS utilisateur' })
  @ApiParam({ name: 'userId', type: String })
  @Get(':userId')
  async getLocation(@Param('userId') userId: string) {
    const loc = await this.service.getLocation(userId);
    if (!loc) return { latitude: null, longitude: null };
    return { latitude: loc.latitude, longitude: loc.longitude };
  }

  /**
   * (Optionnel) Récupère la liste des positions de tous les utilisateurs.
   */
  @ApiOperation({ summary: 'Récupérer la liste des positions de tous les utilisateurs' })
  @Get()
  async getAllLocations() {
    const list = await this.service.getAllLocations();
    return list.map(loc => ({ userId: loc.userId, latitude: loc.latitude, longitude: loc.longitude }));
  }
}
