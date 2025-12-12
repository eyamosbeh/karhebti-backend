import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Service, ServiceDocument } from './schemas/service.schema';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Garage } from '../garages/schemas/garage.schema';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    @InjectModel(Garage.name) private garageModel: Model<any>,
  ) {}

  async create(createDto: CreateServiceDto, userId: string): Promise<Service & { _id: Types.ObjectId }> {
    try {
      // Verify garage exists
      const garage = await this.garageModel.findById(createDto.garage);
      if (!garage) {
        throw new NotFoundException('Garage non trouvé');
      }

      // Check if service already exists for this garage
      const existingService = await this.serviceModel.findOne({
        type: createDto.type,
        garage: createDto.garage
      });

      if (existingService) {
        throw new BadRequestException(`Le service "${createDto.type}" existe déjà pour ce garage`);
      }

      const serviceData: any = {
        ...createDto,
        createdBy: new Types.ObjectId(userId),
      };

      const created = new this.serviceModel(serviceData);
      const saved = await created.save();
      
      // Fixed: Use populate() on the model, not the promise
      const populatedService = await this.serviceModel
        .findById(saved._id)
        .populate('garage', 'nom adresse telephone noteUtilisateur')
        .populate('createdBy', 'nom prenom email')
        .exec();

      return populatedService as Service & { _id: Types.ObjectId };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Erreur lors de la création du service: ${error.message}`);
    }
  }

  async findByGarage(garageId: string): Promise<(Service & { _id: Types.ObjectId })[]> {
    if (!Types.ObjectId.isValid(garageId)) {
      throw new BadRequestException('ID garage invalide');
    }

    const services = await this.serviceModel.find({ garage: garageId })
      .populate({
        path: 'garage',
        select: 'nom adresse telephone noteUtilisateur',
        model: 'Garage'
      })
      // ✅ ADD THIS LINE - populate createdBy
      .populate('createdBy', 'nom prenom email')
      .sort({ type: 1 })
      .exec();

    return services as (Service & { _id: Types.ObjectId })[];
}


  async findByGarageId(garageId: string): Promise<(Service & { _id: Types.ObjectId })[]> {
    if (!Types.ObjectId.isValid(garageId)) {
      throw new BadRequestException('ID garage invalide');
    }

    const garage = await this.garageModel.findById(garageId).select('nom adresse telephone');
    if (!garage) {
      throw new NotFoundException('Garage non trouvé');
    }

    const services = await this.serviceModel.find({ garage: garageId })
      .populate({
        path: 'garage',
        select: 'nom adresse telephone noteUtilisateur',
        model: 'Garage'
      })
      .populate('createdBy', 'nom prenom')
      .sort({ type: 1 })
      .exec();

    // Fixed: Type assertion for populated documents
    return services as (Service & { _id: Types.ObjectId })[];
  }

  async findOne(id: string): Promise<Service & { _id: Types.ObjectId }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID service invalide');
    }

    const service = await this.serviceModel.findById(id)
      .populate('garage', 'nom adresse telephone noteUtilisateur')
      .populate('createdBy', 'nom prenom email')
      .exec();

    if (!service) {
      throw new NotFoundException('Service non trouvé');
    }

    // Fixed: Type assertion for populated document
    return service as Service & { _id: Types.ObjectId };
  }

  async update(id: string, updateDto: UpdateServiceDto, userId: string): Promise<Service & { _id: Types.ObjectId }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID service invalide');
    }

    const service = await this.serviceModel.findById(id);
    if (!service) {
      throw new NotFoundException('Service non trouvé');
    }

    // Fixed: Check if createdBy exists before accessing toString()
    if (service.createdBy && service.createdBy.toString() !== userId) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos propres services');
    }

    // Validate garage exists if updating garage reference
    if (updateDto.garage) {
      if (!Types.ObjectId.isValid(updateDto.garage)) {
        throw new BadRequestException('ID garage invalide');
      }
      
      const garage = await this.garageModel.findById(updateDto.garage);
      if (!garage) {
        throw new NotFoundException('Garage non trouvé');
      }

      // Check if service type already exists in new garage
      const existingService = await this.serviceModel.findOne({
        type: updateDto.type || service.type,
        garage: updateDto.garage,
        _id: { $ne: id }
      });

      if (existingService) {
        throw new BadRequestException(`Le service "${updateDto.type || service.type}" existe déjà dans le garage cible`);
      }
    }

    const updated = await this.serviceModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Service non trouvé');
    }

    // Fixed: Use populate() on the model, not the promise
    const populatedUpdated = await this.serviceModel
      .findById(updated._id)
      .populate('garage', 'nom adresse telephone')
      .populate('createdBy', 'nom prenom email')
      .exec();

    // Fixed: Type assertion for populated document
    return populatedUpdated as Service & { _id: Types.ObjectId };
  }

  async remove(id: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID service invalide');
    }

    const service = await this.serviceModel.findById(id);
    if (!service) {
      throw new NotFoundException('Service non trouvé');
    }

    // Fixed: Check if createdBy exists before accessing toString()
    if (service.createdBy && service.createdBy.toString() !== userId) {
      throw new ForbiddenException('Vous ne pouvez supprimer que vos propres services');
    }

    const result = await this.serviceModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Service non trouvé');
    }
  }

  // Method used by garages controller for cleanup
  async deleteAllByGarage(garageId: string): Promise<void> {
    if (!Types.ObjectId.isValid(garageId)) {
      throw new BadRequestException('ID garage invalide');
    }
    
    await this.serviceModel.deleteMany({ garage: garageId }).exec();
  }

  async search(type: string, garageId?: string, page: number = 1, limit: number = 10): Promise<{
    services: (Service & { _id: Types.ObjectId })[],
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }> {
    const query: any = { type };
    
    if (garageId && Types.ObjectId.isValid(garageId)) {
      query.garage = garageId;
    }

    const skip = (page - 1) * limit;
    
    const [services, total] = await Promise.all([
      this.serviceModel.find(query)
        .populate('garage', 'nom adresse telephone noteUtilisateur')
        .populate('createdBy', 'nom prenom')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.serviceModel.countDocuments(query)
    ]);

    // Fixed: Type assertion for populated documents
    return {
      services: services as (Service & { _id: Types.ObjectId })[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findAll(): Promise<(Service & { _id: Types.ObjectId })[]> {
    const services = await this.serviceModel.find()
      .populate({
        path: 'garage',
        select: 'nom adresse telephone noteUtilisateur',
        model: 'Garage'
      })
      .populate('createdBy', 'nom prenom email')
      .sort({ createdAt: -1 })
      .exec();

    // Fixed: Type assertion for populated documents
    return services as (Service & { _id: Types.ObjectId })[];
  }
}
