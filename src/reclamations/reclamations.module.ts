import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReclamationsService } from './reclamations.service';
import { ReclamationsController } from './reclamations.controller';
import { Reclamation, ReclamationSchema } from './schemas/reclamation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reclamation.name, schema: ReclamationSchema },
    ]),
  ],
  controllers: [ReclamationsController],
  providers: [ReclamationsService],
  exports: [ReclamationsService],
})
export class ReclamationsModule {}
