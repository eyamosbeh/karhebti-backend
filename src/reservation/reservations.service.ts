import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reservation, ReservationDocument } from './schemas/reservation.schema';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { User } from '../users/schemas/user.schema';
import { Garage } from '../garages/schemas/garage.schema';
import { Service } from '../services/schemas/service.schema';
import { UserRole } from '../common/decorators/roles.decorator';
import { RepairBaysService } from '../repair-bays/repair-bays.service';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
    @InjectModel(User.name) private userModel: Model<any>,
    @InjectModel(Garage.name) private garageModel: Model<any>,
    @InjectModel(Service.name) private serviceModel: Model<any>,
    private readonly repairBaysService: RepairBaysService, // ✅ Injection ajoutée
  ) {}

  // Helper method to check if modification is allowed (more than 2 days before reservation)
  private canModifyReservation(reservationDate: Date): boolean {
    const now = new Date();
    const reservationDateTime = new Date(reservationDate);
    
    // Calculate difference in milliseconds
    const timeDiff = reservationDateTime.getTime() - now.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    
    // Allow modification if more than 2 days before reservation
    return daysDiff > 2;
  }

  async create(createDto: CreateReservationDto, currentUser: any) {
    // --- Defensive: Ignore any userId/email from body
    if ('userId' in createDto) { delete (createDto as any).userId; }
    if ('email' in createDto) { delete (createDto as any).email; }

    const userId = currentUser.userId;
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const garage = await this.garageModel.findById(createDto.garageId);
    if (!garage) throw new NotFoundException('Garage non trouvé');

    const date = new Date(createDto.date);
    if (isNaN(date.getTime())) throw new BadRequestException('Date invalide');

    // Check if reservation date is in the past
    const now = new Date();
    if (date < new Date(now.setHours(0, 0, 0, 0))) {
      throw new BadRequestException('Impossible de réserver une date passée');
    }

    // Validation des heures
    const [startHour, startMin] = createDto.heureDebut.split(':').map(Number);
    const [endHour, endMin] = createDto.heureFin.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
      throw new BadRequestException('Heure de début doit être avant heure de fin');
    }
    if (endMinutes - startMinutes < 30) {
      throw new BadRequestException('Durée minimale de 30 minutes');
    }
    
    // Check garage opening hours if available
    if (garage.heureOuverture && garage.heureFermeture) {
      const [openHour, openMin] = garage.heureOuverture.split(':').map(Number);
      const [closeHour, closeMin] = garage.heureFermeture.split(':').map(Number);
      const openMinutes = openHour * 60 + openMin;
      const closeMinutes = closeHour * 60 + closeMin;
      if (startMinutes < openMinutes || endMinutes > closeMinutes) {
        throw new BadRequestException(`Garage ouvert de ${garage.heureOuverture} à ${garage.heureFermeture}`);
      }
    }

    // ✅ NOUVEAU: Trouver un créneau disponible
    const availableBays = await this.repairBaysService.getAvailableBays(
      createDto.garageId,
      date,
      createDto.heureDebut,
      createDto.heureFin,
      this.reservationModel
    );

    if (availableBays.length === 0) {
      throw new BadRequestException(
        'Aucun créneau de réparation disponible pour cette période. Tous les créneaux sont réservés.'
      );
    }

    // Prendre le premier créneau disponible
    const selectedBay = availableBays[0];

    // Validate services if provided
    let services: string[] = [];
    let totalAmount = 0;
    if (createDto.services && createDto.services.length > 0) {
      const validServices = await this.serviceModel.find({
        garage: createDto.garageId,
        type: { $in: createDto.services }
      });
      if (validServices.length !== createDto.services.length) {
        throw new BadRequestException('Service non disponible dans ce garage');
      }
      services = [...createDto.services];
      totalAmount = validServices.reduce((sum: number, s: any) => sum + s.coutMoyen, 0);
    }
    
    const reservationData: any = {
      userId: new Types.ObjectId(userId),
      garageId: new Types.ObjectId(createDto.garageId),
      repairBayId: (selectedBay as any)._id, // ✅ Cast pour TypeScript
      date,
      heureDebut: createDto.heureDebut,
      heureFin: createDto.heureFin,
      services,
      status: createDto.status || 'en_attente',
      commentaires: createDto.commentaires,
      isPaid: false,
      totalAmount
    };
    
    const created = new this.reservationModel(reservationData);
    const saved = await created.save();

    // Always return populated reservation for frontend compatibility!
    return await this.reservationModel.findById(saved._id)
      .populate('userId', 'nom prenom email telephone role')
      .populate('garageId', 'nom adresse telephone')
      .populate('repairBayId', 'name bayNumber heureOuverture heureFermeture') // ✅ Populate repair bay
      .exec();
  }

  async findAll(filters: any, currentUser: any) {
    const { userId, garageId, status, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;
    const query: any = {};
    
    if (currentUser.role === UserRole.USER) query.userId = currentUser.userId;
    else if (currentUser.role === UserRole.propGarage && garageId) query.garageId = new Types.ObjectId(garageId);
    
    if (userId && currentUser.role !== UserRole.USER) query.userId = new Types.ObjectId(userId);
    if (status) query.status = status;
    
    const [reservations, total] = await Promise.all([
      this.reservationModel.find(query)
        .populate('userId', 'nom prenom email telephone role')
        .populate('garageId', 'nom adresse telephone')
        .populate('repairBayId', 'name bayNumber') // ✅ Populate repair bay
        .sort({ date: -1 }).skip(skip).limit(limit).exec(),
      this.reservationModel.countDocuments(query)
    ]);
    
    return { reservations, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByUser(userId: string, filters: any) {
    const { status, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const query: any = { userId: new Types.ObjectId(userId) };

    if (status) {
      query.status = status;
    }

    const [reservations, total] = await Promise.all([
      this.reservationModel.find(query)
        .populate('garageId', 'nom adresse telephone')
        .populate('repairBayId', 'name bayNumber') // ✅ Populate repair bay
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.reservationModel.countDocuments(query)
    ]);

    return {
      reservations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findByGarage(garageId: string, filters: any, userId: string) {
    const { status, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    if (!Types.ObjectId.isValid(garageId)) {
      throw new BadRequestException('ID garage invalide');
    }

    const query: any = { garageId: new Types.ObjectId(garageId) };

    if (status) {
      query.status = status;
    }

    const [reservations, total] = await Promise.all([
      this.reservationModel.find(query)
        .populate('userId', 'nom prenom email')
        .populate('garageId', 'nom adresse')
        .populate('repairBayId', 'name bayNumber') // ✅ Populate repair bay
        .sort({ date: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.reservationModel.countDocuments(query)
    ]);

    return {
      reservations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findOne(id: string, currentUser: any) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID invalide');
    }

    const reservation = await this.reservationModel.findById(id)
      .populate('userId', 'nom prenom email')
      .populate('garageId', 'nom adresse telephone')
      .populate('repairBayId', 'name bayNumber heureOuverture heureFermeture') // ✅ Populate repair bay
      .exec();

    if (!reservation) {
      throw new NotFoundException('Réservation non trouvée');
    }

    // Check access rights
    if (currentUser.role === UserRole.USER && 
        reservation.userId._id.toString() !== currentUser.userId) {
      throw new ForbiddenException('Accès non autorisé');
    }

    return reservation;
  }

  async update(id: string, updateDto: UpdateReservationDto, currentUser: any) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID invalide');
    }

    const reservation = await this.reservationModel.findById(id);
    if (!reservation) {
      throw new NotFoundException('Réservation non trouvée');
    }

    // Check ownership or propGarage access
    const isOwner = reservation.userId.toString() === currentUser.userId;
    const isPropGarage = currentUser.role === UserRole.propGarage;

    if (!isOwner && !isPropGarage) {
      throw new ForbiddenException('Accès non autorisé');
    }

    // For regular users, check if modification is allowed (more than 2 days before)
    if (isOwner && !this.canModifyReservation(reservation.date)) {
      throw new ForbiddenException('Impossible de modifier la réservation. Moins de 2 jours restants.');
    }

    // Users can't change status
    if (currentUser.role === UserRole.USER && updateDto.status) {
      delete (updateDto as any).status;
    }

    // Prepare update data
    const updateData: any = {};

    // Handle time updates
    if (updateDto.heureDebut || updateDto.heureFin) {
      const startTime = updateDto.heureDebut || reservation.heureDebut;
      const endTime = updateDto.heureFin || reservation.heureFin;
      
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      if (startHour * 60 + startMin >= endHour * 60 + endMin) {
        throw new BadRequestException('Heure de début doit être avant heure de fin');
      }

      // ✅ Check conflicts with repair bay availability
      if (updateDto.heureDebut || updateDto.heureFin) {
        const availableBays = await this.repairBaysService.getAvailableBays(
          reservation.garageId.toString(),
          reservation.date,
          startTime,
          endTime,
          this.reservationModel
        );

        // Check if current bay is still available or find another
        const currentBayStillAvailable = availableBays.some(
          bay => (bay as any)._id.equals(reservation.repairBayId)
        );

        if (!currentBayStillAvailable && availableBays.length === 0) {
          throw new BadRequestException('Aucun créneau disponible pour ces horaires');
        }

        // If current bay not available, assign a new one
        if (!currentBayStillAvailable && availableBays.length > 0) {
          updateData.repairBayId = (availableBays[0] as any)._id;
        }
      }

      updateData.heureDebut = updateDto.heureDebut || reservation.heureDebut;
      updateData.heureFin = updateDto.heureFin || reservation.heureFin;
    }

    // Handle services update
    if (updateDto.services && updateDto.services.length > 0) {
      const validServices = await this.serviceModel.find({
        garage: reservation.garageId,
        type: { $in: updateDto.services }
      });

      if (validServices.length !== updateDto.services.length) {
        throw new BadRequestException('Service non disponible');
      }

      updateData.services = updateDto.services;
      updateData.totalAmount = validServices.reduce((sum: number, s: any) => sum + s.coutMoyen, 0);
    }

    // Handle status update (propGarage only)
    if (isPropGarage && updateDto.status) {
      if (!['en_attente', 'confirmé', 'annulé'].includes(updateDto.status)) {
        throw new BadRequestException('Statut invalide');
      }

      updateData.status = updateDto.status;
      updateData.updatedBy = new Types.ObjectId(currentUser.userId);
      
      if (updateDto.status === 'confirmé') {
        updateData.isPaid = true;
      }
    }

    // Handle comments
    if (updateDto.commentaires !== undefined) {
      updateData.commentaires = updateDto.commentaires;
    }

    const updated = await this.reservationModel.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true }
    ).exec();

    if (!updated) {
      throw new NotFoundException('Réservation non trouvée');
    }

    // Fixed: Always return populated version
    return await this.reservationModel.findById(updated._id)
      .populate('userId', 'nom prenom email')
      .populate('garageId', 'nom adresse telephone')
      .populate('repairBayId', 'name bayNumber') // ✅ Populate repair bay
      .exec();
  }

  async remove(id: string, currentUser: any) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID invalide');
    }

    const reservation = await this.reservationModel.findById(id);
    if (!reservation) {
      throw new NotFoundException('Réservation non trouvée');
    }

    // Check ownership
    const isOwner = reservation.userId.toString() === currentUser.userId;
    const isPropGarage = currentUser.role === UserRole.propGarage;

    if (!isOwner && !isPropGarage) {
      throw new ForbiddenException('Accès non autorisé');
    }

    // For regular users, check if cancellation is allowed (more than 2 days before)
    if (isOwner && !this.canModifyReservation(reservation.date)) {
      throw new ForbiddenException('Impossible d\'annuler la réservation. Moins de 2 jours restants.');
    }

    // Users can only cancel pending reservations
    if (isOwner && reservation.status === 'confirmé') {
      throw new ForbiddenException('Réservation confirmée ne peut être annulée');
    }

    // Soft delete: mark as cancelled
    const updateData: any = {
      status: 'annulé'
    };

    if (isPropGarage) {
      updateData.updatedBy = new Types.ObjectId(currentUser.userId);
    }

    const cancelled = await this.reservationModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).exec();

    if (!cancelled) {
      throw new NotFoundException('Réservation non trouvée');
    }

    // Fixed: Return populated cancelled reservation
    const cancelledReservation = await this.reservationModel.findById(cancelled._id)
      .populate('userId', 'nom prenom email')
      .populate('garageId', 'nom adresse telephone')
      .populate('repairBayId', 'name bayNumber') // ✅ Populate repair bay
      .exec();

    return { 
      message: 'Réservation annulée', 
      reservation: cancelledReservation 
    };
  }

  async updateStatus(id: string, status: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID invalide');
    }

    if (!['en_attente', 'confirmé', 'annulé'].includes(status)) {
      throw new BadRequestException('Statut invalide');
    }

    const reservation = await this.reservationModel.findById(id);
    if (!reservation) {
      throw new NotFoundException('Réservation non trouvée');
    }

    // Only propGarage can update status
    if (reservation.status === status) {
      throw new BadRequestException('Statut inchangé');
    }

    // ✅ NOUVEAU: Si on confirme une réservation, utiliser la logique du RepairBaysService
    // pour annuler automatiquement les réservations en conflit
    if (status === 'confirmé' && reservation.status === 'en_attente') {
      await this.repairBaysService.confirmReservation(id);
      
      // La confirmation a été faite par RepairBaysService, récupérer la réservation mise à jour
      const updated = await this.reservationModel.findById(id)
        .populate('userId', 'nom prenom email')
        .populate('garageId', 'nom adresse')
        .populate('repairBayId', 'name bayNumber')
        .exec();
      
      return updated;
    }

    // Pour les autres changements de statut (annulation, etc.)
    const updateData: any = {
      status,
      updatedBy: new Types.ObjectId(userId)
    };

    if (status === 'confirmé') {
      updateData.isPaid = true;
    }

    const updated = await this.reservationModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).exec();

    if (!updated) {
      throw new NotFoundException('Réservation non trouvée');
    }

    // Fixed: Proper populate pattern
    return await this.reservationModel.findById(updated._id)
      .populate('userId', 'nom prenom email')
      .populate('garageId', 'nom adresse')
      .populate('repairBayId', 'name bayNumber')
      .exec();
  }

  // Delete all reservations for a garage (cascade delete)
  async deleteAllByGarage(garageId: string): Promise<void> {
    if (!Types.ObjectId.isValid(garageId)) {
      throw new BadRequestException('ID garage invalide');
    }

    const result = await this.reservationModel.deleteMany({ 
      garageId: new Types.ObjectId(garageId) 
    }).exec();

    console.log(`Deleted ${result.deletedCount} reservations for garage ${garageId}`);
  }
}
