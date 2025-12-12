
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BreakdownStatus } from '../schemas/breakdown.schema';

export class UpdateStatusDto {
  @ApiProperty({ enum: BreakdownStatus, description: 'Nouveau statut', example: BreakdownStatus.ACCEPTED })
  @IsNotEmpty()
  @IsEnum(BreakdownStatus)
  status: BreakdownStatus;
}
