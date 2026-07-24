import { Module } from '@nestjs/common'
import { NenController } from './nen.controller.js'
import { NenService } from './nen.service.js'

@Module({
  controllers: [NenController],
  providers: [NenService],
})
export class NenModule {}
