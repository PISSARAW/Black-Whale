import { Module } from '@nestjs/common'
import { PerspectivesController } from './perspectives.controller.js'
import { PerspectivesService } from './perspectives.service.js'

@Module({
  controllers: [PerspectivesController],
  providers: [PerspectivesService],
})
export class PerspectivesModule {}
