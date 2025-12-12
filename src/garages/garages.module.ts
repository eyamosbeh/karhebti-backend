import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GaragesService } from './garages.service';
import { GaragesController } from './garages.controller';
import { Garage, GarageSchema } from './schemas/garage.schema';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import { ServicesModule } from '../services/services.module';
import { RepairBaysModule } from '../repair-bays/repair-bays.module'; // ✅ Ajouter
import { OsmService } from './osm.service';
import { HttpModule } from '@nestjs/axios';
import { OsmController } from './osm.controller';
import { ReservationsModule } from 'src/reservation/reservations.module';

@Module({
  imports: [
    ServicesModule,
    RepairBaysModule,
    ReservationsModule, // ✅ Ajouter
    MongooseModule.forFeature([
      { name: Garage.name, schema: GarageSchema },
      { name: Service.name, schema: ServiceSchema }
    ]),
    HttpModule,
  ],
  controllers: [GaragesController, OsmController],
  providers: [GaragesService, OsmService],
  exports: [GaragesService],
})
export class GaragesModule {}
