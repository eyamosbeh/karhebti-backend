import {
  BadRequestException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Exception for Azure Translator API errors
 * Handles authentication, rate limiting, and server errors
 */
export class TranslationApiException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    details?: Record<string, any>,
  ) {
    const response = {
      message,
      statusCode,
      ...(details && { details }),
    };
    super(response, statusCode);
  }
}

/**
 * Exception for unsupported language codes
 * Thrown when user requests translation to non-existent language
 */
export class InvalidLanguageException extends BadRequestException {
  constructor(languageCode: string, supportedLanguages?: string[]) {
    const message = `Language code "${languageCode}" is not supported by Azure Translator`;
    const details =
      supportedLanguages && supportedLanguages.length > 0
        ? {
            receivedLanguage: languageCode,
            supportedLanguages: supportedLanguages.slice(0, 10),
          }
        : undefined;

    super({
      message,
      statusCode: HttpStatus.BAD_REQUEST,
      ...(details && { details }),
    });
  }
}

/**
 * Exception for translation request limit exceeded
 * Thrown when batch size or rate limits are exceeded
 */
export class TranslationLimitException extends HttpException {
  constructor(limitType: string, limit: number, provided: number) {
    const message = `${limitType} limit exceeded. Maximum: ${limit}, Provided: ${provided}`;

    super(
      {
        message,
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        details: {
          limitType,
          maximum: limit,
          provided,
        },
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

/**
 * Exception for authentication failures with Azure API
 * Thrown when API key or credentials are invalid
 */
export class TranslationAuthException extends UnauthorizedException {
  constructor(message: string = 'Azure Translator authentication failed') {
    super({
      message,
      statusCode: HttpStatus.UNAUTHORIZED,
      details: {
        recommendation:
          'Verify AZURE_TRANSLATOR_KEY and AZURE_TRANSLATOR_ENDPOINT are correct',
      },
    });
  }
}

/**
 * Exception for network and connection errors
 * Thrown when Azure API is unreachable
 */
export class TranslationNetworkException extends InternalServerErrorException {
  constructor(originalError?: Error) {
    const message = 'Failed to connect to Azure Translator service';

    super({
      message,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      ...(originalError && { details: { error: originalError.message } }),
    });
  }
}

/**
 * Exception for validation errors in translation data
 */
export class TranslationValidationException extends BadRequestException {
  constructor(field: string, reason: string) {
    super({
      message: `Validation failed for field "${field}": ${reason}`,
      statusCode: HttpStatus.BAD_REQUEST,
      details: {
        field,
        reason,
      },
    });
  }
}
