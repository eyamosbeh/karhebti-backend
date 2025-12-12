import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SwipesController } from './swipes.controller';
import { SwipesService } from './swipes.service';
import { Swipe, SwipeSchema } from './schemas/swipe.schema';
import { Car, CarSchema } from '../cars/schemas/car.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Swipe.name, schema: SwipeSchema },
      { name: Car.name, schema: CarSchema },
    ]),
    NotificationsModule,
    ConversationsModule,
  ],
  controllers: [SwipesController],
  providers: [SwipesService],
  exports: [SwipesService],
})
export class SwipesModule {}
