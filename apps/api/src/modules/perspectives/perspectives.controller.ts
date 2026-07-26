import { Controller, Get, Param, Query, Version } from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { PerspectivesService } from './perspectives.service.js'

@ApiTags('perspectives')
@Controller('perspectives')
export class PerspectivesController {
  constructor(private readonly perspectivesService: PerspectivesService) {}

  @Get('compare')
  @Version('1')
  @ApiOperation({ summary: 'Compare two character perspectives at a given event' })
  @ApiQuery({ name: 'left', required: true })
  @ApiQuery({ name: 'right', required: true })
  @ApiQuery({ name: 'eventId', required: true })
  compare(
    @Query('left') left: string,
    @Query('right') right: string,
    @Query('eventId') eventId: string,
  ) {
    return this.perspectivesService.compare(left, right, eventId)
  }

  @Get(':characterId')
  @Version('1')
  @ApiOperation({ summary: 'Build a perspective for a character at a given event' })
  @ApiQuery({ name: 'eventId', required: true })
  @ApiQuery({ name: 'spoilerLimit', required: false, type: Number })
  @ApiQuery({ name: 'mode', required: false })
  getPerspective(
    @Param('characterId') characterId: string,
    @Query('eventId') eventId: string,
    @Query('spoilerLimit') spoilerLimit?: number,
    @Query('mode') mode?: string,
  ) {
    return this.perspectivesService.buildPerspective({ observerId: characterId, eventId, spoilerLimit, mode: mode as any })
  }
}
