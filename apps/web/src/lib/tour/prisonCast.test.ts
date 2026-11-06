import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf } from './blueprint'
import { BEYOND_CELL, BEYOND_WATCH } from './prisonView'
import { mangaViewById } from './mangaViews'
import { stagePostsForMangaView } from './cast/mangaStage'
import { castApparitions } from './cast/distribution'
import { buildHumanFigure } from './humanFigure'
import type { Post } from './cast/types'

const ship = theShip()
const plan = ship.plans.get('interior-beyond-cell')!
const post = (characterId: string): Post => ({
  member: {
    characterId,
    name: characterId,
    locations: [],
    role: 'Hunter',
    since: 'ch-359',
    nen: false,
    hatsu: [],
    beast: null,
  },
  spaceId: BEYOND_WATCH,
  tierId: plan.tier.id,
  at: [0, 0],
  costume: { role: 'hunter' },
})

describe('the chapter 359 prison cast', () => {
  it('keeps Beyond on his mattress and the three Zodiacs on the watch side of the grille', () => {
    const posts = stagePostsForMangaView(
      ['beyond-netero', 'kanzai', 'saiyu', 'saccho-kobayakawa'].map(post),
      mangaViewById('beyond-cell-bars')!,
      plan.tier.id,
    )
    expect(posts[0]).toMatchObject({ spaceId: BEYOND_CELL, pose: 'reclined', floorOffset: 0.585 })
    for (const guard of posts.slice(1)) {
      expect(guard.spaceId).toBe(BEYOND_WATCH)
      expect(guard.at[0]).toBeGreaterThan(-0.5)
      expect(guard.pose).toBe('cross-legged')
    }
    const seen = castApparitions(ship, posts)
    const floor = floorOf(ship.spaces.get(BEYOND_CELL)!, plan.tier)
    expect(seen[0].y).toBeCloseTo(floor + 0.585)
    expect(seen[1].y).toBeCloseTo(floor + 0.25)
    for (const guard of seen.slice(2)) expect(guard.y).toBeCloseTo(floor)
  })

  it('keeps the reclining rig horizontal through animation, with the open book attached to its hand', () => {
    const posts = stagePostsForMangaView(
      [post('beyond-netero')],
      mangaViewById('beyond-cell-bars')!,
      plan.tier.id,
    )
    const seen = castApparitions(ship, posts)[0]
    const rig = buildHumanFigure({
      THREE,
      seen: { ...seen, kind: 'avatar' },
      glow: (colour, opacity) => new THREE.MeshBasicMaterial({ color: colour, opacity }),
    })
    const initial = rig.turns.rotation.x
    expect(initial).toBeLessThan(-1.4)
    expect(rig.turns.position.z).toBeGreaterThan(0)
    const origin = rig.turns.localToWorld(new THREE.Vector3())
    const front = rig.turns.localToWorld(new THREE.Vector3(0, 0, 1)).sub(origin)
    expect(front.y).toBeGreaterThan(0.9)
    const book = rig.root.getObjectByName('beyond-prison-book')!
    expect(book.parent?.name).toBe('hand-right')
    rig.root.position.set(seen.at[0], seen.y, seen.at[1])
    rig.root.rotation.y = seen.heading ?? 0
    rig.root.updateMatrixWorld(true)
    const wrist = rig.root.getObjectByName('hand-left')!.getWorldPosition(new THREE.Vector3())
    const manacle = plan.structures.find(({ kind }) => kind === 'manacle')!
    const cuff = new THREE.Vector3(
      manacle.at[0] + manacle.size[0] * 0.15 + 0.17,
      floorOf(ship.spaces.get(BEYOND_CELL)!, plan.tier) + manacle.base + manacle.height / 2 - 0.14,
      manacle.at[1],
    )
    expect(wrist.distanceTo(cuff)).toBeLessThan(0.2)

    for (const seconds of [0, 1, 10]) {
      rig.animate(seconds)
      expect(rig.turns.rotation.x).toBe(initial)
      expect(book.parent?.name).toBe('hand-right')
    }
    const bounds = new THREE.Box3().setFromObject(rig.lod.near)
    expect(Math.max(bounds.max.z - bounds.min.z, bounds.max.x - bounds.min.x)).toBeGreaterThan(
      bounds.max.y - bounds.min.y,
    )
  })
})
