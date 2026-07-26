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

  @Get('scene')
  @Version('1')
  @ApiOperation({ summary: 'Get a perspective-ready map scene at a given event' })
  getMapScene(
    @Query('eventId') eventId: string,
    @Query('assetKey') assetKey = 'black-whale-overview',
  ) {
    return this.mapService.getMapScene(eventId, assetKey)
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
