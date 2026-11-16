import type { Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { MangaHairKit } from './mangaHair'
import { mangaScalpGeometry } from './mangaScalp'
import { cluckPlumage, type CluckPlume } from './cluckFeathers'
import { mergeHumanDetails } from './humanDetailGeometry'
import { kurapikaPanel } from './kurapikaGeometry'

export function mangaCluckUpdo(kit: MangaHairKit) {
  kit.parts.push(mangaScalpGeometry(kit))
  for (let i = -7; i <= 7; i++)
    kit.lock({
      width: 0.021,
      depth: 0.012,
      points: [
        [i * 0.02, 0.1, 0.145],
        [i * 0.019, 0.22, 0.14],
        [i * 0.016, 0.29 - Math.abs(i) * 0.005, 0.04],
        [i * 0.015, 0.17, -0.13],
      ],
    })
}

export function addCluckHeaddress(build: HumanHeadBuild, head: Group) {
  if (build.profile.likeness !== 'cluck') return
  const { THREE, geometry, glow } = build
  const plumes: CluckPlume[] = []
  for (let i = -4; i <= 4; i++)
    plumes.push({
      length: 0.66 - Math.abs(i) * 0.055,
      width: 0.034,
      at: [i * 0.018, 0.21, -0.1],
      turn: [0, 0, i * -0.29],
    })
  const crown = cluckPlumage({
    THREE,
    geometry,
    key: 'cluck-feather-crown',
    plumes,
    materials: { white: glow(0xe5eee9, 1), teal: glow(0x72a7ac, 1), shaft: glow(0x8bacae, 1) },
  })
  head.add(crown)
  const ribbon = new THREE.Mesh(
    geometry(THREE, 'manga:cluck-turquoise-ribbons', () => {
      const parts = []
      for (const side of [-1, 1]) {
        parts.push(
          new THREE.SphereGeometry(1, 16, 10)
            .scale(0.08, 0.042, 0.034)
            .rotateZ(side * -0.3)
            .translate(side * 0.15, 0.235, -0.025),
        )
        const tail = kurapikaPanel(THREE, [
          [side * 0.15, 0.2, -0.045],
          [side * 0.185, 0.18, -0.045],
          [side * 0.225, -0.24, -0.045],
          [side * 0.19, -0.205, -0.045],
          [side * 0.165, -0.26, -0.045],
          [side * 0.135, 0.17, -0.045],
        ])
        tail.setAttribute(
          'uv',
          new THREE.Float32BufferAttribute(
            new Float32Array(tail.getAttribute('position').count * 2),
            2,
          ),
        )
        parts.push(tail)
      }
      return mergeHumanDetails(parts)
    }),
    glow(0x639ba3, 1),
  )
  ribbon.name = 'cluck-turquoise-ribbons'
  head.add(ribbon)
  const earrings = new THREE.Mesh(
    geometry(THREE, 'manga:cluck-drop-earrings', () =>
      mergeHumanDetails(
        [-1, 1].flatMap((side) => [
          new THREE.CylinderGeometry(0.002, 0.002, 0.065, 6).translate(side * 0.157, -0.09, 0.02),
          new THREE.ConeGeometry(0.012, 0.022, 3)
            .rotateZ(Math.PI)
            .translate(side * 0.157, -0.13, 0.02),
        ]),
      ),
    ),
    glow(0xc8d2d0, 1),
  )
  earrings.name = 'cluck-drop-earrings'
  head.add(earrings)
}
