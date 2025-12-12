import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { DocumentEntity, DocumentEntitySchema } from './schemas/document.schema';
import { DocumentExpirationScheduler } from './services/document-expiration.scheduler';
import { CarsModule } from '../cars/cars.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UserSchema } from '../users/schemas/user.schema';
import { DocumentsOcrController } from './documents-ocr.controller';
import { DocumentsOcrService } from './documents-ocr.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: DocumentEntity.name, schema: DocumentEntitySchema },
      { name: 'User', schema: UserSchema },
    ]),
    CarsModule,
    NotificationsModule,
  ],
  controllers: [DocumentsController, DocumentsOcrController],
  providers: [DocumentsService, DocumentExpirationScheduler, DocumentsOcrService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
