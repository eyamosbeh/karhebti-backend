import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios, { AxiosError } from 'axios';
import { Translation } from './schemas/translation.schema';
import { TranslationConfigService } from './translation.config';
import {
  TranslationApiException,
  InvalidLanguageException,
  TranslationLimitException,
  TranslationAuthException,
  TranslationNetworkException,
} from './exceptions/translation.exceptions';

/**
 * Response type from Azure Translator API
 */
interface AzureTranslationResponse {
  detectedLanguage?: {
    language: string;
    score: number;
  };
  translations: Array<{
    text: string;
    to: string;
  }>;
}

/**
 * Language information from Azure API
 */
interface AzureLanguageInfo {
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
}

/**
 * Translation Service
 * Handles communication with Azure Translator API and MongoDB caching
 */
@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  private cachedLanguages: Record<string, AzureLanguageInfo> | null = null;
  private languagesCacheTime: number = 0;
  private readonly LANGUAGES_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly CACHE_EXPIRATION_DAYS = 30;
  private readonly MAX_BATCH_SIZE = 100;
  private readonly MAX_REQUEST_BATCH_SIZE = 500;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;

  constructor(
    @InjectModel(Translation.name)
    private translationModel: Model<Translation>,
    private configService: TranslationConfigService,
  ) {}

  /**
   * Translate single or multiple texts
   * Calls Azure Translator API directly without caching
   *
   * @param text Single text string or array of texts
   * @param targetLanguage Target language code (e.g., "es", "fr")
   * @param sourceLanguage Optional source language code
   * @returns Array of translated texts
   */
  async translateText(
    text: string | string[],
    targetLanguage: string,
    sourceLanguage?: string,
  ): Promise<string[]> {
    this.logger.debug(`Translating to ${targetLanguage}`);

    // Convert single text to array
    const textsToTranslate = Array.isArray(text) ? text : [text];

    // Validate language codes
    await this.validateLanguageCodes([targetLanguage, sourceLanguage].filter(
      Boolean,
    ) as string[]);

    // Split into batches if needed (max 100 per Azure request)
    const batches = this.chunkArray(textsToTranslate, this.MAX_BATCH_SIZE);
    const results: string[] = [];

    for (const batch of batches) {
      try {
        const batchResults = await this.callAzureTranslatorAPI(
          batch,
          targetLanguage,
          sourceLanguage,
        );
        results.push(...batchResults);
      } catch (error) {
        this.logger.error(
          `Azure API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        throw error;
      }
    }

    return results;
  }

  /**
   * Translate text with MongoDB caching
   * Reduces Azure API calls for frequently requested translations
   *
   * @param key Unique identifier for the translation
   * @param text Text to translate
   * @param targetLanguage Target language code
   * @param sourceLanguage Optional source language code
   * @returns Translated text
   */
  async translateWithCache(
    key: string,
    text: string,
    targetLanguage: string,
    sourceLanguage: string = 'auto',
  ): Promise<string> {
    // Check cache first
    const cached = await this.translationModel.findOne({
      key,
      languageCode: targetLanguage,
    });

    if (cached) {
      this.logger.debug(
        `Cache hit for key: ${key}, language: ${targetLanguage}`,
      );

      // Check if cache is still fresh (not older than 30 days)
      const cacheAge = Date.now() - new Date(cached.createdAt).getTime();
      const maxCacheAge = this.CACHE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;

      if (cacheAge < maxCacheAge) {
        return cached.translatedText;
      }
    }

    // Not in cache or expired, translate via Azure
    this.logger.debug(`Cache miss or expired for key: ${key}`);
    const [translatedText] = await this.translateText(
      text,
      targetLanguage,
      sourceLanguage === 'auto' ? undefined : sourceLanguage,
    );

    // Save to cache
    try {
      await this.translationModel.findOneAndUpdate(
        {
          key,
          languageCode: targetLanguage,
        },
        {
          key,
          languageCode: targetLanguage,
          originalText: text,
          translatedText,
          sourceLanguage,
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(),
        },
        {
          upsert: true,
          new: true,
        },
      );
      this.logger.debug(`Cached translation for key: ${key}`);
    } catch (error) {
      this.logger.warn(
        `Failed to cache translation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      // Don't throw - return the translation even if caching fails
    }

    return translatedText;
  }

  /**
   * Batch translate multiple key-text pairs with caching
   * Optimizes by checking cache first, then batch translating uncached items
   *
   * @param translations Array of {key, text} pairs to translate
   * @param targetLanguage Target language code
   * @param sourceLanguage Optional source language code
   * @returns Object mapping keys to translated texts
   */
  async batchTranslateWithCache(
    translations: Array<{ key: string; text: string }>,
    targetLanguage: string,
    sourceLanguage: string = 'auto',
  ): Promise<Record<string, string>> {
    // Validate batch size
    if (translations.length > this.MAX_REQUEST_BATCH_SIZE) {
      throw new TranslationLimitException(
        'Batch size',
        this.MAX_REQUEST_BATCH_SIZE,
        translations.length,
      );
    }

    // Check cache for all items
    const result: Record<string, string> = {};
    const itemsToTranslate: Array<{ key: string; text: string }> = [];

    for (const item of translations) {
      const cached = await this.translationModel.findOne({
        key: item.key,
        languageCode: targetLanguage,
      });

      if (cached) {
        const cacheAge =
          Date.now() - new Date(cached.createdAt).getTime();
        const maxCacheAge = this.CACHE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;

        if (cacheAge < maxCacheAge) {
          result[item.key] = cached.translatedText;
          continue;
        }
      }

      itemsToTranslate.push(item);
    }

    // Batch translate uncached items
    if (itemsToTranslate.length > 0) {
      this.logger.debug(
        `Batch translating ${itemsToTranslate.length} uncached items`,
      );

      const textsToTranslate = itemsToTranslate.map((item) => item.text);
      const translatedTexts = await this.translateText(
        textsToTranslate,
        targetLanguage,
        sourceLanguage === 'auto' ? undefined : sourceLanguage,
      );

      // Save all new translations to cache
      const cachePromises = itemsToTranslate.map((item, index) =>
        this.translationModel
          .findOneAndUpdate(
            {
              key: item.key,
              languageCode: targetLanguage,
            },
            {
              key: item.key,
              languageCode: targetLanguage,
              originalText: item.text,
              translatedText: translatedTexts[index],
              sourceLanguage,
              createdAt: new Date(),
              updatedAt: new Date(),
              expiresAt: new Date(),
            },
            {
              upsert: true,
              new: true,
            },
          )
          .catch((error) =>
            this.logger.warn(
              `Failed to cache translation for key ${item.key}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            ),
          ),
      );

      await Promise.all(cachePromises);

      // Add translated items to result
      itemsToTranslate.forEach((item, index) => {
        result[item.key] = translatedTexts[index];
      });
    }

    return result;
  }

  /**
   * Get list of supported languages from Azure
   * Results are cached for 24 hours
   *
   * @returns Object with language codes as keys and language info as values
   */
  async getAvailableLanguages(): Promise<
    Record<
      string,
      {
        code: string;
        name: string;
        nativeName: string;
        direction: 'ltr' | 'rtl';
      }
    >
  > {
    // Check in-memory cache
    const now = Date.now();
    if (
      this.cachedLanguages &&
      now - this.languagesCacheTime < this.LANGUAGES_CACHE_DURATION
    ) {
      this.logger.debug('Using cached languages list');
      return this.formatLanguagesResponse(this.cachedLanguages);
    }

    // Fetch from Azure
    try {
      this.logger.debug('Fetching languages from Azure Translator API');
      const url = this.configService.getLanguagesUrl();
      const headers = this.configService.getRequestHeaders();

      const response = await axios.get<{
        translation: Record<string, AzureLanguageInfo>;
      }>(url, { headers });

      const languages = response.data.translation || {};
      this.cachedLanguages = languages;
      this.languagesCacheTime = now;

      this.logger.log(
        `Fetched ${Object.keys(languages).length} languages from Azure`,
      );

      return this.formatLanguagesResponse(languages);
    } catch (error) {
      this.logger.error(
        `Failed to fetch languages: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw this.handleAzureApiError(error);
    }
  }

  /**
   * Clear cached translations
   * Can optionally clear only for a specific language
   *
   * @param languageCode Optional language code to clear specific language cache
   * @returns Count of deleted documents
   */
  async clearCache(languageCode?: string): Promise<number> {
    try {
      const query = languageCode
        ? { languageCode }
        : {};

      const result = await this.translationModel.deleteMany(query);

      this.logger.log(
        `Cleared ${result.deletedCount} cached translations ${languageCode ? `for language ${languageCode}` : ''}`,
      );

      return result.deletedCount || 0;
    } catch (error) {
      this.logger.error(
        `Failed to clear cache: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new TranslationApiException(
        'Failed to clear translation cache',
      );
    }
  }

  /**
   * Get all cached translations for a specific language
   * Used by mobile apps for offline support
   *
   * @param languageCode Language code to retrieve cache for
   * @returns Object mapping keys to translated texts
   */
  async getCachedTranslations(
    languageCode: string,
  ): Promise<{ translations: Record<string, string>; count: number }> {
    try {
      const translations = await this.translationModel
        .find({ languageCode })
        .select('key translatedText');

      const result: Record<string, string> = {};
      translations.forEach((item) => {
        result[item.key] = item.translatedText;
      });

      this.logger.log(
        `Retrieved ${translations.length} cached translations for language ${languageCode}`,
      );

      return {
        translations: result,
        count: translations.length,
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve cached translations: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new TranslationApiException(
        'Failed to retrieve cached translations',
      );
    }
  }

  /**
   * Private helper: Call Azure Translator API
   * Handles HTTP communication and response parsing
   */
  private async callAzureTranslatorAPI(
    texts: string[],
    targetLanguage: string,
    sourceLanguage?: string,
  ): Promise<string[]> {
    try {
      const url = this.configService.getTranslationUrl(
        targetLanguage,
        sourceLanguage,
      );
      const headers = this.configService.getRequestHeaders();

      const requestBody = texts.map((text) => ({
        Text: text,
      }));

      this.logger.debug(
        `Calling Azure API with ${texts.length} text(s), target: ${targetLanguage}`,
      );

      const response = await axios.post<AzureTranslationResponse[]>(
        url,
        requestBody,
        { headers },
      );

      return response.data.map(
        (item) => item.translations[0]?.text || '',
      );
    } catch (error) {
      this.logger.error(
        `Azure API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw this.handleAzureApiError(error);
    }
  }

  /**
   * Private helper: Validate language codes
   * Checks if provided language codes are supported
   */
  private async validateLanguageCodes(codes: string[]): Promise<void> {
    try {
      const availableLanguages = await this.getAvailableLanguages();
      const availableCodes = Object.keys(availableLanguages);

      for (const code of codes) {
        if (!availableCodes.includes(code)) {
          throw new InvalidLanguageException(code, availableCodes);
        }
      }
    } catch (error) {
      if (error instanceof InvalidLanguageException) {
        throw error;
      }
      // If we can't validate (API error), allow the request to proceed
      this.logger.warn(
        `Could not validate language codes: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Private helper: Handle Azure API errors
   * Converts HTTP errors to custom exceptions
   */
  private handleAzureApiError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const data = axiosError.response?.data as any;

      switch (status) {
        case 401:
        case 403:
          return new TranslationAuthException(
            'Invalid Azure Translator credentials',
          );
        case 429:
          return new TranslationLimitException(
            'API rate limit',
            100, // Approximate
            1,
          );
        case 500:
        case 502:
        case 503:
          return new TranslationApiException(
            'Azure Translator service is temporarily unavailable',
            500,
          );
        default:
          return new TranslationApiException(
            `Azure Translator API error: ${data?.error?.message || 'Unknown error'}`,
            status || 500,
          );
      }
    }

    return new TranslationNetworkException(
      error instanceof Error ? error : undefined,
    );
  }

  /**
   * Private helper: Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Private helper: Format languages response
   */
  private formatLanguagesResponse(
    languages: Record<string, AzureLanguageInfo>,
  ): Record<
    string,
    {
      code: string;
      name: string;
      nativeName: string;
      direction: 'ltr' | 'rtl';
    }
  > {
    const result: Record<
      string,
      {
        code: string;
        name: string;
        nativeName: string;
        direction: 'ltr' | 'rtl';
      }
    > = {};

    Object.entries(languages).forEach(([code, info]) => {
      result[code] = {
        code,
        name: info.name,
        nativeName: info.nativeName,
        direction: info.dir,
      };
    });

    return result;
  }
}
