import type { HumanClothesBuild } from './humanClothes'
import { mangaBodyShape } from './mangaBody'
import { addMangaSuit } from './mangaTailoring'
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
  const { THREE, geometry, figure, materials, frame, profile } = build
  const { chest, depth } = mangaBodyShape(profile)
  const stripeMaterial = keniStripeMaterial(materials.shirt)
  const stripes = new THREE.Mesh(
    geometry(THREE, 'manga:keni-pinstripe-suit', () => {
      const parts = []
      for (let i = -5; i <= 5; i++) {
        const x = i * 0.033
        const span = Math.max(0.25, 0.58 - Math.abs(i) * 0.027)
        parts.push(
          new THREE.BoxGeometry(0.003, span, 0.004).translate(
            x,
            0.02 + Math.abs(i) * 0.004,
            depth * 0.98,
          ),
        )
      }
      for (const side of [-1, 1])
        for (let i = 0; i < 4; i++)
          parts.push(
            new THREE.BoxGeometry(0.003, 0.29 - i * 0.025, 0.004)
              .rotateZ(side * (0.34 + i * 0.035))
              .translate(side * (0.065 + i * 0.026), 0.18 - i * 0.012, depth * 1.01),
          )
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
            chest * 0.89,
          ),
        )
      return mergeHumanDetails(parts)
    }),
    materials.shirt,
  )
  dots.name = 'keni-polka-dot-tie'
  figure.add(dots)
}
