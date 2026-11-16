import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { hasLikeness } from '../tour/humanProfiles'
import { buildStageBackground } from './stageBackground'
import {
  backgroundParticipants,
  STAGE_BACKGROUNDS,
  stageBackgroundDescription,
} from './stageBackgroundCatalogue'
import { BACKGROUND_GLYPHS } from './stageBackgroundGlyphs'
import { FIGHT_STAGES } from './stages'
import { createFightState } from './fightState'
import type { SceneryKit } from './stageKit'
import type { FightState } from './types'

function kit(): SceneryKit {
  return {
    THREE,
    geometry: (geometry) => geometry,
    glow: (colour, opacity) => new THREE.MeshBasicMaterial({ color: colour, opacity }),
  }
}
function transforms(root: THREE.Object3D): number[][] {
  const result: number[][] = []
  root.traverse((object) =>
    result.push([
      ...object.position.toArray(),
      object.rotation.x,
      object.rotation.y,
      object.rotation.z,
    ]),
  )
  return result
}
function impact(state: FightState): void {
  state.impact = { ...state.impact, sequence: 1 } as NonNullable<FightState['impact']>
}
function audience(root: THREE.Group): THREE.Object3D {
  return root.getObjectByName('background-audience')!
}

describe('stage background Easter Eggs', () => {
  it('authors two declared cameos, an original image and a keepsake for all 33 stages', () => {
    expect(Object.keys(STAGE_BACKGROUNDS).sort()).toEqual(
      FIGHT_STAGES.map((stage) => stage.id).sort(),
    )
    const headlines = new Set<string>()
    for (const definition of Object.values(STAGE_BACKGROUNDS)) {
      expect(definition.spectators).toHaveLength(2)
      expect(new Set(definition.spectators.map((person) => person.identity)).size).toBe(2)
      for (const person of definition.spectators)
        expect(hasLikeness(person.identity), person.identity).toBe(true)
      expect(BACKGROUND_GLYPHS[definition.image.motif]).toMatch(/^M/)
      expect(definition.image.caption.fr.length).toBeGreaterThan(20)
      expect(definition.image.caption.en.length).toBeGreaterThan(20)
      expect(definition.secret.caption.fr.length).toBeGreaterThan(20)
      headlines.add(definition.image.headline)
    }
    expect(headlines.size).toBe(33)
  })

  it.each(FIGHT_STAGES)(
    'builds finite decorations behind the duel in $id without changing its state',
    (stage) => {
      const state = createFightState('kurapika', 'hisoka')
      const before = JSON.stringify(state)
      const background = buildStageBackground(kit(), stage.id, { fight: () => state })
      expect(audience(background.root).children).toHaveLength(2)
      expect(background.root.children).toHaveLength(3)
      expect(background.root.userData.decorative).toBe(true)
      background.update(0)
      background.update(1)
      background.root.updateMatrixWorld(true)
      const bounds = new THREE.Box3().setFromObject(background.root)
      expect(bounds.max.z).toBeLessThan(0.1)
      for (const vector of [bounds.min, bounds.max])
        expect(vector.toArray().every(Number.isFinite)).toBe(true)
      expect(JSON.stringify(state)).toBe(before)
      background.dispose()
    },
  )

  it('replaces combatant cameos with passengers and hides later duplicates', () => {
    const state = createFightState('biscuit', 'leorio')
    expect(backgroundParticipants(state)).toEqual(['biscuit-krueger', 'leorio-paradinight'])
    const background = buildStageBackground(kit(), 'heavens-arena', { fight: () => state })
    expect(audience(background.root).children.map((person) => person.userData.identity)).toEqual([
      'clash-passenger-0',
      'clash-passenger-1',
    ])
    expect(
      stageBackgroundDescription('heavens-arena', backgroundParticipants(state)),
    ).not.toContain('Biscuit')
    expect(stageBackgroundDescription('heavens-arena', [], 'en')).toContain('Biscuit, Leorio')
    background.dispose()
    const changing = createFightState('kurapika', 'hisoka')
    const next = buildStageBackground(kit(), 'heavens-arena', { fight: () => changing })
    changing.player.id = 'biscuit'
    next.update(1)
    expect(next.root.getObjectByName('background-spectator:biscuit-krueger')?.visible).toBe(false)
    next.dispose()
  })

  it('reacts to new impacts and settles, while quiet spectators remain calm', () => {
    const state = createFightState('kurapika', 'hisoka')
    state.phase = 'fighting'
    const crowd = buildStageBackground(kit(), 'heavens-arena', { fight: () => state })
    const quiet = buildStageBackground(kit(), 'supreme-court', { fight: () => state })
    crowd.update(1)
    quiet.update(1)
    const resting = transforms(audience(crowd.root))
    const silent = transforms(audience(quiet.root))
    impact(state)
    crowd.update(1)
    quiet.update(1)
    expect(transforms(audience(crowd.root))).not.toEqual(resting)
    expect(transforms(audience(quiet.root))).toEqual(silent)
    crowd.update(4)
    const baseline = buildStageBackground(kit(), 'heavens-arena')
    baseline.update(4)
    expect(transforms(audience(crowd.root))).toEqual(transforms(audience(baseline.root)))
    baseline.dispose()
    crowd.dispose()
    quiet.dispose()
  })

  it('reacts to the verdict and accepts the same impact number after a round reset', () => {
    const state = createFightState('kurapika', 'hisoka')
    state.phase = 'fighting'
    const background = buildStageBackground(kit(), 'heavens-arena', { fight: () => state })
    const baseline = buildStageBackground(kit(), 'heavens-arena')
    baseline.update(2)
    background.update(2)
    const resting = transforms(audience(baseline.root))
    state.phase = 'finished'
    background.update(2)
    expect(transforms(audience(background.root))).not.toEqual(resting)
    state.phase = 'ready'
    state.impact = null
    background.update(2)
    expect(transforms(audience(background.root))).toEqual(resting)
    state.phase = 'fighting'
    impact(state)
    background.update(2)
    expect(transforms(audience(background.root))).not.toEqual(resting)
    state.phase = 'ready'
    state.impact = null
    background.update(2)
    state.roundNumber++
    state.phase = 'fighting'
    background.update(2)
    impact(state)
    background.update(2)
    expect(transforms(audience(background.root))).not.toEqual(resting)
    background.dispose()
    baseline.dispose()
  })

  it('freezes decorative motion and reactions with reduced motion', () => {
    const state = createFightState('kurapika', 'hisoka')
    const background = buildStageBackground(kit(), 'heavens-arena', {
      fight: () => state,
      reducedMotion: true,
    })
    background.update(0)
    const before = transforms(background.root)
    impact(state)
    background.update(10)
    state.phase = 'finished'
    background.update(20)
    expect(transforms(background.root)).toEqual(before)
    background.dispose()
  })

  it('releases owned artwork once while preserving shared human geometry and shadows', () => {
    const background = buildStageBackground(kit(), 'whale-hold')
    const protectedResources = new Set<THREE.BufferGeometry | THREE.Material>()
    const image = background.root.getObjectByName('background-image:whale')!
      .children[1] as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
    background.root.traverse((object) => {
      const mesh = object as THREE.Mesh
      if (mesh.geometry?.userData.sharedHuman) protectedResources.add(mesh.geometry)
      if (mesh.name === 'contact-shadow')
        for (const material of [mesh.material].flat()) protectedResources.add(material)
    })
    const sharedSpies = [...protectedResources].map((resource) => vi.spyOn(resource, 'dispose'))
    const materialSpy = vi.spyOn(image.material, 'dispose')
    const textureSpy = vi.spyOn(image.material.map!, 'dispose')
    background.dispose()
    background.dispose()
    expect(materialSpy).toHaveBeenCalledTimes(1)
    expect(textureSpy).toHaveBeenCalledTimes(1)
    for (const spy of sharedSpies) expect(spy).not.toHaveBeenCalled()
    vi.restoreAllMocks()
  })
})
