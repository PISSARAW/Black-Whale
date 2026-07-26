import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import type { Chapter } from '@black-whale/domain'

@Injectable()
export class ChaptersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Chapter[]> {
    const chapters = await this.prisma.chapter.findMany()
    return chapters.map(this.mapPrismaChapterToDomain)
  }

  async findOne(id: string): Promise<Chapter> {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id }
    })
    
    if (!chapter) {
      throw new NotFoundException(`Chapter not found: ${id}`)
    }
    
    return this.mapPrismaChapterToDomain(chapter)
  }

  private mapPrismaChapterToDomain(prismaChapter: any): Chapter {
    return {
      id: prismaChapter.id,
      number: prismaChapter.number,
      title: prismaChapter.title ?? undefined
    }
  }
}
