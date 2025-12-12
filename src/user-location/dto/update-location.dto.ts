/**
 * DTO pour enregistrer ou mettre à jour la position GPS d'un utilisateur.
 */
export class UpdateLocationDto {
  userId: string;
  latitude: number;
  longitude: number;
}
