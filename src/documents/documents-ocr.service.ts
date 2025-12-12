import { Injectable, Logger } from '@nestjs/common';
import { createWorker, LoggerMessage } from 'tesseract.js';
import { DocumentType, OcrDocumentDataDto } from './dto/ocr-document-response.dto';

@Injectable()
export class DocumentsOcrService {
  private readonly logger = new Logger(DocumentsOcrService.name);

  async extractDocumentData(
    fileBuffer: Buffer,
    typeHint?: DocumentType,
  ): Promise<OcrDocumentDataDto> {
    const rawText = await this.performOcr(fileBuffer);
    const type = this.detectType(rawText, typeHint);
    const { dateEmission, dateExpiration } = this.extractDates(rawText);

    return {
      type,
      dateEmission,
      dateExpiration,
    };
  }

  private async performOcr(fileBuffer: Buffer): Promise<string> {
    this.logger.debug('📷 Lancement de tesseract.js pour extraire le texte');
    const worker = await createWorker(
      'fra',
      undefined,
      {
        logger: (info: LoggerMessage) =>
          this.logger.debug(`OCR: ${info.status} ${Math.round(info.progress * 100)}%`),
      },
    );

    try {
      await worker.load();
      const { data } = await worker.recognize(fileBuffer);
      return data.text ?? '';
    } catch (error) {
      this.logger.warn('⚠️  OCR a échoué, retour d’une chaîne vide', (error as Error).message);
      return '';
    } finally {
      await worker.terminate();
    }
  }

  private detectType(text: string, hint?: DocumentType): DocumentType {
    if (hint && hint !== 'inconnu') {
      return hint;
    }

    const normalized = text.toLowerCase();
    if (normalized.includes('carte grise') || normalized.includes("certificat d'immatriculation")) {
      return 'carte_grise';
    }
    if (normalized.includes('assurance') || normalized.includes("attestation d'assurance")) {
      return 'assurance';
    }
    if (normalized.includes('permis')) {
      return 'permis';
    }
    if (normalized.includes('visite technique') || normalized.includes('contrôle technique')) {
      return 'visite_technique';
    }
    if (
      normalized.includes('vignette') ||
      normalized.includes('taxe de circulation') ||
      normalized.includes('quittance')
    ) {
      return 'vignette';
    }

    return 'inconnu';
  }

  private extractDates(text: string): { dateEmission?: string; dateExpiration?: string } {
    const candidates = this.findDateCandidates(text);
    if (!candidates.length) {
      return {};
    }

    const sorted = candidates.sort((a, b) => a.getTime() - b.getTime());
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    return {
      dateEmission: first.toISOString(),
      dateExpiration: last.toISOString(),
    };
  }

  private findDateCandidates(text: string): Date[] {
    const isoMatches = text.match(/\b\d{4}[\/\-]\d{2}[\/\-]\d{2}\b/g) ?? [];
    const frenchMatches = text.match(/\b\d{2}[\/\-]\d{2}[\/\-]\d{4}\b/g) ?? [];
    return [...isoMatches, ...frenchMatches]
      .map((raw) => this.parseDate(raw))
      .filter((candidate): candidate is Date => Boolean(candidate));
  }

  private parseDate(raw: string): Date | null {
    const cleaned = raw.replace(/\s+/g, '');

    const isoPattern = /^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/;
    const frenchPattern = /^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/;

    let match = cleaned.match(isoPattern);
    if (match) {
      const [, year, month, day] = match;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }

    match = cleaned.match(frenchPattern);
    if (match) {
      const [, day, month, year] = match;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }

    return null;
  }
}
