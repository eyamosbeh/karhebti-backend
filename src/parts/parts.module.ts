import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PartsService } from './parts.service';
import { PartsController } from './parts.controller';
import { Part, PartSchema } from './schemas/part.schema';
import { CarsModule } from '../cars/cars.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Part.name, schema: PartSchema }]), CarsModule],
  controllers: [PartsController],
  providers: [PartsService],
  exports: [PartsService],
})
export class PartsModule {}
