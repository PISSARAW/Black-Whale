import { describe, expect, it } from 'vitest'
import { MeshBasicMaterial, MeshPhysicalMaterial } from 'three'
import * as THREE from 'three'
import type { Apparition } from './apparitions'
import { buildHumanFigure } from './humanFigure'
import { auraFor } from './cast/nen'
import type { CastMember, Post } from './cast/types'

const glow = (colour: number, opacity: number) =>
  new MeshBasicMaterial({ color: colour, opacity, transparent: opacity < 1 })

const glass = (worn: { ior: number; thickness: number; roughness: number }) =>
  new MeshPhysicalMaterial({ transmission: 1, ...worn })

describe('shared human figure', () => {
  it('draws Morena as one seated silhouette at the negotiation table', () => {
    const seen: Apparition & { kind: 'avatar' } = {
      id: 'morena-dealer-human',
      kind: 'avatar',
      spaceId: 'office',
      tierId: 'interior-heilly-hideout',
      at: [0, 0],
      y: 0,
      size: 0.42,
      colour: 0xd94f68,
      stage: 0,
      hidden: false,
      human: {
        role: 'morena',
        identity: 'morena-prudo',
        pose: 'seated',
        aura: 'none',
      },
    }

    const human = buildHumanFigure({
      THREE,
      glow: (colour, opacity) =>
        new MeshBasicMaterial({ color: colour, opacity, transparent: opacity < 1 }),
      seen,
    })

    expect(human.root.getObjectByName('morena-seated-lap')).toBeTruthy()
    expect(human.root.getObjectByName('morena-standing-gown')).toBeUndefined()
    expect(human.root.getObjectByName('morena-decolletage')).toBeTruthy()
    expect(human.root.getObjectByName('morena-stitch-crown')).toBeTruthy()
    expect(human.root.getObjectByName('morena-scar')).toBeTruthy()
    expect(human.root.getObjectByName('face-eye-left')).toBeTruthy()
    expect(human.root.getObjectByName('face-eye-right')).toBeTruthy()
    expect(human.root.getObjectByName('knee-left')?.rotation.x).toBeCloseTo(Math.PI / 2)
    expect(human.root.getObjectByName('knee-right')?.rotation.x).toBeCloseTo(Math.PI / 2)
  })
})

/**
 * The asymmetry these two describe used to be structural: the visitor had the
 * whole vocabulary and the cast had three modes, so the branches below — En
 * rings, Gyo eyes, a Ryu distribution, a refractive shell — existed in the
 * builder and were unreachable from a body standing in a room.
 */
describe('the aura a passenger of the walk is wearing', () => {
  function figureOf(role: string, situation: Parameters<typeof auraFor>[1], refracts = true) {
    const member: CastMember = {
      characterId: 'sakata',
      name: 'Sakata',
      locations: ['tier-1-royal-residential-sector-room-1014'],
      role,
      since: 'ch-358',
      nen: true,
      hatsu: [],
      beast: null,
    }
    const post: Post = {
      member,
      spaceId: 'room',
      tierId: 'tier-1',
      at: [0, 0],
      costume: { role: 'guard' },
    }
    const seen: Apparition & { kind: 'avatar' } = {
      id: 'cast:sakata',
      kind: 'avatar',
      spaceId: 'room',
      tierId: 'tier-1',
      at: [0, 0],
      y: 0,
      size: 0.42,
      colour: 0xd8b49a,
      stage: 0,
      hidden: false,
      human: { role: 'guard', pose: 'guard', identity: 'sakata', ...auraFor(post, situation) },
    }
    return buildHumanFigure({ THREE, glow, ...(refracts ? { glass } : {}), seen })
  }

  const CALM_ROOM = { visitorIn: null, visitorCasting: false, hostileRooms: [] }
  const CASTING = { visitorIn: 'room', visitorCasting: true, hostileRooms: [] }

  it('lays the standing En of a guard on the floor', () => {
    const guard = figureOf('Royal Bodyguard for Prince Woble', CALM_ROOM)
    expect(guard.root.getObjectByName('nen-en-0')).toBeTruthy()
    expect(guard.root.getObjectByName('nen-en-2')).toBeTruthy()
  })

  it('lights the eyes and the covered zones of a body the visitor has alarmed', () => {
    const alarmed = figureOf('Royal Bodyguard for Prince Woble', CASTING)
    expect(alarmed.root.getObjectByName('nen-gyo-left')).toBeTruthy()
    expect(alarmed.root.getObjectByName('nen-gyo-right')).toBeTruthy()
    expect(alarmed.root.getObjectByName('nen-ryu-torso')).toBeTruthy()
    expect(alarmed.root.getObjectByName('nen-ryu-feet')).toBeTruthy()
  })

  it('wraps a raised aura in the shell that bends the corridor behind it', () => {
    const shell = figureOf('Nen teacher', CASTING).root.getObjectByName('nen-aura-glass')
    expect(shell).toBeTruthy()
    expect((shell as THREE.Mesh).material).toBeInstanceOf(MeshPhysicalMaterial)
  })

  it('wraps nothing on a palier that cannot pay for a transmissive material', () => {
    const figure = figureOf('Nen teacher', CASTING, false)
    expect(figure.root.getObjectByName('nen-aura-glass')).toBeUndefined()
  })

  /** A shimmer around a hidden body would be a detector for Zetsu itself. */
  it('wraps nothing around a body that has put its aura away', () => {
    const hidden = figureOf('undercover assassin', CASTING)
    expect(hidden.root.getObjectByName('nen-aura-glass')).toBeUndefined()
    expect(hidden.root.getObjectByName('nen-en-0')).toBeUndefined()
  })
})
