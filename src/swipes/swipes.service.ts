import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Swipe, SwipeDocument } from './schemas/swipe.schema';
import { Car, CarDocument } from '../cars/schemas/car.schema';
import { CreateSwipeDto } from './dto/create-swipe.dto';
import { RespondSwipeDto } from './dto/respond-swipe.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { ConversationsService } from '../conversations/conversations.service';
import { SwipeStatusResponse } from './dto/swipe-status.response';

@Injectable()
export class SwipesService {
  constructor(
    @InjectModel(Swipe.name) private swipeModel: Model<SwipeDocument>,
    @InjectModel(Car.name) private carModel: Model<CarDocument>,
    private notificationsService: NotificationsService,
    private conversationsService: ConversationsService,
  ) {}

  async createSwipe(userId: string, createSwipeDto: CreateSwipeDto) {
    const { carId, direction } = createSwipeDto;

    // Check if car exists
    const car = await this.carModel.findById(carId).populate('user');
    if (!car) {
      throw new NotFoundException('Car not found');
    }

    // Prevent swiping on own car
    if (car.user.toString() === userId) {
      throw new BadRequestException('Cannot swipe on your own car');
    }

    // Check if user already swiped on this car
    const existingSwipe = await this.swipeModel.findOne({ userId, carId });
    if (existingSwipe) {
      throw new BadRequestException('You have already swiped on this car');
    }

    // Create swipe
    const swipe = await this.swipeModel.create({
      userId,
      carId,
      direction,
      sellerId: (car.user as any)?._id || car.user,
      status: direction === 'right' ? 'pending' : 'declined',
    });

    // If right swipe, create notification for seller
    if (direction === 'right') {
      const sellerIdStr = (car.user as any)?._id?.toString() || car.user.toString();
      await this.notificationsService.createNotification({
        userId: sellerIdStr,
        type: 'swipe_right',
        title: 'New Interest in Your Car',
        message: `Someone wants to buy your ${car.marque} ${car.modele}`,
        data: {
          carId: (car as any)._id.toString(),
          swipeId: (swipe as any)._id.toString(),
        },
        fromUserId: userId,
      });
    }

    return swipe;
  }

  async respondToSwipe(userId: string, respondSwipeDto: RespondSwipeDto) {
    const { swipeId, response } = respondSwipeDto;

    const swipe = await this.swipeModel
      .findById(swipeId)
      .populate('carId')
      .populate('userId');

    if (!swipe) {
      throw new NotFoundException('Swipe not found');
    }

    // Only seller can respond
    if (swipe.sellerId.toString() !== userId) {
      throw new ForbiddenException('Only the seller can respond to this swipe');
    }

    if (swipe.status !== 'pending') {
      throw new BadRequestException('Swipe already responded');
    }

    // Update swipe status
    swipe.status = response;
    await swipe.save();

    // If accepted, create conversation
    if (response === 'accepted') {
      const buyerId = (swipe.userId as any)?._id?.toString() || swipe.userId.toString();
      const carId = (swipe.carId as any)?._id?.toString() || swipe.carId.toString();
      const conversation = await this.conversationsService.findOrCreateConversation({
        buyerId,
        sellerId: userId,
        carId,
      });

      // Notify buyer
      const buyerIdStr = (swipe.userId as any)?._id?.toString() || swipe.userId.toString();
      await this.notificationsService.createNotification({
        userId: buyerIdStr,
        type: 'swipe_accepted',
        title: 'Your Offer Was Accepted!',
        message: `The seller accepted your interest in their ${(swipe.carId as any)['marque']} ${(swipe.carId as any)['modele']}`,
        data: {
          carId,
          conversationId: (conversation as any)._id.toString(),
        },
        fromUserId: userId,
      });

      return { swipe, conversation };
    }

    // If declined, notify buyer
    const buyerIdStr = (swipe.userId as any)?._id?.toString() || swipe.userId.toString();
    await this.notificationsService.createNotification({
      userId: buyerIdStr,
      type: 'swipe_declined',
      title: 'Offer Declined',
      message: `The seller declined your interest in their car`,
      data: {
        carId: (swipe.carId as any)._id.toString(),
      },
      fromUserId: userId,
    });

    return { swipe };
  }

  async acceptSwipe(userId: string, swipeId: string): Promise<SwipeStatusResponse> {
    const swipe = await this.swipeModel
      .findById(swipeId)
      .populate('carId')
      .populate('userId');

    if (!swipe) {
      throw new NotFoundException('Swipe not found');
    }

    if (swipe.sellerId.toString() !== userId) {
      throw new ForbiddenException('Only the seller can accept this swipe');
    }

    if (swipe.status !== 'pending') {
      throw new BadRequestException('Swipe already responded');
    }

    swipe.status = 'accepted';
    await swipe.save();

    const buyerId = (swipe.userId as any)?._id?.toString() || swipe.userId.toString();
    const carId = (swipe.carId as any)?._id?.toString() || swipe.carId.toString();
    const conversation = await this.conversationsService.findOrCreateConversation({
      buyerId,
      sellerId: userId,
      carId,
    });

    await this.notificationsService.createNotification({
      userId: buyerId,
      type: 'swipe_accepted',
      title: 'Your Offer Was Accepted!',
      message: `The seller accepted your interest in their ${(swipe.carId as any)['marque']} ${(swipe.carId as any)['modele']}`,
      data: {
        carId,
        conversationId: (conversation as any)._id.toString(),
      },
      fromUserId: userId,
    });

    return { status: 'accepted', conversationId: (conversation as any)._id.toString() };
  }

  async declineSwipe(userId: string, swipeId: string): Promise<SwipeStatusResponse> {
    const swipe = await this.swipeModel
      .findById(swipeId)
      .populate('carId')
      .populate('userId');

    if (!swipe) {
      throw new NotFoundException('Swipe not found');
    }

    if (swipe.sellerId.toString() !== userId) {
      throw new ForbiddenException('Only the seller can decline this swipe');
    }

    if (swipe.status !== 'pending') {
      throw new BadRequestException('Swipe already responded');
    }

    swipe.status = 'declined';
    await swipe.save();

    const buyerIdStr2 = (swipe.userId as any)?._id?.toString() || swipe.userId.toString();
    await this.notificationsService.createNotification({
      userId: buyerIdStr2,
      type: 'swipe_declined',
      title: 'Offer Declined',
      message: `The seller declined your interest in their car`,
      data: {
        carId: (swipe.carId as any)._id.toString(),
      },
      fromUserId: userId,
    });

    return { status: 'declined' };
  }

  async getUserSwipes(userId: string) {
    return this.swipeModel
      .find({ userId })
      .populate('carId')
      .populate('sellerId', 'nom prenom email')
      .sort({ createdAt: -1 });
  }

  async getPendingSwipesForSeller(userId: string) {
    return this.swipeModel
      .find({ sellerId: userId, status: 'pending' })
      .populate('carId')
      .populate('userId', 'nom prenom email')
      .sort({ createdAt: -1 });
  }
}
