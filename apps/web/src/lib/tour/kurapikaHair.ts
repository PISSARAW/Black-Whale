import type { Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { mergeHumanDetails } from './humanDetailGeometry'
import { kurapikaLock, type HairLock } from './kurapikaGeometry'

function fringe(): HairLock[] {
  return Array.from({ length: 15 }, (_, index) => {
    const x = (index - 7) * 0.019
    const tipY = 0.025 + (index % 3) * 0.013 + Math.abs(x) * 0.03
    return {
      width: 0.019,
      depth: 0.008,
      points: [
        [x * 0.28 - 0.018, 0.225, 0.015],
        [x * 0.7 - 0.014, 0.178, 0.112],
        [x, 0.098, 0.143],
        [x + 0.009, tipY, 0.142 - Math.abs(x) * 0.1],
      ],
    }
  })
}

function sidesAndBack(): HairLock[] {
  const locks: HairLock[] = []
  for (const side of [-1, 1]) {
    for (let index = 0; index < 8; index++) {
      const angle = (index / 7) * Math.PI * 0.82
      const x = side * (0.155 * Math.cos(angle * 0.45))
      const z = 0.082 - Math.sin(angle * 0.6) * 0.22
      const tip = -0.11 - (index % 3) * 0.023
      locks.push({
        width: 0.026,
        depth: 0.012,
        points: [
          [x * 0.5, 0.203, z * 0.55],
          [x, 0.105, z],
          [x * 1.09, -0.026, z + 0.008],
          [x * (index === 1 ? 1.28 : 1.01), tip, z + 0.018],
        ],
      })
    }
  }
  return locks
}

/** The bob is a volume of separate pointed locks, with a broken, swept fringe. */
export function addKurapikaHair(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, outlined, materials } = build
  const locks = [...sidesAndBack(), ...fringe()]
  const hair = outlined({
    THREE,
    geometry: geometry(THREE, 'kurapika:layered-bob', () =>
      mergeHumanDetails([
        new THREE.SphereGeometry(0.174, 28, 12, 0, Math.PI * 2, 0, 1.06)
          .scale(1, 1.2, 0.86)
          .translate(0, 0.026, -0.008),
        backShell(THREE),
        ...locks.map((lock) => kurapikaLock(THREE, lock)),
      ]),
    ),
    material: materials.hairInk,
    ink: materials.ink,
    scale: 1.015,
  })
  hair.name = 'kurapika-layered-bob'
  head.add(hair)
}

function backShell(THREE: HumanHeadBuild['THREE']) {
  const shell = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.13, -0.14),
      new THREE.Vector2(0.158, -0.07),
      new THREE.Vector2(0.166, 0.02),
      new THREE.Vector2(0.159, 0.105),
      new THREE.Vector2(0.12, 0.17),
    ],
    48,
    0.85,
    Math.PI * 2 - 1.7,
  ).scale(1, 1, 0.8)
  const positions = shell.getAttribute('position')
  for (let index = 0; index < positions.count; index++) {
    const y = positions.getY(index)
    const angle = Math.atan2(positions.getZ(index), positions.getX(index))
    if (y < -0.1) positions.setY(index, y + Math.sin(angle * 14) * 0.012)
  }
  shell.computeVertexNormals()
  return shell
}
