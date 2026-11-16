import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performMove, tickFight } from './engine'
import { createFightImpactScene } from './fightImpactScene'
import { defaultFightComfort, comfortableImpact } from './fightComfort'
import { fightReplayHash } from './fightReplayHash'
import { EMPTY_INPUT, type FightImpact } from './types'

function contact() {
  let state = beginFight(createFight('hisoka', 'kurapika', { mode: 'versus-local' }))
  state.player.x = 47
  state.opponent.x = 52
  state = performMove({ state, side: 'player', action: 'heavy' })
  for (let i = 0; i < 50 && !state.impact; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  if (!state.impact) throw Error('Expected a real engine contact')
  return state
}

describe('contacts show actual public outcomes', () => {
  it.each([
    ['hit', {}],
    ['guard', { blocked: true }],
    ['parry', { parried: true, blocked: true }],
  ] as const)('gives %s a distinct shape and never mutates combat', (kind, flags) => {
    const state = contact()
    state.impact = { ...state.impact!, ...flags }
    const hash = fightReplayHash(state)
    const scene = new THREE.Scene()
    const initial = { ...state, impact: null }
    const effect = createFightImpactScene({
      THREE,
      scene,
      initial,
      comfort: defaultFightComfort,
      geometry: (made) => made,
      glow: (color) => new THREE.MeshBasicMaterial({ color }),
    })
    effect.emit(state, 100)
    expect(scene.getObjectByName(`fight-contact-${kind}`)).toBeDefined()
    const type = (scene.children[0] as THREE.Mesh).geometry.type
    expect(type).toBe({ hit: 'SphereGeometry', guard: 'BoxGeometry', parry: 'TorusGeometry' }[kind])
    const count = scene.children.length
    effect.emit(state, 100)
    expect(scene.children).toHaveLength(count)
    effect.animate(500)
    expect(scene.children).toHaveLength(0)
    expect(fightReplayHash(state)).toBe(hash)
  })
  it.each(['avoided', 'invulnerable'] as const)('does not present %s as a damaging blow', (key) => {
    const state = contact()
    const impact = { ...state.impact!, [key]: true }
    const profile = comfortableImpact({
      impact,
      attacker: 'hisoka',
      comfort: defaultFightComfort(),
    })
    expect(profile).toMatchObject({ sparks: 0, shakeMs: 0, shakeX: 0, shakeY: 0 })
  })
  it('does not infer a secret Nen ability from contact information', () => {
    const state = contact()
    const impact: FightImpact = { ...state.impact!, concealed: true }
    expect(
      comfortableImpact({ impact, attacker: state.player.id, comfort: defaultFightComfort() }),
    ).toEqual(
      comfortableImpact({
        impact: { ...impact, concealed: false },
        attacker: state.player.id,
        comfort: defaultFightComfort(),
      }),
    )
  })
})
