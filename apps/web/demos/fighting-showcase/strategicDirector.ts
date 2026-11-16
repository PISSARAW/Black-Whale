import type { FightSide, FightState, MoveSlot } from '../../src/lib/fighting/types'
import { ContinuousDirector } from './continuousDirector'

export class StrategicDirector extends ContinuousDirector {
  beat(title: string, subtitle: string, tags: string[]) {
    this.caption(title, subtitle, tags)
    this.audit.push({ kind: 'beat', second: this.states.length / 60, title })
  }

  guarded(side: FightSide, slot: MoveSlot) {
    const other = side === 'player' ? 'opponent' : 'player'
    this.close(side)
    this.until(() => this.free(side) && this.free(other))
    this.held[other] = { guard: true, aura: true }
    this.advance(3)
    this.hit(side, slot)
    this.ready(side)
    this.held[other] = {}
  }

  observe(before: FightState) {
    super.observe(before)
    if (
      before.player.nen.on &&
      before.opponent.nen.ken &&
      this.state.impact?.sequence !== before.impact?.sequence &&
      this.state.impact?.blocked
    )
      this.audit.push({ kind: 'on-ken-block', second: this.states.length / 60 })
    for (const side of ['player', 'opponent'] as const) {
      if (!before[side].nen.on && this.state[side].nen.on)
        this.audit.push({
          kind: 'on-oath',
          side,
          second: this.states.length / 60,
          grudge: this.state[side].on?.grudge,
        })
      if (before[side].nen.on && !this.state[side].nen.on)
        this.audit.push({ kind: 'on-collapse', side, second: this.states.length / 60 })
      if (!before[side].on?.sealFrames && this.state[side].on?.sealFrames)
        this.audit.push({ kind: 'on-seal', side, second: this.states.length / 60 })
    }
  }

  report() {
    const report = super.report()
    const firstSun = this.states.findIndex((state) => state.player.hatsuEffects.sunMark > 0)
    const detonation = this.audit.find((event) => event.kind === 'sun-moon-detonation')
    return {
      ...report,
      mangaInspired: true,
      winner: this.state.winner,
      onVariant: 'The Last Mission-inspired game mechanic; not part of the manga duel.',
      beats: this.audit.filter((event) => event.kind === 'beat'),
      onEvents: this.audit.filter((event) => String(event.kind).startsWith('on-')),
      sunTrapAgeSeconds: detonation ? Number(detonation.second) - firstSun / 60 : 0,
    }
  }
}
