import { ContinuousDirector } from './continuousDirector'
import { canStartFighterAttack } from '../../src/lib/fighting/fighterAttacks'
import { moveForSlot } from '../../src/lib/fighting/movesets'
import { catsNamePhase } from '../../src/lib/fighting/camillaCat'
import type { FightSide, FightState, MoveSlot } from '../../src/lib/fighting/types'

export class CatsDirector extends ContinuousDirector {
  close(side: FightSide, gap = 8) {
    if (!this.state.catsName) super.close(side, gap)
  }

  execute(side: FightSide, slot: MoveSlot, charged = false) {
    if (this.state.catsName || this.state.phase !== 'fighting') return
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
      })
  }

  route(low = false) {
    if (this.state.catsName || this.state.phase !== 'fighting') return
    this.chain('player', low ? ['lowLight', 'standingHeavy'] : ['standingLight', 'backHeavy'])
  }

  observe(before: FightState) {
    super.observe(before)
    const phase = this.state.catsName ? catsNamePhase(this.state.catsName.frame) : undefined
    const previous = before.catsName ? catsNamePhase(before.catsName.frame) : undefined
    if (phase !== previous)
      this.audit.push({
        kind: `cat-${phase ?? 'complete'}`,
        second: this.states.length / 60,
        playerHealth: this.state.player.health,
        opponentHealth: this.state.opponent.health,
      })
    if (!before.catsNameConsumed && this.state.catsNameConsumed)
      this.audit.push({ kind: 'cat-consumed', second: this.states.length / 60 })
  }

  report() {
    const base = super.report()
    const death = this.states.findIndex((s) => Boolean(s.catsName))
    const hits = this.audit.filter((e) => e.kind === 'impact' && !e.avoided)
    const heals = this.states.flatMap((s, i) =>
      i && s.opponent.health > this.states[i - 1].opponent.health
        ? [
            {
              second: i / 60,
              amount: s.opponent.health - this.states[i - 1].opponent.health,
              nativeResurrection: Boolean(this.states[i - 1].catsName) && s.phase === 'finished',
            },
          ]
        : [],
    )
    return {
      ...base,
      catsDuel: true,
      winner: this.state.winner,
      apparentKnockoutSecond: death / 60,
      chrolloHealthBeforeCat: this.states[death]?.player.health,
      initialHealth: this.states[0].player.maxHealth,
      catFrames: this.states.filter((s) => s.catsName).length,
      storyEvents: this.audit.filter((e) => String(e.kind).startsWith('cat-')),
      emptyStrikes: this.audit.filter((e) => e.kind === 'empty-strike'),
      contactsBySide: Object.fromEntries(
        (['player', 'opponent'] as const).map((side) => [
          side,
          hits.filter((e) => e.attacker === side).length,
        ]),
      ),
      heals,
      chrolloConsumed: this.state.catsNameConsumed === 'player',
      source:
        'One continuous native duel. Only initial health is extended. Camilla dies, Cat’s Name captures and consumes her killer, then resurrects her without another combat command.',
    }
  }
}
