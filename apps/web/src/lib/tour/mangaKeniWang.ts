import type { HumanClothesBuild } from './humanClothes'
import { mangaChestSurface } from './mangaBody'
import { addMangaSuit } from './mangaTailoring'
import { kurapikaSurfacePanel } from './kurapikaGeometry'
import { mergeHumanDetails } from './humanDetailGeometry'
import type { Material, MeshBasicMaterial } from 'three'

const STRIPE_MATERIALS = new WeakMap<Material, MeshBasicMaterial>()

function keniStripeMaterial(source: Material): MeshBasicMaterial {
  const held = STRIPE_MATERIALS.get(source)
  if (held) return held
  const made = source.clone() as MeshBasicMaterial
  made.color.setHex(0x7d818c)
  made.opacity = 0.72
  made.transparent = true
  STRIPE_MATERIALS.set(source, made)
  return made
}

export function addKeniStripedSuit(build: HumanClothesBuild): void {
  addMangaSuit(build)
  if (build.profile.plainSuit) return
  const { THREE, geometry, figure, materials, frame, profile } = build
  const stripeMaterial = keniStripeMaterial(materials.shirt)
  const stripes = new THREE.Mesh(
    geometry(THREE, 'manga:keni-pinstripe-suit', () => {
      const parts = []
      for (let i = -5; i <= 5; i++) {
        if (i === 0) continue
        const x = i * 0.027
        const top = 1.09 + Math.abs(i) * 0.057
        parts.push(
          kurapikaSurfacePanel(THREE, {
            points: [
              [x, 0.87, 0],
              [x + 0.0019, 0.87, 0],
              [x + 0.0019, top, 0],
              [x, top, 0],
            ],
            depth: (sx, sy) => mangaChestSurface(profile, sx, sy) + 0.0035,
          }).translate(0, -1.12, 0),
        )
      }
      return mergeHumanDetails(parts)
    }),
    stripeMaterial,
  )
  stripes.name = 'keni-pinstripe-suit'
  stripes.position.y = 1.12 * frame.neck
  figure.add(stripes)

  const dots = new THREE.Mesh(
    geometry(THREE, 'manga:keni-polka-dot-tie', () => {
      const parts = []
      for (let i = 0; i < 6; i++)
        parts.push(
          new THREE.CircleGeometry(0.004, 8).translate(
            (i % 2 ? 1 : -1) * 0.006,
            1.38 - i * 0.027,
            mangaChestSurface(profile, 0, 1.38 - i * 0.027) + 0.017,
          ),
        )
      return mergeHumanDetails(parts)
    }),
    materials.shirt,
  )
  dots.name = 'keni-polka-dot-tie'
  figure.add(dots)
}
