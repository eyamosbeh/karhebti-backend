import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { ReportRoadIssueDto, DangerZoneQueryDto, MaintenanceRecommendationDto, GarageRecommendationDto } from './dto/ai.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('AI Features')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('report-road-issue')
  @ApiOperation({ summary: 'Signaler une anomalie routière détectée' })
  @ApiResponse({ status: 201, description: 'Anomalie signalée avec succès' })
  reportRoadIssue(@Body() dto: ReportRoadIssueDto) {
    return this.aiService.reportRoadIssue(dto);
  }

  @Get('danger-zones')
  @ApiOperation({ summary: 'Récupérer les zones dangereuses signalées' })
  @ApiResponse({ status: 200, description: 'Liste des zones dangereuses' })
  getDangerZones(@Query() dto: DangerZoneQueryDto) {
    return this.aiService.getDangerZones(dto);
  }

  @Post('maintenance-recommendations')
  @ApiOperation({ summary: 'Obtenir des recommandations d\'entretien personnalisées' })
  @ApiResponse({ status: 200, description: 'Recommandations d\'entretien basées sur l\'IA' })
  getMaintenanceRecommendations(
    @Body() dto: MaintenanceRecommendationDto,
    @CurrentUser() user: any,
  ) {
    return this.aiService.getMaintenanceRecommendations(dto, user.userId, user.role);
  }

  @Get('garage-recommendation')
  @ApiOperation({ summary: 'Recommander des garages selon le besoin et la localisation' })
  @ApiResponse({ status: 200, description: 'Liste des garages recommandés' })
  getGarageRecommendations(@Query() dto: GarageRecommendationDto) {
    return this.aiService.getGarageRecommendations(dto);
  }
}
