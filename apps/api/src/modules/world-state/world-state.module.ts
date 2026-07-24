import { Module } from '@nestjs/common'
import { WorldStateController } from './world-state.controller.js'
import { WorldStateService } from './world-state.service.js'

@Module({
  controllers: [WorldStateController],
  providers: [WorldStateService],
  exports: [WorldStateService],
})
export class WorldStateModule {}
