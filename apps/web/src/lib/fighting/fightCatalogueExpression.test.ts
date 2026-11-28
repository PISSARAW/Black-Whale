import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { EXPRESSION_CATALOGUE } from '$lib/tour/expressions/catalogue'
import { setHumanExpression } from '$lib/tour/expressions/expressionPlayer'
import { buildHumanFigure, type HumanLook } from '$lib/tour/humanFigure'
import { disposeExpressionEffects } from '$lib/tour/expressions/faceEffects'
import { buildFightFigure } from './fighterFigure'
import { createFightState } from './fightState'
import { fightBodyMotion } from './fightBodyMotion'
import { fightFaceRig, suspendFightExpression } from './fightExpressionRig'
import { fightReplayHash } from './fightReplayHash'
import { FIGHTING_ROSTER, fighterDefinition } from './roster'
import type { ArcadeFighter } from './types'
const glow = (color: number, opacity: number) => new THREE.MeshBasicMaterial({ color, opacity })
function draw(model: ReturnType<typeof buildFightFigure>, fighter: ArcadeFighter, seconds: number) {
  model.animate(seconds, 'idle', { motion: fightBodyMotion({ fighter, seconds, progress: 0 }) })
}
function finiteFigure(root: THREE.Object3D) {
  let finite = true
  root.traverse((node) => {
    finite &&= [
      ...node.position,
      ...node.scale,
      node.rotation.x,
      node.rotation.y,
      node.rotation.z,
    ].every(Number.isFinite)
  })
  return finite
}
describe('the complete catalogue on real character figures', () => {
  it.each(FIGHTING_ROSTER)(
    '$name supports every expression in both games without changing replay state',
    ({ id }) => {
      const state = createFightState(id, 'hisoka'),
        fighter = state.player
      const clash = buildFightFigure({ THREE, glow, fighter })
      const definition = fighterDefinition(id)
      const seen: HumanLook = {
        id,
        kind: 'avatar',
        spaceId: 'test',
        tierId: 'tier-1',
        at: [0, 0],
        y: 0,
        size: 0.42,
        colour: 0xffffff,
        stage: 0,
        hidden: false,
        human: {
          role: definition.modelRole,
          identity: definition.modelId,
          pose: 'idle',
          aura: 'none',
        },
      }
      const tour = buildHumanFigure({ THREE, glow, seen })
      const hash = fightReplayHash(state)
      let seconds = 1
      for (const entry of EXPRESSION_CATALOGUE) {
        const expression = { id: entry.id, fade: 0 }
        setHumanExpression(clash.root, expression)
        draw(clash, fighter, seconds)
        tour.animate(seconds, 'idle', { expression })
        expect(finiteFigure(clash.root), entry.id).toBe(true)
        expect(finiteFigure(tour.root), entry.id).toBe(true)
        seconds++
      }
      expect(fightReplayHash(state)).toBe(hash)
      setHumanExpression(clash.root)
      draw(clash, fighter, seconds)
      tour.animate(seconds)
      expect(fightFaceRig(clash.root)!.pose!.tears).toBe(0)
      for (const model of [clash, tour]) {
        expect(model.root.getObjectByName('expression-tear--1')?.visible ?? false).toBe(false)
        disposeExpressionEffects(model.root)
      }
    },
    30000,
  )

  it('renders frowns, asymmetric lids, teeth, tears and tint on the actual face and restores it', () => {
    const fighter = createFightState('kurapika', 'hisoka').player
    const model = buildFightFigure({ THREE, glow, fighter })
    const rig = fightFaceRig(model.root)!
    draw(model, fighter, 1)
    setHumanExpression(model.root, { id: 'bouche/coins-abaisses', fade: 0 })
    draw(model, fighter, 2)
    expect(rig.mouth!.morphTargetInfluences![2]).toBeLessThan(0)
    setHumanExpression(model.root, { id: 'paupieres/clin-d-oeil', fade: 0 })
    draw(model, fighter, 3)
    expect(rig.eyes[0].node.scale.y).not.toBeCloseTo(rig.eyes[1].node.scale.y)
    setHumanExpression(model.root, { id: 'machoire/dents-decouvertes', fade: 0 })
    draw(model, fighter, 4)
    expect(model.root.getObjectByName('expression-visible-teeth')!.visible).toBe(true)
    let skin: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial> | undefined
    rig.head.traverse((node) => {
      const mesh = node as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>
      if (mesh.isMesh && mesh.material?.color?.getHex() === rig.skin) skin ??= mesh
    })
    expect(skin).toBeDefined()
    const original = skin!.material
    setHumanExpression(model.root, { id: 'signes/rougeur-de-colere', fade: 0 })
    draw(model, fighter, 5)
    expect(skin!.material).not.toBe(original)
    const tinted = skin!.material
    expect(skin!.material.color.getHex()).not.toBe(original.color.getHex())
    expect(original.color.getHex()).toBe(rig.skin)
    setHumanExpression(model.root)
    draw(model, fighter, 6)
    expect(skin!.material).toBe(original)
    setHumanExpression(model.root, { id: 'signes/rougeur-de-colere', fade: 0 })
    draw(model, fighter, 7)
    expect(skin!.material).toBe(tinted)
    expect(model.root.getObjectByName('expression-visible-teeth')!.visible).toBe(false)
    disposeExpressionEffects(model.root)
  })
  it('allows a hit to interrupt a cue, preserves the simulation, and expires cleanly', () => {
    const fighter = createFightState('hisoka', 'kurapika').player
    const model = buildFightFigure({ THREE, glow, fighter })
    setHumanExpression(model.root, { id: 'joie/rire-franc', start: 0, duration: 2, fade: 0 })
    draw(model, fighter, 1)
    expect(fightFaceRig(model.root)!.pose!.smile).toBeGreaterThan(0)
    draw(model, { ...fighter, hitStun: 12, pose: 'hit' }, 1)
    expect(fightFaceRig(model.root)!.pose!.smile).toBe(0)
    draw(model, fighter, 3)
    expect(fightFaceRig(model.root)!.pose!.jaw).toBe(0)
  })
  it('suspends tears and the jaw for a cinematic and restores the borrowed expression', () => {
    const fighter = createFightState('kurapika', 'hisoka').player
    const model = buildFightFigure({ THREE, glow, fighter })
    setHumanExpression(model.root, { id: 'tristesse/sanglots', fade: 0 })
    draw(model, fighter, 1)
    const tear = model.root.getObjectByName('expression-tear--1')!
    const jaw = fightFaceRig(model.root)!.mouth!
    expect(tear.visible).toBe(true)
    const scale = jaw.scale.clone()
    const restore = suspendFightExpression(model.root)
    expect(tear.visible).toBe(false)
    expect(jaw.scale.y).toBeLessThan(scale.y)
    restore()
    expect(tear.visible).toBe(true)
    expect(jaw.scale.equals(scale)).toBe(true)
    disposeExpressionEffects(model.root)
  })
})
