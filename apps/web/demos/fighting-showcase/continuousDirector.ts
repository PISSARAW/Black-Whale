import { motionOf } from '../../src/lib/fighting/fighterMovement'
import type { FightInput, FightSide, MoveSlot } from '../../src/lib/fighting/types'
import { Showcase } from './timeline'

export class ContinuousDirector extends Showcase {
  frameRate = 60
  held: Record<FightSide, Partial<FightInput>> = { player: {}, opponent: {} }

  advance(frames = 1) {
    this.step(frames, this.held.player, this.held.opponent)
  }

  until(test: () => boolean, limit = 180) {
    for (let frame = 0; frame < limit && !test(); frame++) {
      if (this.state.phase !== 'fighting') break
      this.advance()
    }
  }

  free(side: FightSide) {
    const fighter = this.state[side]
    return (
      !fighter.attack &&
      !fighter.hitStun &&
      !fighter.blockStun &&
      !fighter.knockdownFrames &&
      !fighter.wakeupInvulnerableFrames &&
      !fighter.hatsuEffects.manipulatedFrames &&
      !fighter.throwTechRecoveryFrames
    )
  }

  ready(side: FightSide) {
    this.until(() => this.free(side) && this.state[side].y === 0)
  }

  direction(side: FightSide, away = false): Partial<FightInput> {
    const other = side === 'player' ? 'opponent' : 'player'
    const right = this.state[side].x < this.state[other].x
    return { [right !== away ? 'right' : 'left']: true }
  }

  close(side: FightSide, gap = 4.5) {
    const previous = this.held[side]
    this.until(() => {
      this.held[side] = { ...previous, ...this.direction(side) }
      return Math.abs(this.state.player.x - this.state.opponent.x) <= gap && this.free(side)
    })
    this.held[side] = previous
    this.advance()
  }

  retreat(side: FightSide, frames: number) {
    const previous = this.held[side]
    this.held[side] = { ...previous, ...this.direction(side, true) }
    this.advance(frames)
    this.held[side] = previous
    this.advance()
  }

  execute(side: FightSide, slot: MoveSlot, charged = false) {
    const diagnostics = {
      aura: this.state[side].aura,
      gap: Math.abs(this.state.player.x - this.state.opponent.x),
      pose: this.state[side].pose,
    }
    this.move(side, slot, { aura: charged })
    Object.assign(this.audit[this.audit.length - 1], diagnostics)
    this.until(
      () =>
        (this.state[side].attack?.confirmedHit && this.state.hitstop === 0) ||
        !this.state[side].attack,
    )
  }

  hit(side: FightSide, slot: MoveSlot, charged = false) {
    this.ready(side)
    this.advance()
    this.execute(side, slot, charged)
  }

  chain(side: FightSide, route: MoveSlot[], input: Partial<FightInput> = {}) {
    const previous = this.held[side]
    const other = side === 'player' ? 'opponent' : 'player'
    this.close(side)
    this.until(() => this.free(other) && this.free(side))
    this.held[side] = { ...previous, ...input }
    this.advance()
    for (const slot of route) this.execute(side, slot)
    this.held[side] = previous
  }

  aerial(side: FightSide) {
    this.close(side)
    this.ready(side)
    const previous = this.held[side]
    this.held[side] = { ...this.direction(side), jump: true }
    this.advance(9)
    this.held[side] = {}
    if (side === 'player') this.execute(side, 'airLight')
    this.execute(side, 'airHeavy')
    this.held[side] = previous
  }

  book(slot: MoveSlot) {
    this.hit('opponent', slot)
    this.ready('opponent')
  }

  report() {
    const report = super.report()
    const impacts = this.audit.filter((event) => event.kind === 'impact')
    let idle = 0
    let maxIdle = 0
    for (const state of this.states) {
      const inactive = [state.player, state.opponent].every(
        (fighter) =>
          !fighter.attack &&
          !fighter.hitStun &&
          !fighter.blockStun &&
          !fighter.knockdownFrames &&
          fighter.y === 0 &&
          Math.abs(motionOf(fighter).velocityX) < 0.01,
      )
      idle = inactive ? idle + 1 : 0
      maxIdle = Math.max(idle, maxIdle)
    }
    const backwards = this.states.some(
      (state, index) => index > 0 && state.frame < this.states[index - 1].frame,
    )
    const healed = this.states.some(
      (state, index) =>
        index > 0 &&
        (state.player.health > this.states[index - 1].player.health ||
          state.opponent.health > this.states[index - 1].opponent.health),
    )
    return {
      ...report,
      continuous: true,
      source:
        'One uninterrupted production fighting simulation; no cuts, teleports, resource resets or health refills.',
      continuity: {
        resets: this.audit.filter((event) => event.kind === 'cut').length - 1,
        backwards,
        healed,
      },
      confirmedCombos: impacts.filter((event) => event.comboHits === 2).length,
      impactCount: impacts.length,
      impactsPerSecond: impacts.length / report.duration,
      maxIdleSeconds: maxIdle / 60,
      finalHealth: { player: this.state.player.health, opponent: this.state.opponent.health },
      finalAura: { player: this.state.player.aura, opponent: this.state.opponent.aura },
    }
  }
}
