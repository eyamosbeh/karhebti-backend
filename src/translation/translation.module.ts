import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TranslationService } from './translation.service';
import { TranslationController } from './translation.controller';
import { Translation, TranslationSchema } from './schemas/translation.schema';
import { TranslationConfigService } from './translation.config';

/**
 * Translation Module
 * Provides multi-language translation functionality using Azure Translator API
 * Features:
 * - Direct translation via Azure API
 * - MongoDB caching to reduce API calls
 * - Batch translation with cache optimization
 * - Supported languages listing
 * - Cache management
 */
@Module({
  imports: [
    // Import MongoDB model for translation caching
    MongooseModule.forFeature([
      {
        name: Translation.name,
        schema: TranslationSchema,
      },
    ]),
  ],
  providers: [TranslationService, TranslationConfigService],
  controllers: [TranslationController],
  exports: [TranslationService, TranslationConfigService],
})
export class TranslationModule {}
