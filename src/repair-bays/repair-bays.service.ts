import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RepairBay, RepairBayDocument } from './schemas/repair-bay.schema';
import { CreateRepairBayDto } from './dto/create-repair-bay.dto';
import { UpdateRepairBayDto } from './dto/update-repair-bay.dto';

@Injectable()
export class RepairBaysService {
  constructor(
    @InjectModel(RepairBay.name) private repairBayModel: Model<RepairBayDocument>,
    @InjectModel('Reservation') private reservationModel: Model<any>,
  ) {}

  /**
   * Créer plusieurs créneaux pour un garage
   */
  async createMultipleBaysForGarage(
    garageId: string,
    numberOfBays: number,
    heureOuverture: string,
    heureFermeture: string
  ): Promise<RepairBay[]> {
    const bays: RepairBay[] = [];

    for (let i = 1; i <= numberOfBays; i++) {
      const bay = new this.repairBayModel({
        garageId: new Types.ObjectId(garageId),
        bayNumber: i,
        name: `Créneau ${i}`,
        heureOuverture,
        heureFermeture,
        isActive: true,
      });

      const saved = await bay.save();
      bays.push(saved);
    }

    return bays;
  }

  /**
   * Créer un seul créneau
   */
  async createRepairBay(
    garageId: string,
    bayNumber: number,
    name: string,
    heureOuverture: string,
    heureFermeture: string,
    isActive: boolean = true
  ): Promise<RepairBay> {
    if (!Types.ObjectId.isValid(garageId)) {
      throw new BadRequestException('ID garage invalide');
    }

    const bay = new this.repairBayModel({
      garageId: new Types.ObjectId(garageId),
      bayNumber,
      name,
      heureOuverture,
      heureFermeture,
      isActive,
    });

    return bay.save();
  }

  /**
   * Obtenir tous les créneaux d'un garage
   */
  async getBaysByGarage(garageId: string): Promise<RepairBay[]> {
    if (!Types.ObjectId.isValid(garageId)) {
      throw new BadRequestException('ID garage invalide');
    }

    return this.repairBayModel
      .find({ garageId: new Types.ObjectId(garageId) })
      .sort({ bayNumber: 1 })
      .exec();
  }

  /**
   * Obtenir les créneaux disponibles pour une date/heure
   */
  async getAvailableBays(
    garageId: string,
    date: Date,
    heureDebut: string,
    heureFin: string,
    reservationModel: Model<any>
  ): Promise<RepairBay[]> {
    if (!Types.ObjectId.isValid(garageId)) {
      throw new BadRequestException('ID garage invalide');
    }

    // Récupérer tous les créneaux actifs du garage
    const allBays = await this.repairBayModel
      .find({ garageId: new Types.ObjectId(garageId), isActive: true })
      .exec();

    // Normaliser la date (début de la journée)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // ✅ CORRECTION IMPORTANTE: Seules les réservations CONFIRMÉES bloquent les créneaux
    // Les réservations en_attente ne bloquent PAS les créneaux (en attente de confirmation par propGarage)
    const reservedBayIds = await reservationModel
      .find({
        garageId: new Types.ObjectId(garageId),
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        status: {
          $in: ['confirmé', 'en_cours', 'terminé'] // ✅ RETIRÉ 'en_attente' - seules les confirmées bloquent
        },
        $or: [
          {
            heureDebut: { $lt: heureFin },
            heureFin: { $gt: heureDebut }
          }
        ]
      })
      .distinct('repairBayId')
      .exec();

    // Retourner les créneaux non réservés
    return allBays.filter(
      bay => !reservedBayIds.some(id => id.equals((bay as any)._id))
    );
  }

  /**
   * Obtenir un créneau par ID
   */
  async findOne(id: string): Promise<RepairBay> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID invalide');
    }

    const bay = await this.repairBayModel.findById(id).exec();
    
    if (!bay) {
      throw new NotFoundException('Créneau non trouvé');
    }

    return bay;
  }

  /**
   * Mettre à jour un créneau
   */
  async updateBay(
    bayId: string,
    updateData: UpdateRepairBayDto
  ): Promise<RepairBay> {
    if (!Types.ObjectId.isValid(bayId)) {
      throw new BadRequestException('ID invalide');
    }

    const updated = await this.repairBayModel
      .findByIdAndUpdate(bayId, updateData, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Créneau non trouvé');
    }

    return updated;
  }

  /**
   * Supprimer un créneau
   */
  async deleteBay(bayId: string): Promise<void> {
    if (!Types.ObjectId.isValid(bayId)) {
      throw new BadRequestException('ID invalide');
    }

    const result = await this.repairBayModel.findByIdAndDelete(bayId).exec();
    
    if (!result) {
      throw new NotFoundException('Créneau non trouvé');
    }
  }

  /**
   * Supprimer tous les créneaux d'un garage (cascade)
   */
  async deleteAllByGarage(garageId: string): Promise<void> {
    if (!Types.ObjectId.isValid(garageId)) {
      throw new BadRequestException('ID garage invalide');
    }

    const result = await this.repairBayModel.deleteMany({ 
      garageId: new Types.ObjectId(garageId) 
    }).exec();

    console.log(`Deleted ${result.deletedCount} repair bays for garage ${garageId}`);
  }

  /**
   * Compter le nombre de créneaux d'un garage
   */
  async countByGarage(garageId: string): Promise<number> {
    if (!Types.ObjectId.isValid(garageId)) {
      throw new BadRequestException('ID garage invalide');
    }

    return this.repairBayModel.countDocuments({
      garageId: new Types.ObjectId(garageId)
    }).exec();
  }

  /**
   * Activer/Désactiver un créneau
   */
  async toggleActive(bayId: string): Promise<RepairBay> {
    if (!Types.ObjectId.isValid(bayId)) {
      throw new BadRequestException('ID invalide');
    }

    const bay = await this.repairBayModel.findById(bayId).exec();
    
    if (!bay) {
      throw new NotFoundException('Créneau non trouvé');
    }

    bay.isActive = !bay.isActive;
    return bay.save();
  }

  async confirmReservation(reservationId: string): Promise<void> {
    const reservation = await this.reservationModel.findById(reservationId).exec();
  
    if (!reservation) {
      throw new NotFoundException('Réservation non trouvée');
    }

    if (reservation.status === 'confirmé') {
      throw new BadRequestException('Cette réservation est déjà confirmée');
    }

    if (reservation.status === 'annulé') {
      throw new BadRequestException('Impossible de confirmer une réservation annulée');
    }
  
    const repairBay = await this.repairBayModel.findById(reservation.repairBayId).exec();
  
    if (!repairBay) {
      throw new NotFoundException('Créneau de réparation non trouvé');
    }

    // Normaliser la date pour la comparaison
    const reservationDate = new Date(reservation.date);
    const startOfDay = new Date(reservationDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(reservationDate);
    endOfDay.setHours(23, 59, 59, 999);
  
    // ✅ Vérifier les conflits UNIQUEMENT avec les réservations CONFIRMÉES (pas en_attente)
    const overlappingConfirmedReservations = await this.reservationModel.find({
      _id: { $ne: reservationId }, // Exclure la réservation actuelle
      repairBayId: reservation.repairBayId,
      status: { $in: ['confirmé', 'en_cours'] }, // ✅ Seulement les confirmées
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      $or: [
        { 
          heureDebut: { $lt: reservation.heureFin }, 
          heureFin: { $gt: reservation.heureDebut } 
        },
      ],
    }).exec();
  
    if (overlappingConfirmedReservations.length > 0) {
      throw new BadRequestException(
        `Le créneau "${repairBay.name}" est déjà occupé pour cette période par une réservation confirmée`
      );
    }
  
    // ✅ NOUVEAU: Annuler automatiquement toutes les autres réservations en_attente 
    // pour le même créneau, même date et heures qui se chevauchent
    const conflictingPendingReservations = await this.reservationModel.find({
      _id: { $ne: reservationId }, // Exclure la réservation actuelle
      repairBayId: reservation.repairBayId,
      status: 'en_attente', // ✅ Seulement les en attente
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      $or: [
        { 
          heureDebut: { $lt: reservation.heureFin }, 
          heureFin: { $gt: reservation.heureDebut } 
        },
      ],
    }).exec();

    // Annuler toutes les réservations en conflit
    if (conflictingPendingReservations.length > 0) {
      await this.reservationModel.updateMany(
        {
          _id: { $in: conflictingPendingReservations.map(r => r._id) }
        },
        {
          $set: { 
            status: 'annulé',
            commentaires: `Annulée automatiquement - Créneau confirmé pour une autre réservation`
          }
        }
      ).exec();

      console.log(`✅ ${conflictingPendingReservations.length} réservation(s) en attente annulée(s) automatiquement pour le créneau ${repairBay.name}`);
    }
  
    // ✅ Confirmer la réservation
    reservation.status = 'confirmé';
    await reservation.save();

    console.log(`✅ Réservation ${reservationId} confirmée pour le créneau ${repairBay.name}`);
  }
}
