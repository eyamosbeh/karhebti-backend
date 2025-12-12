import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ReclamationsService } from './reclamations.service';
import { CreateReclamationDto } from './dto/create-reclamation.dto';
import { UpdateReclamationDto } from './dto/update-reclamation.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('reclamations')
@UseGuards(JwtAuthGuard)
export class ReclamationsController {
  constructor(private readonly reclamationsService: ReclamationsService) {}

  @Post()
  create(
    @Body() createReclamationDto: CreateReclamationDto,
    @CurrentUser() user: any,
  ) {
    return this.reclamationsService.create(createReclamationDto, user.userId);
  }

  @Get()
  findAll(@Query('userId') userId?: string, @Query('garageId') garageId?: string, @Query('serviceId') serviceId?: string) {
    if (userId) {
      return this.reclamationsService.findByUser(userId);
    }
    if (garageId) {
      return this.reclamationsService.findByGarage(garageId);
    }
    if (serviceId) {
      return this.reclamationsService.findByService(serviceId);
    }
    return this.reclamationsService.findAll();
  }

  @Get('my-reclamations')
  findMyReclamations(@CurrentUser() user: any) {
    return this.reclamationsService.findByUser(user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reclamationsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReclamationDto: UpdateReclamationDto) {
    return this.reclamationsService.update(id, updateReclamationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reclamationsService.remove(id);
  }
}
