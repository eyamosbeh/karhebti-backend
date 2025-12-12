import { Controller, Post, Get, Body, UseGuards, Req, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { SwipesService } from './swipes.service';
import { CreateSwipeDto } from './dto/create-swipe.dto';
import { RespondSwipeDto } from './dto/respond-swipe.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SwipeStatusResponse } from './dto/swipe-status.response';

@ApiTags('swipes')
@Controller('swipes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SwipesController {
  constructor(private readonly swipesService: SwipesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a swipe (left or right) on a car' })
  async createSwipe(@Req() req, @Body() createSwipeDto: CreateSwipeDto) {
    return this.swipesService.createSwipe(req.user.userId, createSwipeDto);
  }

  @Post('respond')
  @ApiOperation({ summary: 'Respond to a swipe (accept or decline)' })
  async respondToSwipe(@Req() req, @Body() respondSwipeDto: RespondSwipeDto) {
    return this.swipesService.respondToSwipe(req.user.userId, respondSwipeDto);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept a pending swipe request' })
  @ApiOkResponse({ description: 'Swipe accepted', type: SwipeStatusResponse })
  async accept(@Req() req, @Param('id') id: string): Promise<SwipeStatusResponse> {
    return this.swipesService.acceptSwipe(req.user.userId, id);
  }

  @Post(':id/decline')
  @ApiOperation({ summary: 'Decline a pending swipe request' })
  @ApiOkResponse({ description: 'Swipe declined', type: SwipeStatusResponse })
  async decline(@Req() req, @Param('id') id: string): Promise<SwipeStatusResponse> {
    return this.swipesService.declineSwipe(req.user.userId, id);
  }

  @Get('my-swipes')
  @ApiOperation({ summary: 'Get all swipes made by current user' })
  async getUserSwipes(@Req() req) {
    return this.swipesService.getUserSwipes(req.user.userId);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending swipes for seller (current user)' })
  async getPendingSwipes(@Req() req) {
    return this.swipesService.getPendingSwipesForSeller(req.user.userId);
  }
}
