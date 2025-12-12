import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Maintenance, MaintenanceDocument } from './schemas/maintenance.schema';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { CarsService } from '../cars/cars.service';

@Injectable()
export class MaintenancesService {
  constructor(
    @InjectModel(Maintenance.name) private maintenanceModel: Model<MaintenanceDocument>,
    private carsService: CarsService,
  ) {}

  async create(createMaintenanceDto: CreateMaintenanceDto, userId: string, userRole: string): Promise<Maintenance> {
    // Vérifier que la voiture appartient à l'utilisateur
    await this.carsService.findOne(createMaintenanceDto.voiture, userId, userRole);
    
    const maintenanceData = {
      ...createMaintenanceDto,
      ownerId: userId, // Set the owner
    };
    
    const createdMaintenance = new this.maintenanceModel(maintenanceData);
    return createdMaintenance.save();
  }

  async findAll(userId: string, userRole: string): Promise<Maintenance[]> {
    if (userRole === 'admin') {
      const results = await this.maintenanceModel.find().populate('garage voiture').exec();
      return results.map((m: any) => {
        const obj = (m.toObject && typeof m.toObject === 'function') ? m.toObject() : m;
        obj.displayDate = obj.date || obj.dueAt || obj.createdAt;
        return obj;
      });
    }

    // Récupérer les voitures de l'utilisateur
    const userCars = await this.carsService.findByUser(userId);
    const carIds = userCars.map(car => (car as any)._id);

    const results = await this.maintenanceModel.find({ voiture: { $in: carIds } }).populate('garage voiture').exec();
    return results.map((m: any) => {
      const obj = (m.toObject && typeof m.toObject === 'function') ? m.toObject() : m;
      obj.displayDate = obj.date || obj.dueAt || obj.createdAt;
      return obj;
    });
  }

  async findOne(id: string, userId: string, userRole: string): Promise<Maintenance> {
    // Valider l'ID MongoDB
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID d\'entretien invalide');
    }

    const maintenance = await this.maintenanceModel.findById(id).exec();
    if (!maintenance) {
      throw new NotFoundException('Entretien non trouvé');
    }

    if (userRole !== 'admin') {
      // Vérifier que la voiture appartient à l'utilisateur avant de peupler
      await this.carsService.findOne(maintenance.voiture.toString(), userId, userRole);
    }

    // Peupler après la vérification des permissions
    try {
      await maintenance.populate('garage voiture');
      // expose a consistent displayDate for frontend
      (maintenance as any).displayDate = (maintenance as any).date || (maintenance as any).dueAt || (maintenance as any).createdAt;
    } catch (error) {
      // Si le peuplement échoue (garage ou voiture introuvable), retourner sans peupler
      console.error('Erreur lors du peuplement:', error);
    }

    return maintenance;
  }

  async update(id: string, updateMaintenanceDto: UpdateMaintenanceDto, userId: string, userRole: string): Promise<Maintenance> {
    // Valider l'ID MongoDB
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID d\'entretien invalide');
    }

    const maintenance = await this.maintenanceModel.findById(id).exec();
    if (!maintenance) {
      throw new NotFoundException('Entretien non trouvé');
    }

    if (userRole !== 'admin') {
      await this.carsService.findOne(maintenance.voiture.toString(), userId, userRole);
    }

    const updatedMaintenance = await this.maintenanceModel
      .findByIdAndUpdate(id, updateMaintenanceDto, { new: true })
      .exec();

    if (!updatedMaintenance) {
      throw new NotFoundException('Entretien non trouvé');
    }

    // Peupler après la mise à jour
    try {
      await updatedMaintenance.populate('garage voiture');
      (updatedMaintenance as any).displayDate = (updatedMaintenance as any).date || (updatedMaintenance as any).dueAt || (updatedMaintenance as any).createdAt;
    } catch (error) {
      console.error('Erreur lors du peuplement:', error);
    }

    return updatedMaintenance;
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    // Valider l'ID MongoDB
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID d\'entretien invalide');
    }

    const maintenance = await this.maintenanceModel.findById(id);
    if (!maintenance) {
      throw new NotFoundException('Entretien non trouvé');
    }

    if (userRole !== 'admin') {
      await this.carsService.findOne(maintenance.voiture.toString(), userId, userRole);
    }

    await this.maintenanceModel.findByIdAndDelete(id).exec();
  }

  async findWithFilters(
    userId: string,
    userRole: string,
    filters: {
      search?: string;
      status?: 'planned' | 'done' | 'overdue';
      dateFrom?: string;
      dateTo?: string;
      tags?: string[];
      minCost?: number;
      maxCost?: number;
      minMileage?: number;
      maxMileage?: number;
      sort?: 'dueAt' | 'createdAt' | 'cout' | 'mileage';
      order?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    },
  ) {
    const {
      search,
      status,
      dateFrom,
      dateTo,
      tags,
      minCost,
      maxCost,
      minMileage,
      maxMileage,
      sort = 'dueAt',
      order = 'asc',
      page = 1,
      limit = 20,
    } = filters;

    // Validate limit
    const validLimit = Math.min(limit, 100);
    const skip = (page - 1) * validLimit;

    // Build aggregation pipeline
    const pipeline: any[] = [];

    // Owner scoping - filter by user's cars FIRST
    if (userRole !== 'admin') {
      const userCars = await this.carsService.findByUser(userId);
      const carIds = userCars.map(car => (car as any)._id);
      pipeline.push({
        $match: { voiture: { $in: carIds } }
      });
    }

    // Then add lookups to get car and garage data for searching
    pipeline.push(
      {
        $lookup: {
          from: 'garages',
          localField: 'garage',
          foreignField: '_id',
          as: 'garage',
        },
      },
      { $unwind: { path: '$garage', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'cars',
          localField: 'voiture',
          foreignField: '_id',
          as: 'voiture',
        },
      },
      { $unwind: { path: '$voiture', preserveNullAndEmptyArrays: true } }
    );

    // Search across specific fields
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      pipeline.push({
        $match: {
          $or: [
            { 'voiture.marque': searchRegex },      // Car name
            { 'voiture.modele': searchRegex },      // Car model
            { 'garage.nom': searchRegex },          // Garage name
            { type: searchRegex },                  // Type of maintenance
            { $expr: { $regexMatch: { input: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, regex: searchRegex } } }, // Date as string
            { $expr: { $regexMatch: { input: { $toString: '$cout' }, regex: searchRegex } } } // Price as string
          ]
        }
      });
    }

    // Date range filter (dueAt, not the maintenance date)
    if (dateFrom || dateTo) {
      const dateMatch: any = {};
      if (dateFrom) {
        dateMatch.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        dateMatch.$lte = new Date(dateTo);
      }
      pipeline.push({
        $match: { dueAt: dateMatch }
      });
    }

    // Tags filter
    if (tags && tags.length > 0) {
      pipeline.push({
        $match: { tags: { $in: tags } }
      });
    }

    // Cost range filter
    if (minCost !== undefined || maxCost !== undefined) {
      const costMatch: any = {};
      if (minCost !== undefined) {
        costMatch.$gte = minCost;
      }
      if (maxCost !== undefined) {
        costMatch.$lte = maxCost;
      }
      pipeline.push({
        $match: { cout: costMatch }
      });
    }

    // Mileage range filter
    if (minMileage !== undefined || maxMileage !== undefined) {
      const mileageMatch: any = {};
      if (minMileage !== undefined) {
        mileageMatch.$gte = minMileage;
      }
      if (maxMileage !== undefined) {
        mileageMatch.$lte = maxMileage;
      }
      pipeline.push({
        $match: { mileage: mileageMatch }
      });
    }

    // Add computed overdue field
    pipeline.push({
      $addFields: {
        isOverdue: {
          $and: [
            { $ne: ['$status', 'done'] },
            { $lt: ['$dueAt', new Date()] },
          ],
        },
      },
    });

    // Add a consistent displayDate (prefer `date`, fallback to `dueAt`)
    pipeline.push({
      $addFields: {
        displayDate: { $ifNull: ['$date', '$dueAt'] },
      },
    });

    // Status filter (including computed 'overdue')
    if (status) {
      if (status === 'overdue') {
        pipeline.push({
          $match: {
            isOverdue: true,
          },
        });
      } else {
        pipeline.push({
          $match: {
            status: status,
            isOverdue: false,
          },
        });
      }
    }

    // Sort
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortField: any = {};
    sortField[sort] = sortOrder;
    pipeline.push({ $sort: sortField });

    // Facet for pagination
    pipeline.push({
      $facet: {
        data: [
          { $skip: skip },
          { $limit: validLimit },
        ],
        totalCount: [{ $count: 'count' }],
      },
    });

    const result = await this.maintenanceModel.aggregate(pipeline).exec();
    const data = result[0]?.data || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;

    return {
      data,
      page,
      limit: validLimit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / validLimit),
    };
  }

  async findUpcoming(
    userId: string,
    userRole: string,
    limit: number = 5,
    includePlate: boolean = false,
  ) {
    const matchConditions: any = {
      status: { $ne: 'done' },
      dueAt: { $gte: new Date() },
    };

    // Owner scoping
    if (userRole !== 'admin') {
      const userCars = await this.carsService.findByUser(userId);
      const carIds = userCars.map(car => (car as any)._id);
      matchConditions.voiture = { $in: carIds };
    }

    const pipeline: any[] = [
      { $match: matchConditions },
      { $sort: { dueAt: 1 } },
      { $limit: limit },
    ];

    // Optionally include car plate via lookup
    if (includePlate) {
      pipeline.push({
        $lookup: {
          from: 'cars',
          localField: 'voiture',
          foreignField: '_id',
          as: 'carData',
        },
      });
      pipeline.push({
        $unwind: { path: '$carData', preserveNullAndEmptyArrays: true },
      });
      pipeline.push({
        $project: {
          _id: 1,
          title: 1,
          voiture: '$voiture',
          dueAt: 1,
          displayDate: { $ifNull: ['$date', '$dueAt'] },
          status: 1,
          plate: '$carData.immatriculation',
        },
      });
    } else {
      pipeline.push({
        $project: {
          _id: 1,
          title: 1,
          voiture: '$voiture',
          dueAt: 1,
          displayDate: { $ifNull: ['$date', '$dueAt'] },
          status: 1,
        },
      });
    }

    return this.maintenanceModel.aggregate(pipeline).exec();
  }

  private async hasTextIndex(): Promise<boolean> {
    try {
      const indexes = await this.maintenanceModel.collection.getIndexes();
      return Object.values(indexes).some((index: any) =>
        Object.values(index.key || {}).includes('text'),
      );
    } catch {
      return false;
    }
  }
}
