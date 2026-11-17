import { ContinuousDirector } from './continuousDirector'
import { canStartFighterAttack } from '../../src/lib/fighting/fighterAttacks'
import { moveForSlot } from '../../src/lib/fighting/movesets'
import type { FightSide, FightState, MoveSlot } from '../../src/lib/fighting/types'

export class KurapikaVictoryDirector extends ContinuousDirector {
  execute(side: FightSide, slot: MoveSlot, charged = false) {
    const move = moveForSlot(this.state[side].id, slot)!
    if (move.kind === 'light' || move.kind === 'heavy')
      this.until(() => canStartFighterAttack(this.state[side], move.kind, move.id))
    super.execute(side, slot, charged)
  }
  observe(before: FightState) {
    super.observe(before)
    if (!before.opponent.chainJail && this.state.opponent.chainJail)
      this.audit.push({
        kind: 'chain-jail-capture',
        second: this.states.length / 60,
        target: this.state.opponent.id,
        targetNen: this.state.opponent.nen.mode,
      })
  }
  recover(side: FightSide) {
    this.until(() => this.free('player') && this.free('opponent'))
    this.held[side] = { down: true, aura: true }
    this.until(() => this.state[side].aura >= 99.9, 600)
    this.held[side] = {}
    this.advance()
  }
}
