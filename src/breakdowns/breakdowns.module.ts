import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Breakdown, BreakdownSchema } from './schemas/breakdown.schema';
import { BreakdownsService } from './breakdowns.service';
import { BreakdownsController } from './breakdowns.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

/**
 * Module autonome pour la gestion des pannes (MongoDB/Mongoose).
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Breakdown.name, schema: BreakdownSchema },
    ]),
    NotificationsModule,
    UsersModule,
  ],
  providers: [BreakdownsService],
  controllers: [BreakdownsController],
})
export class BreakdownsModule {}
