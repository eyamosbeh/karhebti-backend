import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RepairBaysController } from './repair-bays.controller';
import { RepairBaysService } from './repair-bays.service';
import { RepairBay, RepairBaySchema } from './schemas/repair-bay.schema';
import { Reservation, ReservationSchema } from '../reservation/schemas/reservation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RepairBay.name, schema: RepairBaySchema },
      { name: Reservation.name, schema: ReservationSchema },
    ])
  ],
  controllers: [RepairBaysController],
  providers: [RepairBaysService],
  exports: [RepairBaysService], // Important pour l'utiliser dans d'autres modules
})
export class RepairBaysModule {}
