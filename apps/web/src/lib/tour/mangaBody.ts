import type { HumanProfile } from './humanProfiles'
import { ZHANG_LEI_BODY } from './mangaZhangLeiProfile'
import { SALESALE_BODY, SALESALE_SECTIONS } from './mangaSalesaleBody'
import { humanProportions, profileFrameShape } from './humanProfiles'
import { mangaLikeness } from './mangaLikeness'
import type { HumanTrunk, HumanTrunkBuild } from './humanTrunk'
import type { HumanClothesBuild } from './humanClothes'
import type { Material } from 'three'
import { kurapikaSurfacePanel, type Point3 } from './kurapikaGeometry'

export function mangaBodyShape(profile: HumanProfile) {
  const frame = profileFrameShape(profile)
  const proportions = humanProportions(profile)
  if (profile.likeness === 'prince-zhanglei') return ZHANG_LEI_BODY
  if (profile.likeness === 'prince-salesale') return SALESALE_BODY
  const mass = {
    slim: [0.18, 0.12, 0.118],
    average: [0.213, 0.146, 0.14],
    broad: [0.252, 0.185, 0.175],
  }[profile.build]
  if (profile.likeness === 'prince-tserriednich')
    return { chest: 0.25, waist: 0.195, depth: 0.16, neck: frame.neck }
  if (profile.likeness === 'furykov')
    return { chest: 0.24, waist: 0.2, depth: 0.17, neck: frame.neck }
  if (profile.likeness === 'melody')
    return { chest: 0.235, waist: 0.21, depth: 0.17, neck: frame.neck }
  if (profile.likeness === 'dogman')
    return { chest: 0.315, waist: 0.205, depth: 0.205, neck: frame.neck }
  if (profile.likeness === 'tokarine')
    return { chest: 0.3, waist: 0.255, depth: 0.2, neck: frame.neck }
  if (profile.likeness === 'nasubi-hui-guo-rou')
    return { chest: 0.325, waist: 0.315, depth: 0.255, neck: frame.neck }
  return {
    chest: mass[0] * profile.shoulders * frame.width,
    waist: mass[1] * frame.width * proportions.hips,
    depth: mass[2],
    neck: frame.neck,
  }
}

export function mangaBodySections(profile: HumanProfile): ReadonlyArray<readonly [number, number]> {
  if (profile.likeness === 'prince-salesale') return SALESALE_SECTIONS
  if (profile.likeness === 'nasubi-hui-guo-rou')
    return [
      [0, 0.7],
      [0.31, 0.7],
      [0.34, 0.82],
      [0.355, 0.98],
      [0.345, 1.13],
      [0.33, 1.28],
      [0.325, 1.35],
      [0.29, 1.41],
      [0.12, 1.49],
      [0, 1.5],
    ]
  const { chest, waist } = mangaBodyShape(profile)
  return [
    [0, 0.73],
    [waist * 1.13, 0.73],
    [waist, 0.96],
    [waist * 1.07, 1.12],
    [chest * 0.94, 1.31],
    [chest, 1.35],
    [chest * 0.88, 1.395],
    [chest * 0.36, 1.47],
    [chest * 0.29, 1.49],
    [0, 1.49],
  ]
}

export function mangaChestSurface(profile: HumanProfile, x: number, y: number): number {
  const shape = mangaBodyShape(profile)
  const sections = mangaBodySections(profile)
  const height = Math.max(0.731, Math.min(1.4899, y / shape.neck))
  const next = sections.findIndex(([, sy]) => sy >= height)
  const [ra, ya] = sections[Math.max(0, next - 1)]
  const [rb, yb] = sections[Math.max(1, next)]
  const r = ra + ((rb - ra) * (height - ya)) / Math.max(0.001, yb - ya)
  return (Math.sqrt(Math.max(0, r ** 2 - x ** 2)) * shape.depth) / shape.chest
}

export function buildMangaTrunk(build: HumanTrunkBuild): HumanTrunk {
  const { THREE, geometry, outlined, figure, profile, materials } = build
  const shape = mangaBodyShape(profile)
  const key = `${profile.build}:${profile.shoulders}:${profile.frame}:${shape.chest}:${shape.waist}:${shape.depth}`
  const pelvis = outlined({
    THREE,
    geometry: geometry(THREE, `manga:pelvis:${key}`, () =>
      new THREE.CylinderGeometry(shape.waist * 1.08, shape.waist * 0.99, 0.18, 24).scale(1, 1, 0.8),
    ),
    material: materials.trousers ?? materials.cloth,
    ink: materials.ink,
    scale: 1.028,
  })
  pelvis.position.y = 0.77 * shape.neck
  figure.add(pelvis)
  const torso = outlined({
    THREE,
    geometry: geometry(THREE, `manga:torso:${key}`, () =>
      new THREE.LatheGeometry(
        mangaBodySections(profile).map(([r, y]) => new THREE.Vector2(r, (y - 1.12) * shape.neck)),
        28,
      ).scale(1, 1, shape.depth / shape.chest),
    ),
    material: materials.cloth,
    ink: materials.ink,
    scale: 1.03,
  })
  torso.position.y = 1.12 * shape.neck
  torso.name = 'torso'
  figure.add(torso)
  const neckSize = mangaLikeness(profile).neck
  const neck = new THREE.Mesh(
    geometry(
      THREE,
      `manga:neck:${neckSize}`,
      () => new THREE.CylinderGeometry(neckSize, neckSize * 1.15, 0.16, 20),
    ),
    materials.skin,
  )
  neck.position.y = 1.5 * shape.neck
  neck.name = 'manga-neck'
  figure.add(neck)
  return {
    pelvis,
    torso,
    width: shape.waist / 0.15,
    shoulder: shape.chest / profile.shoulders + 0.024,
  }
}

export function mangaClothesKey(profile: HumanProfile) {
  return `${profile.likeness}:${profile.frame}:${profile.build}:${profile.shoulders}`
}

/** All upper panels have a real height on the rig, including their attachment in Fighting. */
export function mangaPanel(
  build: HumanClothesBuild,
  options: {
    name: string
    points: readonly (readonly [number, number])[]
    material: Material
    lift?: number
  },
) {
  const { THREE, geometry, profile, figure, frame } = build
  const sx = profile.shoulders * frame.width
  const points: Point3[] = options.points.map(([x, y]) => [x * sx, y * frame.neck, 0])
  const panel = new THREE.Mesh(
    geometry(THREE, `manga:panel:${mangaClothesKey(profile)}:${options.name}`, () =>
      kurapikaSurfacePanel(THREE, {
        points,
        depth: (x, y) => mangaChestSurface(profile, x, y) + (options.lift ?? 0.012),
      }).translate(0, -1.12 * frame.neck, 0),
    ),
    options.material,
  )
  panel.name = options.name
  panel.position.y = 1.12 * frame.neck
  figure.add(panel)
  return panel
}
