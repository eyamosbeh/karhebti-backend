import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { Reservation, ReservationSchema } from './schemas/reservation.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Garage, GarageSchema } from '../garages/schemas/garage.schema';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import { RepairBaysModule } from '../repair-bays/repair-bays.module'; // ✅ Import

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reservation.name, schema: ReservationSchema },
      { name: User.name, schema: UserSchema },
      { name: Garage.name, schema: GarageSchema },
      { name: Service.name, schema: ServiceSchema },
    ]),
    RepairBaysModule, // ✅ Ajouter ici
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
