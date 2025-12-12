import {
  IsString,
  IsArray,
  ArrayMaxSize,
  Matches,
  IsOptional,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for single or multiple text translation
 * Validates language codes and text content
 */
export class TranslateDto {
  /**
   * Text or array of texts to translate
   * Supports both single string and array of strings
   */
  @IsNotEmpty()
  text: string | string[];

  /**
   * Target language code
   * Must be 2-letter code (e.g., "en", "es")
   * Or 5-letter code with region (e.g., "en-US", "zh-Hans")
   */
  @IsString()
  @Matches(/^[a-z]{2}(-[A-Z]{2})?$/, {
    message:
      'Language code must be valid ISO 639-1 format (e.g., "en" or "en-US")',
  })
  targetLanguage: string;

  /**
   * Optional source language code
   * If not provided, Azure will auto-detect
   * Must also follow valid language code format
   */
  @IsOptional()
  @IsString()
  @Matches(/^[a-z]{2}(-[A-Z]{2})?$/, {
    message:
      'Source language code must be valid ISO 639-1 format (e.g., "en" or "en-US")',
  })
  sourceLanguage?: string;
}

/**
 * DTO for batch translation item
 * Each item contains a key and text to translate
 */
export class BatchTranslateItemDto {
  /**
   * Unique key identifier for the translation
   * Used to store and retrieve translations (e.g., "home.welcome_message")
   */
  @IsString()
  @IsNotEmpty()
  key: string;

  /**
   * Text content to translate
   */
  @IsString()
  @IsNotEmpty()
  text: string;
}

/**
 * DTO for batch translation requests
 * Supports up to 500 items per request
 */
export class BatchTranslateDto {
  /**
   * Array of items to translate
   * Maximum 500 items per request
   * Each item must have key and text properties
   */
  @IsArray()
  @ArrayMaxSize(500, {
    message: 'Maximum 500 items allowed per batch request',
  })
  @ValidateNested({ each: true })
  @Type(() => BatchTranslateItemDto)
  items: BatchTranslateItemDto[];

  /**
   * Target language code
   * Must be valid ISO 639-1 format
   */
  @IsString()
  @Matches(/^[a-z]{2}(-[A-Z]{2})?$/, {
    message: 'Language code must be valid ISO 639-1 format',
  })
  targetLanguage: string;

  /**
   * Optional source language code
   * If not provided, Azure will auto-detect
   */
  @IsOptional()
  @IsString()
  @Matches(/^[a-z]{2}(-[A-Z]{2})?$/, {
    message: 'Source language code must be valid ISO 639-1 format',
  })
  sourceLanguage?: string;
}

/**
 * Response DTO for translation results
 */
export class TranslationResponseDto {
  /**
   * Array of translated texts
   * Maintains order with input texts
   */
  translations: string[];
}

/**
 * Response DTO for batch translation results
 */
export class BatchTranslationResponseDto {
  /**
   * Object mapping translation keys to translated texts
   * Key: original key from request
   * Value: translated text
   */
  translations: Record<string, string>;
}

/**
 * Response DTO for available languages
 */
export class LanguageDto {
  /**
   * ISO language code (e.g., "en", "es")
   */
  code: string;

  /**
   * Display name in English (e.g., "English")
   */
  name: string;

  /**
   * Native display name (e.g., "English" or "Español")
   */
  nativeName: string;
}

/**
 * Response DTO for languages list
 */
export class LanguagesResponseDto {
  /**
   * Array of supported languages with codes and names
   */
  languages: LanguageDto[];
}

/**
 * Response DTO for cache operations
 */
export class CacheResponseDto {
  /**
   * Number of cached translations
   */
  count: number;

  /**
   * Message describing the operation result
   */
  message: string;
}

/**
 * Response DTO for cached translations
 */
export class CachedTranslationsResponseDto {
  /**
   * Object mapping translation keys to cached translated texts
   */
  translations: Record<string, string>;

  /**
   * Language code for the cached translations
   */
  languageCode: string;

  /**
   * Total count of cached translations for this language
   */
  count: number;
}
