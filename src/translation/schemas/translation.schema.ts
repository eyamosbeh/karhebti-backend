import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Translation Schema for MongoDB
 * Caches translated texts to reduce Azure API calls
 */
@Schema({ timestamps: true })
export class Translation extends Document {
  /**
   * Unique translation key identifier (e.g., "home.welcome_message")
   * Used to identify the translation in the source app
   */
  @Prop({ required: true, index: true })
  key: string;

  /**
   * ISO language code (e.g., "en", "es", "fr", "ar")
   * Identifies the target language
   */
  @Prop({ required: true, index: true })
  languageCode: string;

  /**
   * Original text in source language
   * Stored for reference and validation
   */
  @Prop({ required: true })
  originalText: string;

  /**
   * Translated text from Azure Translator
   */
  @Prop({ required: true })
  translatedText: string;

  /**
   * Optional: source language code for reference
   */
  @Prop()
  sourceLanguage?: string;

  /**
   * Timestamp when the translation was cached
   * Used for cache expiration logic (30 days)
   */
  @Prop({ default: Date.now })
  createdAt: Date;

  /**
   * Timestamp of last update
   */
  @Prop({ default: Date.now })
  updatedAt: Date;

  /**
   * TTL Index for automatic deletion after 30 days (2592000 seconds)
   * Helps manage cache size and ensure fresh translations
   */
  @Prop({ default: Date.now, index: { expires: 2592000 } })
  expiresAt: Date;
}

export const TranslationSchema = SchemaFactory.createForClass(Translation);

/**
 * Create compound index on (key + languageCode) for fast lookups
 * This combination uniquely identifies a cached translation
 */
TranslationSchema.index({ key: 1, languageCode: 1 }, { unique: true });

/**
 * Index for finding all translations by language code
 * Used for mobile offline support and cache retrieval
 */
TranslationSchema.index({ languageCode: 1, createdAt: -1 });

/**
 * Index on createdAt for cache expiration queries
 */
TranslationSchema.index({ createdAt: 1 });
