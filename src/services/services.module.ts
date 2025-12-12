import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { Service, ServiceSchema } from './schemas/service.schema';
import { Garage, GarageSchema } from '../garages/schemas/garage.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Service.name, schema: ServiceSchema },
      { name: Garage.name, schema: GarageSchema },
    ]),
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
