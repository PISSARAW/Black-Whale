import { PrisonFixture, PRISON } from './prisonFixture'

/** The square plate, eight bolts, radial reinforcement and short chain of ch. 359. */
export function buildPrisonManacle(f: PrisonFixture): void {
  const {
    size: [depth, width],
    height,
  } = f.placement.structure
  f.box([depth * 0.3, height, width], [-depth * 0.33, height / 2, 0], PRISON.steel)
  for (const z of [-1, 0, 1]) {
    for (const y of [-1, 0, 1]) {
      if (!z && !y) continue
      f.add(new f.THREE.CylinderGeometry(0.035, 0.035, 0.025, 6), {
        at: [-depth * 0.12, height / 2 + y * height * 0.37, z * width * 0.37],
        colour: PRISON.dark,
        rotation: [0, 0, Math.PI / 2],
      })
    }
  }
  f.add(new f.THREE.CylinderGeometry(width * 0.2, width * 0.2, 0.065, 20), {
    at: [0, height / 2, 0],
    colour: PRISON.dark,
    rotation: [0, 0, Math.PI / 2],
  })
  for (let spoke = 0; spoke < 8; spoke++) {
    const angle = (spoke * Math.PI) / 4
    f.add(new f.THREE.BoxGeometry(0.035, height * 0.26, 0.05), {
      at: [
        -depth * 0.1,
        height / 2 + Math.cos(angle) * height * 0.23,
        Math.sin(angle) * width * 0.23,
      ],
      colour: PRISON.dark,
      rotation: [angle, 0, 0],
    })
  }
  for (let link = 0; link < 4; link++) {
    f.ring([depth * 0.15 + link * 0.043, height / 2 - link * 0.035, 0], {
      radius: 0.035,
      tube: 0.009,
      rotation: [((link % 2) * Math.PI) / 2, Math.PI / 2, 0],
    })
  }
  f.ring([depth * 0.15 + 0.17, height / 2 - 0.14, 0], {
    radius: 0.075,
    tube: 0.018,
    rotation: [0, Math.PI / 2, 0],
  })
}

/** Add the lower rail and collars to the same uprights the collision plan draws. */
export function buildPrisonGrille(f: PrisonFixture): void {
  const {
    size: [width, depth],
    height,
  } = f.placement.structure
  f.box([width, 0.09, depth], [0, 0.045, 0], PRISON.dark)
  for (const z of [-1, 1]) {
    f.box([width + 0.02, height, 0.07], [0, height / 2, z * (depth / 2 - 0.035)], PRISON.steel)
  }
}
