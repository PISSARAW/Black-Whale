import type * as Three from 'three'
import { CasinoFixture } from './casinoFixture'
import { labelSwampBall } from './casinoLettering'

const IVORY = 0xd6d1bd
const GOLD = 0xb69a60
const DARK = 0x282a28
const RED = 0x773c42
const GLASS = 0x6d8b85

/** Tall cabinets with rounded crowns, inset game faces and projecting controls, ch. 420. */
export function dressCasinoMachine(THREE: typeof Three, model: CasinoFixture): void {
  model.box([0.92, 0.07, 0.94], [0, 0.035, 0], DARK)
  model.box([0.74, 0.33, 0.7], [0, 0.225, 0.02], IVORY)
  model.box([0.88, 0.075, 0.9], [0, 0.42, 0], GOLD)
  model.box([0.9, 0.42, 0.58], [0, 0.66, 0.13], RED)
  model.box([0.71, 0.31, 0.025], [0, 0.66, -0.171], DARK)
  model.box([0.61, 0.25, 0.027], [0, 0.66, -0.188], GLASS)
  // Three reel windows, without inventing a game name or a winning sequence.
  for (const x of [-0.21, 0, 0.21]) {
    model.box([0.17, 0.16, 0.015], [x, 0.66, -0.21], IVORY)
    model.ring({ radius: 0.052, tube: 0.007, at: [x, 0.66, -0.223], colour: GOLD, vertical: true })
  }
  model.box([0.9, 0.04, 0.32], [0, 0.46, -0.32], DARK)
  for (const x of [-0.25, 0.12, 0.28]) model.ball([x, 0.49, -0.34], 0.025, GOLD)
  model.box([0.35, 0.04, 0.05], [0, 0.25, -0.34], DARK)
  model.add(
    new THREE.SphereGeometry(0.45, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.27, 0.65),
    {
      at: [0, 0.87, 0.13],
      colour: GOLD,
    },
  )
  model.box([0.67, 0.06, 0.025], [0, 0.89, -0.17], IVORY)
}

/** An original geometric rendering of the three stacked dishes and pachinko face. */
export function dressSwampBall(THREE: typeof Three, model: CasinoFixture): void {
  model.drum({ radius: 0.43, height: 0.08, at: [0, 0.04, 0], colour: DARK })
  model.drum({ radius: 0.39, height: 0.3, at: [0, 0.23, 0], colour: IVORY })
  for (let index = 0; index < 12; index++) {
    const a = (index * Math.PI) / 6
    model.add(new THREE.BoxGeometry(0.025, 0.22, 0.075), {
      at: [Math.sin(a) * 0.395, 0.23, Math.cos(a) * 0.395],
      colour: GOLD,
      rotation: [0, a, 0],
    })
  }
  model.box([0.86, 0.5, 0.12], [0, 0.62, 0.25], RED)
  model.box([0.72, 0.42, 0.025], [0, 0.62, 0.177], DARK)
  model.ring({ radius: 0.19, tube: 0.017, at: [0, 0.64, 0.15], colour: GOLD, vertical: true })
  // The pin field is geometry, never a reproduction of the printed illustration.
  for (let row = 0; row < 5; row++) {
    for (let pin = 0; pin < 6; pin++) {
      model.ball([(pin - 2.5) * 0.09 + (row % 2) * 0.025, 0.5 + row * 0.055, 0.15], 0.007, IVORY)
    }
  }
  for (let tier = 0; tier < 3; tier++) {
    const radius = 0.32 - tier * 0.045
    const y = 0.4 + tier * 0.11
    model.drum({ radius, bottom: radius - 0.045, height: 0.025, at: [0, y, -0.1], colour: GOLD })
    model.drum({ radius: radius - 0.025, height: 0.006, at: [0, y + 0.015, -0.1], colour: DARK })
    model.ring({ radius, tube: 0.012, at: [0, y + 0.025, -0.1], colour: IVORY })
    model.ball([0.09, y + 0.03, -0.12], 0.012, IVORY)
  }
  for (const side of [-1, 1]) {
    model.box([0.035, 0.53, 0.04], [side * 0.41, 0.64, 0.25], GOLD)
    model.ball([side * 0.41, 0.93, 0.25], 0.035, IVORY)
  }
  model.add(
    new THREE.SphereGeometry(0.43, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.25, 0.3),
    {
      at: [0, 0.88, 0.25],
      colour: GOLD,
    },
  )
  model.box([0.7, 0.055, 0.03], [0, 0.9, 0.1], IVORY)
  labelSwampBall(model)
  model.box([0.82, 0.045, 0.2], [0, 0.35, -0.35], DARK)
  model.ball([0.31, 0.4, -0.36], 0.032, GOLD)
}

export function dressCasinoSeat(model: CasinoFixture): void {
  model.box([0.84, 0.18, 0.81], [0, 0.36, 0], RED)
  model.box([0.84, 0.5, 0.18], [0, 0.72, 0.31], RED)
  for (const side of [-1, 1]) {
    model.box([0.15, 0.22, 0.8], [side * 0.41, 0.56, 0], RED)
    for (const z of [-0.3, 0.3]) model.box([0.08, 0.27, 0.08], [side * 0.34, 0.135, z], GOLD)
  }
}

export function dressCasinoLoungeTable(model: CasinoFixture): void {
  model.box([0.98, 0.12, 0.98], [0, 0.93, 0], DARK)
  for (const x of [-0.36, 0.36]) {
    for (const z of [-0.36, 0.36]) model.box([0.065, 0.86, 0.065], [x, 0.43, z], GOLD)
  }
}
