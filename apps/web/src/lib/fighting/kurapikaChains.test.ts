import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performAuraAttack } from './engine'
import { attackData } from './frameData'
import { toggleEmperorTime } from './kurapikaActions'
import { createKurapikaEffectScene } from './kurapikaEffectScene'
import { createKurapikaChainModel, CHAIN_TIP_NAMES } from './kurapikaChainModel'
import { chainChest, chainFinger } from './kurapikaChainAnchors'
import { poseKurapikaChainHand } from './kurapikaChainHand'
import { kurapikaChainMotions, type ChainStage } from './kurapikaChainMotion'
import type { EffectSceneOptions } from './fighterEffectScene'
import type { FightState, MoveSlot } from './types'

function cast(slot: MoveSlot = 'forwardSpecial'): FightState {
  let state = beginFight(createFight('kurapika', 'phinks', { mode: 'versus-local' }))
  state = { ...state, player: { ...state.player, x: 42 }, opponent: { ...state.opponent, x: 55 } }
  if (slot === 'finisher') state = toggleEmperorTime(state, 'player')
  return performAuraAttack({
    state,
    side: 'player',
    kind: 'special',
    moveId: `kurapika:${slot}`,
    auraCharged: false,
  })
}

function environment() {
  const scene = new THREE.Scene()
  const figures = { player: new THREE.Group(), opponent: new THREE.Group() }
  for (const [index, figure] of Object.values(figures).entries()) {
    figure.position.set(index ? 1.5 : -1.5, 0, 0)
    const hand = new THREE.Group()
    hand.name = 'hand-right'
    hand.position.set(0.3, 1.1, 0.2)
    figure.add(hand)
    scene.add(figure)
  }
  const options: EffectSceneOptions = {
    THREE,
    scene,
    worldX: (x) => (x - 50) * 0.12,
    worldY: (y) => y * 0.12,
    figureOf: (side) => figures[side],
  }
  return { scene, figures, options }
}

describe('Kurapika shares the visitor chain models', () => {
  it('uses hollow rectangular links and all five fully modelled ends in their original palette', () => {
    const model = createKurapikaChainModel(THREE)
    const geometry = model.links[0].geometry as THREE.ExtrudeGeometry
    expect(geometry.type).toBe('ExtrudeGeometry')
    expect((geometry.parameters.shapes as THREE.Shape).holes).toHaveLength(1)
    expect(model.links.every((strand) => strand.geometry === geometry)).toBe(true)
    expect(model.tips.map((tip) => tip.name)).toEqual(
      CHAIN_TIP_NAMES.map((name) => `kurapika-chain-tip:${name}`),
    )
    const colours = new Set<number>()
    let glass = false
    model.root.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return
      const material = node.material as THREE.MeshBasicMaterial
      colours.add(material.color.getHex())
      glass ||= material.opacity === 0.4
    })
    expect(colours.has(0x1d2148)).toBe(true) // Pendulum ball, never a generic yellow cone.
    expect(colours.has(0x4f86c6)).toBe(true)
    expect(colours.has(0xeaf2fa)).toBe(true)
    expect(glass).toBe(true)
    model.dispose()
  })

  it.each([
    ['forwardSpecial', 0],
    ['backSpecial', 1],
    ['neutralSpecial', 2],
    ['downSpecial', 3],
    ['finisher', 4],
  ] as const)(
    '%s selects the correct end and follows startup and recovery frames',
    (slot, stage) => {
      const state = cast(slot)
      expect(state.player.attack).not.toBeNull()
      const data = attackData('special', state.player)
      const first = kurapikaChainMotions(state, 'player')[0]
      state.player.attack!.frame = data.startup
      const deployed = kurapikaChainMotions(state, 'player')[0]
      state.player.attack!.frame = data.startup + data.active + data.recovery - 1
      const returning = kurapikaChainMotions(state, 'player')[0]
      expect(deployed.stage).toBe(stage)
      expect(deployed.extension).toBeGreaterThan(first.extension)
      expect(returning.extension).toBeLessThan(deployed.extension)
    },
  )

  it('keeps Chain Jail while the thumb heals, then hides each released chain independently', () => {
    const state = cast('downSpecial')
    state.opponent.chainJail = { owner: 'player', x: state.opponent.x, y: 0 }
    const { scene, options } = environment()
    const effect = createKurapikaEffectScene(options)
    effect.sync(state, 0)
    expect(kurapikaChainMotions(state, 'player').map((motion) => motion.stage)).toEqual([2, 3])
    expect(scene.getObjectByName('kurapika-chain-tip:claw')!.visible).toBe(true)
    expect(scene.getObjectByName('kurapika-chain-tip:cross')!.visible).toBe(true)
    state.player.attack = null
    state.frame += 1200
    effect.sync(state, 20)
    expect(scene.getObjectByName('kurapika-chain-tip:claw')!.visible).toBe(true)
    expect(scene.getObjectByName('kurapika-chain-tip:cross')!.visible).toBe(false)
    state.opponent.chainJail = undefined
    effect.sync(state, 21)
    expect(scene.getObjectByName('kurapika-chain-tip:claw')!.visible).toBe(false)
    effect.dispose()
  })

  it.each(['player', 'opponent'] as const)(
    'attaches each chain to %s’s posed right hand, including mirrored/rebuilt rigs',
    (side) => {
      const state = cast()
      const { figures, options } = environment()
      figures[side].rotation.y = Math.PI
      const hand = figures[side].getObjectByName('hand-right')!
      hand.rotation.z = 0.7
      const fingerPoints = new Set<string>()
      for (const stage of [0, 1, 2, 3, 4] as ChainStage[]) {
        const point = chainFinger(options, { state, side, stage })
        expect(point.distanceTo(hand.getWorldPosition(new THREE.Vector3()))).toBeLessThan(0.1)
        fingerPoints.add(point.toArray().join(','))
      }
      expect(fingerPoints.size).toBe(5)
      const first = chainFinger(options, { state, side, stage: 1 })
      const replacement = figures[side].clone(true)
      replacement.position.x += 3
      figures[side] = replacement
      const next = chainFinger(options, { state, side, stage: 1 })
      expect(next.x - first.x).toBeCloseTo(3)
    },
  )

  it('alternates interlocking link planes and presents the tip face to the duel camera', () => {
    const model = createKurapikaChainModel(THREE)
    model.draw({
      stage: 1,
      points: [new THREE.Vector3(), new THREE.Vector3(1, 0, 0), new THREE.Vector3(2, 0, 0)],
      direction: new THREE.Vector3(1, 0, 0),
    })
    const a = new THREE.Matrix4(),
      b = new THREE.Matrix4()
    model.links[1].getMatrixAt(0, a)
    model.links[1].getMatrixAt(1, b)
    const az = new THREE.Vector3().setFromMatrixColumn(a, 2)
    const bz = new THREE.Vector3().setFromMatrixColumn(b, 2)
    expect(Math.abs(az.dot(bz))).toBeLessThan(0.01)
    expect(new THREE.Vector3(0, 1, 0).applyQuaternion(model.tips[1].quaternion).z).toBeCloseTo(1)
    model.dispose()
  })

  it('poses the anatomical right arm toward the target instead of leaving its chain on the resting arm', () => {
    const { figures, options } = environment()
    figures.player.remove(figures.player.getObjectByName('hand-right')!)
    const shoulder = new THREE.Group(),
      elbow = new THREE.Group(),
      hand = new THREE.Group()
    shoulder.name = 'shoulder-right'
    elbow.name = 'elbow-right'
    hand.name = 'hand-right'
    shoulder.position.set(0, 1.3, 0)
    elbow.position.y = -0.3
    hand.position.y = -0.25
    figures.player.add(shoulder)
    shoulder.add(elbow)
    elbow.add(hand)
    const before = hand.getWorldPosition(new THREE.Vector3())
    const state = cast('forwardSpecial')
    poseKurapikaChainHand(options, {
      state,
      side: 'player',
      motions: [{ stage: 0, mode: 'attack', extension: 1, reach: 13 }],
      reaches: [0.3, 0.4, 0.3, 0.3, 0.3],
    })
    const after = hand.getWorldPosition(new THREE.Vector3())
    expect(after.x).toBeGreaterThan(before.x + 0.2)
    expect(after.y).toBeGreaterThan(before.y)
    expect(after.toArray().every(Number.isFinite)).toBe(true)
  })

  it('targets the actual torso rather than the chest rotation pivot near the floor', () => {
    const { figures, options } = environment()
    const pivot = new THREE.Group(),
      torso = new THREE.Group()
    pivot.name = 'fight-chest'
    torso.name = 'torso'
    torso.position.y = 1.2
    figures.opponent.add(pivot)
    pivot.add(torso)
    const point = chainChest(options, { state: cast(), side: 'opponent' })
    expect(point.y).toBeCloseTo(1.2)
  })

  it('leaves one Judgment blade at the target’s chest without a duplicate held blade', () => {
    const state = cast('finisher')
    state.opponent.judgmentChain = { owner: 'player', rule: 'zetsu' }
    const { scene, figures, options } = environment()
    const effect = createKurapikaEffectScene(options)
    effect.sync(state, 0)
    const seal = scene.getObjectByName('kurapika-judgment-seal')!
    expect(seal.visible).toBe(true)
    expect(scene.getObjectByName('kurapika-chain-tip:blade')!.visible).toBe(false)
    const before = seal.position.x
    figures.opponent.position.x += 1
    effect.sync(state, 1)
    expect(seal.position.x - before).toBeCloseTo(1)
    effect.dispose()
  })

  it('disposes every shared geometry and material once and removes both actors’ chains', () => {
    const model = createKurapikaChainModel(THREE)
    const geometries = new Set<THREE.BufferGeometry>()
    model.root.traverse((node) => {
      if (node instanceof THREE.Mesh) geometries.add(node.geometry)
    })
    const spies = [...geometries].map((geometry) => vi.spyOn(geometry, 'dispose'))
    const scene = new THREE.Scene()
    scene.add(model.root)
    model.dispose()
    expect(scene.children).toHaveLength(0)
    spies.forEach((spy) => expect(spy).toHaveBeenCalledOnce())
  })
})
