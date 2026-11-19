import { expect, it } from 'vitest'
import * as THREE from 'three'
import { createFightState } from './fightState'
import { performAttack, tickFight } from './engine'
import { createFightReactionPresentation } from './fightReactionPresentation'
import { createFightContactAlignment, fightContactSurface } from './fightContactAlignment'
import { anatomicalContactZone, surfaceContactAt } from './fightSurfaceContact'
import { buildFightFigure } from './fighterFigure'
import { fightBodyMotion } from './fightBodyMotion'
import { fightStrikeLimb } from './fightStrikeLimb'
import { fightRigOf } from './fightRig'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { EMPTY_INPUT, type FighterId } from './types'
import { fightReplayHash } from './fightReplayHash'

const pairs: [FighterId, FighterId][] = [
  ['biscuit', 'bonolenov'],
  ['feitan', 'mizaistom'],
  ['kalluto', 'illumi'],
  ['benjamin', 'leorio'],
  ['phinks', 'kurapika'],
  ['shizuku', 'franklin'],
]
const glow = (color: number) => new THREE.MeshBasicMaterial({ color })
it.each(pairs)('%s hits the same anatomical surface shown by its reaction and impact', (a, b) => {
  for (const facing of [1, -1] as const) {
    let state = createFightState(a, b, { mode: 'versus-local', formatId: 'knockout' })
    state = {
      ...state,
      phase: 'fighting',
      player: { ...state.player, x: facing === 1 ? 44 : 50, facing },
      opponent: { ...state.opponent, x: facing === 1 ? 50 : 44, facing: facing === 1 ? -1 : 1 },
    }
    state = performAttack(state, 'player', 'light')
    for (let n = 0; n < 40 && !state.impact; n++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
    expect(state.impact?.attacker).toBe('player')
    const hash = fightReplayHash(state)
    const models = {
      player: buildFightFigure({ THREE, glow, fighter: state.player }),
      opponent: buildFightFigure({ THREE, glow, fighter: state.opponent }),
    }
    const scene = new THREE.Scene(),
      read = createFightReactionPresentation()
    const zone = anatomicalContactZone(state.player, state.opponent, state.impact!.zone)
    for (const side of ['player', 'opponent'] as const) {
      scene.add(models[side].root)
      models[side].root.position.x = (state[side].x - 47) * 0.115
      models[side].root.rotation.y = state[side].facing * 1.25
      const context = read(state, side, { fighter: state[side], seconds: state.frame / 60 })
      if (side === 'opponent') expect(context.physicalHit?.zone).toBe(zone)
      models[side].animate(0, 'idle', {
        transitionSeconds: 0,
        motion: fightBodyMotion({ fighter: state[side], ...context, seconds: state.frame / 60 }),
      })
    }
    createFightContactAlignment((side) => models[side].turns)(state)
    const surface = surfaceContactAt(models.player.turns, state.frame, state.impact!.sequence)!
    expect(surface).toBeDefined()
    const expected = fightContactSurface(
      fightRigOf(humanAnimationRig(models.opponent.turns)!),
      zone,
      { facing, near: surface },
    )
    expect(surface.distanceTo(expected)).toBeLessThan(1e-6)
    const limb = fightStrikeLimb(state.player, 'hands')
    const hands = limb === 'both' ? ['hand-left', 'hand-right'] : [`hand-${limb}`]
    const gap = Math.min(
      ...hands.map((name) =>
        models.player.turns
          .getObjectByName(name)!
          .getWorldPosition(new THREE.Vector3())
          .distanceTo(surface),
      ),
    )
    expect(gap, `${a}/${b} facing ${facing}`).toBeLessThan(0.18)
    expect(
      surfaceContactAt(models.player.turns, state.frame + 1, state.impact!.sequence),
    ).toBeUndefined()
    expect(fightReplayHash(state)).toBe(hash)
  }
})
