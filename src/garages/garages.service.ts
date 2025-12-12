import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Garage, GarageDocument } from './schemas/garage.schema';
import { CreateGarageDto } from './dto/create-garage.dto';
import { UpdateGarageDto } from './dto/update-garage.dto';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import { OsmService } from './osm.service';
import { RepairBaysService } from '../repair-bays/repair-bays.service';

@Injectable()
export class GaragesService {
  constructor(
    @InjectModel(Garage.name) private garageModel: Model<GarageDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    private readonly osmService: OsmService,
    private readonly repairBaysService: RepairBaysService,
  ) {}

  async create(
    createDto: CreateGarageDto,
    numberOfBays: number = 1
  ): Promise<{ garage: Garage; repairBays: any[] }> {
    // Si l'utilisateur n'envoie PAS latitude/longitude → géocodage via OSM
    if (!createDto.latitude || !createDto.longitude) {
      const results = await this.osmService.searchAddress(createDto.adresse);
  
      if (!results || results.length === 0) {
        throw new NotFoundException('Adresse introuvable via OpenStreetMap');
      }
  
      const bestMatch = results[0];
      createDto.latitude = parseFloat(bestMatch.lat);
      createDto.longitude = parseFloat(bestMatch.lon);
    }
  
    // ✅ Ajouter numberOfBays au DTO avant la création
    const garageData = {
      ...createDto,
      numberOfBays: numberOfBays // ✅ Sauvegarder dans la base de données
    };
  
    // Créer le garage
    const created = new this.garageModel(garageData);
    const savedGarage = await created.save();
  
    // Cast _id en string
    const garageId = (savedGarage._id as any).toString();
  
    // Créer automatiquement les créneaux de réparation
    const repairBays = await this.repairBaysService.createMultipleBaysForGarage(
      garageId,
      numberOfBays,
      createDto.heureOuverture,
      createDto.heureFermeture
    );
  
    return { garage: savedGarage, repairBays };
  }

  async findAll(): Promise<Garage[]> {
    return this.garageModel.find().exec();
  }

  async findOne(id: string): Promise<Garage> {
    const garage = await this.garageModel.findById(id).exec();
    if (!garage) throw new NotFoundException('Garage non trouvé');
    return garage;
  }

  async update(id: string, updateDto: UpdateGarageDto): Promise<Garage> {
    const updated = await this.garageModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
    if (!updated) throw new NotFoundException('Garage non trouvé');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.garageModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Garage non trouvé');
  }
}
