import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import type { Character } from '@black-whale/domain'

@Injectable()
export class CharactersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Character[]> {
    const characters = await this.prisma.character.findMany()
    return characters.map(this.mapPrismaCharacterToDomain)
  }

  async findOne(slug: string): Promise<Character> {
    const character = await this.prisma.character.findUnique({
      where: { slug }
    })
    
    if (!character) {
      throw new NotFoundException(`Character not found: ${slug}`)
    }
    
    return this.mapPrismaCharacterToDomain(character)
  }

  private mapPrismaCharacterToDomain(prismaCharacter: any): Character {
    return {
      id: prismaCharacter.id,
      slug: prismaCharacter.slug,
      canonicalName: prismaCharacter.canonicalName,
      aliases: prismaCharacter.aliases,
      description: prismaCharacter.description ?? undefined,
      narrativeImportance: prismaCharacter.narrativeImportance as any,
      modelingLevel: prismaCharacter.modelingLevel as any,
      firstVisibleEventId: prismaCharacter.firstVisibleEventId,
      portraitAssetId: prismaCharacter.portraitAssetId ?? undefined
    }
  }
}
