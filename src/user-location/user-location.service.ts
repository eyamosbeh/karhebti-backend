import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserLocation } from './schemas/user-location.schema';
import { UpdateLocationDto } from './dto/update-location.dto';

/**
 * Service pour la gestion des positions GPS utilisateur.
 */
@Injectable()
export class UserLocationService {
  constructor(
    @InjectModel(UserLocation.name)
    private userLocationModel: Model<UserLocation>,
  ) {}

  /**
   * Enregistre ou met à jour la position d'un utilisateur.
   */
  async upsertLocation(dto: UpdateLocationDto): Promise<UserLocation> {
    return this.userLocationModel.findOneAndUpdate(
      { userId: dto.userId },
      { $set: { latitude: dto.latitude, longitude: dto.longitude } },
      { upsert: true, new: true },
    ).exec();
  }

  /**
   * Récupère la dernière position connue d'un utilisateur.
   */
  async getLocation(userId: string): Promise<UserLocation | null> {
    return this.userLocationModel.findOne({ userId }).exec();
  }

  /**
   * (Optionnel) Récupère la liste des positions de tous les utilisateurs.
   */
  async getAllLocations(): Promise<UserLocation[]> {
    return this.userLocationModel.find().exec();
  }
}
