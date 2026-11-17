import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import { createVisitHatsuModel, disposeMountedVisitHatsu } from './visitHatsuModel'
import { createFightState } from './fightState'
import { buildFightFigure, fightFigureKey } from './fighterFigure'
import { createSecretWindowScene } from './secretWindowScene'
import { createCamillaCatScene } from './camillaCatScene'
import { createStealthDolphinScene } from './stealthDolphinScene'
import { createProjectileScene } from './projectileScene'
import { animateBlinky } from './blinkyFigure'
import { createFeitanScene } from './feitanScene'
import { CAT_CAPTURE_END, CAT_SUMMON_END } from './camillaCat'
import type { VisitHatsuKind } from './visitHatsuModel'
import type { ArcadeFighter, FightProjectile } from './types'

const glow = (color: number, opacity: number) => new THREE.MeshBasicMaterial({ color, opacity })
function names(root: THREE.Object3D): string[] {
  const result: string[] = []
  root.traverse((part) => result.push(part.name, ...(part.userData.parts ?? [])))
  return result
}
function setup() {
  return {
    THREE,
    scene: new THREE.Scene(),
    worldX: (x: number) => x / 6,
    worldY: (y: number) => y / 6,
  }
}

describe('visit Hatsu adapted to the duel', () => {
  it.each([
    ['blinky', 'hoover'],
    ['jupiter', 'jupiter'],
    ['cats-name', 'cat'],
    ['predator', 'predator-salesale'],
    ['secret-window', 'owl'],
    ['pain-packer', 'pain-armour'],
    ['stealth-dolphin', 'dolphin'],
    ['skill-book', 'book'],
    ['paper-doll', 'paper'],
    ['biohazard', 'animal-object'],
    ['sun-mark', 'sun-mark'],
    ['moon-mark', 'moon-mark'],
    ['emitted-fist', 'mark'],
  ] as const)('fits %s without flattening its anatomy', (kind: VisitHatsuKind, apparition) => {
    const model = createVisitHatsuModel(THREE, { model: kind, anchor: 'floor' })
    model.fit({ width: 0.65, height: 0.9, depth: 0.8 })
    const bounds = new THREE.Box3().setFromObject(model.root)
    const size = bounds.getSize(new THREE.Vector3())
    expect(model.root.userData.apparitionKind).toBe(apparition)
    expect(bounds.min.y).toBeCloseTo(0)
    expect(size.x).toBeGreaterThan(0)
    expect(size.y).toBeGreaterThan(0)
    expect(size.x).toBeLessThanOrEqual(0.65001)
    expect(size.y).toBeLessThanOrEqual(0.90001)
    expect(size.z).toBeLessThanOrEqual(0.80001)
    expect(model.root.scale.x).toBe(model.root.scale.y)
    expect(model.root.scale.y).toBe(model.root.scale.z)
    model.dispose()
  })

  it('keeps the visit cat’s hands and tail available for capture animation', () => {
    const model = createVisitHatsuModel(THREE, {
      model: 'cats-name',
      joints: ['hand--1', 'hand-1', 'cat-tail'],
    })
    expect(names(model.root)).toEqual(
      expect.arrayContaining(['cat-head', 'cat-torso', 'curved-tail']),
    )
    expect(model.joints.size).toBe(3)
    const hand = model.joints.get('hand-1')!
    const before = hand.position.x
    hand.position.x -= 0.4
    expect(model.root.getObjectByName('hand-1')?.parent).toBe(hand)
    expect(hand.position.x).toBeCloseTo(before - 0.4)
    model.dispose()
  })

  it('disposes attached models once and leaves scene-owned effects alive for reparenting', () => {
    const figure = new THREE.Group()
    const mounted = createVisitHatsuModel(THREE, { model: 'blinky', figureOwned: true })
    const independent = createVisitHatsuModel(THREE, { model: 'pain-packer' })
    figure.add(mounted.root, independent.root)
    const resources = new Set<THREE.BufferGeometry | THREE.Material>()
    mounted.root.traverse((part) => {
      if (!(part instanceof THREE.Mesh)) return
      resources.add(part.geometry)
      for (const material of [part.material].flat()) resources.add(material)
    })
    const spies = [...resources].map((resource) => vi.spyOn(resource, 'dispose'))
    disposeMountedVisitHatsu(figure)
    disposeMountedVisitHatsu(figure)
    mounted.dispose()
    expect(mounted.root.parent).toBeNull()
    expect(independent.root.parent).toBe(figure)
    spies.forEach((spy) => expect(spy).toHaveBeenCalledOnce())
    independent.dispose()
  })

  it('attaches the same Blinky to an active stolen page and rebuilds when that page closes', () => {
    const fighter = createFightState('chrollo', 'hisoka').player
    const copied: ArcadeFighter = {
      ...fighter,
      chrolloBook: { pages: ['shizuku'], page: 0, open: true, bookmark: null },
    }
    const model = buildFightFigure({ THREE, glow, fighter: copied })
    const blinky = model.root.getObjectByName('shizuku-blinky')!
    expect(blinky.userData.visitModel).toBe('blinky')
    expect(blinky.parent?.name).toBe('hand-right')
    const closed = { ...fighter, chrolloBook: { ...fighter.chrolloBook!, open: false } }
    expect(fightFigureKey(fighter)).not.toBe(fightFigureKey(copied))
    const closedModel = buildFightFigure({ THREE, glow, fighter: closed })
    expect(closedModel.root.getObjectByName('shizuku-blinky')).toBeUndefined()
    disposeMountedVisitHatsu(closedModel.root)
    disposeMountedVisitHatsu(model.root)
  })

  it('keeps Musse’s private owl owner-only and removes it on Nen loss', () => {
    const options = setup()
    const effects = createSecretWindowScene(options)
    const state = createFightState('musse', 'musse')
    state.player.secretWindow = {
      target: 'opponent',
      attachedAt: 0,
      observation: { frame: 0, action: 'idle' },
    }
    state.opponent.secretWindow = {
      target: 'player',
      attachedAt: 0,
      observation: { frame: 0, action: 'idle' },
    }
    const before = structuredClone(state)
    effects.sync(state, 1)
    expect(options.scene.getObjectByName('secret-window-player')?.visible).toBe(true)
    expect(options.scene.getObjectByName('secret-window-opponent')?.visible).toBe(false)
    expect(state).toEqual(before)
    state.player.nen.mode = 'zetsu'
    effects.sync(state, 2)
    expect(options.scene.getObjectByName('secret-window-player')?.visible).toBe(false)
    effects.dispose()
    expect(options.scene.children).toHaveLength(0)
  })

  it('keeps Blinky upright at the grip when the wrist rolls during a fighting pose', () => {
    const fighter = createFightState('shizuku', 'hisoka').player
    const model = buildFightFigure({ THREE, glow, fighter })
    const wrist = model.root.getObjectByName('hand-right')!
    wrist.rotation.set(1.2, -0.3, 0.7)
    model.turns.rotation.y = 0.6
    animateBlinky(model.turns, fighter, 0)
    const blinky = model.root.getObjectByName('shizuku-blinky')!
    const orientation = blinky.getWorldQuaternion(new THREE.Quaternion())
    const bodyOrientation = model.turns.getWorldQuaternion(new THREE.Quaternion())
    expect(Math.abs(orientation.dot(bodyOrientation))).toBeCloseTo(1)
    expect(blinky.parent).toBe(wrist)
    disposeMountedVisitHatsu(model.root)
  })

  it('fits Pain Packer around the body and head rather than the wearer’s waist', () => {
    const options = setup()
    const state = createFightState('feitan', 'hisoka')
    const model = buildFightFigure({ THREE, glow, fighter: state.player })
    options.scene.add(model.root)
    const height = new THREE.Box3().setFromObject(model.turns).max.y
    state.player.hatsuEffects.painPacker = { injuries: 0, packedDamage: 0, armour: true, sun: null }
    const effects = createFeitanScene({ ...options, figureOf: () => model.turns })
    effects.sync(state, 0)
    const armour = options.scene.getObjectByName('pain-packer:player')!
    const bounds = new THREE.Box3().setFromObject(armour)
    expect(bounds.max.y).toBeGreaterThan(height * 0.9)
    expect(bounds.min.y).toBeLessThan(height * 0.4)
    expect(bounds.min.y).toBeGreaterThan(-0.05)
    effects.dispose()
  })

  it('animates the shared cat’s capture and fits the energy path to its actual tail', () => {
    const options = setup()
    const effects = createCamillaCatScene(options)
    const state = createFightState('camilla', 'hisoka')
    state.catsName = { victimSide: 'player', killerSide: 'opponent', frame: CAT_SUMMON_END }
    effects.sync(state, 0)
    const cat = options.scene.getObjectByName('cats-name-feline')!
    const hand = cat.getObjectByName('hand-1:combat-joint')!
    const before = hand.position.x
    state.catsName.frame = CAT_CAPTURE_END
    effects.sync(state, 0)
    expect(hand.position.x).toBeLessThan(before)
    expect(new THREE.Box3().setFromObject(cat).min.y).toBeCloseTo(0.03)
    state.catsName = undefined
    effects.sync(state, 0)
    expect(cat.visible).toBe(false)
    effects.dispose()
    expect(options.scene.children).toHaveLength(0)
  })

  it('shows Stealth Dolphin only for P1’s loaded ability and follows its owner', () => {
    const options = setup()
    const effects = createStealthDolphinScene(options)
    const state = createFightState('kurapika', 'kurapika')
    state.opponent.kurapika!.held = {
      source: 'hisoka',
      moveId: 'hisoka:neutralSpecial',
      victim: 'player',
      loaded: true,
      used: false,
      sustainedKeys: [],
    }
    effects.sync(state, 0)
    const dolphin = options.scene.getObjectByName('kurapika-stealth-dolphin')!
    expect(dolphin.visible).toBe(false)
    state.player.kurapika!.held = { ...state.opponent.kurapika!.held, victim: 'opponent' }
    effects.sync(state, 0)
    expect(dolphin.visible).toBe(true)
    const x = dolphin.position.x
    state.player.x += 6
    effects.sync(state, 0)
    expect(dolphin.position.x).toBeCloseTo(x + 1)
    effects.dispose()
  })

  it('keeps a recipient’s private Dolphin visible during the linked blackout', () => {
    const options = setup()
    const effects = createStealthDolphinScene(options)
    const state = createFightState('biscuit', 'kurapika')
    state.player.dolphinLoan = {
      lender: { owner: 'opponent', member: 0 },
      blackoutFrames: 200,
      held: {
        source: 'hisoka',
        moveId: 'hisoka:neutralSpecial',
        victim: 'opponent',
        loaded: true,
        used: true,
        sustainedKeys: [],
      },
    }
    state.player.nen.mode = 'zetsu'
    effects.sync(state, 0)
    expect(options.scene.getObjectByName('kurapika-stealth-dolphin')!.visible).toBe(true)
    expect(state.player.kurapika).toBeUndefined()
    effects.dispose()
  })

  it('releases a removed Jupiter immediately and sizes it to its real projectile volume', () => {
    const options = setup()
    const effects = createProjectileScene({ ...options, glow, geometry: (made) => made })
    const shot = {
      id: 81,
      owner: 'player',
      jupiter: true,
      x: 40,
      y: 12,
      width: 12,
      height: 12,
    } as FightProjectile
    effects.sync([shot], 0)
    const planet = options.scene.getObjectByName('bonolenov-jupiter:81')!
    const size = new THREE.Box3().setFromObject(planet).getSize(new THREE.Vector3())
    expect(size.x).toBeLessThanOrEqual(2.00001)
    expect(size.y).toBeLessThanOrEqual(2.00001)
    expect(names(planet)).toContain('great-spot')
    const mesh = planet.getObjectByProperty('isMesh', true) as THREE.Mesh
    const dispose = vi.spyOn(mesh.geometry, 'dispose')
    effects.sync([], 1)
    expect(planet.parent).toBeNull()
    expect(dispose).toHaveBeenCalledOnce()
    effects.dispose()
  })
})
