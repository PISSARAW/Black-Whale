import { BallroomDirector } from './ballroomDirector'
import { moveForSlot } from '../../src/lib/fighting/movesets'
import type { FightSide, MoveSlot } from '../../src/lib/fighting/types'

export class LongBallroomDirector extends BallroomDirector {
  reserve(side: FightSide, minimum = 65) {
    if (
      side === 'player' &&
      this.state.player.kurapika?.emperorTime &&
      this.state.player.aura < minimum
    )
      this.emperor()
    const other = side === 'player' ? 'opponent' : 'player'
    const saved = { ...this.held }
    this.held[side] = { down: true, aura: true }
    this.held[other] = { guard: true }
    for (let attempt = 0; this.state[side].aura < minimum && attempt < 24; attempt++) {
      this.close(side)
      this.hit(side, attempt % 2 ? 'standingHeavy' : 'forwardLight')
      this.ready(side)
    }
    this.held = saved
    this.advance()
  }

  string(side: FightSide, protect = false) {
    const slots: MoveSlot[] =
      side === 'player' ? ['standingLight', 'standingHeavy'] : ['lowLight', 'standingHeavy']
    this.close(side, 4.2)
    this.until(() => this.free('player') && this.free('opponent'))
    const other = side === 'player' ? 'opponent' : 'player'
    const old = { ...this.held }
    this.held[side] = {}
    this.held[other] = {}
    for (const slot of slots) {
      if (protect && !this.state[other].auraExhausted) {
        const zone = moveForSlot(this.state[side].id, slot)!.tuning.targetZone
        const key = {
          head: 'focusHead',
          torso: 'focusTorso',
          hands: 'focusHands',
          feet: 'focusFeet',
        }[zone]
        this.held[other] = { [key]: true }
        this.advance()
      }
      this.execute(side, slot)
    }
    this.held = old
  }

  distance(minimum = 29, side: FightSide = 'player') {
    this.ready(side)
    for (
      let attempt = 0;
      Math.abs(this.state.player.x - this.state.opponent.x) < minimum && attempt < 100;
      attempt++
    )
      this.retreat(side, 2)
  }

  volley(jump = true) {
    this.distance()
    this.ready('opponent')
    this.ready('player')
    const health = this.state.player.health
    this.ranged('opponent')
    this.held.player = jump ? { ...this.direction('player'), jump: true } : { guard: true }
    this.advance(jump ? 25 : 40)
    this.held.player = {}
    this.ready('player')
    this.until(() => this.state.projectiles.length === 0, 75)
    this.audit.push({
      kind: 'range-volley',
      second: this.states.length / 60,
      jump,
      damageTaken: health - this.state.player.health,
    })
  }

  dowsing() {
    this.reserve('player', 40)
    this.close('player', 14)
    this.until(() => this.free('opponent'))
    this.hit('player', 'forwardSpecial')
    this.ready('player')
    this.retreat('player', 15)
  }

  heal() {
    this.reserve('player', 35)
    this.hit('player', 'downSpecial')
    this.ready('player')
  }

  punish() {
    this.close('opponent', 15)
    this.ready('opponent')
    this.move('opponent', 'forwardHeavy')
    this.retreat('player', 4)
    this.advance(16)
    this.held.player = this.direction('player')
    this.advance(1)
    this.held.player = {}
    this.advance(2)
    this.held.player = this.direction('player')
    this.advance(7)
    this.held.player = {}
    this.close('player', 4.2)
    this.execute('player', 'standingLight')
    this.execute('player', 'standingHeavy')
    this.ready('player')
  }

  report() {
    const base = super.report()
    const frames = this.states
    return {
      ...base,
      longForm: true,
      initialHealth: frames[0].player.maxHealth,
      rangeVolleys: this.audit.filter((e) => e.kind === 'range-volley'),
      rangeFrames: frames.filter((s) => Math.abs(s.player.x - s.opponent.x) >= 20).length,
      closeFrames: frames.filter((s) => Math.abs(s.player.x - s.opponent.x) <= 10).length,
      punishHits: this.audit.filter((e) => e.kind === 'impact' && (e.punish || e.counterHit))
        .length,
      emperorActivations: this.audit.filter((e) => e.kind === 'emperor-time-active').length,
    }
  }
}
