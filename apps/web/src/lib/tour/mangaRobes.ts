import type { HumanClothesBuild } from './humanClothes'
import { mangaBodyShape, mangaClothesKey, mangaPanel } from './mangaBody'

export function addMangaDress(build: HumanClothesBuild, hem?: number): void {
  const { THREE, geometry, figure, frame, materials, profile } = build
  const child = profile.frame === 'child'
  const biscuit = profile.likeness === 'biscuit-krueger'
  const { chest, waist } = mangaBodyShape(profile)
  const bottom = hem ?? (biscuit ? 0.24 : -0.15)
  const skirt = new THREE.Mesh(
    geometry(
      THREE,
      `manga:dress:${mangaClothesKey(profile)}:${bottom}`,
      () =>
        new THREE.LatheGeometry(
          [
            new THREE.Vector2(0, bottom * frame.neck),
            new THREE.Vector2(waist * (child ? 1.8 : 2.25), bottom * frame.neck),
            new THREE.Vector2(waist * 1.65, 0.58 * frame.neck),
            new THREE.Vector2(waist * 1.1, 0.98 * frame.neck),
            new THREE.Vector2(0, 0.98 * frame.neck),
          ],
          32,
        ),
    ),
    materials.cloth,
  )
  skirt.name = 'court-gown'
  figure.add(skirt)
  const sash = new THREE.Mesh(
    geometry(THREE, `manga:dress-sash:${mangaClothesKey(profile)}`, () =>
      new THREE.CylinderGeometry(waist * 1.1, waist * 1.13, 0.06, 28).scale(1, 1, 0.7),
    ),
    materials.accent,
  )
  sash.position.y = 0.99 * frame.neck
  figure.add(sash)
  if (biscuit) {
    mangaPanel(build, {
      name: 'biscuit-lace-bib',
      points: [
        [-0.085, 1.415],
        [-0.067, 1.255],
        [0, 1.2],
        [0.067, 1.255],
        [0.085, 1.415],
      ],
      material: materials.shirt,
    })
    const bow = new THREE.Mesh(
      geometry(THREE, 'manga:biscuit-bow', () =>
        new THREE.TorusGeometry(0.04, 0.013, 6, 18).scale(1.5, 0.65, 0.7),
      ),
      materials.accent,
    )
    bow.position.set(0, 1.36 * frame.neck, chest * 0.69)
    bow.name = 'biscuit-ribbon'
    figure.add(bow)
  }
}

export function addMangaKimono(build: HumanClothesBuild): void {
  const { THREE, geometry, figure, profile, materials, frame } = build
  const { waist } = mangaBodyShape(profile)
  const shortKimono = profile.likeness === 'nobunaga-hazama'
  const skirt = new THREE.Mesh(
    geometry(THREE, `manga:robe:${mangaClothesKey(profile)}`, () =>
      shortKimono
        ? new THREE.LatheGeometry(
            [
              [1.69, -0.33],
              [1.72, -0.25],
              [1.55, -0.04],
              [1.38, 0.19],
              [1.18, 0.33],
            ].map(([r, y]) => new THREE.Vector2(r * waist, y * frame.neck)),
            32,
          ).scale(1, 1, 0.78)
        : new THREE.CylinderGeometry(waist * 1.35, waist * 1.85, 1.17 * frame.neck, 32).scale(
            1,
            1,
            0.78,
          ),
    ),
    materials.cloth,
  )
  skirt.name = profile.clothing === 'kimono' ? 'attire-kimono' : 'attire-changshan'
  skirt.position.y = (shortKimono ? 0.57 : 0.435) * frame.neck
  figure.add(skirt)
  if (profile.clothing === 'changshan') {
    const collar = new THREE.Mesh(
      geometry(
        THREE,
        'manga:mandarin-collar',
        () => new THREE.CylinderGeometry(0.065, 0.08, 0.085, 24, 1, true),
      ),
      materials.cloth,
    )
    collar.position.y = 1.46 * frame.neck
    figure.add(collar)
    for (let i = 0; i < 4; i++) {
      const button = new THREE.Mesh(
        geometry(THREE, 'manga:frog-button', () => new THREE.BoxGeometry(0.03, 0.008, 0.012)),
        materials.accent,
      )
      button.position.set(0.04, (1.35 - i * 0.11) * frame.neck, 0.18)
      figure.add(button)
    }
  }
  if (profile.clothing === 'kimono') {
    for (const side of [-1, 1])
      mangaPanel(build, {
        name: `kimono-fold-${side}`,
        points: [[side * 0.065, 1.47], [side * 0.1, 1.43], ...kimonoCollarEnd(side)],
        material: materials.shirt,
      })
    const obi = new THREE.Mesh(
      geometry(THREE, `manga:obi:${mangaClothesKey(profile)}`, () =>
        new THREE.CylinderGeometry(waist * 1.24, waist * 1.27, 0.14, 28).scale(1, 1, 0.77),
      ),
      materials.accent,
    )
    obi.name = 'attire-obi'
    obi.position.y = 1.01 * frame.neck
    figure.add(obi)
  }
}

function kimonoCollarEnd(side: number): readonly (readonly [number, number])[] {
  return side === 1
    ? [
        [-0.08, 1.11],
        [-0.1, 1.16],
      ]
    : [
        [0, 1.31],
        [-0.025, 1.34],
      ]
}
