import type { Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { MangaHairKit } from './mangaHair'
import { mangaScalpGeometry } from './mangaScalp'
import { mergeHumanDetails } from './humanDetailGeometry'
import { kurapikaPanel } from './kurapikaGeometry'

/** Short uneven layers, with a parted fringe and pointed ends around the ears. */
export function mangaFeitanHair(kit: MangaHairKit) {
  const { THREE, parts } = kit
  parts.push(mangaScalpGeometry(kit))
  parts.push(
    new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.163, -0.035),
        new THREE.Vector2(0.18, 0.035),
        new THREE.Vector2(0.16, 0.13),
      ],
      28,
      0.95,
      Math.PI * 2 - 1.9,
    ).scale(1, 1, 0.88),
  )
  for (let i = -5; i <= 5; i++) {
    const x = i * 0.025
    const top = 0.242 - (x / 0.15) ** 2 * 0.065
    kit.lock({
      width: 0.022,
      depth: 0.015,
      points: [
        [x * 0.6, 0.16, 0.005],
        [x * 0.9, top - 0.014, 0.065],
        [x, top + (Math.abs(i) % 3) * 0.005, 0.025],
        [x + 0.027 + (i % 2) * 0.009, top - 0.012, -0.045],
      ],
    })
  }
  // Two stray strands standing off the crown, the reference model's cowlick.
  for (const lean of [1, -0.6])
    kit.lock({
      width: 0.016,
      depth: 0.008,
      points: [
        [lean * 0.01, 0.232, 0.01],
        [lean * 0.02, 0.29, 0.025],
        [lean * 0.05, 0.315, 0.05],
        [lean * 0.075, 0.3, 0.075],
      ],
    })
  for (const side of [-1, 1]) {
    for (let i = 0; i < 7; i++) {
      const z = 0.09 - i * 0.035
      kit.lock({
        width: 0.026,
        depth: 0.014,
        points: [
          [side * 0.08, 0.18, z],
          [side * 0.15, 0.12, z + 0.03],
          [side * 0.18, 0.025, z + 0.015],
          [side * (0.21 + (i % 3) * 0.016), -0.063 - (i % 3) * 0.025, z + 0.01],
        ],
      })
    }
    for (let i = 0; i < 3; i++)
      kit.lock({
        width: 0.021,
        depth: 0.01,
        points: [
          [side * 0.025, 0.205, 0.065 - i * 0.012],
          [side * (0.048 + i * 0.018), 0.165, 0.145],
          [side * (0.06 + i * 0.026), 0.105, 0.178],
          [side * (0.035 + i * 0.03), 0.035 + side * 0.01 + i * 0.012, 0.18],
        ],
      })
  }
}

export function addFeitanScarf(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, glow, profile } = build
  const mesh = (name: string, colour: number, make: () => import('three').BufferGeometry) => {
    const part = new THREE.Mesh(geometry(THREE, `manga:${name}`, make), glow(colour, 1))
    part.name = name
    head.add(part)
    return part
  }
  mesh('feitan-skull-scarf', profile.shirt, () =>
    // A high collar down to the shoulders, as the reference model wears it:
    // no bare neck between the scarf and the coat.
    new THREE.CylinderGeometry(0.157, 0.19, 0.27, 32).scale(1, 1, 0.85).translate(0, -0.185, 0.02),
  )
  mesh('feitan-scarf-flap', profile.shirt, () =>
    kurapikaPanel(THREE, [
      [-0.161, -0.047, 0.17],
      [0.161, -0.047, 0.17],
      [0.116, -0.23, 0.19],
      [0, -0.325, 0.2],
      [-0.116, -0.23, 0.19],
    ]),
  )
  // The reference model's trim is a broad grey band: round the rim of the
  // collar, down to a V on the chest, and the same V again between the shoulders.
  mesh('feitan-scarf-trim', profile.accent, () =>
    mergeHumanDetails([
      ...Array.from({ length: 17 }, (_, i) => {
        const x = (i - 8) * 0.018
        return new THREE.PlaneGeometry(0.021, 0.027)
          .rotateZ(i % 2 ? 0.13 : -0.13)
          .translate(x, -0.056 - x * x * 0.55 + (i % 2) * 0.006, 0.178 - x * x * 0.19)
      }),
      new THREE.PlaneGeometry(0.034, 0.24).rotateZ(0.61).translate(-0.067, -0.241, 0.204),
      new THREE.PlaneGeometry(0.034, 0.24).rotateZ(-0.61).translate(0.067, -0.241, 0.204),
      ...[-1, 1].map((side) =>
        new THREE.PlaneGeometry(0.034, 0.25)
          .rotateZ(side * 0.68)
          .rotateY(Math.PI)
          .translate(side * 0.072, -0.152, -0.132),
      ),
    ]),
  )
  mesh('feitan-scarf-hatching', 0x313848, () => {
    const parts = []
    for (let i = -8; i <= 8; i++)
      parts.push(
        new THREE.PlaneGeometry(0.002, 0.012)
          .rotateZ(i % 2 ? 0.38 : -0.38)
          .translate(i * 0.017, -0.048, 0.175),
      )
    for (const side of [-1, 1])
      for (let i = 0; i < 10; i++)
        parts.push(
          new THREE.PlaneGeometry(0.002, 0.013)
            .rotateZ(side * (i % 2 ? 0.2 : 0.9))
            .translate(side * (0.009 + i * 0.012), -0.326 + i * 0.017, 0.206),
        )
    return mergeHumanDetails(parts)
  })
  mesh('feitan-scarf-emblem', 0xf0eee6, () =>
    mergeHumanDetails([
      new THREE.CircleGeometry(0.036, 24).scale(1, 0.94, 1).translate(0, -0.128, 0.207),
      new THREE.PlaneGeometry(0.036, 0.028).translate(0, -0.157, 0.207),
      // Crossbones behind the skull, knuckled at each end.
      ...[-1, 1].flatMap((side) => [
        new THREE.PlaneGeometry(0.13, 0.016).rotateZ(side * 0.62).translate(0, -0.145, 0.2065),
        ...[-1, 1].map((end) =>
          new THREE.CircleGeometry(0.012, 12).translate(
            end * 0.053,
            -0.145 + end * side * 0.039,
            0.2065,
          ),
        ),
      ]),
    ]),
  )
  mesh('feitan-scarf-skull-holes', 0x12141a, () =>
    mergeHumanDetails([
      new THREE.CircleGeometry(0.009, 16).translate(-0.013, -0.129, 0.209),
      new THREE.CircleGeometry(0.009, 16).translate(0.013, -0.129, 0.209),
      new THREE.CircleGeometry(0.005, 3).translate(0, -0.147, 0.209),
      ...[-1, 0, 1].map((i) =>
        new THREE.PlaneGeometry(0.002, 0.012).translate(i * 0.008, -0.162, 0.209),
      ),
    ]),
  )
}
