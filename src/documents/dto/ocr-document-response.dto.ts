export type DocumentType =
  | 'assurance'
  | 'carte_grise'
  | 'permis'
  | 'visite_technique'
  | 'vignette'
  | 'inconnu';

export class OcrDocumentDataDto {
  type: DocumentType;
  dateEmission?: string;
  dateExpiration?: string;
}

export class OcrDocumentResponseDto {
  success: boolean;
  data: OcrDocumentDataDto;
}
