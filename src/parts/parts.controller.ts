import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PartsService } from './parts.service';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Parts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parts')
export class PartsController {
  constructor(private readonly partsService: PartsService) {}

  @Post()
  create(@Body() createPartDto: CreatePartDto, @CurrentUser() user: any) {
    return this.partsService.create(createPartDto, user.userId, user.role);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.partsService.findAll(user.userId, user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.partsService.findOne(id, user.userId, user.role);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePartDto: UpdatePartDto, @CurrentUser() user: any) {
    return this.partsService.update(id, updatePartDto, user.userId, user.role);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.partsService.remove(id, user.userId, user.role);
  }
}
