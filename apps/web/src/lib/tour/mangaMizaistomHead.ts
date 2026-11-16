import type { Group, Mesh } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { cowSpotContour } from './mangaCowSpots'
import { kurapikaLock, kurapikaSurfacePanel } from './kurapikaGeometry'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addMizaistomHead(build: HumanHeadBuild, head: Group) {
  if (build.profile.likeness !== 'mizaistom-nana') return
  const { THREE, geometry, glow, materials } = build
  head.getObjectByName('manga-layered-hair')!.visible = false
  const crown = new THREE.Mesh(
    geometry(
      THREE,
      'manga:mizaistom-cow-hat',
      () =>
        new THREE.LatheGeometry(
          [
            new THREE.Vector2(0.235, 0.08),
            new THREE.Vector2(0.21, 0.13),
            new THREE.Vector2(0.195, 0.25),
            new THREE.Vector2(0.14, 0.32),
            new THREE.Vector2(0, 0.35),
          ],
          40,
        ),
    ),
    glow(0xefece3, 1),
  )
  crown.name = 'mizaistom-cow-hat'
  head.add(crown)
  const brim = new THREE.Mesh(
    geometry(
      THREE,
      'manga:mizaistom-hat-brim',
      () => new THREE.CylinderGeometry(0.235, 0.255, 0.035, 40, 1, true),
    ),
    glow(0xefece3, 1),
  )
  brim.position.y = 0.075
  head.add(brim)
  const patches = new THREE.Mesh(
    geometry(THREE, 'manga:mizaistom-hat-patches', () => {
      const parts = []
      for (const side of [-1, 1])
        parts.push(
          kurapikaSurfacePanel(THREE, {
            points: cowSpotContour([
              [side * 0.18, 0.1],
              [side * 0.06, 0.12],
              [side * 0.08, 0.24],
              [side * 0.03, 0.32],
              [side * 0.13, 0.31],
              [side * 0.19, 0.24],
            ]).map(([x, y]) => [x, y, 0] as const),
            depth: (x, y) => Math.sqrt(Math.max(0, hatRadius(y) ** 2 - x ** 2)) + 0.008,
          }),
        )
      return mergeHumanDetails(parts)
    }),
    materials.ink,
  )
  patches.name = 'mizaistom-hat-patches'
  head.add(patches)
  const horns = new THREE.Mesh(
    geometry(THREE, 'manga:mizaistom-gold-horns', () =>
      mergeHumanDetails(
        [-1, 1].map((side) =>
          kurapikaLock(THREE, {
            width: 0.03,
            depth: 0.025,
            points: [
              [side * 0.19, 0.22, 0.015],
              [side * 0.25, 0.245, 0.025],
              [side * 0.278, 0.3, 0.02],
              [side * 0.26, 0.365, 0.015],
            ],
          }),
        ),
      ),
    ),
    glow(0xc6ad3d, 1),
  )
  horns.name = 'mizaistom-gold-horns'
  head.add(horns)
  const eyePatch = new THREE.Mesh(
    geometry(THREE, 'manga:mizaistom-eye-patch', () =>
      new THREE.CircleGeometry(0.072, 32).scale(1, 0.72, 1),
    ),
    materials.ink,
  )
  eyePatch.position.set(0.069, 0.016, 0.173)
  eyePatch.name = 'mizaistom-dark-eye-patch'
  head.add(eyePatch)
  for (const side of [-1, 1]) {
    const earring = new THREE.Mesh(
      geometry(
        THREE,
        'manga:mizaistom-earring',
        () => new THREE.TorusGeometry(0.019, 0.0045, 8, 24),
      ),
      glow(0xc6ad3d, 1),
    )
    earring.position.set(side * 0.184, -0.087, 0.015)
    earring.name = 'mizaistom-gold-earring'
    head.add(earring)
  }
  const jaw = new THREE.Mesh(
    geometry(
      THREE,
      'manga:mizaistom-jaw-beard',
      () =>
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.15, -0.045, 0.05),
            new THREE.Vector3(-0.13, -0.14, 0.08),
            new THREE.Vector3(-0.065, -0.218, 0.07),
            new THREE.Vector3(0.065, -0.218, 0.07),
            new THREE.Vector3(0.13, -0.14, 0.08),
            new THREE.Vector3(0.15, -0.045, 0.05),
          ]),
          48,
          0.011,
          7,
          false,
        ),
    ),
    glow(0x222923, 1),
  )
  jaw.name = 'mizaistom-jaw-beard'
  head.add(jaw)
  addFaceContours(build, head)
  for (const eye of ['face-eye-left', 'face-eye-right'])
    (head.getObjectByName(eye)!.getObjectByName('eye-pupil') as Mesh).material = glow(0x4e5a43, 1)
}

function hatRadius(y: number) {
  const sections = [
    [0.08, 0.235],
    [0.13, 0.21],
    [0.25, 0.195],
    [0.32, 0.14],
    [0.35, 0],
  ]
  const next = Math.max(
    1,
    sections.findIndex(([height]) => height >= y),
  )
  const [a, r1] = sections[next - 1],
    [b, r2] = sections[next]
  return r1 + ((r2 - r1) * (y - a)) / (b - a)
}

function addFaceContours(build: HumanHeadBuild, head: Group) {
  const { THREE, geometry, glow } = build
  const marks = new THREE.Mesh(
    geometry(THREE, 'manga:mizaistom-face-contours', () => {
      const parts = []
      for (const side of [-1, 1]) {
        parts.push(
          new THREE.PlaneGeometry(0.002, 0.064)
            .rotateZ(side * 0.09)
            .translate(side * 0.018, -0.035, 0.185),
        )
        parts.push(
          new THREE.PlaneGeometry(0.025, 0.002)
            .rotateZ(side * 0.28)
            .translate(side * 0.014, -0.071, 0.185),
        )
        parts.push(
          new THREE.PlaneGeometry(0.042, 0.003)
            .rotateZ(side * -0.2)
            .translate(side * 0.021, -0.104, 0.172),
        )
      }
      parts.push(new THREE.PlaneGeometry(0.053, 0.003).translate(0, -0.134, 0.155))
      return mergeHumanDetails(parts)
    }),
    glow(0x655448, 0.7),
  )
  marks.name = 'mizaistom-face-contours'
  head.add(marks)
}
