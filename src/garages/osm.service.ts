import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    city?: string;
    country?: string;
    postcode?: string;
  };
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

@Injectable()
export class OsmService {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org';

  constructor(private readonly httpService: HttpService) {}

  async searchAddress(query: string): Promise<LocationSuggestion[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<LocationSuggestion[]>(`${this.baseUrl}/search`, {
          params: {
            q: query,
            format: 'json',
            limit: 10,
            countrycodes: 'ma', // Focus sur Maroc
            'accept-language': 'fr'
          },
          headers: {
            'User-Agent': 'KarhebtiApp/1.0'
          }
        })
      );

      return response.data;
    } catch (error) {
      throw new HttpException(
        'Erreur lors de la recherche d\'adresse',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async reverseGeocode(lat: number, lon: number): Promise<LocationSuggestion> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<LocationSuggestion>(`${this.baseUrl}/reverse`, {
          params: {
            lat,
            lon,
            format: 'json',
            'accept-language': 'fr'
          },
          headers: {
            'User-Agent': 'KarhebtiApp/1.0'
          }
        })
      );

      return response.data;
    } catch (error) {
      throw new HttpException(
        'Erreur lors du géocodage inverse',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getCoordinates(address: string): Promise<Coordinates | null> {
    try {
      const results = await this.searchAddress(address);
      if (results && results.length > 0) {
        return {
          latitude: parseFloat(results[0].lat),
          longitude: parseFloat(results[0].lon)
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}