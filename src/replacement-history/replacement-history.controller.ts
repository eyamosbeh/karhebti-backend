import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReplacementHistoryService } from './replacement-history.service';
import { CreateReplacementHistoryDto } from './dto/create-replacement-history.dto';
import { UpdateReplacementHistoryDto } from './dto/update-replacement-history.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Replacement History')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('replacement-history')
export class ReplacementHistoryController {
  constructor(private readonly service: ReplacementHistoryService) {}

  @Post()
  create(@Body() createDto: CreateReplacementHistoryDto, @CurrentUser() user: any) {
    return this.service.create(createDto, user.userId, user.role);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.userId, user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateReplacementHistoryDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
