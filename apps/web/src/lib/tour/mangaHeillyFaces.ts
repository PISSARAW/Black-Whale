import type { BufferGeometry, Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { kurapikaPanel } from './kurapikaGeometry'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addHeillyReferenceFace(build: HumanHeadBuild, head: Group) {
  const { profile } = build
  if (!['luini', 'yokotani'].includes(profile.likeness ?? '')) return
  if (profile.likeness === 'yokotani' && profile.expression === 'neutral')
    yokotaniSmile(build, head)
  if (profile.likeness === 'luini' && profile.expression !== 'anxious') luiniGrin(build, head)
}

function noseLines(build: HumanHeadBuild): BufferGeometry[] {
  const { THREE } = build
  return [-1, 1].flatMap((side) => [
    new THREE.PlaneGeometry(0.002, 0.086)
      .rotateZ(side * 0.04)
      .translate(side * 0.012, -0.025, 0.183),
    new THREE.PlaneGeometry(0.025, 0.002)
      .rotateZ(side * 0.25)
      .translate(side * 0.011, -0.072, 0.184),
  ])
}

function yokotaniSmile(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, materials } = build
  for (const side of [-1, 1]) {
    head.getObjectByName(side < 0 ? 'face-eye-left' : 'face-eye-right')!.visible = false
    const eyelid = new THREE.Mesh(
      geometry(THREE, 'manga:yokotani-smiling-eyelid', () =>
        new THREE.TorusGeometry(0.03, 0.0025, 6, 24, Math.PI).scale(1, 0.55, 1),
      ),
      materials.ink,
    )
    eyelid.position.set(side * 0.067, 0.009, 0.18)
    eyelid.name = 'yokotani-smiling-eyelid'
    head.add(eyelid)
  }
  head.getObjectByName('face-mouth')!.visible = false
  const smile = new THREE.Mesh(
    geometry(THREE, 'manga:yokotani-wide-smile', () =>
      kurapikaPanel(THREE, [
        [-0.065, -0.087, 0.18],
        [0, -0.103, 0.18],
        [0.065, -0.087, 0.18],
        [0.047, -0.132, 0.18],
        [0, -0.143, 0.18],
        [-0.047, -0.132, 0.18],
      ]),
    ),
    materials.ink,
  )
  smile.name = 'yokotani-wide-smile'
  head.add(smile)
  const teeth = new THREE.Mesh(
    geometry(THREE, 'manga:yokotani-smile-teeth', () =>
      kurapikaPanel(THREE, [
        [-0.053, -0.099, 0.181],
        [0, -0.109, 0.181],
        [0.053, -0.099, 0.181],
        [0.041, -0.117, 0.181],
        [-0.041, -0.117, 0.181],
      ]),
    ),
    build.glow(0xf9f3e8, 1),
  )
  teeth.name = 'yokotani-smile-teeth'
  head.add(teeth)
  const nose = new THREE.Mesh(
    geometry(THREE, 'manga:yokotani-nose-lines', () => mergeHumanDetails(noseLines(build))),
    materials.ink,
  )
  head.add(nose)
}

function luiniGrin(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, materials } = build
  head.getObjectByName('face-mouth')!.visible = false
  const grin = new THREE.Mesh(
    geometry(THREE, 'manga:luini-toothed-grin', () =>
      kurapikaPanel(THREE, [
        [-0.064, -0.105, 0.18],
        [-0.04, -0.087, 0.18],
        [0.01, -0.084, 0.18],
        [0.062, -0.102, 0.18],
        [0.04, -0.12, 0.18],
        [-0.04, -0.124, 0.18],
      ]),
    ),
    build.glow(0xf1eadc, 1),
  )
  grin.name = 'luini-toothed-grin'
  head.add(grin)
  const cavity = new THREE.Mesh(
    geometry(THREE, 'manga:luini-grin-cavity', () =>
      kurapikaPanel(THREE, [
        [-0.064, -0.107, 0.178],
        [-0.04, -0.084, 0.178],
        [0.02, -0.081, 0.178],
        [0.064, -0.102, 0.178],
        [0.046, -0.13, 0.178],
        [0, -0.145, 0.178],
        [-0.039, -0.134, 0.178],
      ]),
    ),
    materials.ink,
  )
  cavity.name = 'luini-grin-cavity'
  head.add(cavity)
  const marks = new THREE.Mesh(
    geometry(THREE, 'manga:luini-face-lines', () => {
      const parts = noseLines(build)
      for (let i = -3; i <= 3; i++)
        parts.push(new THREE.PlaneGeometry(0.0013, 0.022).translate(i * 0.014, -0.105, 0.182))
      parts.push(
        new THREE.TorusGeometry(0.058, 0.0025, 6, 30, Math.PI * 0.88)
          .rotateZ(-1.55)
          .scale(0.7, 1, 1)
          .translate(0.079, -0.016, 0.175),
      )
      parts.push(new THREE.PlaneGeometry(0.003, 0.065).rotateZ(-0.1).translate(0.075, -0.12, 0.172))
      return mergeHumanDetails(parts)
    }),
    materials.ink,
  )
  marks.name = 'luini-cheek-and-grin-lines'
  head.add(marks)
}
