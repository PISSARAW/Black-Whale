import { Controller, Get, Param, Version } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ChaptersService } from './chapters.service.js'

@ApiTags('chapters')
@Controller('chapters')
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'List all chapters' })
  findAll() {
    return this.chaptersService.findAll()
  }

  @Get(':id')
  @Version('1')
  @ApiOperation({ summary: 'Get a chapter by ID' })
  findOne(@Param('id') id: string) {
    return this.chaptersService.findOne(id)
  }
}
