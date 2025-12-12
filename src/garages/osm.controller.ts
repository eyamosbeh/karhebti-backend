import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { OsmService } from './osm.service';

@ApiTags('OSM')
@Controller('osm')
export class OsmController {
  constructor(private readonly osmService: OsmService) {}

  @Get('search')
  @ApiOperation({ summary: 'Rechercher des adresses via OpenStreetMap' })
  @ApiQuery({ name: 'query', description: 'Terme de recherche d\'adresse' })
  @ApiResponse({ status: 200, description: 'Liste des suggestions d\'adresse' })
  async searchAddress(@Query('query') query: string) {
    if (!query || query.length < 3) {
      throw new HttpException(
        'Le terme de recherche doit contenir au moins 3 caractères',
        HttpStatus.BAD_REQUEST
      );
    }

    return this.osmService.searchAddress(query);
  }

  @Get('reverse')
  @ApiOperation({ summary: 'Géocodage inverse - Obtenir l\'adresse depuis des coordonnées' })
  @ApiQuery({ name: 'lat', description: 'Latitude', type: Number })
  @ApiQuery({ name: 'lon', description: 'Longitude', type: Number })
  @ApiResponse({ status: 200, description: 'Adresse correspondante aux coordonnées' })
  async reverseGeocode(
    @Query('lat') lat: number,
    @Query('lon') lon: number
  ) {
    if (!lat || !lon) {
      throw new HttpException(
        'Les coordonnées latitude et longitude sont requises',
        HttpStatus.BAD_REQUEST
      );
    }

    return this.osmService.reverseGeocode(lat, lon);
  }
}