import { Controller, Get, Query, Version } from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { WorldStateService } from './world-state.service.js'

@ApiTags('world-state')
@Controller('world-state')
export class WorldStateController {
  constructor(private readonly worldStateService: WorldStateService) {}

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'Reconstruct the world state at a given event' })
  @ApiQuery({ name: 'eventId', required: false })
  @ApiQuery({ name: 'chapterId', required: false })
  @ApiQuery({ name: 'spoilerLimit', required: false, type: Number })
  getWorldState(
    @Query('eventId') eventId?: string,
    @Query('chapterId') chapterId?: string,
    @Query('spoilerLimit') spoilerLimit?: string,
  ) {
    return this.worldStateService.getWorldState({
      eventId,
      chapterId,
      spoilerLimit: this.parseSpoilerLimit(spoilerLimit),
    })
  }

  @Get('events')
  @Version('1')
  @ApiOperation({ summary: 'List canonical narrative events with their global cursor' })
  listEvents(@Query('spoilerLimit') spoilerLimit?: string) {
    return this.worldStateService.listEvents(this.parseSpoilerLimit(spoilerLimit))
  }

  private parseSpoilerLimit(value?: string) {
    if (value === undefined) return undefined
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : undefined
  }
}
