import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TranslationAuthException } from './exceptions/translation.exceptions';

/**
 * Translation Configuration Service
 * Manages Azure Translator API credentials and configuration
 * Validates environment variables on initialization
 */
@Injectable()
export class TranslationConfigService {
  private readonly logger = new Logger(TranslationConfigService.name);

  private readonly apiKey: string;
  private readonly endpoint: string;
  private readonly region: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('AZURE_TRANSLATOR_KEY') || '';
    this.endpoint =
      this.configService.get<string>('AZURE_TRANSLATOR_ENDPOINT') || '';
    this.region = this.configService.get<string>('AZURE_TRANSLATOR_REGION') || '';

    this.validateConfiguration();
  }

  /**
   * Validates that all required Azure Translator configuration is present
   * Throws error if any required variable is missing
   */
  private validateConfiguration(): void {
    const missingVars: string[] = [];

    if (!this.apiKey) {
      missingVars.push('AZURE_TRANSLATOR_KEY');
    }
    if (!this.endpoint) {
      missingVars.push('AZURE_TRANSLATOR_ENDPOINT');
    }
    if (!this.region) {
      missingVars.push('AZURE_TRANSLATOR_REGION');
    }

    if (missingVars.length > 0) {
      const errorMsg = `Missing required Azure Translator configuration: ${missingVars.join(', ')}`;
      this.logger.error(errorMsg);
      throw new TranslationAuthException(errorMsg);
    }

    this.logger.log(
      `Translation service configured with endpoint: ${this.endpoint}`,
    );
  }

  /**
   * Get the Azure Translator API key
   */
  getApiKey(): string {
    return this.apiKey;
  }

  /**
   * Get the Azure Translator endpoint URL
   */
  getEndpoint(): string {
    return this.endpoint;
  }

  /**
   * Get the Azure region code
   */
  getRegion(): string {
    return this.region;
  }

  /**
   * Build the full translation API URL
   * Includes base endpoint and API version
   */
  getTranslationUrl(targetLanguage: string, sourceLanguage?: string): string {
    let url = `${this.endpoint}/translate?api-version=3.0&to=${targetLanguage}`;

    if (sourceLanguage) {
      url += `&from=${sourceLanguage}`;
    }

    return url;
  }

  /**
   * Build the languages API URL
   * Used to fetch supported languages
   */
  getLanguagesUrl(): string {
    return `${this.endpoint}/languages?api-version=3.0`;
  }

  /**
   * Get HTTP headers for Azure Translator API requests
   */
  getRequestHeaders(): Record<string, string> {
    return {
      'Ocp-Apim-Subscription-Key': this.apiKey,
      'Ocp-Apim-Subscription-Region': this.region,
      'Content-Type': 'application/json',
    };
  }
}
