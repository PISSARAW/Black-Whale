import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { FIGHTING_ROSTER } from './roster'
import { createFightState } from './fightState'
import { performAuraAttack, tickFight } from './engine'
import { EMPTY_INPUT, type FighterId, type FightState } from './types'
import { moveForSlot } from './movesets'
import { physicalRosterPair } from './fightPhysicalRoster'
import { fightPhysicalProfile } from './fightPhysicalProfile'
import { createFightReactionPresentation } from './fightReactionPresentation'
import { bodyPlan, fightBodyMotion } from './fightBodyMotion'
import { physicalHitPose } from './fightHitResponse'
import { physicalFallPose } from './fightFallResponse'
import { physicalComboCurve } from './fightPoseContinuity'
import { buildFightFigure } from './fighterFigure'
import { fightReplayHash } from './fightReplayHash'
import { attackData } from './frameData'
import { fightRigOf } from './fightRig'

const ids = FIGHTING_ROSTER.map((f) => f.id)
const glow = (color: number) => new THREE.MeshBasicMaterial({ color })
function fresh(id: FighterId): FightState {
  const attacker = ids[(ids.indexOf(id) + 13) % ids.length]
  const state = {
    ...createFightState(attacker, id, { mode: 'versus-local', formatId: 'knockout' }),
    phase: 'fighting' as const,
  }
  return { ...state, player: { ...state.player, x: 44 }, opponent: { ...state.opponent, x: 50 } }
}
function hit(id: FighterId) {
  let state = fresh(id)
  const observer = createFightReactionPresentation()
  const move = moveForSlot(state.player.id, 'standingHeavy')!
  state = performAuraAttack({
    state,
    side: 'player',
    kind: move.kind,
    moveId: move.id,
    auraCharged: false,
  })
  for (let i = 0; i < 60 && !state.impact; i++) {
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
    observer(state, 'opponent', { fighter: state.opponent, seconds: state.frame / 60 })
  }
  expect(state.impact?.attacker).toBe('player')
  const context = observer(state, 'opponent', {
    fighter: state.opponent,
    seconds: state.frame / 60,
  })
  return { state, context, observer }
}

it('enables all 1600 roster matchups, including mirrors, and retains the legacy fallback', () => {
  expect(ids).toHaveLength(40)
  for (const a of ids) for (const b of ids) expect(physicalRosterPair(a, b)).toBe(true)
  expect(physicalRosterPair('hisoka', 'marayam')).toBe(false)
})
it('derives distinct response and preparation profiles from the personal choreography and actual body', () => {
  const profiles = ids.map((id) => fightPhysicalProfile(createFightState(id, 'chrollo').player))
  expect(new Set(profiles.map((p) => JSON.stringify(p))).size).toBeGreaterThan(20)
  const biscuit = createFightState('biscuit', 'franklin').player
  const compact = fightPhysicalProfile(biscuit),
    natural = fightPhysicalProfile({ ...biscuit, biscuitTrueForm: true })
  expect(natural.resistance).toBeLessThan(compact.resistance)
  expect(natural.tuck).toBeLessThan(compact.tuck)
  expect(fightPhysicalProfile(biscuit)).toBe(compact)
})

describe.each(ids)('%s full physical presentation', (id) => {
  it('stages a real received hit and catching step, retains its event across a cancel, and changes no state', () => {
    const { state, context, observer } = hit(id)
    const hash = fightReplayHash(state)
    expect(context.physicalHit?.victim).toBe(id)
    expect(context.physicalHit?.profile).toEqual(fightPhysicalProfile(state.opponent))
    const physical = context.physicalHit!
    const first = physicalHitPose(physical, 0),
      later = physicalHitPose(physical, Math.min(0.45, 7 / physical.duration))
    expect(later.rearKnee![0]).toBeGreaterThan(first.rearKnee![0])
    expect(Object.values(later).flat().every(Number.isFinite)).toBe(true)
    expect(
      physicalFallPose(physical, { progress: 0.3, grounded: false }).leadElbow![0],
    ).toBeLessThan(0)
    const cancelled = { ...state, player: { ...state.player, attack: null } }
    expect(
      observer(cancelled, 'opponent', { fighter: cancelled.opponent, seconds: 99 }).physicalHit,
    ).toEqual(physical)
    expect(fightReplayHash(state)).toBe(hash)
  })
  it.each([1, -1] as const)(
    'retains the posed body across a Nen rebuild and freezes in hitstop, facing %s',
    (facing) => {
      const { state, context } = hit(id)
      const fighter = { ...state.opponent, facing }
      const first = buildFightFigure({ THREE, glow, fighter })
      const rebuilt = buildFightFigure({
        THREE,
        glow,
        fighter: { ...fighter, nen: { ...fighter.nen, mode: 'ten' } },
      })
      const poses: number[][] = []
      for (const [index, model] of [first, rebuilt].entries()) {
        model.animate(index + 1, 'idle', {
          transitionSeconds: 0,
          motion: (human) => {
            fightBodyMotion({ fighter, ...context, seconds: index + 1 })(human)
            const rig = fightRigOf(human)
            poses.push([rig.chest.rotation.x, rig.chest.rotation.y, human.legs[1].rotation.x])
          },
        })
      }
      expect(poses[1]).toEqual(poses[0])
    },
  )
  it('keeps the authored heavy contact while using its own preparation rhythm', () => {
    let state = fresh(id)
    state = { ...state, player: { ...createFightState(id, 'chrollo').player, x: 44 } }
    const move = moveForSlot(id, 'standingHeavy')!
    state = performAuraAttack({
      state,
      side: 'player',
      kind: move.kind,
      moveId: move.id,
      auraCharged: false,
    })
    const start = bodyPlan(state.player, { seconds: 0, progress: 0 })!.attackFlow!
    expect(start.loadAt).toBe(fightPhysicalProfile(state.player).loadAt)
    const fighter = {
      ...state.player,
      attack: { ...state.player.attack!, frame: attackData(move.kind, state.player).startup },
    }
    const contact = bodyPlan(fighter, { seconds: 0, progress: 0 })!.pose
    const end = physicalComboCurve({
      from: {},
      contact: start.contact!,
      velocity: {},
      load: {},
      frames: start.startup,
      progress: 1,
      loadAt: start.loadAt,
    })
    for (const [joint, turn] of Object.entries(contact))
      expect(end[joint as keyof typeof end]).toEqual(turn)
  })
})
