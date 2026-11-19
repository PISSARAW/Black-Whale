import { RangedDuelDirector } from './rangedDuelDirector'
import type { FightSide, FightState } from '../../src/lib/fighting/types'

export class RangedDynamicDirector extends RangedDuelDirector {
  private leader: FightSide | null = null
  close(side: FightSide, gap = 6.6) {
    super.close(side, gap)
  }
  distance(gap = 26) {
    const available =
      this.state.player.x < this.state.opponent.x
        ? this.state.opponent.x - 7
        : 93 - this.state.opponent.x
    super.distance(Math.min(gap, available - 0.15))
  }
  physical(side: FightSide, low = false) {
    if (!low || side !== 'player') return super.physical(side, low)
    if (this.state.phase !== 'fighting') return
    this.ready('opponent')
    this.held.opponent = { aura: true, down: true }
    this.close(side)
    this.held.opponent = {}
    this.advance()
    this.chain(side, ['lowLight', 'forwardLight'])
  }
  combos(side: FightSide, count: number) {
    for (let i = 0; i < count && this.state.phase === 'fighting'; i++)
      this.physical(side, i % 2 === 1)
  }
  punishCast() {
    this.distance(22)
    this.ranged('opponent')
    this.advance(8)
    this.move('player', 'neutralSpecial')
    this.until(() => this.free('player') && this.free('opponent') && !this.state.projectiles.length)
    this.audit.push({ kind: 'crossfire', second: this.states.length / 60 })
  }
  remote(dodge = false) {
    this.ready('player')
    if (this.state.player.aura < 41) {
      this.held.player = { ...this.direction('player', true), down: true, aura: true }
      this.advance(Math.ceil((41 - this.state.player.aura) * 6))
      this.held.player = {}
      this.advance()
    }
    super.remote(dodge)
  }
  observe(before: FightState) {
    super.observe(before)
    const difference = this.state.player.health - this.state.opponent.health
    if (!difference) return
    const leader = difference > 0 ? 'player' : 'opponent'
    if (leader !== this.leader) {
      this.audit.push({ kind: 'lead-change', second: this.states.length / 60, leader })
      this.leader = leader
    }
  }
  report() {
    return {
      ...super.report(),
      rangedDynamic: true,
      reversals: this.audit.filter((event) => event.kind === 'lead-change'),
    }
  }
}
