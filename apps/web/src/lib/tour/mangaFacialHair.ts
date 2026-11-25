import type { BufferGeometry, Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { mergeHumanDetails } from './humanDetailGeometry'
import { kurapikaLock } from './kurapikaGeometry'

type Three = HumanHeadBuild['THREE']
function beard(THREE: Three, options: { full: boolean; long: boolean }) {
  const front = options.long ? 0.28 : 0.09
  const root = options.long ? 0.25 : 0.16
  const shape = options.full
    ? {
        step: 0.021,
        width: 0.021,
        top: -0.12,
        next: -0.18,
        middle: options.long ? -0.55 : -0.24,
        end: options.long ? -0.85 : -0.32,
      }
    : { step: 0.008, width: 0.012, top: -0.145, next: -0.19, middle: -0.22, end: -0.255 }
  const parts: BufferGeometry[] = []
  if (options.full)
    parts.push(
      new THREE.SphereGeometry(1, 12, 8).scale(0.075, 0.06, 0.015).translate(0, -0.145, 0.19),
    )
  for (let i = -6; i <= 6; i++) {
    const x = i * shape.step
    parts.push(
      kurapikaLock(THREE, {
        width: shape.width,
        depth: 0.009,
        points: [
          [x, shape.top, root],
          [x * 1.05, shape.next, root],
          [x * 0.9, shape.middle, front + 0.04],
          [x * 0.35, shape.end, front],
        ],
      }),
    )
  }
  return parts
}
function moustache(THREE: Three) {
  return [-1, 1].map((side) =>
    kurapikaLock(THREE, {
      width: 0.019,
      depth: 0.009,
      points: [
        [side * 0.008, -0.07, 0.18],
        [side * 0.037, -0.08, 0.19],
        [side * 0.075, -0.1, 0.16],
        [side * 0.08, -0.15, 0.12],
      ],
    }),
  )
}
function hairParts(THREE: Three, signatures: readonly string[], long: boolean) {
  const parts: BufferGeometry[] = []
  if (signatures.includes('beard-full') || signatures.includes('goatee'))
    parts.push(...beard(THREE, { full: signatures.includes('beard-full'), long }))
  if (signatures.includes('moustache') || signatures.includes('beard-full'))
    parts.push(...moustache(THREE))
  if (signatures.includes('mutton-chops'))
    for (const side of [-1, 1])
      parts.push(
        new THREE.SphereGeometry(1, 10, 8)
          .scale(0.032, 0.1, 0.019)
          .translate(side * 0.139, -0.05, 0.06),
      )
  return mergeHumanDetails(parts)
}
export function addMangaFacialHair(build: HumanHeadBuild, head: Group) {
  const { THREE, profile, geometry, materials } = build
  if (profile.likeness === 'basho' || profile.likeness === 'keeney') return
  const supported = new Set(['beard-full', 'moustache', 'mutton-chops', 'goatee'])
  const signatures = profile.signatures.filter((piece) => supported.has(piece))
  if (!signatures.length) return
  if (profile.likeness === 'leorio-paradinight') {
    const stubble = new THREE.Mesh(
      geometry(THREE, 'manga:leorio-stubble', () =>
        mergeHumanDetails(
          [-3, -2, -1, 0, 1, 2, 3].map((i) =>
            new THREE.PlaneGeometry(0.0018, 0.013)
              .rotateZ(i * -0.06)
              .translate(i * 0.01, -0.182, 0.073),
          ),
        ),
      ),
      build.glow(profile.hair, 0.45),
    )
    stubble.name = 'leorio-stubble'
    head.add(stubble)
    return
  }
  const mesh = new THREE.Mesh(
    geometry(
      THREE,
      `manga:beard:${profile.likeness === 'beyond-netero'}:${signatures.join(':')}`,
      () => hairParts(THREE, signatures, profile.likeness === 'beyond-netero'),
    ),
    profile.likeness === 'terebellum' ? build.glow(0x433b35, 1) : materials.hairInk,
  )
  mesh.name = signatures.includes('beard-full') ? 'signature-beard' : 'manga-facial-hair'
  head.add(mesh)
}
