import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { MeshBasicMaterial, MeshPhysicalMaterial } from 'three'
import {
  createNenTechniqueState,
  transitionNen,
  type NenTechniqueAction,
} from '@black-whale/nen-engine'
import type { Apparition } from './apparitions'
import { buildHumanFigure } from './humanFigure'
import type { HumanZone } from './humanAura'
import { placeRenFlame } from './humanAuraFlames'

const glow = (colour: number, opacity: number) =>
  new MeshBasicMaterial({ color: colour, opacity, transparent: opacity < 1 })
const glass = (worn: { ior: number; thickness: number; roughness: number }) =>
  new MeshPhysicalMaterial({ transmission: 1, ...worn })

function figure(...actions: NenTechniqueAction<HumanZone>[]) {
  return figureSeenBy(true, actions)
}

function figureSeenBy(
  observerGyo: boolean,
  actions: NenTechniqueAction<HumanZone>[],
  aura?: 'zetsu' | 'none',
) {
  const nen = actions.reduce(
    (state, action) => transitionNen(state, action).state,
    createNenTechniqueState<HumanZone>(),
  )
  const seen: Apparition & { kind: 'avatar' } = {
    id: 'guard',
    kind: 'avatar',
    spaceId: 'room',
    tierId: 'tier-1',
    at: [0, 0],
    y: 0,
    size: 0.42,
    colour: 0x8ecae6,
    stage: 0,
    hidden: false,
    human: { role: 'guard', pose: 'guard', identity: 'sakata', aura: aura ?? nen.mode, nen },
  }
  return buildHumanFigure({ THREE, glow, glass, seen, observerGyo }).root
}

const named = (root: THREE.Object3D, prefix: string) => {
  const found: THREE.Object3D[] = []
  root.traverse((node) => node.name.startsWith(prefix) && found.push(node))
  return found
}

describe('the aura as a skin on the body', () => {
  it('wraps a body in Ten in a thin skin and no bubble', () => {
    const root = figure()
    expect(named(root, 'nen-skin-ten').length).toBeGreaterThan(10)
    expect(root.getObjectByName('nen-ten-ren')).toBeUndefined()
  })

  /** The one thing a visitor sneaking past needs to read at a distance. */
  it('wears Ken as its own, thicker level rather than a brighter Ten', () => {
    const root = figure({ type: 'KEN', on: true })
    expect(named(root, 'nen-skin-ken').length).toBeGreaterThan(10)
    expect(named(root, 'nen-skin-ten')).toHaveLength(0)
  })

  it('parents every piece of skin to the limb it covers, so it follows the pose', () => {
    for (const skin of named(figure(), 'nen-skin-'))
      expect((skin as THREE.Mesh).geometry).toBe((skin.parent as THREE.Mesh).geometry)
  })

  it('wears nothing in Zetsu to a visitor not in Gyo', () => {
    expect(named(figureSeenBy(false, [{ type: 'ZETSU' }], 'zetsu'), 'nen-skin-')).toHaveLength(0)
  })

  /** What tells a Nen user hiding in Zetsu apart from a person with no aura. */
  it('shows Gyo the trace of a declared user holding Zetsu, and nothing on anyone else', () => {
    expect(
      named(figureSeenBy(true, [{ type: 'ZETSU' }], 'zetsu'), 'nen-skin-zetsu').length,
    ).toBeGreaterThan(5)
    const nobody = figureSeenBy(true, [{ type: 'ZETSU' }], 'none')
    expect(named(nobody, 'nen-skin-')).toHaveLength(0)
  })
})

describe('Ko', () => {
  /** Every other zone emptied into one: the bareness is the price. */
  it('leaves the rest of the body bare, with no skin and no bending volume', () => {
    const root = figure({ type: 'REN' }, { type: 'KO', zone: 'hands' })
    expect(named(root, 'nen-skin-')).toHaveLength(0)
    expect(root.getObjectByName('nen-aura-glass')).toBeUndefined()
    expect(root.getObjectByName('nen-ren-flame')).toBeUndefined()
    expect(root.getObjectByName('nen-ko-hands')).toBeTruthy()
  })
})

describe('En', () => {
  it('keeps the rings on the floor and raises a dome over them', () => {
    const root = figure({ type: 'EN', radius: 4 })
    expect(root.getObjectByName('nen-en-0')).toBeTruthy()
    const dome = root.getObjectByName('nen-en-dome') as THREE.Mesh
    expect(dome.scale.x).toBe(4)
  })

  /** Inside the sweep the visitor sees the room, not the inside of a sphere. */
  it('draws only the outside of the dome', () => {
    const dome = figure({ type: 'EN', radius: 4 }).getObjectByName('nen-en-dome') as THREE.Mesh
    expect((dome.material as THREE.Material).side).toBe(THREE.FrontSide)
  })
})

describe("Ren's flames", () => {
  it('rise over a life, from the hips to past the head', () => {
    const flame = figure({ type: 'REN' }).getObjectByName('nen-ren-flame') as THREE.Mesh
    flame.userData.auraLife = 0
    placeRenFlame(flame, 0.05, 0)
    const low = flame.position.y
    placeRenFlame(flame, 1.4, 0)
    expect(flame.position.y).toBeGreaterThan(low + 0.5)
  })

  it('are born and vanish small, so the shared material never has to fade', () => {
    const flame = figure({ type: 'REN' }).getObjectByName('nen-ren-flame') as THREE.Mesh
    flame.userData.auraLife = 0
    placeRenFlame(flame, 0, 0)
    expect(flame.scale.y).toBeCloseTo(0)
  })
})
