import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateConversationDto {
  @ApiProperty({ example: 'active', enum: ['pending', 'active', 'closed'], required: false })
  @IsOptional()
  @IsEnum(['pending', 'active', 'closed'])
  status?: string;
}
