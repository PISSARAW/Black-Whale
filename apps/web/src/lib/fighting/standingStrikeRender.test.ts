import { expect, it } from 'vitest'
import * as THREE from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { beginFight, createFight, performAttack, tickFight } from './engine'
import { buildFightFigure } from './fighterFigure'
import { fightBodyMotion } from './fightBodyMotion'
import { balanceGroundedTorso } from './fightGroundedBalance'
import { fightRigOf } from './fightRig'
import { createFightContactAlignment } from './fightContactAlignment'
import { fightWorldX } from './fightCoordinates'
import { motionOf } from './fighterMovement'
import { styleMobility } from './styleMobility'
import { moveForSlot } from './movesets'
import { keyPoseTimeline } from './keyPoseMoves'
import { STANDING_STRIKES } from './standingStrikeDirections'
import { FIGHTING_ROSTER } from './roster'
import { EMPTY_INPUT, type ArcadeFighter, type FightState, type FighterId } from './types'

const glow = (color: number) => new THREE.MeshBasicMaterial({ color })

function draw(fighter: ArcadeFighter, model: ReturnType<typeof buildFightFigure>, frame: number) {
  model.root.position.set(fightWorldX(fighter.x), 0, 0)
  model.root.rotation.y = fighter.facing * 1.25
  model.animate(frame / 60, 'idle', {
    transitionSeconds: 0,
    motion: fightBodyMotion({ fighter, seconds: frame / 60, progress: 0 }),
  })
}

function poseJoints(human: NonNullable<ReturnType<typeof humanAnimationRig>>) {
  const chest = human.figure.getObjectByName('fight-chest')!
  return [
    human.figure.rotation.y,
    ...[chest, ...human.arms, ...human.legs, ...human.knees].flatMap((joint) => [
      joint.rotation.x,
      joint.rotation.y,
      joint.rotation.z,
    ]),
  ]
}

function capture(id: FighterId, kind: 'light' | 'heavy', gap: number) {
  let state = beginFight(createFight(id, 'benjamin', { mode: 'versus-local' }))
  state = {
    ...state,
    player: { ...state.player, x: 44 },
    opponent: { ...state.opponent, x: 44 + gap },
  }
  const scene = new THREE.Scene()
  const models = {
    player: buildFightFigure({ THREE, glow, fighter: state.player }),
    opponent: buildFightFigure({ THREE, glow, fighter: state.opponent }),
  }
  scene.add(models.player.root, models.opponent.root)
  const align = createFightContactAlignment((side) => models[side].turns)
  const human = humanAnimationRig(models.player.turns)!
  const render = (current: FightState) => {
    draw(current.player, models.player, current.frame)
    draw(current.opponent, models.opponent, current.frame)
    align(current)
    expect(human.figure.rotation.x, `${id} ${kind} frame ${current.frame}`).toBe(0)
    expect(human.figure.rotation.z, `${id} ${kind} frame ${current.frame}`).toBe(0)
  }
  render(state)
  const guard = poseJoints(human)
  state = performAttack(state, 'player', kind)
  const move = moveForSlot(id, kind === 'light' ? 'standingLight' : 'standingHeavy')!
  expect(state.player.attack?.moveId).toBe(move.id)
  const { startup, active, recovery } = move.tuning
  const samples = [Math.max(1, startup - 1), startup, startup + active + Math.floor(recovery / 3)]
  const poses = new Map<number, number[]>()
  for (let elapsed = 0; elapsed < startup + active + recovery + 14; elapsed++) {
    const frame = state.player.attack?.frame
    if (frame === undefined) break
    render(state)
    if (frame === startup && kind === 'heavy' && (id === 'zakuro' || id === 'saiyu')) {
      expectSupportedTorso(human)
    }
    if (samples.includes(frame) && !poses.has(frame)) {
      const pose = poseJoints(human).map((angle, joint) => Math.round((angle - guard[joint]) * 100))
      poses.set(frame, pose)
    }
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  }
  expect(poses.size).toBe(samples.length)
  return [...poses.values()].flat()
}

/** A vertical root can still read as a rigid lean when both soles trail the hips. */
function expectSupportedTorso(human: NonNullable<ReturnType<typeof humanAnimationRig>>): void {
  const worldX = (joint: THREE.Object3D) => joint.getWorldPosition(new THREE.Vector3()).x
  const hip = (worldX(human.legs[0]) + worldX(human.legs[1])) / 2
  const shoulder = (worldX(human.arms[0]) + worldX(human.arms[1])) / 2
  const nearestSole = Math.min(
    ...human.knees.map((knee) => Math.abs(worldX(knee.children[1]) - hip)),
  )
  expect(nearestSole).toBeLessThan(0.25)
  expect(Math.abs(shoulder - hip)).toBeLessThan(0.15)
}

it.each([6, 21])(
  'keeps all 40 grounded J/K poses vertical and their drawn joint paths distinct at gap %s',
  (gap) => {
    const light = new Map<FighterId, number[]>(),
      heavy = new Map<FighterId, number[]>()
    for (const { id } of FIGHTING_ROSTER) {
      const j = capture(id, 'light', gap)
      const k = capture(id, 'heavy', gap)
      expect(distance(j, k), id).toBeGreaterThan(6)
      light.set(id, j)
      heavy.set(id, k)
    }
    for (const paths of [light, heavy]) {
      expect(new Set([...paths.values()].map((path) => JSON.stringify(path))).size).toBe(40)
      for (const [a, b] of [
        ['mizaistom', 'terebellum'],
        ['cluck', 'sayird'],
        ['camilla', 'musse'],
        ['hinrigh', 'longhi'],
        ['beyond', 'padaille'],
        ['padaille', 'lynch'],
        ['rihan', 'basho'],
        ['bonolenov', 'melody'],
        ['halkenburg', 'yokotani'],
        ['bill', 'yokotani'],
        ['saiyu', 'zakuro'],
        ['illumi', 'machi'],
        ['gel', 'lynch'],
        ['luini', 'theta'],
        ['tserriednich', 'leorio'],
        ['hanzo', 'luini'],
        ['kurapika', 'hisoka'],
        ['benjamin', 'franklin'],
        ['biscuit', 'hisoka'],
      ] as const) {
        expect(distance(paths.get(a)!, paths.get(b)!), `${a}/${b}`).toBeGreaterThan(9)
      }
    }
  },
  30_000,
)

function distance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, angle, index) => sum + (angle - b[index]) ** 2, 0) / a.length)
}

it('keeps the figure vertical in both directions of every grounded dash', () => {
  for (const { id } of FIGHTING_ROSTER) {
    const fighter = createFight(id, 'benjamin').player
    const model = buildFightFigure({ THREE, glow, fighter })
    const human = humanAnimationRig(model.turns)!
    const mobility = styleMobility(fighter)
    for (const facing of [1, -1] as const) {
      for (const direction of [1, -1] as const) {
        const dash = direction === facing ? mobility.forwardDash : mobility.backDash
        draw(
          {
            ...fighter,
            facing,
            pose: 'walk',
            motion: {
              ...motionOf(fighter),
              dash: { ...dash, direction, frame: Math.floor(dash.frames / 2) },
            },
          },
          model,
          dash.frames,
        )
        expect(human.figure.rotation.x, id).toBe(0)
        expect(human.figure.rotation.z, id).toBe(0)
      }
    }
  }
})

it('plays the authored preparation beat for each grounded footwork direction', () => {
  for (const { id } of FIGHTING_ROSTER) {
    for (const slot of ['standingLight', 'standingHeavy'] as const) {
      const strike = STANDING_STRIKES[id]?.[slot]
      if (!strike) continue
      const preparation = keyPoseTimeline(id, slot)?.filter((key) => key.phase === 'startup')
      expect(preparation?.at(-1)?.at, `${id} ${slot}`).toBe(strike.chamberAt)
      expect(preparation?.map(({ at }) => at)).toEqual(
        preparation?.map(({ at }) => at).sort((a, b) => a - b),
      )
    }
  }
})

it.each([1, -1] as const)(
  'counterbalances a rigid lean without moving the soles, facing %s',
  (facing) => {
    const state = beginFight(createFight('zakuro', 'benjamin', { mode: 'versus-local' }))
    const fighter = { ...state.player, facing }
    const model = buildFightFigure({ THREE, glow, fighter })
    draw(fighter, model, 0)
    const human = humanAnimationRig(model.turns)!
    const rig = fightRigOf(human)
    const worldX = (joint: THREE.Object3D) => joint.getWorldPosition(new THREE.Vector3()).x
    const shoulders = () => (worldX(human.arms[0]) + worldX(human.arms[1])) / 2
    const pivot = human.figure.localToWorld(new THREE.Vector3(0, rig.waist, 0))
    // Put the torso past the front sole while keeping the rig's root vertical.
    rig.chest.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.58)
    rig.chest.position.set(0, rig.waist, 0).applyQuaternion(rig.chest.quaternion).multiplyScalar(-1)
    rig.chest.position.y += rig.waist
    const direction = Math.sign(shoulders() - pivot.x)
    const trailing = human.figure
      .worldToLocal(pivot.clone().add(new THREE.Vector3(-direction * 0.55, 0, 0)))
      .sub(new THREE.Vector3(0, rig.waist, 0))
    human.legs.forEach((leg) => leg.position.add(trailing))
    const feet = rig.ankles.map((ankle) => ankle.getWorldPosition(new THREE.Vector3()))
    const before = Math.abs(shoulders() - pivot.x)
    balanceGroundedTorso(rig)
    expect(Math.abs(shoulders() - pivot.x)).toBeLessThan(before)
    expect(rig.ankles.map((ankle) => ankle.getWorldPosition(new THREE.Vector3()))).toEqual(feet)
    expect(human.figure.rotation.x).toBe(0)
    expect(human.figure.rotation.z).toBe(0)
  },
)
