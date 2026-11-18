import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { FIGHTING_ROSTER } from './roster'
import { createFightState } from './fightState'
import { performAuraAttack, tickFight } from './engine'
import { EMPTY_INPUT, type FighterId, type MoveSlot, type FightState } from './types'
import { moveForSlot } from './movesets'
import { duelBridge, bridgeTarget, flowThroughBridge } from './duelAttackBridges'
import { rosterComboBridge } from './rosterComboMotion'
import { rosterMotionStyle } from './rosterStrikeMotion'
import { fighterAuraHex } from './auraColours'
import { focusNenZone } from './nenAdvanced'
import { applyAuraContext } from './nen'
import { auraConcentration } from './nenConcentration'
import { createNenConcentrationScene } from './nenConcentrationScene'
import { createFightReactionPresentation } from './fightReactionPresentation'
import { buildFightFigure } from './fighterFigure'
import { bodyPlan, fightBodyMotion } from './fightBodyMotion'
import { attackData } from './frameData'
import { reactionPlan } from './fightReactions'
import { fightStrikeLimb } from './fightStrikeLimb'

const ids = FIGHTING_ROSTER.map((fighter) => fighter.id)
const glow = (color: number) => new THREE.MeshBasicMaterial({ color })
function fresh(id: FighterId): FightState {
  const state = createFightState(id, 'chrollo', { mode: 'versus-local', formatId: 'knockout' })
  return {
    ...state,
    phase: 'fighting' as const,
    player: { ...state.player, x: 44, aura: 100 },
    opponent: { ...state.opponent, x: 50 },
  }
}
function strike(id: FighterId, slot: MoveSlot, facing: 1 | -1) {
  const state = fresh(id),
    move = moveForSlot(id, slot)!
  state.player.facing = facing
  return performAuraAttack({
    state,
    side: 'player',
    kind: move.kind,
    moveId: move.id,
    variant: move.variant,
    auraCharged: false,
  }).player
}

describe.each(ids)('%s roster motion', (id) => {
  it.each([1, -1] as const)(
    'bridges the personal normal sequence into its exact contact, facing %s',
    (facing) => {
      const target = strike(id, 'standingHeavy', facing)
      target.attack!.frame = attackData('heavy', target).startup
      const contact = bodyPlan(target, { seconds: 1, progress: 0 })!.pose
      const load = duelBridge(`${id}:standingLight`, `${id}:standingHeavy`, facing)!
      expect(load).toBeDefined()
      expect(bridgeTarget(`${id}:standingHeavy`)).toBe(true)
      const from = bodyPlan(strike(id, 'standingLight', facing), { seconds: 0, progress: 0 })!.pose
      expect(flowThroughBridge({ from, contact, load, progress: 0 })).toEqual(from)
      expect(flowThroughBridge({ from, contact, load, progress: 1 })).toEqual(contact)
      const middle = flowThroughBridge({ from, contact, load, progress: 0.5 })
      expect(Object.values(middle).flat().every(Number.isFinite)).toBe(true)
      expect(rosterMotionStyle(id)).toBeDefined()
    },
  )

  it('reads its physical hit direction at contact and retains it after a cancel', () => {
    let state = fresh(id)
    const move = moveForSlot(id, 'standingHeavy')!
    state = performAuraAttack({
      state,
      side: 'player',
      kind: move.kind,
      moveId: move.id,
      auraCharged: false,
    })
    const read = createFightReactionPresentation()
    for (let frame = 0; frame < 55 && !state.impact; frame++) {
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
      read(state, 'opponent', { fighter: state.opponent, seconds: state.frame / 60 })
    }
    expect(state.impact?.attacker).toBe('player')
    const contact = read(state, 'opponent', { fighter: state.opponent, seconds: state.frame / 60 })
    expect(contact.strikeMotion ?? contact.strikeReaction).toBeDefined()
    const after = { ...state, player: { ...state.player, attack: null } }
    expect(read(after, 'opponent', { fighter: after.opponent, seconds: 9 })).toEqual(contact)
    const pose = reactionPlan(state.opponent, contact, {})!.pose
    expect(Object.values(pose).flat().every(Number.isFinite)).toBe(true)
    const guarded = {
      ...state,
      impact: { ...state.impact!, blocked: true, sequence: state.impact!.sequence + 1 },
    }
    expect(
      read(guarded, 'opponent', { fighter: guarded.opponent, seconds: 10 }).strikeMotion,
    ).toBeUndefined()
  })

  it.each(['ryu', 'ko'] as const)(
    'keeps its own %s colour on both sides and independent from the rival',
    (technique) => {
      for (const facing of [1, -1] as const) {
        let state = fresh(id)
        state.player.facing = facing
        const move = moveForSlot(id, 'standingHeavy')!
        state.player = focusNenZone(state.player, move.tuning.auraZone)
        state = performAuraAttack({
          state,
          side: 'player',
          kind: move.kind,
          moveId: move.id,
          auraCharged: technique === 'ko',
        })
        if (technique === 'ko') state.player = applyAuraContext(state.player, EMPTY_INPUT)
        const allocation = auraConcentration(state.player)!
        expect(allocation.technique).toBe(technique)
        state.opponent = focusNenZone(state.opponent, 'hands')
        const scene = new THREE.Scene()
        const models = {
          player: buildFightFigure({ THREE, glow, fighter: state.player }),
          opponent: buildFightFigure({ THREE, glow, fighter: state.opponent }),
        }
        for (const side of ['player', 'opponent'] as const) {
          scene.add(models[side].root)
          models[side].animate(0, 'idle', {
            transitionSeconds: 0,
            motion: fightBodyMotion({ fighter: state[side], seconds: 0, progress: 0 }),
          })
        }
        const effects = createNenConcentrationScene({
          THREE,
          scene,
          worldX: (x) => x,
          worldY: (y) => y,
          figureOf: (side) => models[side].turns,
        })
        effects.sync({ ...state, frame: 1 })
        for (const side of ['player', 'opponent'] as const) {
          const shells: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>[] = []
          models[side].root.traverse((node) => {
            if (node.name.startsWith('nen-concentration:') && node.visible)
              shells.push(node as (typeof shells)[number])
          })
          expect(shells.length).toBeGreaterThan(0)
          expect(
            shells.every(
              (shell) =>
                shell.material.uniforms.u_colour.value.getHex() === fighterAuraHex(state[side].id),
            ),
          ).toBe(true)
          if (technique === 'ko' && side === 'player')
            expect(shells.every((shell) => shell.name.includes(`:${state.player.nen.ko}:`))).toBe(
              true,
            )
        }
        effects.dispose()
      }
    },
  )
})

it('keeps the compact and rotational styles distinct, and excludes utility Hatsu and cross-character bridges', () => {
  expect(rosterComboBridge('illumi:standingLight', 'illumi:standingHeavy')).not.toEqual(
    rosterComboBridge('bonolenov:standingLight', 'bonolenov:standingHeavy'),
  )
  expect(rosterComboBridge('franklin:standingLight', 'hisoka:standingHeavy')).toBeUndefined()
  expect(bridgeTarget('melody:neutralSpecial')).toBe(false)
  expect(bridgeTarget('bill:neutralSpecial')).toBe(false)
})

it('follows the kicking leg after a side switch, independently from Kurapika’s fixed chain hand', () => {
  expect(fightStrikeLimb(strike('kurapika', 'lowHeavy', 1), 'feet')).toBe('right')
  expect(fightStrikeLimb(strike('kurapika', 'lowHeavy', -1), 'feet')).toBe('left')
  expect(fightStrikeLimb(strike('kurapika', 'standingLight', -1), 'hands')).toBe('right')
  expect(fightStrikeLimb(strike('hisoka', 'standingHeavy', 1), 'feet')).toBe('right')
  expect(fightStrikeLimb(strike('hisoka', 'standingHeavy', -1), 'feet')).toBe('left')
})
