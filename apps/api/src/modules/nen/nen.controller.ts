import { Body, Controller, Get, Param, Post, Query, Version } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { NenService } from './nen.service.js'
import type { NenValidateRequestDto } from '@black-whale/contracts'

@ApiTags('nen')
@Controller('nen')
export class NenController {
  constructor(private readonly nenService: NenService) {}

  @Get('abilities')
  @Version('1')
  @ApiOperation({ summary: 'List all Nen abilities' })
  listAbilities() {
    return this.nenService.listAbilities()
  }

  @Get('abilities/:abilityId/active')
  @Version('1')
  @ApiOperation({ summary: 'Get active state of an ability at a given event' })
  getActiveState(
    @Param('abilityId') abilityId: string,
    @Query('eventId') eventId: string,
  ) {
    return this.nenService.getActiveState(abilityId, eventId)
  }

  @Post('abilities/:abilityId/validate')
  @Version('1')
  @ApiOperation({ summary: 'Validate a Nen ability interaction' })
  validate(
    @Param('abilityId') abilityId: string,
    @Body() dto: NenValidateRequestDto,
  ) {
    return this.nenService.validate(abilityId, dto)
  }
}
