import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReplacementHistory, ReplacementHistoryDocument } from './schemas/replacement-history.schema';
import { CreateReplacementHistoryDto } from './dto/create-replacement-history.dto';
import { UpdateReplacementHistoryDto } from './dto/update-replacement-history.dto';
import { PartsService } from '../parts/parts.service';

@Injectable()
export class ReplacementHistoryService {
  constructor(
    @InjectModel(ReplacementHistory.name) private replacementHistoryModel: Model<ReplacementHistoryDocument>,
    private partsService: PartsService,
  ) {}

  async create(createDto: CreateReplacementHistoryDto, userId: string, userRole: string): Promise<ReplacementHistory> {
    await this.partsService.findOne(createDto.piece, userId, userRole);
    const created = new this.replacementHistoryModel(createDto);
    return created.save();
  }

  async findAll(userId: string, userRole: string): Promise<ReplacementHistory[]> {
    return this.replacementHistoryModel.find().populate('piece').exec();
  }

  async findOne(id: string): Promise<ReplacementHistory> {
    const history = await this.replacementHistoryModel.findById(id).populate('piece').exec();
    if (!history) {
      throw new NotFoundException('Historique non trouvé');
    }
    return history;
  }

  async update(id: string, updateDto: UpdateReplacementHistoryDto): Promise<ReplacementHistory> {
    const updated = await this.replacementHistoryModel.findByIdAndUpdate(id, updateDto, { new: true }).populate('piece').exec();
    if (!updated) {
      throw new NotFoundException('Historique non trouvé');
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.replacementHistoryModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Historique non trouvé');
    }
  }
}
