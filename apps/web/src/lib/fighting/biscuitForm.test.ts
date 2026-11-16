import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, nextRound, performAttack, performMove, tickFight } from './engine'
import { buildFightFigure, fightFigureKey } from './fighterFigure'
import { activeHitbox, FIXED_STEP } from './frameData'
import { hatsuDamageFactor, hatsuDefenceFactor, hatsuSourceFor } from './hatsu'
import { isBiscuitTrueForm } from './biscuitForm'
import { canUseMovesetMove, finisherReady, moveForSlot, movesetFor } from './movesets'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'

const ready = () => beginFight(createFight('biscuit', 'biscuit', { mode: 'versus-local' }))

function frames(state: FightState, count: number): FightState {
  for (let n = 0; n < count; n++) {
    state = tickFight(state, EMPTY_INPUT, { dt: FIXED_STEP, opponentInput: EMPTY_INPUT })
  }
  return state
}

describe('Biscuit’s natural body in fighting', () => {
  it.each<FightSide>(['player', 'opponent'])(
    'reveals %s without a strike, lunge, heal or aura cost',
    (side) => {
      const state = ready()
      const next = performMove({ state, side, action: 'special' })
      expect(isBiscuitTrueForm(next[side])).toBe(true)
      expect(next[side].attack).toBeNull()
      expect(activeHitbox(next[side])).toBeNull()
      expect(next[side].x).toBe(state[side].x)
      expect(next[side].aura).toBe(state[side].aura)
      expect(next[side].health).toBe(state[side].health)
      expect(next.score).toEqual(state.score)
      expect(next.impact).toBeNull()
      expect(next[side === 'player' ? 'opponent' : 'player']).toBe(
        state[side === 'player' ? 'opponent' : 'player'],
      )
    },
  )

  it('keeps the natural body and its strength well past six seconds, including Zetsu', () => {
    const state = performAttack(ready(), 'player', 'special')
    const next = frames(state, 900)
    expect(next.frame).toBe(900)
    expect(isBiscuitTrueForm(next.player)).toBe(true)
    expect(hatsuDamageFactor(next.player)).toBe(1.35)
    expect(hatsuDefenceFactor(next.player)).toBe(0.68)
    const zetsu = { ...next.player, aura: 0, nen: { ...next.player.nen, mode: 'zetsu' as const } }
    expect(isBiscuitTrueForm(frames({ ...next, player: zetsu }, 60).player)).toBe(true)
    expect(performAttack(next, 'player', 'special')).toBe(next)
    expect(finisherReady(next, 'player')).toBe(true)
  })

  it('can reveal her natural body at zero aura and while her Hatsu is sealed', () => {
    const state = ready()
    state.player = {
      ...state.player,
      aura: 0,
      nen: { ...state.player.nen, mode: 'zetsu' },
      hatsuEffects: { ...state.player.hatsuEffects, hatsuStolen: 1, forcedZetsuFrames: 90 },
    }
    expect(
      isBiscuitTrueForm(performMove({ state, side: 'player', action: 'special' }).player),
    ).toBe(true)
  })

  it('does not reveal the body through martial techniques or expose it to Skill Hunter', () => {
    const state = ready()
    const next = performMove({
      state,
      side: 'player',
      action: 'special',
      input: { ...EMPTY_INPUT, right: true },
    })
    expect(next.player.attack?.moveId).toBe('biscuit:forwardSpecial')
    expect(next.player.attack?.hatsuSource).toBeNull()
    expect(isBiscuitTrueForm(next.player)).toBe(false)
    expect(hatsuSourceFor(next.player)).toBeNull()
    expect(next.opponent.hatsuEffects.witnessedHatsu).toBeNull()
    expect(finisherReady(state, 'player')).toBe(false)
  })

  it('cannot reveal while airborne, stunned, down or attacking, or outside a live round', () => {
    for (const overrides of [
      { y: 4 },
      { hitStun: 8 },
      { blockStun: 8 },
      { knockdownFrames: 20 },
      { health: 0 },
    ]) {
      const state = ready()
      const next = performAttack(
        { ...state, player: { ...state.player, ...overrides } },
        'player',
        'special',
      )
      expect(isBiscuitTrueForm(next.player)).toBe(false)
    }
    const attacking = performAttack(ready(), 'player', 'light')
    expect(performAttack(attacking, 'player', 'special')).toBe(attacking)
    const waiting = createFight('biscuit', 'hisoka')
    expect(performAttack(waiting, 'player', 'special')).toBe(waiting)
  })

  it('returns to her compact appearance on a new round', () => {
    const state = performAttack(ready(), 'player', 'special')
    const next = nextRound({ ...state, phase: 'finished', winner: 'player' })
    expect(isBiscuitTrueForm(next.player)).toBe(false)
    expect(hatsuDamageFactor(next.player)).toBe(1)
    expect(hatsuDefenceFactor(next.player)).toBe(1)
    expect(finisherReady(next, 'player')).toBe(false)
  })

  it('replaces the offensive massage and makes the reveal unavailable once active', () => {
    const state = ready()
    expect(moveForSlot('biscuit', 'forwardSpecial')?.nameFr).toBe('Direct du maître')
    expect(
      movesetFor('biscuit')?.moves.some((move) => /massage/i.test(move.nameFr + move.nameEn)),
    ).toBe(false)
    const reveal = moveForSlot('biscuit', 'neutralSpecial')!
    expect(reveal.auraCost).toBe(0)
    expect(reveal.tuning.damage).toBe(0)
    expect(canUseMovesetMove(state, 'player', reveal)).toBe(true)
    expect(canUseMovesetMove(performAttack(state, 'player', 'special'), 'player', reveal)).toBe(
      false,
    )
  })
})

describe('Biscuit’s two visible fighting forms', () => {
  const glow = (color: number, opacity: number) => new THREE.MeshBasicMaterial({ color, opacity })

  it('builds a taller adult with broad shoulders and thick limbs, with working combat joints', () => {
    const compact = ready().player
    const trueForm = { ...compact, biscuitTrueForm: true }
    const small = buildFightFigure({ THREE, glow, fighter: compact })
    const large = buildFightFigure({ THREE, glow, fighter: trueForm })
    const size = (figure: typeof small) =>
      new THREE.Box3().setFromObject(figure.lod.near).getSize(new THREE.Vector3())
    expect(size(large).y).toBeGreaterThan(size(small).y * 1.7)
    expect(size(large).x).toBeGreaterThan(size(small).x * 2)
    expect(large.root.name).toBe('biscuit-true-form')
    const arm = large.root.getObjectByName('shoulder-left')!
    expect(arm.children[1].name).toBe('elbow-left')
    expect(arm.children[0].scale.x).toBeGreaterThan(
      small.root.getObjectByName('shoulder-left')!.children[0].scale.x * 2,
    )
    large.animate(0.2, 'walk')
    large.animate(0.4, 'idle', {
      motion: (rig) => {
        rig.arms[0].rotation.x = -1.2
      },
    })
    expect(arm.rotation.x).toBe(-1.2)
    expect(Number.isFinite(size(large).y)).toBe(true)
  })

  it('rebuilds on a body change and round reset, without leaking the form to another fighter', () => {
    const compact = ready().player
    const trueForm = { ...compact, biscuitTrueForm: true }
    expect(fightFigureKey(trueForm)).not.toBe(fightFigureKey(compact))
    expect(fightFigureKey({ ...compact, x: 40, pose: 'walk' })).toBe(fightFigureKey(compact))
    const hisoka = createFight('hisoka', 'biscuit').player
    expect(fightFigureKey({ ...hisoka, biscuitTrueForm: true })).toBe(fightFigureKey(hisoka))
    const reset = nextRound({ ...ready(), player: trueForm, phase: 'finished', winner: 'player' })
    expect(fightFigureKey(reset.player)).toBe(fightFigureKey(compact))
    expect(buildFightFigure({ THREE, glow, fighter: compact }).root.name).not.toBe(
      'biscuit-true-form',
    )
  })
})
