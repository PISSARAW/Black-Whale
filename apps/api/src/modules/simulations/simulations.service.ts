import { Injectable } from '@nestjs/common'
import type { CreateSimulationDto, SimulationActionDto } from '@black-whale/contracts'

@Injectable()
export class SimulationsService {
  async createBranch(dto: CreateSimulationDto) {
    // TODO: delegate to SimulationEngine
    return { id: 'branch_placeholder', ...dto, events: [] }
  }

  async getBranchState(branchId: string) {
    // TODO: delegate to SimulationEngine
    return { branchId, snapshot: null }
  }

  async applyAction(branchId: string, dto: SimulationActionDto) {
    // TODO: delegate to SimulationEngine
    return { branchId, result: null }
  }
}
