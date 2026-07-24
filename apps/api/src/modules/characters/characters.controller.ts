import { Controller, Get, Param, Version } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { CharactersService } from './characters.service.js'

@ApiTags('characters')
@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'List all characters' })
  findAll() {
    return this.charactersService.findAll()
  }

  @Get(':slug')
  @Version('1')
  @ApiOperation({ summary: 'Get a character by slug' })
  findOne(@Param('slug') slug: string) {
    return this.charactersService.findOne(slug)
  }
}
