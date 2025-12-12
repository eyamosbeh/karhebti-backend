import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.motDePasse, 10);
    const createdUser = new this.userModel({
      ...createUserDto,
      motDePasse: hashedPassword,
    });
    return createdUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-motDePasse').exec();
  }

  async findOne(id: string): Promise<User> {
    // Validate ObjectId format
    if (!id || typeof id !== 'string' || id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new NotFoundException(`Utilisateur non trouvé (ID invalide: ${id})`);
    }
    
    const user = await this.userModel.findById(id).select('-motDePasse').exec();
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUserId: string, currentUserRole: string): Promise<User> {
    // Vérification: l'utilisateur ne peut modifier que son propre profil, sauf s'il est admin
    if (currentUserRole !== 'admin' && id !== currentUserId) {
      throw new ForbiddenException('Vous ne pouvez modifier que votre propre profil');
    }

    if (updateUserDto.motDePasse) {
      updateUserDto.motDePasse = await bcrypt.hash(updateUserDto.motDePasse, 10);
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select('-motDePasse')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return updatedUser;
  }

  async remove(id: string, currentUserRole: string): Promise<void> {
    if (currentUserRole !== 'admin') {
      throw new ForbiddenException('Seuls les administrateurs peuvent supprimer des utilisateurs');
    }

    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
  }

  async updateRole(id: string, role: string): Promise<User> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, { role }, { new: true })
      .select('-motDePasse')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return updatedUser;
  }

  async updateDeviceToken(userId: string, deviceToken: string): Promise<User> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        { deviceToken },
        { new: true },
      )
      .select('-motDePasse')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return updatedUser;
  }

  async findGarageOwners(): Promise<User[]> {
    return this.userModel
      .find({ role: 'propGarage' })
      .select('-motDePasse')
      .exec();
  }
}
