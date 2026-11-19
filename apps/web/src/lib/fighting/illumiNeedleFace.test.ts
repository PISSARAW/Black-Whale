import { describe, expect, it } from 'vitest'
import { nextRound } from './engine'
import { attackData } from './frameData'
import { canAct } from './fightActorState'
import {
  needleFaceSetup,
  needleCommand,
  needleFrames,
  beginNeedleFace,
} from './illumiNeedleFaceTestSetup'
import { EMPTY_INPUT, type FightSide } from './types'
import { applyAuraContext } from './nen'
import { privatePvpState } from './pvp/view'

describe('Illumi’s three forehead needles are distinct from Needle People', () => {
  it.each<FightSide>(['player', 'opponent'])(
    'uses real head contact and facial distortion without brain control for %s',
    (side) => {
      const other = side === 'player' ? 'opponent' : 'player'
      const base = needleFaceSetup(side)
      const started = beginNeedleFace(base, side)
      const startup = attackData('special', started[side]).startup
      expect(started[side].attack).toMatchObject({
        illumiNeedleMode: 'face-warp',
        nenOrigin: { source: 'personal' },
      })
      expect(needleFrames(started, startup - 1)[other].needleFace).toBeUndefined()
      const hit = needleFrames(started, startup)
      expect(hit[other].needleFace?.needles).toHaveLength(3)
      expect(hit[other].needleFace).toMatchObject({
        owner: side,
        member: 0,
        reshaping: true,
        origin: { source: 'personal' },
      })
      expect(hit[other].hitStun).toBeGreaterThan(0)
      expect(hit[other].health).toBe(base[other].health)
      expect(hit[other].needlePuppet).toBeUndefined()
      expect(hit[other].hatsuEffects.manipulatedFrames).toBe(0)
      expect(hit[other].hatsuEffects.forcedZetsuFrames).toBe(0)
      expect(needleFrames(hit, 40)[other].needleFace?.needles).toHaveLength(3)
      expect(canAct(needleFrames(hit, 40)[other])).toBe(true)
    },
  )
  it('leaves guard, distance and actual physical equipment applicable', () => {
    const state = beginNeedleFace(needleFaceSetup())
    expect(needleFrames(state, 45, true).opponent.needleFace).toBeUndefined()
    const base = needleFaceSetup()
    const far = { ...base, opponent: { ...base.opponent, x: 90 } }
    expect(needleFrames(beginNeedleFace(far)).opponent.needleFace).toBeUndefined()
    const empty = { ...base, player: { ...base.player, equipment: [], weaponsConfiscated: true } }
    const selected = needleCommand(empty, { action: 'illumi-needle-mode', target: 'face-warp' })
    expect(needleCommand(selected, { action: 'illumi-needle-apply' })).toBe(selected)
  })
  it('captures the application at startup instead of interpreting a later private choice', () => {
    const started = beginNeedleFace(needleFaceSetup())
    const changed = {
      ...started,
      player: { ...started.player, illumiNeedleMode: 'needle-people' as const },
    }
    const hit = needleFrames(changed)
    expect(hit.opponent.needleFace).toBeTruthy()
    expect(hit.opponent.needlePuppet).toBeUndefined()
    expect(needleCommand(started, { action: 'illumi-needle-mode', target: 'needle-people' })).toBe(
      started,
    )
  })
  it('moves the same three pins out of the face with no duplicate pile or healing', () => {
    const hit = needleFrames(beginNeedleFace(needleFaceSetup()))
    const ids = hit.opponent.needleFace!.needles
    const removed = needleCommand(hit, { action: 'needle-face-remove' }, 'opponent')
    expect(removed.opponent.needleFace).toBeUndefined()
    const pile = removed.battlefield!.entities.find((entry) => entry.detachedFaceNeedles)!
    expect(pile.detachedFaceNeedles!.needles).toEqual(ids)
    expect(pile.material).toBe('real')
    expect(removed.opponent.health).toBe(hit.opponent.health)
    expect(needleCommand(removed, { action: 'needle-face-remove' }, 'opponent')).toBe(removed)
  })
  it('preserves implanted metal and facial state across a round without resetting the caster’s serial', () => {
    const state = needleFrames(beginNeedleFace(needleFaceSetup()))
    const next = nextRound({ ...state, phase: 'finished', winner: 'player' })
    expect(next.opponent.needleFace?.needles).toEqual(state.opponent.needleFace!.needles)
    expect(next.player.illumiNeedleGeneration).toBe(state.player.illumiNeedleGeneration)
  })
  it('keeps On and permits physical extraction with a real hand', () => {
    let state = needleFrames(beginNeedleFace(needleFaceSetup()))
    state = {
      ...state,
      opponent: applyAuraContext(
        { ...state.opponent, on: { grudge: 100, sealFrames: 0 } },
        { ...EMPTY_INPUT, aura: true, hatsu: true },
      ),
    }
    const removed = needleCommand(state, { action: 'needle-face-remove' }, 'opponent')
    expect(removed.opponent.needleFace).toBeUndefined()
    expect(removed.opponent.nen.on).toBe(true)
  })
  it('does not disclose a prepared needle mode or acquisition to the opposing client', () => {
    const selected = needleCommand(needleFaceSetup(), {
      action: 'illumi-needle-mode',
      target: 'face-warp',
    })
    expect(privatePvpState(selected, 'opponent').opponent.illumiNeedleMode).toBeUndefined()
    const hit = needleFrames(beginNeedleFace(selected))
    const view = privatePvpState(hit, 'opponent')
    expect(view.player.needleFace?.needles).toHaveLength(3)
    expect(view.player.needleFace?.origin).toEqual({})
  })
})
