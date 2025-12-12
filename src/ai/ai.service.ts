import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RoadIssue, RoadIssueDocument } from './schemas/road-issue.schema';
import { ReportRoadIssueDto, DangerZoneQueryDto, MaintenanceRecommendationDto, GarageRecommendationDto } from './dto/ai.dto';
import { CarsService } from '../cars/cars.service';
import { GaragesService } from '../garages/garages.service';

@Injectable()
export class AiService {
  constructor(
    @InjectModel(RoadIssue.name) private roadIssueModel: Model<RoadIssueDocument>,
    private carsService: CarsService,
    private garagesService: GaragesService,
  ) {}

  async reportRoadIssue(dto: ReportRoadIssueDto): Promise<any> {
    // Vérifier si une anomalie similaire existe déjà à proximité
    const existing = await this.roadIssueModel.findOne({
      typeAnomalie: dto.typeAnomalie,
      latitude: { $gte: dto.latitude - 0.001, $lte: dto.latitude + 0.001 },
      longitude: { $gte: dto.longitude - 0.001, $lte: dto.longitude + 0.001 },
    });

    if (existing) {
      existing.signalements += 1;
      await existing.save();
      return {
        message: 'Signalement ajouté à une anomalie existante',
        roadIssue: existing,
      };
    }

    const roadIssue = new this.roadIssueModel(dto);
    await roadIssue.save();
    
    return {
      message: 'Anomalie signalée avec succès',
      roadIssue,
    };
  }

  async getDangerZones(dto: DangerZoneQueryDto): Promise<any[]> {
    const query: any = {};
    
    if (dto.latitude && dto.longitude && dto.rayon) {
      const radiusInDegrees = dto.rayon / 111; // Approximation: 1 degré ≈ 111 km
      query.latitude = { $gte: dto.latitude - radiusInDegrees, $lte: dto.latitude + radiusInDegrees };
      query.longitude = { $gte: dto.longitude - radiusInDegrees, $lte: dto.longitude + radiusInDegrees };
    }

    const issues = await this.roadIssueModel.find(query).sort({ signalements: -1 }).exec();

    return issues.map(issue => ({
      id: issue._id,
      type: issue.typeAnomalie,
      description: issue.description,
      latitude: issue.latitude,
      longitude: issue.longitude,
      signalements: issue.signalements,
      niveauDanger: this.calculateDangerLevel(issue.signalements),
    }));
  }

  async getMaintenanceRecommendations(dto: MaintenanceRecommendationDto, userId: string, userRole: string): Promise<any> {
    const car = await this.carsService.findOne(dto.voitureId, userId, userRole);

    // Simulation de recommandations IA basées sur l'âge du véhicule
    const currentYear = new Date().getFullYear();
    const carAge = currentYear - (car as any).annee;

    const recommendations: any[] = [];

    if (carAge > 5) {
      recommendations.push({
        type: 'révision',
        priorite: 'haute',
        raison: 'Votre véhicule a plus de 5 ans, une révision complète est recommandée',
        estimationCout: 250,
        delaiRecommande: '1 mois',
      });
    }

    if (carAge > 2) {
      recommendations.push({
        type: 'vidange',
        priorite: 'moyenne',
        raison: 'Vidange recommandée tous les 15 000 km ou 1 an',
        estimationCout: 80,
        delaiRecommande: '2 mois',
      });
    }

    recommendations.push({
      type: 'contrôle technique',
      priorite: carAge >= 4 ? 'haute' : 'faible',
      raison: 'Contrôle technique obligatoire pour les véhicules de plus de 4 ans',
      estimationCout: 75,
      delaiRecommande: carAge >= 4 ? '1 mois' : '6 mois',
    });

    return {
      voiture: {
        marque: (car as any).marque,
        modele: (car as any).modele,
        annee: (car as any).annee,
        age: carAge,
      },
      recommandations: recommendations,
      scoreEntretien: this.calculateMaintenanceScore(carAge),
    };
  }

  async getGarageRecommendations(dto: GarageRecommendationDto): Promise<any> {
    let garages = await this.garagesService.findAll();

    // Filtrer par type de service si spécifié
    if (dto.typePanne) {
      garages = garages.filter(garage => 
        (garage as any).typeService.includes(dto.typePanne)
      );
    }

    // Simulation de filtrage géographique
    if (dto.latitude && dto.longitude && dto.rayon) {
      // En production, utiliser une vraie requête géospatiale
      garages = garages.slice(0, 5);
    }

    // Trier par note
    garages.sort((a, b) => (b as any).noteUtilisateur - (a as any).noteUtilisateur);

    return garages.slice(0, 10).map(garage => ({
      id: (garage as any)._id,
      nom: (garage as any).nom,
      adresse: (garage as any).adresse,
      telephone: (garage as any).telephone,
      note: (garage as any).noteUtilisateur,
      services: (garage as any).typeService,
      distanceEstimee: (dto.latitude && dto.longitude) ? this.calculateDistance(dto.latitude, dto.longitude) : null,
      recommande: (garage as any).noteUtilisateur >= 4,
    }));
  }

  private calculateDangerLevel(signalements: number): string {
    if (signalements >= 10) return 'très élevé';
    if (signalements >= 5) return 'élevé';
    if (signalements >= 2) return 'moyen';
    return 'faible';
  }

  private calculateMaintenanceScore(carAge: number): number {
    // Score sur 100, diminue avec l'âge
    return Math.max(100 - (carAge * 10), 0);
  }

  private calculateDistance(lat: number, lng: number): string {
    // Simulation - en production, calculer la vraie distance
    const randomDistance = Math.floor(Math.random() * 20) + 1;
    return `${randomDistance} km`;
  }
}
