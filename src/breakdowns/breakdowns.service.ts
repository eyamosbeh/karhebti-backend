
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Breakdown, BreakdownType, BreakdownStatus } from './schemas/breakdown.schema';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { CreateBreakdownDto } from './dto/create-breakdown.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';

/**
 * Service pour la gestion des pannes (MongoDB/Mongoose).
 */
@Injectable()
export class BreakdownsService {
  private readonly logger = new Logger(BreakdownsService.name);

  constructor(
    @InjectModel(Breakdown.name)
    private breakdownModel: Model<Breakdown>,
    private notificationsService: NotificationsService,
    private usersService: UsersService,
  ) {}

  /**
   * Liste paginée et filtrée des pannes (query params)
   */
  async findAll(params: { userId?: string; status?: string; limit?: number; offset?: number }): Promise<{ data: Breakdown[]; total: number; limit: number; offset: number }> {
    const { userId, status, limit = 20, offset = 0 } = params;
    const query: any = {};
    if (userId) query.userId = userId;
    if (status) query.status = status;
    const [data, total] = await Promise.all([
      this.breakdownModel.find(query).skip(Number(offset)).limit(Number(limit)).sort({ createdAt: -1 }).exec(),
      this.breakdownModel.countDocuments(query),
    ]);
    return { data, total, limit: Number(limit), offset: Number(offset) };
  }

  /**
   * Mise à jour partielle d'une panne (PATCH)
   */
  async patchBreakdown(id: string, dto: Partial<CreateBreakdownDto>): Promise<Breakdown | null> {
    await this.breakdownModel.findByIdAndUpdate(id, dto);
    return this.findById(id);
  }

  /**
   * Suppression/annulation d'une panne (DELETE)
   */
  async deleteBreakdown(id: string): Promise<{ message: string; id: string }> {
    await this.breakdownModel.findByIdAndDelete(id);
    return { message: 'Breakdown cancelled successfully', id };
  }

  /**
   * Crée une nouvelle panne.
   */
  async create(createDto: CreateBreakdownDto): Promise<Breakdown> {
    const created = new this.breakdownModel({ ...createDto, status: BreakdownStatus.PENDING });
    const saved = await created.save();
    
    const breakdownId = (saved.id ?? saved._id)?.toString();
    this.logger.log(`✅ Breakdown created: ${breakdownId}`);
    
    // 1. Notifier l'utilisateur que sa demande a été créée
    const user = await this.usersService.findOne(createDto.userId);
    if (user && user.deviceToken) {
      await this.notificationsService.sendNotification({
        userId: user['_id']?.toString() || createDto.userId,
        type: NotificationType.ALERT,
        titre: 'Demande SOS reçue',
        message: `Votre demande d'assistance (${saved.type}) a été enregistrée. Recherche de garages à proximité...`,
        deviceToken: user.deviceToken,
        data: {
          type: 'sos_created',
          breakdownId,
          status: saved.status,
          latitude: saved.latitude.toString(),
          longitude: saved.longitude.toString(),
        },
      });
    }

    // 2. Chercher les propriétaires de garage à proximité
    try {
      this.logger.log(`🔍 Looking for nearby garages for breakdown ${breakdownId}...`);
      this.logger.log(`📍 Breakdown location: ${saved.latitude}, ${saved.longitude}`);
      
      const garageOwners = await this.usersService.findGarageOwners();
      this.logger.log(`👥 Found ${garageOwners.length} verified garage owners`);
      
      let sentCount = 0;
      let failedCount = 0;

      // 3. Envoyer des notifications à chaque propriétaire de garage
      for (const owner of garageOwners) {
        try {
          const ownerId = owner['_id']?.toString();
          
          const notification = await this.notificationsService.sendNotification({
            userId: ownerId,
            type: NotificationType.ALERT,
            titre: '🚨 Nouvelle demande SOS',
            message: `Panne ${saved.type} signalée près de vous. Lat: ${saved.latitude.toFixed(4)}, Lon: ${saved.longitude.toFixed(4)}`,
            deviceToken: owner.deviceToken || undefined,
            data: {
              type: 'sos_request',
              breakdownId,
              breakdownType: saved.type,
              latitude: saved.latitude.toString(),
              longitude: saved.longitude.toString(),
              description: saved.description,
              userId: createDto.userId,
            },
          });
          
          sentCount++;
          const messageId = notification['firebaseMessageId'] || 'N/A';
          this.logger.log(`✅ Notification sent to ${owner.email} - Response: ${messageId}`);
        } catch (error) {
          failedCount++;
          this.logger.error(`❌ Failed to send notification to ${owner.email}: ${error.message}`);
        }
      }

      this.logger.log(`📊 Notification Summary: ${sentCount} sent, ${failedCount} failed`);
    } catch (error) {
      this.logger.error(`❌ Error finding garage owners: ${error.message}`);
    }

    return saved;
  }

  /**
   * Récupère une panne par son id.
   */
  async findById(id: string): Promise<any> {
    const breakdown = await this.breakdownModel.findById(id).exec();
    if (!breakdown) return null;

    // If breakdown is accepted, include garage owner details
    if (breakdown.assignedTo && breakdown.status === BreakdownStatus.ACCEPTED) {
      try {
        const garageOwner = await this.usersService.findOne(breakdown.assignedTo);
        return {
          ...breakdown.toObject(),
          garageOwner: {
            id: garageOwner['_id']?.toString(),
            nom: garageOwner.nom,
            prenom: garageOwner.prenom,
            telephone: garageOwner.telephone,
            email: garageOwner.email,
          },
        };
      } catch (error) {
        this.logger.error(`Failed to fetch garage owner: ${error.message}`);
      }
    }

    return breakdown;
  }

  /**
   * Récupère l'historique des pannes d'un utilisateur.
   */
  async findByUser(userId: string): Promise<Breakdown[]> {
    return this.breakdownModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  /**
   * Met à jour le statut d'une panne.
   */
  async updateStatus(id: string, dto: UpdateStatusDto): Promise<Breakdown | null> {
    await this.breakdownModel.findByIdAndUpdate(id, { status: dto.status });
    const updated = await this.findById(id);
    if (updated) {
      let titre = '';
      let message = '';
      let deviceToken = '';
      let userId = '';
      // Selon le statut, on notifie l'utilisateur ou le garage
      if ([BreakdownStatus.ACCEPTED, BreakdownStatus.REFUSED].includes(dto.status)) {
        // Notifier l'utilisateur que le garage a accepté/refusé
        const user = await this.usersService.findOne(updated.userId);
        if (user && user.deviceToken) {
          deviceToken = user.deviceToken;
          userId = user['userId']?.toString();
          if (dto.status === BreakdownStatus.ACCEPTED) {
            titre = 'SOS accepté';
            message = 'Votre demande SOS a été acceptée. Vous pouvez contacter le garage.';
          } else if (dto.status === BreakdownStatus.REFUSED) {
            titre = 'SOS refusé';
            message = 'Votre demande SOS a été refusée par le garage.';
          }
        }
      } else {
        // Notifier l'utilisateur pour les autres statuts
        const user = await this.usersService.findOne(updated.userId);
        if (user && user.deviceToken) {
          deviceToken = user.deviceToken;
          userId = user['userId']?.toString();
          switch (dto.status) {
            case BreakdownStatus.IN_PROGRESS:
              titre = 'Assistance en route';
              message = 'Un technicien a été assigné et se dirige vers votre position.';
              break;
            case BreakdownStatus.COMPLETED:
              titre = 'Assistance terminée';
              message = "L'assistance a été effectuée avec succès. Merci d'avoir utilisé notre service.";
              break;
            case BreakdownStatus.CANCELLED:
              titre = 'Demande annulée';
              message = "Votre demande d'assistance a été annulée.";
              break;
          }
        }
      }
      if (titre && message && deviceToken) {
        await this.notificationsService.sendNotification({
          userId,
          type: NotificationType.ALERT,
          titre,
          message,
          deviceToken,
          data: {
            type: 'sos_status_updated',
            breakdownId: (updated.id ?? updated._id)?.toString(),
            status: dto.status,
          },
        });
      }
    }
    return updated;
  }

  /**
   * Assigne un agent à une panne.
   */
  async assignAgent(id: string, agentId: string): Promise<Breakdown | null> {
    await this.breakdownModel.findByIdAndUpdate(id, { assignedTo: agentId, status: 'ASSIGNED' });
    return this.findById(id);
  }

  /**
   * Accepter une demande SOS (garage owner)
   */
  async acceptBreakdown(id: string, garageOwnerId: string, garageOwnerEmail: string) {
    this.logger.log(`🟢 [ACCEPT] Breakdown: ${id} by ${garageOwnerEmail}`);
    
    const breakdown = await this.breakdownModel.findById(id);
    if (!breakdown) {
      throw new Error('Breakdown not found');
    }

    // Update breakdown status
    breakdown.status = BreakdownStatus.ACCEPTED;
    breakdown.assignedTo = garageOwnerId;
    await breakdown.save();

    this.logger.log(`✅ Breakdown accepted: ${id} → Status: ${breakdown.status}`);

    // Get garage owner details
    const garageOwner = await this.usersService.findOne(garageOwnerId);

    // Notify user that their SOS was accepted
    try {
      const user = await this.usersService.findOne(breakdown.userId);
      if (user && user.deviceToken) {
        await this.notificationsService.sendNotification({
          userId: user['_id']?.toString() || breakdown.userId,
          type: NotificationType.ALERT,
          titre: '✅ Demande acceptée!',
          message: `${garageOwner.nom} ${garageOwner.prenom} arrive pour vous aider!`,
          deviceToken: user.deviceToken,
          data: {
            type: 'sos_accepted',
            breakdownId: id,
            status: breakdown.status,
            garageOwnerId,
            garageName: `${garageOwner.nom} ${garageOwner.prenom}`,
            garagePhone: garageOwner.telephone,
            garageEmail: garageOwner.email,
          },
        });
        this.logger.log(`📱 User notified: SOS accepted by ${garageOwner.email}`);
      }
    } catch (error) {
      this.logger.error(`Failed to notify user: ${error.message}`);
    }

    return {
      _id: breakdown._id,
      status: breakdown.status,
      assignedTo: breakdown.assignedTo,
      garageOwner: {
        id: garageOwner['_id']?.toString(),
        nom: garageOwner.nom,
        prenom: garageOwner.prenom,
        telephone: garageOwner.telephone,
        email: garageOwner.email,
      },
      message: '✅ Demande acceptée! Navigation démarrée.',
    };
  }

  /**
   * Refuser une demande SOS (garage owner)
   */
  async refuseBreakdown(id: string, garageOwnerId: string, garageOwnerEmail: string) {
    this.logger.log(`🔴 [REFUSE] Breakdown: ${id} by ${garageOwnerEmail}`);
    
    const breakdown = await this.breakdownModel.findById(id);
    if (!breakdown) {
      throw new Error('Breakdown not found');
    }

    // Update breakdown status
    breakdown.status = BreakdownStatus.REFUSED;
    await breakdown.save();

    this.logger.log(`ℹ️ Breakdown refused: ${id} → Status: ${breakdown.status}`);

    // Optionally notify user that their SOS was refused
    try {
      const user = await this.usersService.findOne(breakdown.userId);
      if (user && user.deviceToken) {
        await this.notificationsService.sendNotification({
          userId: user['_id']?.toString() || breakdown.userId,
          type: NotificationType.ALERT,
          titre: 'Demande refusée',
          message: 'Un garage a refusé votre demande. Recherche d\'autres garages...',
          deviceToken: user.deviceToken,
          data: {
            type: 'sos_refused',
            breakdownId: id,
            status: breakdown.status,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to notify user: ${error.message}`);
    }

    return {
      message: 'Breakdown refused',
      breakdownId: id,
      status: breakdown.status,
    };
  }
}
