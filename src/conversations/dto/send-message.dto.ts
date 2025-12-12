import { IsString, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  conversationId: string;

  @ApiProperty({ example: 'Hello, is this car still available?' })
  @IsString()
  content: string;
}
