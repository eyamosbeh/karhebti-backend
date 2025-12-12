import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CarsService } from './cars.service';
import { CarsController } from './cars.controller';
import { Car, CarSchema } from './schemas/car.schema';
import { UploadService } from '../common/services/upload.service';
import { Swipe, SwipeSchema } from '../swipes/schemas/swipe.schema';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Car.name, schema: CarSchema },
      { name: Swipe.name, schema: SwipeSchema },
    ]),
    forwardRef(() => AiModule),
  ],
  controllers: [CarsController],
  providers: [CarsService, UploadService],
  exports: [CarsService, UploadService],
})
export class CarsModule {}
