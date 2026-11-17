import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight } from './engine'
import { createKurapikaEffectScene } from './kurapikaEffectScene'
import { performArsenalCommand } from './retrospectiveArsenal'
import { advanceDowsing } from './dowsingAction'
import type { FightState } from './types'

function reading(): FightState {
  const base = beginFight(createFight('kurapika', 'hisoka', { mode: 'versus-local' }))
  const state = {
    ...base,
    player: { ...base.player, x: 42, facing: 1 as const },
    opponent: { ...base.opponent, x: 48, facing: -1 as const },
  }
  const asked = performArsenalCommand(state, 'player', {
    action: 'dowsing-ask',
    target: 'identity',
  })
  return performArsenalCommand(asked, 'opponent', { action: 'dowsing-answer', target: 'lie' })
}

describe('the real Dowsing pendulum follows simulation and perception', () => {
  it('swings the ring-finger tip on a knowing lie, then hides it when the live Hatsu is stopped', () => {
    const scene = new THREE.Scene()
    const effect = createKurapikaEffectScene({
      THREE,
      scene,
      worldX: (x) => x * 0.12,
      worldY: (y) => y * 0.12,
    })
    const state = reading()
    effect.sync(state, 0)
    const tip = scene
      .getObjectByName('kurapika-chains:player')!
      .getObjectByName('kurapika-chain-tip:pendulum')!
    expect(tip.visible).toBe(true)
    const before = tip.position.x
    effect.sync({ ...state, frame: state.frame + 5 }, 5 / 60)
    expect(tip.position.x).not.toBeCloseTo(before)
    const stopped = advanceDowsing({ ...state, player: { ...state.player, hitStun: 10 } })
    effect.sync(stopped, 1)
    expect(tip.visible).toBe(false)
    expect(stopped.player.dowsingReading).toEqual(state.player.dowsingReading)
    effect.dispose()
  })
  it('conceals the pendulum with In for the other viewer and restores actual Gyo visibility', () => {
    const scene = new THREE.Scene()
    const effect = createKurapikaEffectScene({
      THREE,
      scene,
      worldX: (x) => x * 0.12,
      worldY: (y) => y * 0.12,
      viewer: () => 'opponent',
    })
    const read = reading(),
      hidden = { ...read, player: { ...read.player, nen: { ...read.player.nen, in: true } } }
    effect.sync(hidden, 0)
    const tip = scene
      .getObjectByName('kurapika-chains:player')!
      .getObjectByName('kurapika-chain-tip:pendulum')!
    expect(tip.visible).toBe(false)
    const gyo = {
      ...hidden,
      opponent: { ...hidden.opponent, nen: { ...hidden.opponent.nen, gyo: true } },
    }
    effect.sync(gyo, 0)
    expect(tip.visible).toBe(true)
    effect.dispose()
  })
})
