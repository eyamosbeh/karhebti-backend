import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DocumentEntity, DocumentEntityDocument } from './schemas/document.schema';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { CarsService } from '../cars/cars.service';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(DocumentEntity.name) private documentModel: Model<DocumentEntityDocument>,
    private carsService: CarsService,
  ) {}

  async create(createDto: CreateDocumentDto, userId: string, userRole: string): Promise<DocumentEntity> {
    await this.carsService.findOne(createDto.voiture, userId, userRole);
    // Correction automatique du champ fichier pour tous les nouveaux documents
    if (createDto.fichier && !createDto.fichier.startsWith('/uploads/documents/')) {
      createDto.fichier = '/uploads/documents/' + createDto.fichier.split('/').pop();
    }
    const created = new this.documentModel(createDto);
    return created.save();
  }

  async findAll(userId: string, userRole: string): Promise<DocumentEntity[]> {
    if (userRole === 'admin') {
      return this.documentModel.find().populate('voiture').exec();
    }
    const userCars = await this.carsService.findByUser(userId);
    const carIds = userCars.map(car => (car as any)._id);
    return this.documentModel.find({ voiture: { $in: carIds } }).populate('voiture').exec();
  }

  async findOne(id: string, userId: string, userRole: string): Promise<DocumentEntity> {
    const doc = await this.documentModel.findById(id).populate('voiture').exec();
    if (!doc) {
      throw new NotFoundException('Document non trouvé');
    }
    if (userRole !== 'admin') {
      await this.carsService.findOne(doc.voiture.toString(), userId, userRole);
    }
    return doc;
  }

  async update(id: string, updateDto: UpdateDocumentDto, userId: string, userRole: string): Promise<DocumentEntity> {
    const doc = await this.documentModel.findById(id);
    if (!doc) {
      throw new NotFoundException('Document non trouvé');
    }
    if (userRole !== 'admin') {
      await this.carsService.findOne(doc.voiture.toString(), userId, userRole);
    }
    // Correction automatique du champ fichier pour toutes les mises à jour
    if (updateDto.fichier && !updateDto.fichier.startsWith('/uploads/documents/')) {
      updateDto.fichier = '/uploads/documents/' + updateDto.fichier.split('/').pop();
    }
    const updated = await this.documentModel.findByIdAndUpdate(id, updateDto, { new: true }).populate('voiture').exec();
    if (!updated) {
      throw new NotFoundException('Document non trouvé');
    }
    return updated;
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const doc = await this.documentModel.findById(id);
    if (!doc) {
      throw new NotFoundException('Document non trouvé');
    }
    if (userRole !== 'admin') {
      await this.carsService.findOne(doc.voiture.toString(), userId, userRole);
    }
    await this.documentModel.findByIdAndDelete(id).exec();
  }

  /**
   * Trouvé les documents qui expirent bientôt pour un utilisateur
   */
  async findExpiringDocuments(userId: string, windowDays: number = 7): Promise<DocumentEntity[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + windowDays);
    futureDate.setHours(23, 59, 59, 999);

    // Get user's cars
    const userCars = await this.carsService.findByUser(userId);
    const carIds = userCars.map(car => (car as any)._id);

    // Find documents for this user's cars expiring soon
    return this.documentModel
      .find({
        voiture: { $in: carIds },
        dateExpiration: {
          $gte: today,
          $lte: futureDate,
        },
      })
      .populate('voiture')
      .exec();
  }
}
