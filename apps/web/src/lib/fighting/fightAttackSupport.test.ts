import { expect, it } from 'vitest'
import * as THREE from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { buildFightFigure, fightFigureKey } from './fighterFigure'
import { createPresentedModelRefresh } from './refreshPresentedModel'
import { createFightState } from './fightState'
import { performAuraAttack, tickFight } from './engine'
import { createFightReactionPresentation } from './fightReactionPresentation'
import { createFightContactAlignment } from './fightContactAlignment'
import { fightBodyMotion } from './fightBodyMotion'
import { fightGroundContact } from './fightGroundContact'
import { lowestFootHeight } from './fightFootContact'
import { supportCycle } from './fightSupportCycle'
import { fightRigOf } from './fightRig'
import { moveForSlot } from './movesets'
import { canStartFighterAttack } from './fighterAttacks'
import { focusNenZone } from './nenAdvanced'
import { FIGHTING_ROSTER } from './roster'
import { EMPTY_INPUT, type FighterId, type FightState } from './types'

function combo(id: FighterId, facing: 1 | -1) {
  const ids = FIGHTING_ROSTER.map((fighter) => fighter.id)
  const opponent = ids[(ids.indexOf(id) + 13) % ids.length]
  let state: FightState = { ...createFightState(id, opponent), phase: 'fighting' }
  state.player = { ...state.player, x: facing === 1 ? 44 : 50, facing }
  state.opponent = { ...state.opponent, x: facing === 1 ? 50 : 44, facing: facing === 1 ? -1 : 1 }
  const scene = new THREE.Scene()
  const make = (fighter: FightState['player']) =>
    buildFightFigure({ THREE, fighter, glow: (color) => new THREE.MeshBasicMaterial({ color }) })
  const models = {
    player: { model: make(state.player), nen: fightFigureKey(state.player) },
    opponent: { model: make(state.opponent), nen: fightFigureKey(state.opponent) },
  }
  scene.add(models.player.model.root, models.opponent.model.root)
  const refresh = createPresentedModelRefresh({
    scene,
    models,
    nenKey: fightFigureKey,
    buildFighter: make,
  })
  const reaction = createFightReactionPresentation()
  const align = createFightContactAlignment((side) => models[side].model.turns)
  const samples: {
    frame: number
    side: string
    move?: string
    attackFrame?: number
    feet: number[]
    support: number
    free?: number
    pelvis: number
  }[] = []
  function draw() {
    for (const side of ['player', 'opponent'] as const) {
      const fighter = state[side],
        model = refresh(side, fighter)
      model.root.position.set((fighter.x - 47) * 0.115, fighter.y * 0.12, 0)
      model.root.rotation.y = fighter.facing * 1.25
      model.animate(state.frame / 60, 'idle', {
        transitionSeconds: 0,
        motion: fightBodyMotion({
          fighter,
          ...reaction(state, side, { fighter, seconds: state.frame / 60 }),
          seconds: state.frame / 60,
        }),
        afterMotion: fightGroundContact(fighter),
      })
    }
    align(state)
    for (const side of ['player', 'opponent'] as const) {
      const fighter = state[side],
        human = humanAnimationRig(models[side].model.turns)!,
        rig = fightRigOf(human)
      if (
        fighter.y > 0 ||
        fighter.health <= 0 ||
        !rig.planted ||
        ['down', 'wakeup', 'ko'].includes(fighter.pose)
      )
        continue
      samples.push({
        frame: state.frame,
        side,
        move: fighter.attack?.moveId,
        attackFrame: fighter.attack?.frame,
        feet: rig.ankles.map(lowestFootHeight),
        ...supportCycle(fighter),
        pelvis: human.pelvis.getWorldPosition(new THREE.Vector3()).y,
      })
    }
  }
  let hits = 0,
    sequence = 0,
    heavyStarted = false
  const light = moveForSlot(id, 'standingLight')!,
    heavy = moveForSlot(id, 'standingHeavy')!
  draw()
  for (let frame = 0; frame < 110; frame++) {
    if (frame === 8) {
      state.player = focusNenZone(state.player, 'hands')
      state = performAuraAttack({
        state,
        side: 'player',
        kind: light.kind,
        moveId: light.id,
        auraCharged: false,
      })
    }
    if (hits >= 1 && !heavyStarted && canStartFighterAttack(state.player, heavy.kind, heavy.id)) {
      state.player = focusNenZone(state.player, heavy.tuning.auraZone)
      state = performAuraAttack({
        state,
        side: 'player',
        kind: heavy.kind,
        moveId: heavy.id,
        auraCharged: false,
      })
      heavyStarted = state.player.attack?.moveId === heavy.id
    }
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
    if (state.impact && state.impact.sequence !== sequence) {
      sequence = state.impact.sequence
      if (state.impact.attacker === 'player' && !state.impact.blocked) hits++
    }
    draw()
  }
  return { samples, hits, heavyStarted }
}

it.each(FIGHTING_ROSTER.flatMap(({ id }) => ([1, -1] as const).map((facing) => ({ id, facing }))))(
  '$id keeps its soles above the floor and one support through light → heavy facing $facing',
  ({ id, facing }) => {
    const { samples, hits, heavyStarted } = combo(id, facing)
    expect(heavyStarted).toBe(true)
    expect(hits).toBeGreaterThanOrEqual(2)
    for (const sample of samples) {
      expect(Math.min(...sample.feet), JSON.stringify(sample)).toBeGreaterThan(-0.008)
      expect(Math.min(...sample.feet), JSON.stringify(sample)).toBeLessThan(0.02)
      if (sample.free !== undefined)
        expect(sample.feet[sample.support], JSON.stringify(sample)).toBeLessThan(0.02)
    }
    if (id === 'kurapika') {
      const attacker = samples.filter((sample) => sample.side === 'player')
      const entry = attacker.findIndex((sample) => sample.move === 'kurapika:standingHeavy')
      // Keeping a sole above the floor alone must not hide the original pelvis collapse.
      expect(attacker[entry - 1].pelvis - attacker[entry].pelvis).toBeLessThan(0.15)
    }
  },
)
