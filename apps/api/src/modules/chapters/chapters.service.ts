import { Injectable, NotFoundException } from '@nestjs/common'
import type { Chapter } from '@black-whale/domain'

@Injectable()
export class ChaptersService {
  async findAll(): Promise<Chapter[]> {
    return []
  }

  async findOne(id: string): Promise<Chapter> {
    throw new NotFoundException(`Chapter not found: ${id}`)
  }
}
