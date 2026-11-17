import { StrategicDirector } from './strategicDirector'
import { canStartFighterAttack } from '../../src/lib/fighting/fighterAttacks'
import { moveForSlot } from '../../src/lib/fighting/movesets'
import { crossGameBusy } from '../../src/lib/fighting/crossGame'
import type { FightSide, FightState, MoveSlot, FightInput } from '../../src/lib/fighting/types'

export class JudgmentDirector extends StrategicDirector {
  close(side: FightSide, gap = 8.0) {
    super.close(side, gap)
  }
  free(side: FightSide) {
    return super.free(side) && !crossGameBusy(this.state[side])
  }

  execute(side: FightSide, slot: MoveSlot, charged = false) {
    if (this.state.phase !== 'fighting') return
    const move = moveForSlot(this.state[side].id, slot)!
    if (move.kind === 'light' || move.kind === 'heavy')
      this.until(() => canStartFighterAttack(this.state[side], move.kind, move.id))
    const first = this.audit.length
    super.execute(side, slot, charged)
    if (
      !this.audit
        .slice(first)
        .some((e) => e.kind === 'impact' && e.attacker === side && e.move === move.id)
    )
      this.audit.push({
        kind: 'empty-strike',
        second: this.states.length / 60,
        side,
        move: move.id,
        gap: Math.abs(this.state.player.x - this.state.opponent.x),
      })
  }

  route(side: FightSide, low = false) {
    if (this.state.phase !== 'fighting') return
    const route: MoveSlot[] = low
      ? ['lowLight', 'forwardHeavy']
      : side === 'player' && !this.state.player.nen.on
        ? ['standingLight', 'standingLight', 'standingHeavy']
        : ['standingLight', 'standingHeavy']
    this.chain(side, route)
  }

  airRoute(side: FightSide) {
    this.close(side)
    this.until(() => this.free('player') && this.free('opponent'))
    this.held[side] = { ...this.direction(side), jump: true }
    this.advance(9)
    this.held[side] = {}
    this.execute(side, 'airLight')
    this.execute(side, 'airHeavy')
    this.ready(side)
  }

  warn() {
    this.close('player', 12)
    this.until(() => this.free('player') && this.free('opponent'))
    this.move('player', 'neutralSpecial')
    this.advance(20)
    this.held.opponent = this.direction('opponent')
    this.advance(2)
    this.held.opponent = {}
  }

  focus(input: Partial<FightInput>) {
    this.held.opponent = input
    this.advance(3)
  }

  swear(side: FightSide) {
    this.ready(side)
    this.held[side] = { aura: true, hatsu: true }
    this.advance(2)
    this.held[side] = {}
    this.audit.push({
      kind: 'on-command',
      second: this.states.length / 60,
      side,
      accepted: this.state[side].nen.on,
      health: this.state[side].health,
    })
  }

  move(side: FightSide, slot: MoveSlot, input: Partial<FightInput> = {}) {
    const before = this.state
    super.move(side, slot, input)
    if (!before.opponent.biscuitTrueForm && this.state.opponent.biscuitTrueForm)
      this.audit.push({ kind: 'biscuit-transformed', second: this.states.length / 60 })
    if (!before.opponent.crossGame && this.state.opponent.crossGame)
      this.audit.push({
        kind: 'yellow-card',
        second: this.states.length / 60,
        aura: this.state.player.aura,
      })
  }

  observe(before: FightState) {
    super.observe(before)
    const from = before.opponent.crossGame?.phase,
      to = this.state.opponent.crossGame?.phase
    if (from !== to)
      this.audit.push({ kind: `cross-game-${to ?? 'released'}`, second: this.states.length / 60 })
  }

  report() {
    const base = super.report()
    const hits = this.audit.filter((e) => e.kind === 'impact' && !e.avoided)
    const simultaneous = this.states.filter(
      (s) => s.phase === 'fighting' && s.player.nen.on && s.opponent.nen.on,
    )
    return {
      ...base,
      judgmentDuel: true,
      mangaInspired: false,
      initialHealth: this.states[0].player.maxHealth,
      biscuitTechniques: [
        ...new Set(
          this.states
            .filter((s) => !s.opponent.biscuitTrueForm)
            .flatMap((s) => [
              s.opponent.nen.mode,
              ...(Object.values(s.opponent.nen.ryu).some((v) => v > 0) && !s.opponent.nen.on
                ? ['ryu']
                : []),
            ]),
        ),
      ],
      storyEvents: this.audit.filter((e) =>
        /yellow-card|cross-game|biscuit-transformed|on-command/.test(String(e.kind)),
      ),
      emptyStrikes: this.audit.filter((e) => e.kind === 'empty-strike'),
      counterHits: hits.filter((e) => e.counterHit),
      punishHits: hits.filter((e) => e.punish),
      simultaneousOnSeconds: simultaneous.length / 60,
      onHits: Object.fromEntries(
        (['player', 'opponent'] as const).map((side) => [
          side,
          hits.filter(
            (e) =>
              e.attacker === side && this.states[Math.round(Number(e.second) * 60)]?.[side].nen.on,
          ).length,
        ]),
      ),
      trueFormAtVictory: Boolean(this.state.opponent.biscuitTrueForm),
      bothOnAtVictory: this.state.player.nen.on && this.state.opponent.nen.on,
      source:
        'One real fighting duel; two warned disobediences, natural-body transformation, basic Nen defence, timed counters and simultaneous On. Only the initial health is extended.',
    }
  }
}
