import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserLocation, UserLocationSchema } from './schemas/user-location.schema';
import { UserLocationService } from './user-location.service';
import { UserLocationController } from './user-location.controller';

/**
 * Module pour la gestion des positions GPS utilisateur.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserLocation.name, schema: UserLocationSchema },
    ]),
  ],
  providers: [UserLocationService],
  controllers: [UserLocationController],
})
export class UserLocationModule {}
