import { Module } from '@nestjs/common'
import { MapController } from './map.controller.js'
import { MapService } from './map.service.js'
import { PrismaModule } from '../prisma/prisma.module.js'

@Module({
  imports: [PrismaModule],
  controllers: [MapController],
  providers: [MapService],
})
export class MapModule {}
