import { StrategicDirector } from './strategicDirector'
import { canStartFighterAttack } from '../../src/lib/fighting/fighterAttacks'
import { moveForSlot } from '../../src/lib/fighting/movesets'
import type { FightSide, FightState, MoveSlot, FightInput } from '../../src/lib/fighting/types'

export class SolarDirector extends StrategicDirector {
  close(side: FightSide, gap = 5.5) {
    super.close(side, gap)
  }

  execute(side: FightSide, slot: MoveSlot, charged = false) {
    const move = moveForSlot(this.state[side].id, slot)!
    if (move.kind === 'light' || move.kind === 'heavy')
      this.until(() => canStartFighterAttack(this.state[side], move.kind, move.id))
    super.execute(side, slot, charged)
  }

  exchange(side: FightSide) {
    this.chain(
      side,
      side === 'player'
        ? ['standingLight', 'forwardLight', 'forwardSpecial']
        : ['standingLight', 'backHeavy'],
    )
  }

  move(side: FightSide, slot: MoveSlot, input: Partial<FightInput> = {}) {
    const phase = this.state.parallelFuture?.phase
    super.move(side, slot, input)
    if (this.state.parallelFuture && this.state.parallelFuture.phase !== phase)
      this.audit.push({
        kind: `laplace-${this.state.parallelFuture.phase}`,
        second: this.states.length / 60,
      })
  }

  observe(before: FightState) {
    super.observe(before)
    const previous = before.player.hatsuEffects.painPacker!
    const pain = this.state.player.hatsuEffects.painPacker!
    const emit = (kind: string, detail: Record<string, unknown> = {}) =>
      this.audit.push({ kind, second: this.states.length / 60, ...detail })
    if (!previous.armour && pain.armour) emit('pain-packer-equipped', { damage: pain.packedDamage })
    if (!previous.sun && pain.sun) emit('rising-sun-ignited', { ...pain.sun })
    if (previous.sun && !pain.sun)
      emit('rising-sun-expired', { age: previous.sun.age, duration: previous.sun.duration })
    if (this.state.parallelFuture?.phase !== before.parallelFuture?.phase)
      emit(`laplace-${this.state.parallelFuture?.phase ?? 'ended'}`)
  }

  report() {
    const base = super.report()
    const sunStates = this.states.filter((s) => s.player.hatsuEffects.painPacker?.sun)
    const vision = this.states.find((s) => s.parallelFuture?.phase === 'vision')?.parallelFuture
    const divergence = this.states.filter((s) => s.parallelFuture?.phase === 'diverging')
    return {
      ...base,
      solarDuel: true,
      mangaInspired: false,
      maximumPain: Math.max(
        ...this.states.map((s) => s.player.hatsuEffects.painPacker?.injuries ?? 0),
      ),
      predictedHealth: vision?.frames.at(-1)?.opponent.health,
      predictedFrames: vision?.frames.length,
      solarDamageTaken: sunStates.length
        ? sunStates[0].opponent.health - sunStates.at(-1)!.opponent.health
        : null,
      divergenceFrames:
        divergence.length + Number(this.audit.some((e) => e.kind === 'laplace-ended')),
      visibleDivergenceFrames: divergence.length,
      maximumDivergence: Math.max(
        0,
        ...divergence.map((s) =>
          Math.abs(
            s.opponent.x -
              s.parallelFuture!.frames[Math.max(0, s.parallelFuture!.cursor - 1)].opponent.x,
          ),
        ),
      ),
      solarEvents: this.audit.filter((e) => /pain-packer|rising-sun|laplace/.test(String(e.kind))),
      source:
        'One production Feitan / Tserriednich fight; real injuries, armour, solar heat and 600-frame Laplace Devil forecast. No resource resets.',
    }
  }
}
