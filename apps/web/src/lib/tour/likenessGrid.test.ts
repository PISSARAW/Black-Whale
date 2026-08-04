import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { MeshBasicMaterial } from 'three'
import appearanceFile from '../../../../../data/characters/appearance.json'
import type { Apparition } from './apparitions'
import { buildHumanFigure } from './humanFigure'

/**
 * The reference grid — ADR-005 §4-P4, in the form this repository can check.
 *
 * The phase asks for a grid of portraits taken in CI. What that is *for* is
 * catching a face that changed without anybody meaning it to: an edit to the
 * hair module that quietly drops Biscuit's ringlets, a shared geometry key
 * reused for two different shapes, a signature that stops being hung. Pixels
 * are one way to catch that and they are the way that needs a GPU, a browser
 * and a tolerance for antialiasing noise; the rig is another, and it is the one
 * that fails with a name on it rather than with a diff of two PNGs.
 *
 * So this is a contact sheet of sixty-seven rigs rather than of sixty-seven
 * pictures: for each declared likeness, what was built, how much of it, and
 * where the named pieces ended up. It will not tell you a face is ugly. It will
 * tell you, on the commit that did it, that Chrollo lost his cross.
 *
 * `scripts/tour-shots.mjs` remains the way to actually look at the walk, and
 * the honest statement of the gap is that nothing here replaces a pair of eyes.
 */
function person(identity: string): Apparition & { kind: 'avatar' } {
  return {
    id: identity,
    kind: 'avatar',
    spaceId: 'room',
    tierId: 'tier-1',
    at: [0, 0],
    y: 0,
    size: 0.42,
    colour: 0xffffff,
    stage: 0,
    hidden: false,
    human: { role: 'witness', pose: 'idle', identity },
  }
}

/** One rig, reduced to what a change would have to break to matter. */
function portrait(identity: string): string {
  const rig = buildHumanFigure({
    THREE,
    glow: (colour, opacity) =>
      new MeshBasicMaterial({ color: colour, opacity, transparent: opacity < 1 }),
    seen: person(identity),
  })
  let meshes = 0
  const named: string[] = []
  rig.root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) meshes += 1
    if (child.name) named.push(child.name)
  })
  const height = rig.turns.scale.x.toFixed(3)
  return `${identity} · ${meshes} meshes · ×${height} · ${named.sort().join(' ')}`
}

describe('the reference grid', () => {
  it('draws every declared likeness the way it drew it last time', () => {
    const sheet = appearanceFile.declared.map((entry) => portrait(entry.id)).join('\n')
    expect(sheet).toMatchSnapshot()
  })

  it('gives no two of them the same rig', () => {
    // Sixty-seven declarations that came out identical would pass a snapshot
    // and mean the projection is not reading the data at all.
    const sheets = new Set(appearanceFile.declared.map((entry) => portrait(entry.id)))
    expect(sheets.size).toBe(appearanceFile.declared.length)
  })
})
