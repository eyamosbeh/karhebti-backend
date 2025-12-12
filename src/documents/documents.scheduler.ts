import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DocumentsService } from './documents.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { Types } from 'mongoose';

/**
 * Scheduler pour vérifier les documents expirants
 * et envoyer des notifications push
 *
 * Exécution: Chaque jour à 9h00 AM
 * Tâche: Vérifier les documents expirant dans 3 jours
 *        et envoyer des notifications push aux utilisateurs
 */
@Injectable()
export class DocumentsScheduler {
  private readonly logger = new Logger(DocumentsScheduler.name);

  constructor(
    private readonly documentsService: DocumentsService,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Exécuter tous les jours à 9h00 AM
   * Vérifier les documents expirant dans 3 jours
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkExpiringDocuments() {
    this.logger.log('🔍 [SCHEDULER] Vérification des documents expirants...');

    try {
      // 1. Récupérer tous les utilisateurs
      const allUsers = await this.usersService.findAll();
      this.logger.debug(
        `📊 Vérification pour ${allUsers.length} utilisateurs`,
      );

      let totalNotificationsSent = 0;
      let usersWithToken = 0;

      // 2. Pour chaque utilisateur, chercher les documents expirants
      for (const user of allUsers) {
        try {
          // Vérifier si l'utilisateur a un device token
          if (!user.deviceToken) {
            this.logger.debug(`⏭️  ${user.email} - Pas de device token`);
            continue;
          }

          usersWithToken++;

          // Chercher les documents expirant dans 3 jours
          const expiringDocs = await this.documentsService.findExpiringDocuments(
            (user as any)._id.toString(),
            3, // Fenêtre de 3 jours
          );

          if (expiringDocs.length > 0) {
            // 3. Envoyer une notification push pour chaque document expirant
            for (const doc of expiringDocs) {
              try {
                await this.sendDocumentExpirationNotification(user, doc);
                totalNotificationsSent++;
              } catch (docError) {
                this.logger.warn(
                  `⚠️  Erreur notification doc ${(doc as any)._id}: ${(docError as any).message}`,
                );
              }
            }

            this.logger.log(
              `✅ ${expiringDocs.length} notification(s) envoyée(s) pour ${user.email}`,
            );
          }
        } catch (userError) {
          this.logger.warn(
            `⚠️  Erreur pour utilisateur ${user.email}: ${userError.message}`,
          );
        }
      }

      // 4. Résumé final
      this.logger.log(
        `✅ [SCHEDULER] Vérification terminée | ${usersWithToken} utilisateurs avec token | ${totalNotificationsSent} notifications envoyées`,
      );
    } catch (error) {
      this.logger.error(
        `❌ [SCHEDULER] Erreur critique: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Alternative: Exécuter à 9h du matin, midi et 18h
   * Décommentez si vous voulez plus de reminders
   *
   * @Cron('0 9,12,18 * * *')
   * async checkExpiringDocumentsMultipleTimes() {
   *   await this.checkExpiringDocuments();
   * }
   */

  /**
   * Envoyer une notification d'expiration pour un document
   *
   * @param user Utilisateur destinataire
   * @param document Document expirant
   */
  private async sendDocumentExpirationNotification(user: any, document: any) {
    const documentType = document.type || 'Document';
    const daysUntilExpiration = this.calculateDaysUntilExpiration(
      document.dateExpiration,
    );

    // Construire les données de la notification
    const notificationData = {
      userId: (user as any)._id.toString(),
      titre: `⚠️  ${documentType} expire bientôt`,
      message: `Votre ${documentType} expire dans ${daysUntilExpiration} jour(s)`,
      type: NotificationType.DOCUMENT_EXPIRATION,
      deviceToken: user.deviceToken,
      documentId: (document as any)._id.toString(),
      data: {
        documentId: (document as any)._id.toString(),
        documentType: documentType,
        expirationDate: document.dateExpiration.toISOString(),
        daysUntilExpiration: daysUntilExpiration.toString(),
      },
    };

    try {
      // Envoyer la notification
      await this.notificationsService.sendNotification(notificationData);

      this.logger.debug(
        `📤 Notification envoyée | User: ${user.email} | Type: ${documentType} | Jours restants: ${daysUntilExpiration}`,
      );
    } catch (error) {
      this.logger.warn(
        `⚠️  Impossible d'envoyer notification à ${user.email}: ${error.message}`,
      );
      throw error; // Propager l'erreur pour logging
    }
  }

  /**
   * Calculer les jours restants jusqu'à l'expiration
   *
   * @param expirationDate Date d'expiration du document
   * @returns Nombre de jours jusqu'à l'expiration (minimum 0)
   */
  private calculateDaysUntilExpiration(expirationDate: Date): number {
    // Normaliser les dates (heure 00:00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expDate = new Date(expirationDate);
    expDate.setHours(0, 0, 0, 0);

    // Calculer la différence en millisecondes
    const diffTime = expDate.getTime() - today.getTime();

    // Convertir en jours
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Retourner au minimum 0
    return Math.max(0, diffDays);
  }
}
