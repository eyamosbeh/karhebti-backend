import { PartialType } from '@nestjs/swagger';
import { CreateRepairBayDto } from './create-repair-bay.dto';

export class UpdateRepairBayDto extends PartialType(CreateRepairBayDto) {}
