import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reclamation, ReclamationDocument } from './schemas/reclamation.schema';
import { CreateReclamationDto } from './dto/create-reclamation.dto';
import { UpdateReclamationDto } from './dto/update-reclamation.dto';

@Injectable()
export class ReclamationsService {
  constructor(
    @InjectModel(Reclamation.name)
    private reclamationModel: Model<ReclamationDocument>,
  ) {}

  async create(createReclamationDto: CreateReclamationDto, userId: string): Promise<Reclamation> {
    const reclamation = new this.reclamationModel({
      ...createReclamationDto,
      user: userId,
    });
    return reclamation.save();
  }

  async findAll(): Promise<Reclamation[]> {
    return this.reclamationModel
      .find()
      .populate('user', 'nom prenom email')
      .populate('garage', 'nom adresse')
      .populate('service', 'nom description')
      .exec();
  }

  async findByUser(userId: string): Promise<Reclamation[]> {
    return this.reclamationModel
      .find({ user: userId })
      .populate('garage', 'nom adresse')
      .populate('service', 'nom description')
      .exec();
  }

  async findByGarage(garageId: string): Promise<Reclamation[]> {
    return this.reclamationModel
      .find({ garage: garageId, type: 'garage' })
      .populate('user', 'nom prenom email')
      .exec();
  }

  async findByService(serviceId: string): Promise<Reclamation[]> {
    return this.reclamationModel
      .find({ service: serviceId, type: 'service' })
      .populate('user', 'nom prenom email')
      .exec();
  }

  async findOne(id: string): Promise<Reclamation> {
    const reclamation = await this.reclamationModel
      .findById(id)
      .populate('user', 'nom prenom email')
      .populate('garage', 'nom adresse')
      .populate('service', 'nom description')
      .exec();

    if (!reclamation) {
      throw new NotFoundException(`Réclamation avec l'ID ${id} introuvable`);
    }
    return reclamation;
  }

  async update(id: string, updateReclamationDto: UpdateReclamationDto): Promise<Reclamation> {
    const reclamation = await this.reclamationModel
      .findByIdAndUpdate(id, updateReclamationDto, { new: true })
      .populate('user', 'nom prenom email')
      .populate('garage', 'nom adresse')
      .populate('service', 'nom description')
      .exec();

    if (!reclamation) {
      throw new NotFoundException(`Réclamation avec l'ID ${id} introuvable`);
    }
    return reclamation;
  }

  async remove(id: string): Promise<void> {
    const result = await this.reclamationModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Réclamation avec l'ID ${id} introuvable`);
    }
  }
}
