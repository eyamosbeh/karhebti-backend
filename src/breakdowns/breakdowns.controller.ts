
import { Controller, Post, Body, Get, Param, Put, Patch, Delete, Query, Request, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BreakdownsService } from './breakdowns.service';
import { CreateBreakdownDto } from './dto/create-breakdown.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';

/**
 * Contrôleur REST pour la gestion des pannes (MongoDB/Mongoose).
 */
@ApiTags('breakdowns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('breakdowns')
export class BreakdownsController {
  constructor(private readonly service: BreakdownsService) {}

  /**
   * Crée une nouvelle panne.
   */
  @ApiOperation({ summary: 'Créer une nouvelle panne' })
  @ApiBody({ type: CreateBreakdownDto })
  @Post()
  create(@Body() dto: Omit<CreateBreakdownDto, 'userId'>, @CurrentUser() user: any) {
    // On ignore le userId du body, on prend celui du JWT
    const breakdownDto = { ...dto, userId: user.userId };
    return this.service.create(breakdownDto);
  }

  /**
   * Détail d'une panne par id.
   */
  @ApiOperation({ summary: 'Détail d\'une panne par id' })
  @ApiParam({ name: 'id', type: String })
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  /**
   * Liste paginée et filtrée des pannes (query params)
   */
  @ApiOperation({ summary: 'Liste paginée et filtrée des pannes' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @Get()
  findAll(@Query('userId') userId?: string, @Query('status') status?: string, @Query('limit') limit?: number, @Query('offset') offset?: number) {
    return this.service.findAll({ userId, status, limit, offset });
  }

  /**
   * Historique des pannes d'un utilisateur.
   */
  @ApiOperation({ summary: 'Historique des pannes d\'un utilisateur' })
  @ApiParam({ name: 'userId', type: String })
  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.service.findByUser(userId);
  }

  /**
   * Mise à jour du statut d'une panne.
   */
  @ApiOperation({ summary: 'Mise à jour du statut d\'une panne' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateStatusDto })
  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.service.updateStatus(id, dto);
  }

  /**
   * Mise à jour partielle d'une panne (PATCH)
   */
  @ApiOperation({ summary: 'Mise à jour partielle d\'une panne' })
  @ApiParam({ name: 'id', type: String })
  @Patch(':id')
  async patchBreakdown(@Param('id') id: string, @Body() dto: Partial<CreateBreakdownDto>, @CurrentUser() user: any) {
    const breakdown = await this.service.findById(id);
    if (!breakdown) throw new ForbiddenException('Panne non trouvée');
    if (user.role !== 'admin' && breakdown.userId !== user.userId) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos propres pannes');
    }
    return this.service.patchBreakdown(id, dto);
  }

  /**
   * Suppression/annulation d'une panne (DELETE)
   */
  @ApiOperation({ summary: 'Annuler ou supprimer une panne' })
  @ApiParam({ name: 'id', type: String })
  @Delete(':id')
  async deleteBreakdown(@Param('id') id: string, @CurrentUser() user: any) {
    const breakdown = await this.service.findById(id);
    if (!breakdown) throw new ForbiddenException('Panne non trouvée');
    if (user.role !== 'admin' && breakdown.userId !== user.userId) {
      throw new ForbiddenException('Vous ne pouvez supprimer que vos propres pannes');
    }
    return this.service.deleteBreakdown(id);
  }

  /**
   * Assigne un agent à une panne.
   */
  @ApiOperation({ summary: 'Assigner un agent à une panne' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ schema: { properties: { agentId: { type: 'string' } } } })
  @Put(':id/assign')
  assignAgent(@Param('id') id: string, @Body('agentId') agentId: string) {
    return this.service.assignAgent(id, agentId);
  }

  /**
   * Accepter une demande SOS (garage owner)
   */
  @ApiOperation({ summary: 'Accepter une demande SOS' })
  @ApiParam({ name: 'id', type: String, description: 'ID du breakdown' })
  @Put(':id/accept')
  async acceptBreakdown(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.acceptBreakdown(id, user.userId, user.email);
  }

  /**
   * Refuser une demande SOS (garage owner)
   */
  @ApiOperation({ summary: 'Refuser une demande SOS' })
  @ApiParam({ name: 'id', type: String, description: 'ID du breakdown' })
  @Put(':id/refuse')
  async refuseBreakdown(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.refuseBreakdown(id, user.userId, user.email);
  }
}
