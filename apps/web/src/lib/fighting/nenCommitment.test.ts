import { expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performAuraAttack } from './engine'
import { FIGHTING_ROSTER } from './roster'
import { readNenCommitment, prioritiseCommitmentPunish, withNenCommitment } from './nenCommitment'
import { focusNenZone } from './nenAdvanced'
import { advanceNenTransfer } from './nenTransfer'
import { attackData, attackTotal } from './frameData'
import { createNenConcentrationScene } from './nenConcentrationScene'
import { buildFightFigure } from './fighterFigure'
import { fighterAuraHex } from './auraColours'
import type { BodyPlan } from './fightPose'

it.each(FIGHTING_ROSTER.map(({ id }) => id))(
  '%s exposes only current public commitment and keeps its contact pose',
  (id) => {
    let state = beginFight(createFight(id, 'hisoka', { mode: 'versus-local' }))
    state = performAuraAttack({
      state,
      side: 'player',
      kind: 'heavy',
      moveId: `${id}:standingHeavy`,
      auraCharged: true,
    })
    const data = attackData('heavy', state.player)
    const plan: BodyPlan = { pose: { chest: [0.2, 0, 0] }, plant: true, key: id, blend: 0.03 }
    const active = { ...state.player, attack: { ...state.player.attack!, frame: data.startup } }
    expect(withNenCommitment(plan, active)).toBe(plan)
    state.player = {
      ...active,
      attack: { ...active.attack, frame: data.startup + data.active + 1 },
    }
    const reading = readNenCommitment(state, 'player', 'opponent')!
    expect(reading.kind).toBe('recovery')
    expect(reading.frames).toBe(attackTotal(data) - state.player.attack!.frame)
    const slots = ['standingLight', 'standingHeavy', 'forwardLight'] as const
    expect([...prioritiseCommitmentPunish({ state, gap: 5, roll: 0.4 }, slots)].sort()).toEqual(
      [...slots].sort(),
    )
  },
)

it('keeps hidden transfers private until Gyo and never grants a blind punish', () => {
  const state = beginFight(createFight('hisoka', 'machi', { mode: 'versus-local' }))
  state.player = focusNenZone(focusNenZone(state.player, 'feet'), 'hands')
  state.player.nen.in = true
  expect(readNenCommitment(state, 'player', 'opponent')).toBeNull()
  state.opponent = { ...state.opponent, nen: { ...state.opponent.nen, gyo: true } }
  expect(readNenCommitment(state, 'player', 'opponent')?.kind).toBe('transfer')
  state.opponent.parallelEyesClosed = true
  expect(readNenCommitment(state, 'player', 'opponent')).toBeNull()
})

it.each(FIGHTING_ROSTER.map(({ id }) => id))(
  '%s shows travelling flux during a real interpolated transfer in its owner colour',
  (id) => {
    let state = beginFight(createFight(id, 'machi', { mode: 'versus-local' }))
    state.player = focusNenZone(state.player, 'feet')
    const model = buildFightFigure({
      THREE,
      glow: (color) => new THREE.MeshBasicMaterial({ color }),
      fighter: state.player,
    })
    const scene = new THREE.Scene()
    scene.add(model.root)
    const effects = createNenConcentrationScene({
      THREE,
      scene,
      worldX: (x) => x,
      worldY: (y) => y,
      viewer: () => 'player',
      figureOf: (side) => (side === 'player' ? model.turns : undefined),
    })
    effects.sync(state)
    state.player = focusNenZone(state.player, 'hands')
    state = { ...state, frame: state.frame + 1, player: advanceNenTransfer(state.player, 1 / 60) }
    effects.sync(state)
    const flow = scene.children.filter(
      (node) => node.name === 'nen-redistribution-flow' && node.visible,
    ) as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>[]
    expect(flow.length).toBeGreaterThan(0)
    expect(state.player.nen.ryu.hands).toBeLessThan(0.5)
    for (const node of flow) expect(node.material.color.getHex()).toBe(fighterAuraHex(id))
    const before = flow.map((node) => [...node.geometry.attributes.position.array])
    effects.sync({ ...state, frame: state.frame + 1, hitstop: 4 })
    expect(flow.map((node) => [...node.geometry.attributes.position.array])).toEqual(before)
    effects.dispose()
  },
)
