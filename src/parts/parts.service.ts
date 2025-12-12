import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Part, PartDocument } from './schemas/part.schema';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';
import { CarsService } from '../cars/cars.service';

@Injectable()
export class PartsService {
  constructor(
    @InjectModel(Part.name) private partModel: Model<PartDocument>,
    private carsService: CarsService,
  ) {}

  async create(createPartDto: CreatePartDto, userId: string, userRole: string): Promise<Part> {
    await this.carsService.findOne(createPartDto.voiture, userId, userRole);
    const createdPart = new this.partModel(createPartDto);
    return createdPart.save();
  }

  async findAll(userId: string, userRole: string): Promise<Part[]> {
    if (userRole === 'admin') {
      return this.partModel.find().populate('voiture').exec();
    }
    const userCars = await this.carsService.findByUser(userId);
    const carIds = userCars.map(car => (car as any)._id);
    return this.partModel.find({ voiture: { $in: carIds } }).populate('voiture').exec();
  }

  async findOne(id: string, userId: string, userRole: string): Promise<Part> {
    const part = await this.partModel.findById(id).populate('voiture').exec();
    if (!part) {
      throw new NotFoundException('Pièce non trouvée');
    }
    if (userRole !== 'admin') {
      await this.carsService.findOne(part.voiture.toString(), userId, userRole);
    }
    return part;
  }

  async update(id: string, updatePartDto: UpdatePartDto, userId: string, userRole: string): Promise<Part> {
    const part = await this.partModel.findById(id);
    if (!part) {
      throw new NotFoundException('Pièce non trouvée');
    }
    if (userRole !== 'admin') {
      await this.carsService.findOne(part.voiture.toString(), userId, userRole);
    }
    const updated = await this.partModel.findByIdAndUpdate(id, updatePartDto, { new: true }).populate('voiture').exec();
    if (!updated) {
      throw new NotFoundException('Pièce non trouvée');
    }
    return updated;
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const part = await this.partModel.findById(id);
    if (!part) {
      throw new NotFoundException('Pièce non trouvée');
    }
    if (userRole !== 'admin') {
      await this.carsService.findOne(part.voiture.toString(), userId, userRole);
    }
    await this.partModel.findByIdAndDelete(id).exec();
  }
}
