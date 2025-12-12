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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MaintenancesService } from './maintenances.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Maintenances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('maintenances')
export class MaintenancesController {
  constructor(private readonly maintenancesService: MaintenancesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un entretien' })
  @ApiResponse({ status: 201, description: 'Entretien créé' })
  create(@Body() createMaintenanceDto: CreateMaintenanceDto, @CurrentUser() user: any) {
    return this.maintenancesService.create(createMaintenanceDto, user.userId, user.role);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les entretiens' })
  @ApiResponse({ status: 200, description: 'Liste des entretiens' })
  findAll(@CurrentUser() user: any) {
    return this.maintenancesService.findAll(user.userId, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un entretien' })
  @ApiResponse({ status: 200, description: 'Détails de l\'entretien' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.maintenancesService.findOne(id, user.userId, user.role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un entretien' })
  @ApiResponse({ status: 200, description: 'Entretien modifié' })
  update(
    @Param('id') id: string,
    @Body() updateMaintenanceDto: UpdateMaintenanceDto,
    @CurrentUser() user: any,
  ) {
    return this.maintenancesService.update(id, updateMaintenanceDto, user.userId, user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un entretien' })
  @ApiResponse({ status: 200, description: 'Entretien supprimé' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.maintenancesService.remove(id, user.userId, user.role);
  }

  @Get('search/filter')
  @ApiOperation({ summary: 'Search and filter maintenances with pagination' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in car name, car model, garage name, maintenance type, date (YYYY-MM-DD), and price' })
  @ApiQuery({ name: 'status', required: false, enum: ['planned', 'done', 'overdue'] })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Due date from (ISO-8601 date)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Due date to (ISO-8601 date)' })
  @ApiQuery({ name: 'tags', required: false, isArray: true, type: String })
  @ApiQuery({ name: 'minCost', required: false, type: Number })
  @ApiQuery({ name: 'maxCost', required: false, type: Number })
  @ApiQuery({ name: 'minMileage', required: false, type: Number })
  @ApiQuery({ name: 'maxMileage', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false, enum: ['dueAt', 'createdAt', 'cout', 'mileage'], description: 'Sort field' })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max: 100, default: 20)' })
  @ApiResponse({ status: 200, description: 'Filtered maintenances with pagination metadata' })
  findWithFilters(@Query() query: any, @CurrentUser() user: any) {
    const tags = query.tags ? (Array.isArray(query.tags) ? query.tags : [query.tags]) : undefined;
    
    return this.maintenancesService.findWithFilters(user.userId, user.role, {
      search: query.search,
      status: query.status,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      tags,
      minCost: query.minCost ? parseFloat(query.minCost) : undefined,
      maxCost: query.maxCost ? parseFloat(query.maxCost) : undefined,
      minMileage: query.minMileage ? parseInt(query.minMileage) : undefined,
      maxMileage: query.maxMileage ? parseInt(query.maxMileage) : undefined,
      sort: query.sort,
      order: query.order,
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
    });
  }

  @Get('upcoming/widget')
  @ApiOperation({ summary: 'Get upcoming maintenances for widget' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items (default: 5)' })
  @ApiQuery({ name: 'includePlate', required: false, type: Boolean, description: 'Include car plate number' })
  @ApiResponse({ status: 200, description: 'Upcoming maintenances sorted by due date' })
  findUpcoming(@Query() query: any, @CurrentUser() user: any) {
    const limit = query.limit ? parseInt(query.limit) : 5;
    const includePlate = query.includePlate === 'true';
    
    return this.maintenancesService.findUpcoming(user.userId, user.role, limit, includePlate);
  }
}
