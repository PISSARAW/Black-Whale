import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { beginFight, createFight, performThrow } from '../engine'
import { resolveFightImpacts } from '../combatImpact'
import { attackData } from '../frameData'
import { buildFightFigure } from '../fighterFigure'
import { introBodyMotion } from '../presentation/introMotion'
import { fightGroundContact, lowestBodyHeight } from '../fightGroundContact'
import { fightRigOf } from '../fightRig'
import { throwBodyPosition, thrownVisualFighter } from '../throwCinematicMotion'
import { confirmedThrow } from '../throwCinematic'
import { fightWorldX, fightWorldY } from '../fightCoordinates'
import { EMPTY_INPUT, type FighterId, type FightSide } from '../types'
import { createThrowSignatureScene } from './scene'
import { pivotThrowBody } from './physics'
import { sampleThrowBeat } from './sample'
import { THROW_PERFORMANCES, throwPerformanceFor } from './catalogue'

const glow = (color: number) => new THREE.MeshBasicMaterial({ color })
function rigFor(id: FighterId) {
  const state = beginFight(createFight(id, 'kurapika'))
  const model = buildFightFigure({ THREE, glow, fighter: state.player })
  const human = humanAnimationRig(model.turns)!
  fightRigOf(human)
  return { model, human }
}

describe('throw weight, pivot and support', () => {
  it.each(['biscuit', 'benjamin', 'franklin'] as const)(
    '%s rotates around the pelvis rather than swinging it around the feet',
    (id) => {
      const { model, human } = rigFor(id)
      model.root.position.set(2, 0.5, -1)
      human.figure.rotation.set(0, 0, 0)
      const pivot = new THREE.Vector3(0, human.legs[0].position.y, 0)
      const before = human.figure.localToWorld(pivot.clone())
      human.figure.rotation.set(-1.3, 0.7, 0.15)
      pivotThrowBody(human)
      expect(human.figure.localToWorld(pivot.clone()).distanceTo(before)).toBeLessThan(1e-8)
    },
  )
  it('continues moving through an intermediate lift key instead of stopping at each pose', () => {
    const performance = throwPerformanceFor('franklin', false)!
    const y = (t: number) => sampleThrowBeat(performance, t).path[1]
    expect(y(0.3) - y(0.2999)).toBeGreaterThan(0.0002)
    expect(y(0.3001) - y(0.3)).toBeGreaterThan(0.0002)
  })
  it('keeps angular velocity through the intermediate lift as well as root travel', () => {
    const performance = throwPerformanceFor('franklin', false)!
    const pitch = (t: number) => sampleThrowBeat(performance, t).victim.body![0]
    expect(pitch(0.3001) - pitch(0.3)).toBeLessThan(-0.00001)
    expect(pitch(0.3) - pitch(0.2999)).toBeLessThan(-0.00001)
  })
  it.each(THROW_PERFORMANCES.map((performance) => [performance.id, performance] as const))(
    '%s accelerates down from its apex and stays on the floor after impact',
    (_, performance) => {
      const peak = performance.beats.reduce((a, b) => (b.path[1] > a.path[1] ? b : a))
      const land = performance.beats.find((beat) => beat.at > peak.at && beat.path[1] === 0)!
      if (peak.path[1] <= 0 || !land) return
      const height = (u: number) =>
        sampleThrowBeat(performance, peak.at + (land.at - peak.at) * u).path[1]
      expect(height(0.7) - height(0.6)).toBeLessThan(height(0.3) - height(0.2))
      expect(sampleThrowBeat(performance, land.at).path[1]).toBe(0)
    },
  )
  it.each(['benjamin', 'franklin', 'machi', 'hanzo'] as const)(
    '%s keeps rigid bones, releases support feet and lands the whole body in either seat',
    (id) => {
      for (const side of ['player', 'opponent'] as const) audit({ id, side })
    },
  )
})

function audit(options: { id: FighterId; side: FightSide }) {
  const { id, side } = options
  let state = beginFight(
    createFight(side === 'player' ? id : 'kurapika', side === 'opponent' ? id : 'kurapika', {
      mode: 'versus-local',
    }),
  )
  state = {
    ...state,
    player: { ...state.player, x: 46, aura: 100 },
    opponent: { ...state.opponent, x: 51, aura: 100 },
  }
  state = performThrow(state, side, { ...EMPTY_INPUT, aura: true })
  state = resolveFightImpacts(
    {
      ...state,
      [side]: {
        ...state[side],
        attack: { ...state[side].attack!, frame: attackData('heavy', state[side]).startup },
      },
    },
    [],
  )
  const before = structuredClone(state),
    confirmed = confirmedThrow(state)!
  let frame = confirmed
  const scene = new THREE.Scene()
  const models = {
    player: buildFightFigure({ THREE, glow, fighter: state.player }),
    opponent: buildFightFigure({ THREE, glow, fighter: state.opponent }),
  }
  scene.add(models.player.root, models.opponent.root)
  const signature = createThrowSignatureScene({
    THREE,
    scene,
    worldX: fightWorldX,
    worldY: fightWorldY,
    figureOf: (seat) => models[seat].turns,
    throwFrame: () => frame,
  })
  const bones = Object.values(models).flatMap((model) =>
    humanAnimationRig(model.turns)!.knees.map((knee) => knee.position.length()),
  )
  for (const t of [0, 0.24, 0.4, 0.58, 0.72, 0.85]) {
    frame = { ...confirmed, age: confirmed.duration * t }
    for (const seat of ['player', 'opponent'] as const) {
      const position = throwBodyPosition({ state, side: seat, frame, fallback: state[seat] })
      const fighter =
        seat === frame.victim ? thrownVisualFighter(state[seat], position) : state[seat]
      const model = models[seat]
      model.root.position.set(fightWorldX(position.x), fightWorldY(position.y), position.z ?? 0)
      model.root.rotation.y = fighter.facing * 1.25
      model.animate(t, 'idle', {
        motion: introBodyMotion({
          fighter,
          side: seat,
          introFrame: null,
          throwFrame: frame,
          seconds: t,
          progress: t,
        }),
        afterMotion: fightGroundContact(fighter),
      })
    }
    signature.sync(state, t)
    if (t === 0.24 && id !== 'hanzo') {
      const human = humanAnimationRig(models[frame.attacker].turns)!
      const soles = human.knees.map(
        (knee) => new THREE.Box3().setFromObject(knee.children[1]).min.y,
      )
      expect(Math.min(...soles)).toBeLessThan(0.1)
      expect(Math.max(...soles) - Math.min(...soles)).toBeGreaterThan(0.025)
      expect(
        human.knees.every(
          (knee) => Math.abs(knee.rotation.y) < 1e-8 && Math.abs(knee.rotation.z) < 1e-8,
        ),
      ).toBe(true)
    }
    const actual = Object.values(models).flatMap((model) =>
      humanAnimationRig(model.turns)!.knees.map((knee) => knee.position.length()),
    )
    expect(actual).toEqual(bones)
    for (const seat of ['player', 'opponent'] as const)
      expect(lowestBodyHeight(humanAnimationRig(models[seat].turns)!)).toBeGreaterThan(-0.015)
    if (t === 0.85)
      expect(lowestBodyHeight(humanAnimationRig(models[frame.victim].turns)!)).toBeCloseTo(0.012, 2)
  }
  expect(state).toEqual(before)
  signature.dispose()
}
