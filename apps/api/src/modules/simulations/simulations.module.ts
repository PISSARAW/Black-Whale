import { Module } from '@nestjs/common'
import { SimulationsController } from './simulations.controller.js'
import { SimulationsService } from './simulations.service.js'
import { NenModule } from '../nen/nen.module.js'

@Module({
  imports: [NenModule],
  controllers: [SimulationsController],
  providers: [SimulationsService],
})
export class SimulationsModule {}
