import { expect, it } from 'vitest'
import { FIGHTING_ROSTER } from './roster'
import { createFightState } from './fightState'
import { performAuraAttack } from './engine'
import { moveForSlot } from './movesets'
import { attackData } from './frameData'
import { attackTransfer } from './fightAttackWeight'
import { fightStrikeLimb } from './fightStrikeLimb'
import { supportCycle } from './fightSupportCycle'
import { strikeSupportPose } from './fightStrikeSupport'

it.each(FIGHTING_ROSTER.map((f) => f.id))(
  '%s carries its own hip drive through contact and brakes before recovery ends',
  (id) => {
    const move = moveForSlot(id, 'standingHeavy')!
    const state = performAuraAttack({
      state: { ...createFightState(id, 'hisoka'), phase: 'fighting' },
      side: 'player',
      kind: move.kind,
      moveId: move.id,
      auraCharged: false,
    })
    const fighter = state.player,
      frames = attackData(move.kind, fighter)
    const transfer = attackTransfer(fighter, move.slot)
    const contact = strikeSupportPose(fighter, { transfer, frames, frame: frames.startup })
    expect(
      Object.values(contact)
        .flat()
        .some((v) => Math.abs(v) > 0.02),
    ).toBe(true)
    const end = strikeSupportPose(fighter, {
      transfer,
      frames,
      frame: frames.startup + frames.active + frames.recovery,
    })
    expect(
      Object.values(end)
        .flat()
        .every((v) => Math.abs(v) < 1e-6),
    ).toBe(true)
    for (const facing of [1, -1] as const) {
      const incoming = { ...fighter, facing }
      const cycle = supportCycle(incoming)
      if (cycle.free !== undefined) {
        expect(cycle.support).not.toBe(cycle.free)
        const limb = fightStrikeLimb(incoming, 'feet')
        if (limb !== 'both') expect(cycle.free).toBe(limb === 'left' ? 0 : 1)
      } else {
        expect(cycle.support).toBe(facing === 1 ? 0 : 1)
        const driven = supportCycle({
          ...incoming,
          attack: { ...incoming.attack!, frame: frames.startup },
        })
        expect(driven.support).toBe(1 - cycle.support)
      }
    }
  },
)
