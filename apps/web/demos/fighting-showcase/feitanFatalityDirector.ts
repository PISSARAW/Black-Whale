import { ContinuousDirector } from './continuousDirector'
import { canStartFighterAttack } from '../../src/lib/fighting/fighterAttacks'
import { moveForSlot } from '../../src/lib/fighting/movesets'
import type { FightSide, FightState, MoveSlot } from '../../src/lib/fighting/types'

export class FeitanFatalityDirector extends ContinuousDirector {
  execute(side: FightSide, slot: MoveSlot, charged = false) {
    const move = moveForSlot(this.state[side].id, slot)!
    if (move.kind === 'light' || move.kind === 'heavy')
      this.until(() => canStartFighterAttack(this.state[side], move.kind, move.id))
    super.execute(side, slot, charged)
  }
  recover() {
    this.until(() => this.free('player') && this.free('opponent'))
    this.held.player = { down: true, aura: true }
    this.until(() => this.state.player.aura >= 99.9, 600)
    this.held.player = {}
    this.advance()
  }
  observe(before: FightState) {
    super.observe(before)
    const previous = before.player.hatsuEffects.painPacker!,
      pain = this.state.player.hatsuEffects.painPacker!
    if (!previous.armour && pain.armour)
      this.audit.push({
        kind: 'pain-packer-equipped',
        frame: this.states.length,
        pain: pain.packedDamage,
      })
    if (!previous.sun && pain.sun)
      this.audit.push({
        kind: 'rising-sun-ignited',
        frame: this.states.length,
        damage: pain.sun.damage,
        radius: pain.sun.radius,
      })
    if (pain.sun && this.state.opponent.health < before.opponent.health)
      this.audit.push({
        kind: 'solar-burn',
        frame: this.states.length,
        damage: before.opponent.health - this.state.opponent.health,
      })
  }
}
