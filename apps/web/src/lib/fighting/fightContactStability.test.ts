import { expect, it } from 'vitest'
import * as THREE from 'three'
import { createFightState } from './fightState'
import { performAttack } from './engine'
import { createFightContactLatch } from './fightContactLatch'
import { createFightBodySeparation, coreBoxes } from './fightBodySeparation'
import { buildFightFigure } from './fighterFigure'
import { fightBodyMotion } from './fightBodyMotion'
import { clearFootTarget } from './fightLimbClearance'
import { fightReplayHash } from './fightReplayHash'

it('holds the same anatomical contact through a changing shoulder target and a model rebuild', () => {
  const fighter = performAttack(
    { ...createFightState('benjamin', 'leorio'), phase: 'fighting' },
    'player',
    'light',
  ).player
  const part = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)),
    read = createFightContactLatch()
  const first = read(fighter, part, {
    position: new THREE.Vector3(-0.515, 0.1, 0.1),
    active: true,
    identity: 'round1',
  })
  const rebuilt = new THREE.Mesh(part.geometry)
  const held = read({ ...fighter, attack: { ...fighter.attack!, frame: 1 } }, rebuilt, {
    position: new THREE.Vector3(-0.515, 0.45, -0.3),
    active: true,
    identity: 'round1',
  })
  expect(held.toArray()).toEqual(first.toArray())
  const reset = read(fighter, part, {
    position: new THREE.Vector3(-0.515, 0.4, -0.3),
    active: true,
    identity: 'round2',
  })
  expect(reset.y).toBeCloseTo(0.4)
})

it('does not redistribute existing body clearance when an impact changes attacker and victim shares', () => {
  const fresh = createFightState('phinks', 'franklin')
  let state = {
    ...fresh,
    player: { ...fresh.player, x: 44 },
    opponent: { ...fresh.opponent, x: 50 },
    phase: 'fighting' as const,
  }
  const glow = (color: number) => new THREE.MeshBasicMaterial({ color })
  const models = {
    player: buildFightFigure({ THREE, glow, fighter: state.player }),
    opponent: buildFightFigure({ THREE, glow, fighter: state.opponent }),
  }
  const scene = new THREE.Scene()
  const reset = () => {
    for (const side of ['player', 'opponent'] as const) {
      scene.add(models[side].root)
      models[side].root.position.x = side === 'player' ? -0.15 : 0.15
      models[side].root.rotation.y = state[side].facing * 1.25
      models[side].animate(0, 'idle', {
        transitionSeconds: 0,
        motion: fightBodyMotion({
          fighter: { ...state[side], attack: null, pose: 'idle' },
          seconds: 0,
          progress: 0,
        }),
      })
    }
  }
  const separate = createFightBodySeparation((side) => models[side].turns)
  reset()
  separate(state)
  const before = [models.player.root.position.x, models.opponent.root.position.x]
  state = performAttack(state, 'player', 'light') as typeof state
  state = { ...state, frame: 1, opponent: { ...state.opponent, pose: 'hit', hitStun: 20 } }
  const hash = fightReplayHash(state)
  reset()
  separate(state)
  expect(models.player.root.position.x).toBeCloseTo(before[0], 9)
  expect(models.opponent.root.position.x).toBeCloseTo(before[1], 9)
  for (const a of coreBoxes(models.player.turns))
    for (const b of coreBoxes(models.opponent.turns)) {
      if (Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y) > 0.01)
        expect(a.max.x).toBeLessThan(b.min.x)
    }
  expect(fightReplayHash(state)).toBe(hash)
})

it('keeps a planted target outside the rival foot volume', () => {
  const rival = new THREE.Group(),
    knee = new THREE.Group()
  knee.name = 'knee-left'
  knee.add(new THREE.Group(), new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.3)))
  rival.add(knee)
  const target = clearFootTarget(new THREE.Vector3(0, 0, 0), rival, 1)
  expect(target.x).toBeLessThan(-0.145)
})
