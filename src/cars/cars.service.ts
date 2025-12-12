import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Car, CarDocument } from './schemas/car.schema';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { UploadService } from '../common/services/upload.service';
import { Swipe, SwipeDocument } from '../swipes/schemas/swipe.schema';

@Injectable()
export class CarsService {
  constructor(
    @InjectModel(Car.name) private carModel: Model<CarDocument>,
    @InjectModel(Swipe.name) private swipeModel: Model<SwipeDocument>,
    private uploadService: UploadService,
  ) {}

  async create(createCarDto: CreateCarDto, userId: string): Promise<Car> {
    const createdCar = new this.carModel({
      ...createCarDto,
      user: userId,
    });
    return createdCar.save();
  }

  async findAll(userId: string, userRole: string): Promise<Car[]> {
    // Admin peut voir toutes les voitures, utilisateur seulement les siennes
    const filter = userRole === 'admin' ? {} : { user: userId };
    return this.carModel.find(filter).populate('user', '-motDePasse').exec();
  }

  async findOne(id: string, userId: string, userRole: string): Promise<Car> {
    const car = await this.carModel.findById(id).populate('user', '-motDePasse').exec();
    if (!car) {
      throw new NotFoundException('Voiture non trouvée');
    }

    // Convertir les deux IDs en string pour la comparaison
    const carUserId = (car.user as any)._id?.toString() || car.user.toString();
    // Vérifier que l'utilisateur a accès à cette voiture
    if (userRole !== 'admin' && carUserId !== userId) {
      throw new ForbiddenException('Accès non autorisé à cette voiture');
    }

    return car;
  }

  async update(id: string, updateCarDto: UpdateCarDto, userId: string, userRole: string): Promise<Car> {
    const car = await this.carModel.findById(id);
    if (!car) {
      throw new NotFoundException('Voiture non trouvée');
    }

    // Convertir les deux IDs en string pour la comparaison
    const carUserId = (car.user as any)._id?.toString() || car.user.toString();
    if (userRole !== 'admin' && carUserId !== userId) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos propres voitures');
    }

    const updatedCar = await this.carModel
      .findByIdAndUpdate(id, updateCarDto, { new: true })
      .populate('user', '-motDePasse')
      .exec();

    if (!updatedCar) {
      throw new NotFoundException('Voiture non trouvée');
    }

    return updatedCar;
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const car = await this.carModel.findById(id);
    if (!car) {
      throw new NotFoundException('Voiture non trouvée');
    }

    // Convertir les deux IDs en string pour la comparaison
    const carUserId = (car.user as any)._id?.toString() || car.user.toString();
    if (userRole !== 'admin' && carUserId !== userId) {
      throw new ForbiddenException('Vous ne pouvez supprimer que vos propres voitures');
    }

    await this.carModel.findByIdAndDelete(id).exec();
  }

  async findByUser(userId: string): Promise<Car[]> {
    return this.carModel.find({ user: userId }).exec();
  }

  async uploadImage(
    carId: string,
    file: Express.Multer.File,
    userId: string,
    userRole: string,
  ): Promise<Car> {
    const car = await this.carModel.findById(carId);
    if (!car) {
      throw new NotFoundException('Voiture non trouvée');
    }

    // Check ownership
    const carUserId = (car.user as any)._id?.toString() || car.user.toString();
    if (userRole !== 'admin' && carUserId !== userId) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos propres voitures');
    }

    // Delete old image if exists
    if (car.imageUrl) {
      await this.uploadService.deleteCarImage(car.imageUrl);
    }

    // Process and upload new image
    const processedImage = await this.uploadService.processCarImage(file, carId);

    // Update car with new image data
    car.imageUrl = processedImage.url;
    car.imageMeta = processedImage.metadata;
    await car.save();

    return car;
  }

  // Marketplace methods
  async getAvailableCarsForSwipe(userId: string): Promise<Car[]> {
    // Get IDs of cars already swiped by user
    const swipedCars = await this.swipeModel.find({ userId }).distinct('carId');

    return this.carModel
      .find({
        forSale: true,
        saleStatus: 'available',
        user: { $ne: userId },
        _id: { $nin: swipedCars },
      })
      .populate('user', 'nom prenom email')
      .exec();
  }

  async listCarForSale(carId: string, userId: string): Promise<Car> {
    const car = await this.carModel.findById(carId);
    if (!car) {
      throw new NotFoundException('Car not found');
    }

    // Check ownership
    const carUserId = (car.user as any)._id?.toString() || car.user.toString();
    if (carUserId !== userId) {
      throw new ForbiddenException('You can only list your own cars for sale');
    }

    car.forSale = true;
    car.saleStatus = 'available';
    await car.save();

    return car;
  }

  async unlistCar(carId: string, userId: string): Promise<Car> {
    const car = await this.carModel.findById(carId);
    if (!car) {
      throw new NotFoundException('Car not found');
    }

    // Check ownership
    const carUserId = (car.user as any)._id?.toString() || car.user.toString();
    if (carUserId !== userId) {
      throw new ForbiddenException('You can only unlist your own cars');
    }

    car.forSale = false;
    car.saleStatus = 'not-listed';
    await car.save();

    return car;
  }
}
