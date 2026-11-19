import { beginFight, createFight, performAttack } from '../../src/lib/fighting/engine'
import { performArsenalCommand } from '../../src/lib/fighting/retrospectiveArsenal'
import { performArenaAction } from '../../src/lib/fighting/arenaActions'
import { performAuraAttack } from '../../src/lib/fighting/engine'
import { createArenaState } from '../../src/lib/fighting/arenaTypes'
import { moveForSlot } from '../../src/lib/fighting/movesets'
import { applyAuraContext } from '../../src/lib/fighting/nen'
import {
  EMPTY_INPUT,
  type FightInput,
  type FightSide,
  type MoveSlot,
} from '../../src/lib/fighting/types'
import type { ArsenalCommand } from '../../src/lib/fighting/retrospectiveTypes'
import { lastContactProof } from './lastContactProof'
import { StrategicDirector } from './strategicDirector'

export class LastContactDirector extends StrategicDirector {
  setup() {
    this.cut({
      title: 'LE DERNIER CONTACT',
      subtitle: 'Hisoka × Chrollo',
      tags: ['TOUR CÉLESTE'],
      gap: 8,
    })
    this.state = beginFight(
      createFight('hisoka', 'chrollo', {
        mode: 'versus-local',
        formatId: 'knockout',
        environment: {
          stageId: 'heavens-arena',
          preparation: { mode: 'scenario', resources: ['rooms'], cohorts: [] },
        },
      }),
    )
    this.state = { ...this.state, time: 600, remainingFrames: 36000, arena: createArenaState() }
    for (const side of ['player', 'opponent'] as const)
      this.state[side] = applyAuraContext(
        {
          ...this.state[side],
          x: side === 'player' ? 46 : 54,
          aura: 100,
          health: side === 'player' ? 1300 : 1800,
          maxHealth: side === 'player' ? 1300 : 1800,
        },
        { ...EMPTY_INPUT, aura: true },
      )
  }
  free(side: FightSide) {
    return super.free(side) && !this.state[side].arenaRecovery && !this.state[side].clothCapture
  }
  mark(title: string, subtitle: string, tags: string[] = []) {
    this.beat(title, subtitle, tags)
  }
  move(side: FightSide, slot: MoveSlot, input: Partial<FightInput> = {}) {
    const previous = this.state[side].attack
    super.move(side, slot, input)
    const next = moveForSlot(this.state[side].id, slot)!
    if (previous && this.state[side].attack?.moveId === next.id && previous.moveId !== next.id) {
      const from = moveForSlot(this.state[side].id, previous.moveId?.split(':')[1] as MoveSlot)
      this.audit.push({
        kind: 'combo-cancel',
        second: this.states.length / 60,
        side,
        from: previous.moveId,
        to: next.id,
        confirmedHit: previous.confirmedHit,
        legal: Boolean(from?.cancelInto.includes(next.id)),
      })
    }
  }
  command(side: FightSide, command: ArsenalCommand) {
    this.ready(side)
    const before = this.state
    this.state = performArsenalCommand(this.state, side, command)
    this.audit.push({
      kind: 'arsenal',
      second: this.states.length / 60,
      side,
      ...command,
      accepted: before !== this.state,
    })
    if (before === this.state)
      throw Error(
        `Rejected ${side} ${JSON.stringify(command)} at ${this.states.length / 60}: ${JSON.stringify({ aura: this.state[side].aura, x: this.state[side].x, otherX: this.state[side === 'player' ? 'opponent' : 'player'].x, f: this.state[side] })}`,
      )
    this.advance()
  }
  page(target: string) {
    this.command('opponent', { action: 'history-page', target })
  }
  stampCopy() {
    this.ready('opponent')
    const before = this.state
    this.state = performArenaAction(this.state, 'opponent', performAuraAttack)
    if (this.state === before)
      throw Error(
        'Copy mark rejected: ' +
          JSON.stringify({ f: this.state.opponent, entities: this.state.battlefield?.entities }),
      )
    this.advance(20)
  }
  poseBook() {
    this.book('downSpecial')
    this.advance()
  }
  physical(side: FightSide, index = 0) {
    const player: MoveSlot[][] = [
      ['standingLight', 'standingHeavy', 'lowHeavy'],
      ['standingLight', 'standingHeavy', 'backHeavy'],
      ['lowLight', 'standingHeavy'],
    ]
    const opponent: MoveSlot[][] = [
      ['standingLight', 'backHeavy', 'lowHeavy'],
      ['standingLight', 'backHeavy', 'forwardLight'],
      ['lowLight', 'standingHeavy', 'forwardLight'],
    ]
    this.chain(side, (side === 'player' ? player : opponent)[index % 3])
  }
  exchange(count: number) {
    for (let i = 0; i < count && this.state.phase === 'fighting'; i++) {
      this.physical(i % 2 ? 'opponent' : 'player', i)
    }
  }
  recover(side: FightSide, target = 80) {
    this.ready(side)
    const other = side === 'player' ? 'opponent' : 'player'
    this.held[side] = { down: true, aura: true }
    for (let i = 0; i < 12 && this.state[side].aura < target; i++) {
      this.physical(other, i)
      if (this.state[side].aura < target) {
        this.held[side] = { ...this.direction(side, true), down: true, aura: true }
        this.held[other] = this.direction(other)
        this.advance(35)
        this.held[other] = {}
      }
    }
    this.held[side] = {}
    this.advance()
    if (this.state[side].aura < target) throw Error(`Aura recovery failed ${side}`)
  }
  walk(side: FightSide, x: number) {
    this.ready(side)
    this.until(() => {
      this.held[side] = { [this.state[side].x < x ? 'right' : 'left']: true }
      return Math.abs(this.state[side].x - x) < 1.3
    }, 500)
    this.held[side] = {}
    this.advance()
    this.audit.push({
      kind: 'walk',
      side,
      target: x,
      actual: this.state[side].x,
      second: this.states.length / 60,
    })
  }
  travelToRoom() {
    this.ready('player')
    this.ready('opponent')
    this.held = { player: { right: true }, opponent: { right: true } }
    this.until(() => this.state.opponent.x >= 82, 500)
    this.held = { player: {}, opponent: {} }
    this.walk('player', 78)
    this.walk('opponent', 82)
  }
  projectile(side: FightSide) {
    this.ready(side)
    this.state = performAttack(this.state, side, 'ranged')
    this.advance()
  }
  report() {
    const r = super.report()
    return {
      ...r,
      source:
        'One native versus-local simulation; historical teleport moves Hisoka, no resource resets or healing.',
      lastContact: true,
      proof: lastContactProof(this.states),
      winner: this.state.winner,
      arsenal: this.audit.filter((e) => e.kind === 'arsenal'),
      comboCancels: this.audit.filter((e) => e.kind === 'combo-cancel'),
      openWounds: this.state.player.openWounds,
      stolen: this.state.player.skillHunterStolen,
      sealedWounds: Math.max(...this.states.map((s) => s.player.gumWoundSeals ?? 0)),
    }
  }
}
