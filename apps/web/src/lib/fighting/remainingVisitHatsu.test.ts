import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import { createFightState } from './fightState'
import { createVisitHatsuModel, type VisitHatsuKind } from './visitHatsuModel'
import { createBlackVoiceScene } from './blackVoiceScene'
import { createMoonlightScene } from './moonlightScene'
import { createFutureBeastScene } from './futureBeastScene'
import { createVisitWeaponScene } from './visitWeaponScene'
import { createHalkenburgArrowScene } from './halkenburgArrowScene'
import { createBungeeGumScene } from './bungeeGumScene'
import { createCrossGameScene } from './crossGameScene'
import { createPreparationScene } from './preparationScene'
import { createMelodyFluteScene } from './melodyFluteScene'
import { createRemainingVisitHatsuScene } from './remainingVisitHatsuScene'
import { attackData } from './frameData'
import { BIRD_TETHER, BIRD_WINGS } from '$lib/tour/apparitionBasicView'
import type { ArcadeFighter, FighterId, FightState } from './types'

function setup(id: FighterId = 'hisoka') {
  const state = createFightState(id, 'hisoka')
  state.phase = 'fighting'
  state.player.x = 40
  state.opponent.x = 60
  const options = {
    THREE,
    scene: new THREE.Scene(),
    worldX: (x: number) => x / 6,
    worldY: (y: number) => y / 6,
  }
  return { state, options }
}
function attack(source: FighterId, frame = 0): NonNullable<ArcadeFighter['attack']> {
  return {
    kind: 'special',
    moveId: `${source}:neutralSpecial`,
    frame,
    impacted: false,
    auraCharged: true,
    concealed: false,
    hatsuSource: source,
    projectileSpawned: false,
    reversal: false,
  }
}
function future(owner: 'player' | 'opponent'): NonNullable<FightState['parallelFuture']> {
  return {
    owner,
    phase: 'vision',
    frames: [],
    preparation: 0,
    cursor: 0,
    previewCursor: 0,
    controls: null,
  }
}

describe('remaining visit models in fighting', () => {
  it.each([
    'black-voice',
    'moonlight-contract',
    'bungee-gum',
    'cross-game-card',
    'snake-arm',
    'priest-staff',
    'black-voice-antenna',
    'controlled-bird',
    'grimmel-arrow',
    'rising-sun',
    'biohazard-cuffs',
    'tserriednich-second',
  ] as VisitHatsuKind[])('builds and uniformly fits %s', (kind) => {
    const model = createVisitHatsuModel(THREE, { model: kind, climb: 6 })
    model.fit({ width: 0.7, height: 1.2, depth: 0.9 })
    const size = new THREE.Box3().setFromObject(model.root).getSize(new THREE.Vector3())
    expect(size.x).toBeGreaterThan(0)
    expect(size.y).toBeGreaterThan(0)
    expect(size.x).toBeLessThanOrEqual(0.70001)
    expect(size.y).toBeLessThanOrEqual(1.20001)
    expect(size.z).toBeLessThanOrEqual(0.90001)
    expect(model.root.scale.x).toBe(model.root.scale.y)
    model.dispose()
  })

  it('holds Black Voice in the free left hand, follows rebuilds and hides it when its page closes', () => {
    const { state, options } = setup('chrollo')
    state.player.chrolloBook = { pages: ['black-voice'], page: 0, open: true, bookmark: null }
    state.opponent.hatsuEffects.manipulatedFrames = 30
    let figure = new THREE.Group()
    const hand = new THREE.Group()
    hand.name = 'hand-left'
    hand.position.set(1, 1.2, 0.25)
    figure.add(hand)
    options.scene.add(figure)
    const effects = createBlackVoiceScene({ ...options, figureOf: () => figure })
    const before = structuredClone(state)
    effects.sync(state, 0)
    const phone = options.scene.getObjectByName('black-voice-phone:player')!
    expect(phone.position.toArray()).toEqual([1, 1.2, 0.25])
    expect(options.scene.getObjectByName('black-voice-antenna:player')?.visible).toBe(true)
    expect(state).toEqual(before)
    options.scene.remove(figure)
    figure = new THREE.Group()
    const replacement = new THREE.Group()
    replacement.name = 'hand-left'
    replacement.position.set(2, 1.2, 0.25)
    figure.add(replacement)
    options.scene.add(figure)
    effects.sync(state, 1)
    expect(phone.position.x).toBe(2)
    state.player.chrolloBook.open = false
    effects.sync(state, 2)
    expect(phone.visible).toBe(false)
    expect(options.scene.getObjectByName('black-voice-antenna:player')?.visible).toBe(false)
    effects.dispose()
    expect(options.scene.children).toEqual([figure])
  })

  it('switches Longhi’s displayed stationery only after the second signature, including a loan', () => {
    const { state, options } = setup('kurapika')
    const effects = createMoonlightScene(options)
    const pact = {
      issuer: 'opponent' as const,
      recipient: 'player' as const,
      terms: 'no-attacks' as const,
      reward: 'one-use-of-moonlight-act' as const,
      penalty: 'one-week-zetsu' as const,
      remainingFrames: 90,
    }
    state.moonlight = { offer: pact }
    effects.sync(state, 0)
    const offer = options.scene.getObjectByName('moonlight-contract:offer')!
    expect(offer.userData.variantStage).toBe(0)
    expect(offer.position.x).toBeCloseTo(options.worldX(50))
    state.moonlight = { active: pact }
    effects.sync(state, 1)
    expect(offer.visible).toBe(false)
    expect(options.scene.getObjectByName('moonlight-contract:signed')?.userData.variantStage).toBe(
      1,
    )
    state.moonlight = undefined
    effects.sync(state, 2)
    expect(options.scene.children.every((root) => !root.visible)).toBe(true)
    effects.dispose()
    expect(options.scene.children).toHaveLength(0)
  })

  it.each(['chrollo', 'kurapika'] as const)(
    'shows Saiyu’s staff for an active %s use, then hides it on Nen loss',
    (id) => {
      const { state, options } = setup(id)
      if (id === 'chrollo')
        state.player.chrolloBook = { pages: ['saiyu'], page: 0, open: true, bookmark: null }
      else
        state.player.kurapika!.held = {
          source: 'saiyu',
          moveId: 'saiyu:neutralSpecial',
          victim: 'opponent',
          loaded: true,
          used: true,
          sustainedKeys: [],
        }
      const effects = createVisitWeaponScene(options)
      effects.sync(state, 0)
      const staff = options.scene.getObjectByName('priest-staff:player')!
      expect(staff.userData.visitModel).toBe('priest-staff')
      state.player.nen.mode = 'zetsu'
      effects.sync(state, 1)
      expect(staff.visible).toBe(false)
      effects.dispose()
    },
  )

  it('extends Gel’s shared arm in active frames, including a Dolphin user, without mutating the attack', () => {
    const { state, options } = setup('kurapika')
    state.player.kurapika!.held = {
      source: 'gel',
      moveId: 'gel:neutralSpecial',
      victim: 'opponent',
      loaded: true,
      used: true,
      sustainedKeys: [],
    }
    state.player.attack = attack('gel')
    const effects = createVisitWeaponScene(options)
    effects.sync(state, 0)
    const snake = options.scene.getObjectByName('gel-snake-arm:player')!
    const folded = snake.children[0].scale.y
    snake.updateMatrixWorld(true)
    const head = snake.getObjectByName('gel-snake-head')!
    const firstHeadSize = new THREE.Box3().setFromObject(head).getSize(new THREE.Vector3())
    state.player.attack.frame = attackData('special', state.player).startup
    const before = structuredClone(state)
    effects.sync(state, 0)
    expect(snake.children[0].scale.y).toBeGreaterThan(folded)
    snake.updateMatrixWorld(true)
    const activeHeadSize = new THREE.Box3().setFromObject(head).getSize(new THREE.Vector3())
    expect(activeHeadSize.distanceTo(firstHeadSize)).toBeLessThan(0.000001)
    expect(state).toEqual(before)
    state.player.attack = null
    effects.sync(state, 1)
    expect(snake.visible).toBe(false)
    effects.dispose()
  })

  it('replaces the real hand during Gel’s transformation and restores it on interruption', () => {
    const { state, options } = setup('gel')
    state.player.attack = attack('gel')
    const figure = new THREE.Group()
    const hand = new THREE.Group()
    hand.name = 'hand-right'
    figure.add(hand)
    const effects = createVisitWeaponScene({ ...options, figureOf: () => figure })
    effects.sync(state, 0)
    expect(hand.visible).toBe(false)
    state.player.attack = null
    effects.sync(state, 1)
    expect(hand.visible).toBe(true)
    state.player.attack = attack('gel')
    effects.sync(state, 2)
    effects.dispose()
    expect(hand.visible).toBe(true)
  })
  it.each([1, -1] as const)('keeps Gel’s snake upright when striking in direction %s', (facing) => {
    const { state, options } = setup('gel')
    state.player.facing = facing
    state.opponent.x = state.player.x + facing * 20
    state.player.attack = attack('gel')
    const effects = createVisitWeaponScene(options)
    effects.sync(state, 0)
    const snake = options.scene.getObjectByName('gel-snake-arm:player')!
    snake.updateMatrixWorld(true)
    const head = snake.getObjectByName('gel-snake-head')!
    const up = new THREE.Vector3(0, 1, 0).transformDirection(head.matrixWorld)
    const forward = new THREE.Vector3(0, 0, -1).transformDirection(head.matrixWorld)
    expect(up.y).toBeGreaterThan(0.9)
    expect(forward.x * facing).toBeGreaterThan(0.9)
    effects.dispose()
  })
  it('animates Halkenburg’s existing strike, without introducing a second projectile or impact', () => {
    const { state, options } = setup('halkenburg')
    state.player.attack = attack('halkenburg')
    state.player.hatsuEffects.arrowNocked = 1
    const effects = createHalkenburgArrowScene(options)
    effects.sync(state, 0)
    const arrow = options.scene.getObjectByName('halkenburg-arrow:player')!
    const origin = arrow.position.x
    const data = attackData('special', state.player)
    state.player.attack.frame = data.startup
    const before = structuredClone(state)
    effects.sync(state, 0)
    expect(arrow.position.x).toBeGreaterThan(origin)
    expect(state).toEqual(before)
    state.player.attack.frame = data.startup + data.active
    effects.sync(state, 0)
    expect(arrow.visible).toBe(false)
    effects.dispose()
  })

  it('keeps the personal future beast in P1’s private vision, with no guardian beast or preparation reveal', () => {
    const { state, options } = setup('tserriednich')
    const effects = createFutureBeastScene(options)
    state.parallelFuture = future('opponent')
    effects.sync(state, 0)
    expect(options.scene.children).toHaveLength(0)
    state.parallelFuture = { ...future('player'), phase: 'preparing' }
    effects.sync(state, 0)
    expect(options.scene.children).toHaveLength(0)
    state.parallelFuture.phase = 'vision'
    state.player.nen.mode = 'zetsu'
    effects.sync(state, 0)
    const beast = options.scene.getObjectByName('tserriednich-personal-beast:player')!
    expect(beast.visible).toBe(true)
    expect(beast.userData.apparitionKind).toBe('tserriednich-second')
    state.parallelFuture = undefined
    effects.sync(state, 1)
    expect(beast.visible).toBe(false)
    effects.dispose()
  })

  it('bends the shared gum along the real tether, respects In and reuses its geometry', () => {
    const { state, options } = setup()
    state.bungeeGum = { owner: 'player', target: 'opponent', hidden: false, retracting: false }
    const effects = createBungeeGumScene(options)
    effects.sync(state, 0)
    const gum = options.scene.getObjectByName('hisoka-bungee-gum')!
    const strand = gum.getObjectByName('gum-strand') as THREE.Mesh
    const bounds = new THREE.Box3().setFromObject(gum)
    expect(bounds.min.x).toBeCloseTo(options.worldX(40), 1)
    expect(bounds.max.x).toBeCloseTo(options.worldX(60), 1)
    expect(bounds.min.y).toBeLessThan(1)
    const geometry = strand.geometry
    state.player.x = 42
    effects.sync(state, 1)
    expect(strand.geometry).toBe(geometry)
    state.bungeeGum = { owner: 'opponent', target: 'player', hidden: true, retracting: false }
    effects.sync(state, 1)
    expect(gum.visible).toBe(false)
    state.player.nen.en = { radius: 2 }
    effects.sync(state, 1)
    expect(gum.visible).toBe(true)
    gum.updateWorldMatrix(true, true)
    const local = new THREE.Box3().setFromObject(strand)
    expect(local.max.x).toBeLessThan(options.worldX(state.opponent.x) - 1)
    expect(gum.getObjectByName('gum-anchor:combat-joint')?.visible).toBe(false)
    state.player.nen.en = null
    state.player.nen.gyo = true
    effects.sync(state, 1)
    expect(gum.visible).toBe(true)
    const dispose = vi.spyOn(geometry, 'dispose')
    effects.dispose()
    expect(dispose).toHaveBeenCalledOnce()
  })

  it('uses the visit’s yellow Cross Game card while preserving its display timer', () => {
    const { state, options } = setup('mizaistom')
    state.player.crossGameCardFrames = 18
    state.opponent.crossGame = { owner: 'player', phase: 'warning', noticeFrames: 0, x: 60, y: 0 }
    const effects = createCrossGameScene(options)
    effects.sync(state, 0)
    const card = options.scene.children.find(
      (root) => root.userData.visitModel === 'cross-game-card',
    )!
    const face = card.getObjectByProperty('isMesh', true) as THREE.Mesh<
      THREE.BufferGeometry,
      THREE.MeshBasicMaterial
    >
    expect(face.material.color.getHex()).toBe(0xf0c94d)
    state.player.crossGameCardFrames = 0
    effects.sync(state, 1)
    expect(card.visible).toBe(false)
    effects.dispose()
  })

  it('shares prepared birds and flutes, animates wings, and releases removed entities', () => {
    const { state, options } = setup('cluck')
    state.battlefield = {
      entities: [
        {
          id: 'bird',
          kind: 'bird',
          owner: 'player',
          x: 45,
          y: 0,
          present: true,
          material: 'real',
          health: 1,
          controller: { side: 'player', source: 'cluck' },
        },
        {
          id: 'flute',
          kind: 'flute',
          owner: 'neutral',
          x: 50,
          y: 0,
          present: true,
          material: 'real',
          health: 1,
        },
      ],
      interactionHeld: { player: false, opponent: false },
      completed: { player: 0, opponent: 0 },
    }
    const effects = createPreparationScene(options)
    effects.sync(state, 0)
    const bird = options.scene.getObjectByName('visit-hatsu:controlled-bird')!
    const wings = bird.getObjectByName(BIRD_WINGS)!
    expect(options.scene.getObjectByName('visit-hatsu:melody-flute')).toBeDefined()
    expect(bird.getObjectByName(BIRD_TETHER)?.visible).toBe(false)
    effects.sync(state, 0.1)
    expect(wings.children[0].rotation.z).not.toBe(0)
    state.player.nen.gyo = true
    effects.sync(state, 0.2)
    expect(bird.getObjectByName(BIRD_TETHER)?.visible).toBe(true)
    state.battlefield.entities = []
    effects.sync(state, 0.3)
    expect(options.scene.children).toHaveLength(0)
    effects.dispose()
  })

  it('requires a real flute for a borrowed Melody performance', () => {
    const { state, options } = setup('kurapika')
    state.player.equipment = []
    state.player.melodyPerformance = {
      originX: 40,
      startupFrames: 0,
      playingFrames: 30,
      moveId: 'melody:neutralSpecial',
    }
    const effects = createMelodyFluteScene(options)
    effects.sync(state, 0)
    expect(options.scene.children).toHaveLength(0)
    state.player.equipment = ['flute']
    effects.sync(state, 0)
    expect(options.scene.getObjectByName('melody-borrowed-flute:player')?.visible).toBe(true)
    state.player.melodyPerformance = undefined
    effects.sync(state, 1)
    expect(options.scene.children[0].visible).toBe(false)
    effects.dispose()
  })

  it('closes every scene-owned model after a mixed sequence', () => {
    const { state, options } = setup('saiyu')
    state.bungeeGum = { owner: 'player', target: 'opponent', hidden: false, retracting: false }
    state.parallelFuture = future('player')
    const effects = createRemainingVisitHatsuScene(options)
    effects.sync(state, 0)
    const resources = new Set<THREE.BufferGeometry | THREE.Material>()
    options.scene.traverse((part) => {
      const mesh = part as THREE.Mesh
      if (mesh.geometry) resources.add(mesh.geometry)
      if (mesh.material) [mesh.material].flat().forEach((material) => resources.add(material))
    })
    const disposals = [...resources].map((resource) => vi.spyOn(resource, 'dispose'))
    effects.sync(state, 1)
    effects.dispose()
    expect(options.scene.children).toHaveLength(0)
    disposals.forEach((spy) => expect(spy).toHaveBeenCalledOnce())
  })
})
