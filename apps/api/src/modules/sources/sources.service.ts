import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import type { Source, SourceType } from '@black-whale/domain'

@Injectable()
export class SourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Source[]> {
    const sources = await this.prisma.source.findMany()
    return sources.map(this.mapPrismaSourceToDomain)
  }

  async findOne(id: string): Promise<Source> {
    const source = await this.prisma.source.findUnique({
      where: { id }
    })
    
    if (!source) {
      throw new NotFoundException(`Source not found: ${id}`)
    }
    
    return this.mapPrismaSourceToDomain(source)
  }

  private mapPrismaSourceToDomain(prismaSource: any): Source {
    return {
      id: prismaSource.id,
      type: prismaSource.type as SourceType || 'manga' as SourceType,
      chapter: prismaSource.chapterNumber,
      page: prismaSource.page ?? undefined,
      panel: undefined,
      description: prismaSource.description ?? ''
    }
  }
}
