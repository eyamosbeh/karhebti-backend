import { ApiProperty } from '@nestjs/swagger';

export class SwipeStatusResponse {
  @ApiProperty({ enum: ['accepted', 'declined'] })
  status: 'accepted' | 'declined';

  @ApiProperty({ required: false, example: '507f1f77bcf86cd799439011' })
  conversationId?: string;
}
