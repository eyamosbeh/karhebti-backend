import { IsIn, IsOptional } from 'class-validator';

export type DocumentTypeHint =
  | 'assurance'
  | 'carte_grise'
  | 'permis'
  | 'visite_technique'
  | 'vignette';

/**
 * Optionnellement utilisé pour orienter l'OCR sur le type de document attendu.
 */
export class OcrDocumentOptionsDto {
  @IsOptional()
  @IsIn(['assurance', 'carte_grise', 'permis', 'visite_technique', 'vignette'])
  typeHint?: DocumentTypeHint;
}
