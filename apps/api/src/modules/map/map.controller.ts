import { Controller, Get, Param, Query, Version } from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { MapService } from './map.service.js'

@ApiTags('map')
@Controller('map')
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'Get the ship map state at a given event' })
  @ApiQuery({ name: 'eventId', required: true })
  getMapState(@Query('eventId') eventId: string) {
    return this.mapService.getMapState(eventId)
  }

  @Get('entities/:entityId/presence')
  @Version('1')
  @ApiOperation({ summary: 'Get entity presence at a given event' })
  @ApiQuery({ name: 'eventId', required: true })
  getEntityPresence(
    @Param('entityId') entityId: string,
    @Query('eventId') eventId: string,
  ) {
    return this.mapService.getEntityPresence(entityId, eventId)
  }
}
