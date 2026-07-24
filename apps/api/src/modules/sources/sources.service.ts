import { Injectable, NotFoundException } from '@nestjs/common'
import type { Source } from '@black-whale/domain'

@Injectable()
export class SourcesService {
  async findAll(): Promise<Source[]> {
    return []
  }

  async findOne(id: string): Promise<Source> {
    throw new NotFoundException(`Source not found: ${id}`)
  }
}
