import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TranslationService } from './translation.service';
import {
  TranslateDto,
  BatchTranslateDto,
  TranslationResponseDto,
  BatchTranslationResponseDto,
  LanguagesResponseDto,
  CacheResponseDto,
  LanguageDto,
  CachedTranslationsResponseDto,
} from './dto/translate.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

/**
 * Translation Controller
 * Handles all translation-related HTTP requests
 * Provides endpoints for translating text, managing cache, and retrieving available languages
 */
@ApiTags('Translation')
@Controller('api/translation')
export class TranslationController {
  private readonly logger = new Logger(TranslationController.name);

  constructor(private readonly translationService: TranslationService) {}

  /**
   * Translate single or multiple texts
   * POST /api/translation/translate
   *
   * @param dto TranslateDto with text(s), target language, optional source language
   * @returns Array of translated texts maintaining input order
   */
  @Post('translate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Translate text or multiple texts',
    description:
      'Translates single or multiple texts to target language using Azure Translator API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Translations successful',
    type: TranslationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid language code or input validation failed',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Azure authentication failed',
  })
  async translate(
    @Body() dto: TranslateDto,
  ): Promise<TranslationResponseDto> {
    this.logger.log(
      `Translate request: target=${dto.targetLanguage}, source=${dto.sourceLanguage || 'auto'}`,
    );

    const translations = await this.translationService.translateText(
      dto.text,
      dto.targetLanguage,
      dto.sourceLanguage,
    );

    return {
      translations,
    };
  }

  /**
   * Batch translate with caching
   * POST /api/translation/batch
   *
   * @param dto BatchTranslateDto with items array and target language
   * @returns Object mapping keys to translated texts
   */
  @Post('batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Batch translate with caching',
    description:
      'Translate multiple key-text pairs. Uses cache when available. Supports up to 500 items.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Batch translation successful',
    type: BatchTranslationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid batch size (max 500) or validation failed',
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Rate limit exceeded',
  })
  async batchTranslate(
    @Body() dto: BatchTranslateDto,
  ): Promise<BatchTranslationResponseDto> {
    this.logger.log(
      `Batch translate request: ${dto.items.length} items, target=${dto.targetLanguage}`,
    );

    const translations = await this.translationService.batchTranslateWithCache(
      dto.items,
      dto.targetLanguage,
      dto.sourceLanguage || 'auto',
    );

    return {
      translations,
    };
  }

  /**
   * Get available languages
   * GET /api/translation/languages
   *
   * @returns List of supported languages with codes and names
   */
  @Get('languages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get available languages',
    description:
      'Returns list of all languages supported by Azure Translator with their codes and native names',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Languages retrieved successfully',
  })
  async getLanguages(): Promise<{
    languages: Array<{
      code: string;
      name: string;
      nativeName: string;
      direction: 'ltr' | 'rtl';
    }>;
  }> {
    this.logger.log('Fetching available languages');

    const languagesMap =
      await this.translationService.getAvailableLanguages();
    const languages = Object.values(languagesMap);

    return {
      languages,
    };
  }

  /**
   * Get cached translations for a specific language
   * GET /api/translation/cached/:languageCode
   *
   * @param languageCode Language code (e.g., "es", "fr")
   * @returns Object mapping keys to cached translated texts
   */
  @Get('cached/:languageCode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get cached translations',
    description:
      'Retrieves all cached translations for a specific language. Used for mobile offline support.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cached translations retrieved successfully',
    type: CachedTranslationsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No cached translations found for language',
  })
  async getCachedTranslations(
    @Param('languageCode') languageCode: string,
  ): Promise<CachedTranslationsResponseDto> {
    this.logger.log(`Retrieving cached translations for language: ${languageCode}`);

    const result =
      await this.translationService.getCachedTranslations(languageCode);

    return {
      translations: result.translations,
      languageCode,
      count: result.count,
    };
  }

  /**
   * Clear translation cache
   * DELETE /api/translation/cache
   *
   * @param languageCode Optional language code to clear specific language only
   * @returns Number of deleted cached translations
   */
  @Delete('cache')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clear translation cache',
    description:
      'Clears cached translations. Requires admin authentication. Can target specific language or clear all.',
  })
  @ApiQuery({
    name: 'languageCode',
    required: false,
    description: 'Optional language code to clear only that language cache',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cache cleared successfully',
    type: CacheResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Not authorized (admin required)',
  })
  async clearCache(
    @Query('languageCode') languageCode?: string,
  ): Promise<CacheResponseDto> {
    this.logger.log(
      `Clearing cache ${languageCode ? `for language: ${languageCode}` : 'for all languages'}`,
    );

    const deleted = await this.translationService.clearCache(languageCode);

    return {
      count: deleted,
      message: `Cleared ${deleted} cached translations${languageCode ? ` for language ${languageCode}` : ''}`,
    };
  }
}
