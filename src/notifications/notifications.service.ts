import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Notification, NotificationStatus, NotificationType } from './schemas/notification.schema';
import { SendNotificationDto, UpdateDeviceTokenDto } from './dto/notification.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { initializeFirebase, getFirebaseMessaging } from '../common/config/firebase.config';
import { UsersService } from '../users/users.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseMessaging: any;

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
    private readonly usersService: UsersService,
    private eventEmitter: EventEmitter2,
  ) {
    this.initializeServices();
  }

  private initializeServices() {
    try {
      initializeFirebase();
      this.firebaseMessaging = getFirebaseMessaging();
      this.logger.log('✅ Firebase initialisé avec succès');
    } catch (error) {
      this.logger.warn('⚠️  Firebase non disponible:', error);
    }
  }

  /**
   * Envoyer une notification via Firebase Cloud Messaging
   */
  async sendFirebaseNotification(
    deviceToken: string,
    titre: string,
    message: string,
    data?: Record<string, any>,
  ): Promise<string> {
    if (!this.firebaseMessaging) {
      throw new Error('Firebase Cloud Messaging non disponible');
    }

    try {
      const response = await this.firebaseMessaging.send({
        token: deviceToken,
        notification: {
          title: titre,
          body: message,
        },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: titre,
                body: message,
              },
              badge: 1,
              sound: 'default',
            },
          },
        },
      });

      this.logger.log(`✅ Notification Firebase envoyée: ${response}`);
      return response;
    } catch (error) {
      this.logger.error(`❌ Erreur lors de l'envoi Firebase: ${error.message}`);
      throw error;
    }
  }

  /**
   * Envoyer une notification complète (enregistrement + envoi Firebase)
   */
  async sendNotification(
    sendNotificationDto: SendNotificationDto,
  ): Promise<Notification> {
    const {
      userId,
      titre,
      message,
      type,
      deviceToken,
      documentId,
      maintenanceId,
      data,
    } = sendNotificationDto;

    // Créer l'enregistrement de notification
    const notificationRecord = await this.notificationModel.create({
      userId: new Types.ObjectId(userId),
      type,
      title: titre,
      titre,
      message,
      deviceToken,
      documentId: documentId ? new Types.ObjectId(documentId) : undefined,
      maintenanceId: maintenanceId ? new Types.ObjectId(maintenanceId) : undefined,
      data,
      status: NotificationStatus.PENDING,
    });

    try {
      // Envoyer via Firebase
      let firebaseMessageId: string | undefined = undefined;
      if (deviceToken) {
        try {
          firebaseMessageId = await this.sendFirebaseNotification(
            deviceToken,
            titre,
            message,
            data,
          );
          notificationRecord.status = NotificationStatus.SENT;
          notificationRecord.sentAt = new Date();
        } catch (error) {
          this.logger.error(`Firebase failed for notification: ${error.message}`);
          notificationRecord.errorMessage = error.message;
        }
      }

      await notificationRecord.save();
      
      // Return notification with Firebase message ID
      return {
        ...notificationRecord.toObject(),
        firebaseMessageId,
      } as any;
    } catch (error) {
      notificationRecord.status = NotificationStatus.FAILED;
      notificationRecord.errorMessage = error.message;
      await notificationRecord.save();
      throw error;
    }
  }

  /**
   * Create a notification (used by system/admin)
   */
  async createNotification(createNotificationDto: CreateNotificationDto) {
    const notification = await this.notificationModel.create(createNotificationDto);

    // Emit event for real-time notification via WebSocket
    this.eventEmitter.emit('notification.created', {
      userId: notification.userId.toString(),
      notification,
    });

    return notification;
  }

  /**
   * Get unread count for backward compatibility
   */
  async getUnreadCount(userId: string) {
    const count = await this.countUnreadNotifications(userId);
    return { count };
  }

  /**
   * Mettre à jour le device token d'un utilisateur
   */
  async updateDeviceToken(
    userId: string,
    updateDeviceTokenDto: UpdateDeviceTokenDto,
  ): Promise<void> {
    const { deviceToken } = updateDeviceTokenDto;
    await this.usersService.updateDeviceToken(userId, deviceToken);
    this.logger.log(`Device token mis à jour pour l'utilisateur: ${userId}`);
  }

  /**
   * Récupérer les notifications d'un utilisateur
   */
  async getUserNotifications(
    userId: string,
    unreadOnly: boolean = false,
    limit: number = 20,
    skip: number = 0,
  ): Promise<Notification[]> {
    const query: any = { userId: new Types.ObjectId(userId) };
    if (unreadOnly) {
      query.status = { $ne: NotificationStatus.READ };
    }
    return this.notificationModel
      .find(query)
      .populate('fromUserId', 'nom prenom email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(notificationId: string, userId?: string): Promise<Notification | null> {
    const query: any = { _id: new Types.ObjectId(notificationId) };
    if (userId) {
      query.userId = new Types.ObjectId(userId);
    }
    
    return this.notificationModel.findOneAndUpdate(
      query,
      {
        status: NotificationStatus.READ,
        read: true,
        readAt: new Date(),
      },
      { new: true },
    );
  }

  /**
   * Marquer toutes les notifications d'un utilisateur comme lues
   */
  async markAllAsRead(userId: string): Promise<any> {
    return this.notificationModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        status: { $ne: NotificationStatus.READ },
      },
      {
        status: NotificationStatus.READ,
        read: true,
        readAt: new Date(),
      },
    );
  }

  /**
   * Récupérer les notifications non lues
   */
  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return this.notificationModel
      .find({
        userId: new Types.ObjectId(userId),
        status: { $ne: NotificationStatus.READ },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Compter les notifications non lues
   */
  async countUnreadNotifications(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      status: { $ne: NotificationStatus.READ },
    });
  }

  /**
   * Supprimer une notification
   */
  async deleteNotification(notificationId: string): Promise<any> {
    return this.notificationModel.findByIdAndDelete(
      new Types.ObjectId(notificationId),
    );
  }

  /**
   * Supprimer toutes les notifications d'un utilisateur
   */
  async deleteAllUserNotifications(userId: string): Promise<any> {
    return this.notificationModel.deleteMany({
      userId: new Types.ObjectId(userId),
    });
  }
}
