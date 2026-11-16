import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { hasLikeness } from '../tour/humanProfiles'
import { buildStageBackground } from './stageBackground'
import {
  backgroundParticipants,
  STAGE_BACKGROUNDS,
  stageBackgroundDescription,
} from './stageBackgroundCatalogue'
import { STAGE_BACKGROUND_SCENES } from './stageBackgroundScenes'
import { buildBackgroundItem } from './stageBackgroundItems'
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
  it('keeps declared likenesses and original graphic sources available for all stages', () => {
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

  it('authors different compositions, media, public sizes and event types instead of a universal recipe', () => {
    expect(Object.keys(STAGE_BACKGROUND_SCENES).sort()).toEqual(
      FIGHT_STAGES.map(({ id }) => id).sort(),
    )
    const counts = new Set<number>()
    const media = new Set<string>()
    const events = new Set<string>()
    const signatures = new Set<string>()
    for (const recipe of Object.values(STAGE_BACKGROUND_SCENES)) {
      counts.add(
        recipe.flatMap((element) => (element.kind === 'cameo' ? element.people : [])).length,
      )
      signatures.add(
        recipe
          .map((element) => {
            if (element.kind === 'event') {
              events.add(element.event)
              return element.event
            }
            if (element.kind === 'art') {
              media.add(element.medium)
              return element.medium
            }
            if (element.kind === 'object') return element.object + ':' + element.motion
            return `cameo:${element.people.length}`
          })
          .join(','),
      )
    }
    expect([...counts].sort()).toEqual([0, 1, 2])
    expect(media.size).toBe(5)
    expect(events.size).toBe(21)
    expect(signatures.size).toBe(33)
    expect(STAGE_BACKGROUND_SCENES['vip-casino'].some(({ kind }) => kind === 'cameo')).toBe(false)
    expect(STAGE_BACKGROUND_SCENES['woble-salon'].some(({ kind }) => kind === 'art')).toBe(false)
    expect(STAGE_BACKGROUND_SCENES['princes-burial-chamber']).toHaveLength(2)
    expect(stageBackgroundDescription('vip-casino', [])).not.toContain('Zhang Lei')
  })

  it('keeps the fourteen memorial flames small throughout their breathing cycle', () => {
    const background = buildStageBackground(kit(), 'princes-burial-chamber')
    for (const seconds of [0, 1, 8, 27]) {
      background.update(seconds)
      const candles = background.root.getObjectByName('background-event:memorial-lights')!
      candles.updateMatrixWorld(true)
      expect(new THREE.Box3().setFromObject(candles).max.y).toBeLessThan(0.3)
    }
    background.dispose()
  })

  it('gives a found object its own motion instead of making every object bob on a pedestal', () => {
    const still = buildBackgroundItem(
      kit(),
      { kind: 'object', object: 'card', at: [0, 0.2, -1], motion: 'still' },
      { stageId: 'cineplex-concourse', context: {} },
    )
    const roll = buildBackgroundItem(
      kit(),
      { kind: 'object', object: 'coin', at: [0, 0.2, -1], motion: 'roll' },
      { stageId: 'vip-casino', context: {} },
    )
    const frame = { seconds: 0, excitement: 0, finished: false, reducedMotion: false }
    still.update(frame)
    roll.update(frame)
    const before = transforms(still.root)
    const rolling = transforms(roll.root)
    still.update({ ...frame, seconds: 3 })
    roll.update({ ...frame, seconds: 3 })
    expect(transforms(still.root)).toEqual(before)
    expect(transforms(roll.root)).not.toEqual(rolling)
    expect(still.root.children).toHaveLength(1)
  })

  it('triggers environmental reactions on impacts and verdicts', () => {
    const state = createFightState('kurapika', 'hisoka')
    state.phase = 'fighting'
    const impactBackground = buildStageBackground(kit(), 'hull-suspension', { fight: () => state })
    const verdictBackground = buildStageBackground(kit(), 'royal-salon', { fight: () => state })
    impactBackground.update(0)
    verdictBackground.update(0)
    const spring = impactBackground.root.getObjectByName('background-event:spring-gauge')!
    const chess = verdictBackground.root.getObjectByName('background-event:chess')!
    const restSpring = transforms(spring)
    const restChess = transforms(chess)
    impact(state)
    impactBackground.update(0)
    verdictBackground.update(0)
    expect(transforms(spring)).not.toEqual(restSpring)
    expect(transforms(chess)).toEqual(restChess)
    state.phase = 'finished'
    verdictBackground.update(0)
    expect(transforms(chess)).not.toEqual(restChess)
    impactBackground.dispose()
    verdictBackground.dispose()
  })

  it.each(FIGHT_STAGES)('freezes all selected decorations with reduced motion in $id', ({ id }) => {
    const state = createFightState('kurapika', 'hisoka')
    state.phase = 'fighting'
    const background = buildStageBackground(kit(), id, { fight: () => state, reducedMotion: true })
    background.update(0)
    const before = transforms(background.root)
    impact(state)
    state.phase = 'finished'
    background.update(30)
    expect(transforms(background.root)).toEqual(before)
    background.dispose()
  })

  it.each(FIGHT_STAGES)(
    'builds finite decorations behind the duel in $id without changing its state',
    (stage) => {
      const state = createFightState('kurapika', 'hisoka')
      const before = JSON.stringify(state)
      const background = buildStageBackground(kit(), stage.id, { fight: () => state })
      const recipe = STAGE_BACKGROUND_SCENES[stage.id]
      const people = recipe.flatMap((element) => (element.kind === 'cameo' ? element.people : []))
      expect(background.root.getObjectByName('background-audience')?.children.length ?? 0).toBe(
        people.length,
      )
      expect(background.root.children).toHaveLength(recipe.length)
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
    const quiet = buildStageBackground(kit(), 'unma-salon', { fight: () => state })
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
    baseline.update(1)
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
    const background = buildStageBackground(kit(), 'heavens-arena')
    const protectedResources = new Set<THREE.BufferGeometry | THREE.Material>()
    const image = background.root.getObjectByName('background-art:monitor')!
      .children[0] as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
    background.root.traverse((object) => {
      const mesh = object as THREE.Mesh
      if (mesh.geometry?.userData.sharedHuman) protectedResources.add(mesh.geometry)
      if (mesh.name === 'contact-shadow')
        for (const material of [mesh.material].flat()) protectedResources.add(material)
    })
    expect(protectedResources.size).toBeGreaterThan(0)
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
