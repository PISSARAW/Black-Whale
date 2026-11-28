import { describe, expect, it } from 'vitest'
import { Group, PerspectiveCamera, Scene, Vector3 } from 'three'
import { createFight } from '../engine'
import { defaultFightComfort } from '../fightComfort'
import { createPremiumCinematic } from './premiumCinematic'
import { premiumImpactPhase } from './premiumCinematicTiming'
import type { VictoryContext } from './types'

function context(): VictoryContext {
  const scene = new Scene()
  const camera = new PerspectiveCamera(34, 1.6, 0.1, 100)
  const hero = new Group()
  const victim = new Group()
  const heroHead = new Group()
  const victimHead = new Group()
  hero.add(heroHead)
  victim.add(victimHead)
  camera.position.set(0, 2, 8)
  scene.add(hero, victim)
  return {
    scene,
    scenery: new Group(),
    camera,
    state: createFight('phinks', 'franklin'),
    frame: {
      active: true,
      elapsed: 4.5,
      fighter: 'phinks',
      loser: 'opponent',
      winner: 'player',
      token: 'premium-test',
    },
    age: 270,
    hero: { root: hero, head: heroHead, height: 1.8, width: 0.6 },
    victim: { root: victim, head: victimHead, height: 1.8, width: 0.6 },
    centre: 0,
    gap: 2,
    comfort: defaultFightComfort(),
    save: () => {},
    material: () => {},
    defer: () => {},
    add: (root) => scene.add(root),
  }
}

describe('premium cinematic foundation', () => {
  it('provides anticipation, contact hold and a deterministic recovery', () => {
    expect(premiumImpactPhase(250, { impact: 270 }).stage).toBe('idle')
    expect(premiumImpactPhase(264, { impact: 270 }).anticipation).toBeGreaterThan(0)
    expect(premiumImpactPhase(270, { impact: 270 }).contact).toBe(1)
    expect(premiumImpactPhase(282, { impact: 270 }).stage).toBe('recovery')
    expect(premiumImpactPhase(310, { impact: 270 }).stage).toBe('idle')
  })

  it('adds a signature shot, event light and three-phase body response', () => {
    const fixture = context()
    const premium = createPremiumCinematic()
    premium.apply(fixture, {
      impact: 270,
      focus: new Vector3(1, 1, 0),
      strength: 1,
      signature: { start: 258, end: 292, width: 1.2, height: 0.9 },
    })
    expect(fixture.scene.userData.premiumCinematic).toMatchObject({
      stage: 'contact',
      contact: 1,
      signature: true,
    })
    expect(fixture.victim.root.position.x).toBeGreaterThan(0.1)
    expect(fixture.victim.root.rotation.z).toBeLessThan(-0.1)
    expect(fixture.camera.position.z).toBeLessThan(8)
    expect(fixture.scene.getObjectByName('premium-cinematic-light')).toBeTruthy()
    premium.dispose()
  })

  it('keeps the comfort camera fixed and suppresses the flash', () => {
    const fixture = context()
    fixture.comfort = { ...defaultFightComfort(), camera: 0, shake: 0, flashes: false }
    const before = fixture.camera.position.toArray()
    const premium = createPremiumCinematic()
    premium.apply(fixture, {
      impact: 270,
      focus: new Vector3(1, 1, 0),
      signature: { start: 258, end: 292, width: 1.2, height: 0.9 },
    })
    expect(fixture.camera.position.toArray()).toEqual(before)
    expect(fixture.scene.userData.premiumCinematic.signature).toBe(false)
    expect(fixture.scene.userData.premiumCinematic.cameraImpulse).toBe(0)
    expect(fixture.scene.userData.premiumCinematic.light).toBeLessThan(0.2)
    premium.dispose()
  })
})
