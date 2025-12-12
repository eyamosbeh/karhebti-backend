import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Request,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { SendNotificationDto, UpdateDeviceTokenDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a notification (admin/system use)' })
  async createNotification(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.createNotification(createNotificationDto);
  }

  /**
   * Envoyer une notification (Firebase uniquement)
   * POST /notifications/send
   */
  @Post('send')
  async sendNotification(
    @Body() sendNotificationDto: SendNotificationDto,
    @Request() req: any,
  ) {
    try {
      const notification = await this.notificationsService.sendNotification(
        sendNotificationDto,
      );
      return {
        success: true,
        message: 'Notification envoyée avec succès',
        data: notification,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erreur lors de l\'envoi de la notification',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications for current user' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  async getUserNotifications(
    @Req() req, 
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit: string = '20',
    @Query('skip') skip: string = '0',
  ) {
    try {
      const userId = req.user.userId;
      const notifications = await this.notificationsService.getUserNotifications(
        userId,
        unreadOnly === 'true',
        parseInt(limit),
        parseInt(skip),
      );
      const unreadCount = await this.notificationsService.getUnreadCount(userId);
      
      return {
        success: true,
        data: notifications,
        metadata: {
          total: notifications.length,
          unreadCount,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erreur lors de la récupération des notifications',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Récupérer les notifications non lues
   * GET /notifications/unread
   */
  @Get('unread')
  async getUnreadNotifications(@Request() req: any) {
    try {
      const userId = req.user.userId;
      const notifications = await this.notificationsService.getUnreadNotifications(
        userId,
      );
      
      return {
        success: true,
        data: notifications,
        count: notifications.length,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erreur lors de la récupération des notifications non lues',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get count of unread notifications' })
  async getUnreadCount(@Req() req) {
    try {
      const userId = req.user.userId;
      const count = await this.notificationsService.getUnreadCount(userId);
      
      return {
        success: true,
        count,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Marquer une notification comme lue
   * PATCH /notifications/:id/read
   */
  @Post(':id/mark-read')
  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(@Param('id') id: string, @Req() req) {
    try {
      const notification = await this.notificationsService.markAsRead(id, req.user.userId);
      
      return {
        success: true,
        message: 'Notification marquée comme lue',
        data: notification,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erreur lors de la mise à jour de la notification',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('mark-all-read')
  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Req() req) {
    try {
      const userId = req.user.userId;
      await this.notificationsService.markAllAsRead(userId);
      
      return {
        success: true,
        message: 'Toutes les notifications ont été marquées comme lues',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Mettre à jour le device token
   * POST /notifications/update-device-token
   */
  @Post('update-device-token')
  async updateDeviceToken(
    @Body() updateDeviceTokenDto: UpdateDeviceTokenDto,
    @Request() req: any,
  ) {
    try {
      const userId = req.user.userId;
      await this.notificationsService.updateDeviceToken(
        userId,
        updateDeviceTokenDto,
      );
      
      return {
        success: true,
        message: 'Device token mis à jour avec succès',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Supprimer une notification
   * DELETE /notifications/:id
   */
  @Delete(':id')
  async deleteNotification(@Param('id') notificationId: string) {
    try {
      await this.notificationsService.deleteNotification(notificationId);
      
      return {
        success: true,
        message: 'Notification supprimée avec succès',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Supprimer toutes les notifications
   * DELETE /notifications
   */
  @Delete()
  async deleteAllNotifications(@Request() req: any) {
    try {
      const userId = req.user.userId;
      await this.notificationsService.deleteAllUserNotifications(userId);
      
      return {
        success: true,
        message: 'Toutes les notifications ont été supprimées',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
