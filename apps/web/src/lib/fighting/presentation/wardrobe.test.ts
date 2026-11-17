import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { createFight } from '../engine'
import { FIGHTING_ROSTER } from '../roster'
import { buildFightFigure, fightFigureKey } from '../fighterFigure'
import { fightReplayHash } from '../fightReplayHash'
import { wardrobePalette, wardrobeProfile } from './wardrobe'
import { defaultPreferences } from './collection'
import { presentedFigures } from './figures'
import { humanProfile } from '$lib/tour/humanProfiles'
const glow = (color: number, opacity: number) => new THREE.MeshBasicMaterial({ color, opacity })
function geometry(root: THREE.Object3D) {
  const meshes: unknown[] = []
  root.traverse((part) => {
    if (!(part instanceof THREE.Mesh)) return
    meshes.push([
      part.name,
      part.geometry.type,
      [...part.geometry.attributes.position.array],
      part.position.toArray(),
      part.scale.toArray(),
    ])
  })
  return meshes
}
function dispose(root: THREE.Object3D) {
  root.traverse((part) => {
    if (!(part instanceof THREE.Mesh)) return
    part.geometry.dispose()
    for (const material of [part.material].flat()) material.dispose()
  })
}
describe('wardrobe recognition and rendering budget', () => {
  it.each(FIGHTING_ROSTER)(
    'preserves $id geometry, equipment, Nen state and rig for both palettes',
    ({ id }) => {
      const state = createFight(id, 'hisoka'),
        hash = fightReplayHash(state)
      const native = buildFightFigure({ THREE, glow, fighter: state.player })
      const reference = geometry(native.root)
      for (const palette of ['slate', 'ivory'] as const) {
        const figure = buildFightFigure({ THREE, glow, fighter: state.player, palette })
        expect(geometry(figure.root)).toEqual(reference)
        dispose(figure.root)
      }
      dispose(native.root)
      expect(fightReplayHash(state)).toBe(hash)
    },
  )
  it('changes only ordinary fabric, keeping skin, hair, cut, signatures, likeness and bare skin panels', () => {
    const original = humanProfile({
      id: 'preview',
      kind: 'combatant',
      spaceId: '',
      tierId: '',
      at: [0, 0],
      y: 0,
      size: 1,
      colour: 0,
      stage: 0,
      hidden: false,
      human: { role: 'hunter', identity: 'kurapika', pose: 'idle' },
    })
    for (const palette of ['slate', 'ivory'] as const) {
      const { jacket, trousers, shirt, ...rest } = wardrobeProfile(original, palette)
      const { jacket: _j, trousers: _t, shirt: _s, ...reference } = original
      expect(rest).toEqual(reference)
      expect([jacket, trousers, shirt]).not.toEqual([
        original.jacket,
        original.trousers,
        original.shirt,
      ])
      expect(wardrobeProfile({ ...original, shirt: original.skin }, palette).shirt).toBe(
        original.skin,
      )
    }
    expect(wardrobeProfile(original, 'native')).toBe(original)
  })
  it('keeps visible transformations native and does not use hidden opponent data as a colour signal', () => {
    const biscuit = createFight('biscuit', 'hisoka').player
    expect(wardrobePalette({ ...biscuit, biscuitTrueForm: true }, 'ivory')).toBe('native')
    const illumi = createFight('illumi', 'hisoka').player
    expect(
      wardrobePalette({ ...illumi, illumi: { ...illumi.illumi!, disguised: true } }, 'slate'),
    ).toBe('native')
    const hisoka = createFight('hisoka', 'kurapika').player
    expect(wardrobePalette(hisoka, 'slate')).toBe('slate')
    hisoka.secretWindow = {
      target: 'opponent',
      attachedAt: 1,
      observation: { frame: 1, action: 'special' },
    }
    expect(wardrobePalette(hisoka, 'slate')).toBe('slate')
  })
  it('also protects a transformed body when a caller requests a palette directly', () => {
    const fighter = { ...createFight('biscuit', 'hisoka').player, biscuitTrueForm: true }
    const native = buildFightFigure({ THREE, glow, fighter })
    const dressed = buildFightFigure({ THREE, glow, fighter, palette: 'ivory' })
    const colours = (root: THREE.Object3D) => {
      const result: number[] = []
      root.traverse((part) => {
        if (part instanceof THREE.Mesh)
          for (const material of [part.material].flat()) {
            if ('color' in material) result.push((material.color as THREE.Color).getHex())
          }
      })
      return result
    }
    expect(colours(dressed.root)).toEqual(colours(native.root))
    dispose(native.root)
    dispose(dressed.root)
  })
  it('invalidates only on effective wardrobe changes and keeps P1/P2 stable for either viewer', () => {
    const state = createFight('kurapika', 'hisoka'),
      preferences = defaultPreferences()
    const figures = presentedFigures({
      build: buildFightFigure,
      key: fightFigureKey,
      resources: { THREE, glow },
      read: () => ({ state, viewer: 'opponent', preferences }),
    })
    const before = figures.nenKey(state.player),
      other = figures.nenKey(state.opponent)
    preferences.player = 'slate'
    expect(figures.nenKey(state.player)).not.toBe(before)
    expect(figures.nenKey(state.opponent)).toBe(other)
    expect(figures.nenKey(state.player)).toBe(figures.nenKey(state.player))
    dispose(figures.models.player.model.root)
    dispose(figures.models.opponent.model.root)
  })
})
