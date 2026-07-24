import { Controller, Get, Param, Version } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { SourcesService } from './sources.service.js'

@ApiTags('sources')
@Controller('sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'List all sources' })
  findAll() {
    return this.sourcesService.findAll()
  }

  @Get(':id')
  @Version('1')
  @ApiOperation({ summary: 'Get a source by ID' })
  findOne(@Param('id') id: string) {
    return this.sourcesService.findOne(id)
  }
}
