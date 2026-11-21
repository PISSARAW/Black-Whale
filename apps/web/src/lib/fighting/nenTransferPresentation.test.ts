import { describe, expect, it } from 'vitest'
import { auraConcentration } from './nenConcentration'
import { createConcentrationClock, RYU_VISUAL_TRANSFER_FRAMES } from './nenConcentrationClock'
import { withNenCommitment } from './nenCommitment'
import { focusNenZone } from './nenAdvanced'
import { releaseFocusedAura } from './nen'
import { advanceNenTransfer } from './nenTransfer'
import { createFightState } from './fightState'
import type { BodyPlan } from './fightPose'

describe('Ryu transfer presentation', () => {
  it('keeps the visible allocation moving monotonically after the gameplay transfer ends', () => {
    const clock = createConcentrationClock('player')
    let state = createFightState('kurapika', 'hisoka', { mode: 'versus-local' })
    state = { ...state, phase: 'fighting' }
    const hands = focusNenZone(state.player, 'hands')
    state = { ...state, player: hands }
    clock(state, auraConcentration(hands))

    const feet = focusNenZone(releaseFocusedAura(hands), 'feet')
    const logicalDuration = feet.nenTransfer!.duration
    expect(logicalDuration).toBeLessThan(RYU_VISUAL_TRANSFER_FRAMES)
    state = { ...state, frame: 1, player: feet }

    const visibleShares: number[] = []
    const visibleProgress: number[] = []
    for (let frame = 1; frame <= RYU_VISUAL_TRANSFER_FRAMES + 2; frame++) {
      if (frame > 1)
        state = {
          ...state,
          frame,
          player: advanceNenTransfer(state.player, 1 / 60),
        }
      const shown = clock(state, auraConcentration(state.player))
      visibleShares.push(shown.concentration!.shares.feet)
      if (shown.visualTransfer)
        visibleProgress.push(shown.visualTransfer.age / shown.visualTransfer.travelFrames)
    }

    expect(state.player.nenTransfer).toBeUndefined()
    expect(visibleShares).toEqual([...visibleShares].sort((a, b) => a - b))
    expect(visibleProgress).toEqual([...visibleProgress].sort((a, b) => a - b))
    expect(visibleShares.at(-1)).toBeCloseTo(0.76)
  })

  it('freezes visual travel in hitstop', () => {
    const clock = createConcentrationClock('player')
    let state = createFightState('kurapika', 'hisoka', { mode: 'versus-local' })
    const hands = focusNenZone(state.player, 'hands')
    clock({ ...state, player: hands }, auraConcentration(hands))
    const feet = focusNenZone(releaseFocusedAura(hands), 'feet')
    state = { ...state, frame: 1, player: feet }
    const before = clock(state, auraConcentration(feet))
    const frozen = clock({ ...state, frame: 4, hitstop: 3 }, auraConcentration(feet))
    expect(frozen.visualTransfer?.age).toBe(before.visualTransfer?.age)
    expect(frozen.concentration?.shares).toEqual(before.concentration?.shares)
  })

  it('retargets from the currently visible distribution without a jump', () => {
    const clock = createConcentrationClock('player')
    let state = createFightState('kurapika', 'hisoka', { mode: 'versus-local' })
    const hands = focusNenZone(state.player, 'hands')
    clock({ ...state, player: hands }, auraConcentration(hands))
    const feet = focusNenZone(releaseFocusedAura(hands), 'feet')
    state = { ...state, frame: 1, player: feet }
    clock(state, auraConcentration(feet))
    state = { ...state, frame: 2, player: advanceNenTransfer(feet, 1 / 60) }
    const before = clock(state, auraConcentration(state.player))

    const head = focusNenZone(releaseFocusedAura(state.player), 'head')
    state = { ...state, frame: 3, player: head }
    const retargeted = clock(state, auraConcentration(head))
    expect(
      Math.abs(retargeted.concentration!.shares.feet - before.concentration!.shares.feet),
    ).toBeLessThan(0.1)
    expect(retargeted.visualTransfer?.age).toBe(0)
  })

  it('eases the body accent in and out instead of toggling it', () => {
    const fighter = createFightState('kurapika', 'hisoka').player
    const hands = focusNenZone(fighter, 'hands')
    const transfer = focusNenZone(releaseFocusedAura(hands), 'feet').nenTransfer!
    const plan: BodyPlan = { key: 'stance', plant: true, blend: 0, pose: {} }
    const accent = (age: number) =>
      withNenCommitment(plan, {
        ...fighter,
        nenTransfer: { ...transfer, age },
      })!.pose.chest?.[0] ?? 0

    expect(accent(0)).toBeCloseTo(0)
    expect(accent(transfer.duration / 2)).toBeGreaterThan(0.03)
    expect(accent(transfer.duration)).toBeCloseTo(0)
  })
})
