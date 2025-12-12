import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ example: 'Hello, is this car still available?' })
  @IsString()
  @MinLength(1)
  content: string;
}
