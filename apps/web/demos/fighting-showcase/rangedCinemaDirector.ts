import { RangedDynamicDirector } from './rangedDynamicDirector'
import { moveForSlot } from '../../src/lib/fighting/movesets'
import type { FightSide, MoveSlot, FightInput } from '../../src/lib/fighting/types'

export class RangedCinemaDirector extends RangedDynamicDirector {
  physical(side: FightSide, low = false) {
    if (this.state.phase !== 'fighting') return
    this.chain(
      side,
      side === 'player' && low ? ['lowLight', 'forwardLight'] : ['standingLight', 'standingHeavy'],
    )
  }
  move(side: FightSide, slot: MoveSlot, input: Partial<FightInput> = {}) {
    const before = this.state[side].attack
    const previousMove =
      before && moveForSlot(this.state[side].id, before.moveId?.split(':')[1] as MoveSlot)
    const next = moveForSlot(this.state[side].id, slot)!
    super.move(side, slot, input)
    if (before && this.state[side].attack?.moveId === next.id)
      this.audit.push({
        kind: 'combo-cancel',
        second: this.states.length / 60,
        side,
        from: before.moveId,
        to: next.id,
        confirmedHit: before.confirmedHit,
        legal: Boolean(previousMove?.cancelInto.includes(next.id)),
      })
  }
  gunCombo() {
    this.chain('opponent', ['standingLight', 'standingHeavy', 'forwardSpecial'])
    this.until(() => this.free('opponent') && !this.state.projectiles.length)
  }
  finishWithFranklin() {
    this.distance(26)
    if (this.state.opponent.aura < 56) {
      this.held.opponent = { ...this.direction('opponent', true), down: true, aura: true }
      this.held.player = this.direction('player')
      this.until(() => this.state.opponent.aura >= 56, 300)
      this.held = { player: {}, opponent: {} }
      this.advance()
    }
    this.ready('opponent')
    this.ready('player')
    this.move('opponent', 'finisher')
    this.until(() => this.state.phase === 'finished', 240)
  }
  report() {
    return {
      ...super.report(),
      rangedCinema: true,
      comboCancels: this.audit.filter((e) => e.kind === 'combo-cancel'),
      fatality: {
        source: 'src/lib/fighting/victory/franklin.ts',
        duration: 10,
        winner: 'franklin',
        victim: 'leorio',
        stage: this.state.environment.stageId,
      },
    }
  }
}
