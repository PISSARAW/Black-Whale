import { Injectable, NotFoundException } from '@nestjs/common'
import type { Character } from '@black-whale/domain'

@Injectable()
export class CharactersService {
  // TODO: inject Prisma / DB repository
  async findAll(): Promise<Character[]> {
    return []
  }

  async findOne(slug: string): Promise<Character> {
    // TODO: query DB
    throw new NotFoundException(`Character not found: ${slug}`)
  }
}
