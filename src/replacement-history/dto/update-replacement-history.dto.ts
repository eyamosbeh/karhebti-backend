import { PartialType } from '@nestjs/swagger';
import { CreateReplacementHistoryDto } from './create-replacement-history.dto';

export class UpdateReplacementHistoryDto extends PartialType(CreateReplacementHistoryDto) {}
