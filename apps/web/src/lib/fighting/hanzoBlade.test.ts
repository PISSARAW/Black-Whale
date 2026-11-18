import { expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { buildFightFigure } from './fighterFigure'
import { fightBodyMotion, bodyPlan } from './fightBodyMotion'
import { canUseMovesetMove, moveForSlot } from './movesets'
import { hanzoBladeAvailable } from './hanzoBlade'
import { hanzoBladeExtension } from './hanzoBladeFigure'
import { boneSnapshot, physicalJoints, physicalViolations } from './physicalAuditTestKit'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { EMPTY_INPUT, type ArcadeFighter, type MoveSlot } from './types'

function duel() {
  const state = beginFight(
    createFight('hanzo', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return { ...state, player: { ...state.player, x: 46 }, opponent: { ...state.opponent, x: 54 } }
}
function strike(slot: MoveSlot, fighter?: Partial<ArcadeFighter>) {
  const state = duel(),
    move = moveForSlot('hanzo', slot)!
  state.player = { ...state.player, ...fighter }
  return performAuraAttack({
    state,
    side: 'player',
    kind: move.kind,
    moveId: move.id,
    auraCharged: false,
  })
}
const cases = (['forwardSpecial', 'backSpecial'] as const).flatMap((slot) =>
  [1, -1].map((facing) => ({ slot, facing: facing as 1 | -1 })),
)

it.each(cases)(
  '$slot facing $facing: the fixed blade follows the right forearm throughout deployment and retraction',
  ({ slot, facing }) => {
    const actor = { ...strike(slot).player, facing },
      move = moveForSlot('hanzo', slot)!
    const model = buildFightFigure({
      THREE,
      glow: (colour) => new THREE.MeshBasicMaterial({ color: colour }),
      fighter: actor,
    })
    model.root.rotation.y = facing * 1.25
    const blade = model.root.getObjectByName('hanzo-hidden-blade')!
    expect(blade.parent?.name).toBe('elbow-right')
    const slide = blade.getObjectByName('hanzo-blade-slide')!
    const tip = blade.getObjectByName('hanzo-blade-tip')!
    const bones = new Map<string, number[]>(),
      vertices = new Map<THREE.BufferGeometry, number[]>()
    blade.traverse((node) => {
      bones.set(node.uuid, node.scale.toArray())
      if ((node as THREE.Mesh).isMesh) {
        const geometry = (node as THREE.Mesh).geometry
        vertices.set(geometry, Array.from(geometry.getAttribute('position').array))
      }
    })
    let anatomicalBones: ReturnType<typeof boneSnapshot> | undefined
    const total = move.tuning.startup + move.tuning.active + move.tuning.recovery
    for (let frame = 0; frame <= total; frame++) {
      const fighter = { ...actor, attack: { ...actor.attack!, frame } }
      const before = JSON.stringify(fighter)
      model.animate(frame / 60, 'idle', {
        transitionSeconds: 0,
        motion: fightBodyMotion({ fighter, seconds: frame / 60, progress: 0 }),
      })
      model.root.updateMatrixWorld(true)
      expect(blade.userData.extension).toBeCloseTo(hanzoBladeExtension(fighter))
      if (frame === 0 || frame === total) expect(slide.visible).toBe(false)
      if (frame >= move.tuning.startup && frame < move.tuning.startup + move.tuning.active) {
        expect(slide.visible).toBe(true)
        expect(blade.userData.extension).toBe(1)
        const wrist = model.root
          .getObjectByName('hand-right')!
          .getWorldPosition(new THREE.Vector3())
        expect((tip.getWorldPosition(new THREE.Vector3()).x - wrist.x) * facing).toBeGreaterThan(
          0.12,
        )
        const pose = bodyPlan(fighter, { seconds: frame / 60, progress: 0 })!.pose
        const rightShoulder = facing === 1 ? pose.leadShoulder : pose.rearShoulder
        expect(rightShoulder?.[0]).toBeLessThan(-1)
      }
      const joints = physicalJoints(model.root)
      expect(physicalViolations(joints)).toEqual([])
      anatomicalBones ??= boneSnapshot(joints)
      expect(boneSnapshot(joints)).toEqual(anatomicalBones)
      blade.traverse((node) => expect(node.scale.toArray()).toEqual(bones.get(node.uuid)))
      for (const [geometry, original] of vertices)
        expect(Array.from(geometry.getAttribute('position').array)).toEqual(original)
      expect(JSON.stringify(fighter)).toBe(before)
    }
    const human = humanAnimationRig(model.turns)!
    expect(human.arms[1].getObjectByName('hanzo-hidden-blade')).toBe(blade)
  },
)

it.each(['forwardSpecial', 'backSpecial'] as const)(
  '%s is unusable when confiscated or when controlling the Nen double',
  (slot) => {
    const state = duel(),
      move = moveForSlot('hanzo', slot)!
    for (const actor of [
      { ...state.player, weaponsConfiscated: true },
      {
        ...state.player,
        hanzoProjection: {
          bodyX: 46,
          bodyFacing: 1 as const,
          bodyNen: state.player.nen,
          startupFrames: 0,
        },
      },
    ]) {
      expect(hanzoBladeAvailable(actor)).toBe(false)
      expect(canUseMovesetMove({ ...state, player: actor }, 'player', move)).toBe(false)
      expect(strike(slot, actor).player.attack).toBeNull()
      const model = buildFightFigure({
        THREE,
        glow: (colour) => new THREE.MeshBasicMaterial({ color: colour }),
        fighter: actor,
      })
      expect(model.root.getObjectByName('hanzo-hidden-blade')?.visible).toBe(false)
    }
  },
)

it('never gives a copied Skill 4 or an unrelated fighter a physical hidden blade', () => {
  const state = beginFight(createFight('chrollo', 'hisoka', { mode: 'versus-local' }))
  const model = buildFightFigure({
    THREE,
    glow: (colour) => new THREE.MeshBasicMaterial({ color: colour }),
    fighter: state.player,
  })
  expect(model.root.getObjectByName('hanzo-hidden-blade')).toBeUndefined()
})

it('lands real close-range blade damage once, without a Nen cost or projection', () => {
  let state = strike('forwardSpecial', { aura: 0, nen: { ...duel().player.nen, mode: 'zetsu' } })
  expect(state.player.aura).toBe(0)
  const before = duel().opponent.health
  for (let frame = 0; frame < 45; frame++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false })
  expect(state.opponent.health).toBeLessThan(before)
  expect(state.opponent.health).toBeGreaterThan(before - 30)
  expect(state.player.hanzoProjection).toBeUndefined()
  expect(state.player.aura).toBeGreaterThanOrEqual(0)
})

it('cancels a blade strike confiscated during startup, before it can deal invisible damage', () => {
  let state = strike('forwardSpecial')
  state.player = { ...state.player, weaponsConfiscated: true }
  const health = state.opponent.health
  for (let frame = 0; frame < 30; frame++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false })
  expect(state.player.attack).toBeNull()
  expect(state.opponent.health).toBe(health)
})
