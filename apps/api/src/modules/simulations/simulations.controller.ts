import { Body, Controller, Get, Param, Post, Query, Version } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { SimulationsService } from './simulations.service.js'
import type { CreateSimulationDto, SimulationActionDto } from '@black-whale/contracts'

@ApiTags('simulations')
@Controller('simulations')
export class SimulationsController {
  constructor(private readonly simulationsService: SimulationsService) {}

  @Post()
  @Version('1')
  @ApiOperation({ summary: 'Create a new simulation branch' })
  create(@Body() dto: CreateSimulationDto) {
    return this.simulationsService.createBranch(dto)
  }

  @Get(':branchId')
  @Version('1')
  @ApiOperation({ summary: 'Get the current state of a simulation branch' })
  getState(@Param('branchId') branchId: string) {
    return this.simulationsService.getBranchState(branchId)
  }

  @Get(':branchId/map-scene')
  @Version('1')
  @ApiOperation({ summary: 'Project a simulation branch as a map scene' })
  getMapScene(
    @Param('branchId') branchId: string,
    @Query('assetKey') assetKey = 'black-whale-overview',
  ) {
    return this.simulationsService.getMapScene(branchId, assetKey)
  }

  @Post(':branchId/actions')
  @Version('1')
  @ApiOperation({ summary: 'Apply an action to a simulation branch' })
  applyAction(
    @Param('branchId') branchId: string,
    @Body() dto: SimulationActionDto,
  ) {
    return this.simulationsService.applyAction(branchId, dto)
  }
}
