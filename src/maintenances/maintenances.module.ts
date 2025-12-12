import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MaintenancesService } from './maintenances.service';
import { MaintenancesController } from './maintenances.controller';
import { Maintenance, MaintenanceSchema } from './schemas/maintenance.schema';
import { CarsModule } from '../cars/cars.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Maintenance.name, schema: MaintenanceSchema }]),
    CarsModule,
  ],
  controllers: [MaintenancesController],
  providers: [MaintenancesService],
})
export class MaintenancesModule {}
