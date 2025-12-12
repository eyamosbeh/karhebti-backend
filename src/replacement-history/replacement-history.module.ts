import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReplacementHistoryService } from './replacement-history.service';
import { ReplacementHistoryController } from './replacement-history.controller';
import { ReplacementHistory, ReplacementHistorySchema } from './schemas/replacement-history.schema';
import { PartsModule } from '../parts/parts.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ReplacementHistory.name, schema: ReplacementHistorySchema }]),
    PartsModule,
  ],
  controllers: [ReplacementHistoryController],
  providers: [ReplacementHistoryService],
})
export class ReplacementHistoryModule {}
