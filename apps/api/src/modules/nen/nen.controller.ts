import { Body, Controller, Get, Param, Post, Query, Version } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { NenService } from './nen.service.js'
import { NenValidateRequestDto } from './dto/nen-validate.dto.js'

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
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Validate a Nen ability interaction' })
  validate(
    @Param('abilityId') abilityId: string,
    @Body() dto: NenValidateRequestDto,
  ) {
    return this.nenService.validate(abilityId, dto)
  }

  @Post('abilities/:abilityId/plan')
  @Version('1')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Build the authoritative interaction plan for a Nen ability' })
  plan(
    @Param('abilityId') abilityId: string,
    @Body() dto: NenValidateRequestDto,
  ) {
    return this.nenService.plan(abilityId, dto)
  }
}
