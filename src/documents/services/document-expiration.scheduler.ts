import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DocumentEntity } from '../schemas/document.schema';
import { UserDocument } from '../../users/schemas/user.schema';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../notifications/schemas/notification.schema';

@Injectable()
export class DocumentExpirationScheduler {
  private readonly logger = new Logger(DocumentExpirationScheduler.name);

  constructor(
    @InjectModel(DocumentEntity.name) private documentModel: Model<DocumentEntity>,
    @InjectModel('User') private userModel: Model<UserDocument>,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Vérifie les documents qui expirent dans les 7 prochains jours
   * S'exécute chaque jour à 16h15
   */
  @Cron('15 16 * * *')
  async checkDocumentExpiration() {
    this.logger.log('🔍 Vérification des documents qui expirent...');

    try {
      // Calculer la date d'aujourd'hui et dans 7 jours
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
      sevenDaysLater.setHours(23, 59, 59, 999);

      // Rechercher les documents qui expirent dans les 7 prochains jours
      const expiringDocuments = await this.documentModel.find({
        dateExpiration: {
          $gte: today,
          $lte: sevenDaysLater,
        },
        notificationSent: { $ne: true }, // Éviter les doublons
      }).populate({
        path: 'voiture',
        populate: { path: 'user' },
      });

      this.logger.log(
        `📄 ${expiringDocuments.length} document(s) qui expire(nt) bientôt`,
      );

      // Envoyer une notification pour chaque document
      for (const doc of expiringDocuments) {
        await this.sendExpirationNotification(doc);
      }

      this.logger.log('✅ Vérification des expirations terminée');
    } catch (error) {
      this.logger.error('❌ Erreur lors de la vérification des expirations:', error);
    }
  }

  /**
   * Envoie une notification pour un document qui expire
   */
  private async sendExpirationNotification(document: any) {
    try {
      // Récupérer le propriétaire de la voiture (le user)
      const car = document.voiture;
      if (!car) {
        this.logger.warn(
          `⚠️  Document ${document._id} n'a pas de voiture associée`,
        );
        return;
      }

      const populatedUser = car.user as UserDocument | null;
      const userId = populatedUser?._id ?? car.user;
      const finalUser = populatedUser ??
        (userId ? await this.userModel.findById(userId) : null);

      if (!finalUser) {
        this.logger.warn(`⚠️  Utilisateur ${userId} non trouvé`);
        return;
      }

      // Vérifier que l'utilisateur a un device token
      if (!finalUser.deviceToken) {
        this.logger.warn(
          `⚠️  Utilisateur ${finalUser._id} n'a pas de device token`,
        );
        return;
      }

      // Calculer les jours restants
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysRemaining = Math.ceil(
        (new Date(document.dateExpiration).getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      const documentType = this.getDocumentTypeLabel(document.type);
      const title = `📋 ${documentType} expire bientôt!`;
      const body = `Votre ${documentType} expire dans ${daysRemaining} jour(s). Veuillez le renouveler.`;

      // Enregistrer et envoyer la notification via NotificationsService
      const finalUserId = (finalUser._id as Types.ObjectId).toString();

      await this.notificationsService.sendNotification({
        userId: finalUserId,
        type: NotificationType.DOCUMENT_EXPIRATION,
        titre: title,
        message: body,
        deviceToken: finalUser.deviceToken,
        documentId: document._id.toString(),
        data: {
          documentId: document._id.toString(),
          carId: car._id.toString(),
          documentType: document.type,
          daysRemaining: daysRemaining.toString(),
        },
      });

      // Marquer le document comme notifié
      await this.documentModel.updateOne(
        { _id: document._id },
        { notificationSent: true },
      );

      this.logger.log(
        `📨 Notification envoyée à ${finalUser._id} pour ${documentType}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Erreur lors de l'envoi de la notification pour ${document._id}:`,
        error,
      );
    }
  }

  /**
   * Récupère le label lisible du type de document
   */
  private getDocumentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'assurance': 'Assurance automobile',
      'carte grise': 'Carte grise',
      'contrôle technique': 'Contrôle technique',
      'visite technique': 'Visite technique',
      'timbre': 'Timbre fiscal',
    };
    return labels[type?.toLowerCase()] || type || 'Document';
  }
}
