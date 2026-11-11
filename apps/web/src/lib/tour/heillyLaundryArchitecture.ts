import type { BanquetDetailBuilder, Point3 } from './banquetDetailBuilder'
import type { Space, Structure } from './types'
import { CHROME, STEEL_BRUSHED, STEEL_DARK } from './heillyHideoutDetailSurface'

export interface LaundryContext {
  into: BanquetDetailBuilder
  floor: number
  ceilingHeight: number
  space: Space
  structures: Structure[]
}

interface DisposalScene {
  into: BanquetDetailBuilder
  floor: number
}

const ENAMEL = 0xd8d7cc
const PANEL = 0x777a79
const PANEL_DARK = 0x34383a
const FLOOR_SEAM = 0x555a59
const CLOTH = 0xc8c5b7
const CLOTH_DARK = 0x77746b
const BAG = 0x8e8b7d
const SKIN = 0xb49a82
const WORKWEAR = 0x6d706b
const WASTE = 0x5a554b

function floorGrid(scene: DisposalScene): void {
  const { into, floor } = scene
  for (let x = -17.9; x <= -8.4; x += 1.05) {
    into.box([0.018, 0.012, 7.55], { at: [x, floor + 0.008, 3.68], colour: FLOOR_SEAM })
  }
  for (let z = 0.2; z <= 7.25; z += 0.92) {
    into.box([9.95, 0.012, 0.018], { at: [-13.14, floor + 0.009, z], colour: FLOOR_SEAM })
  }
}

function tableLeg(scene: DisposalScene, at: Point3): void {
  scene.into.cylinder(
    { radius: 0.055, height: 0.78, sides: 10 },
    { at: [at[0], scene.floor + 0.39, at[2]], colour: STEEL_DARK },
  )
  scene.into.cylinder(
    { radius: 0.08, height: 0.035, sides: 12 },
    {
      at: [at[0], scene.floor + 0.045, at[2]],
      rotation: [Math.PI / 2, 0, 0],
      colour: PANEL_DARK,
    },
  )
}

function bodyOnTray(scene: DisposalScene): void {
  const { into, floor } = scene
  const y = floor + 1.02
  into.sphere([0.25, 0.22, 0.27], { at: [-13.12, y + 0.18, 4.15], colour: SKIN })
  into.box([0.68, 0.24, 0.72], {
    at: [-13.12, y, 3.64],
    rotation: [0, -0.06, 0],
    colour: WORKWEAR,
  })
  into.box([0.56, 0.22, 0.38], { at: [-13.1, y - 0.01, 3.12], colour: WORKWEAR })
  for (const x of [-13.34, -12.86]) {
    into.cylinder(
      { radius: 0.115, height: 0.72, sides: 10 },
      { at: [x, y - 0.02, 2.73], rotation: [Math.PI / 2, 0, 0], colour: WORKWEAR },
    )
    into.box([0.24, 0.16, 0.24], { at: [x, y - 0.03, 2.32], colour: PANEL_DARK })
  }
  into.cylinder(
    { radius: 0.1, height: 0.78, sides: 10 },
    {
      at: [-13.58, y + 0.02, 3.62],
      rotation: [Math.PI / 2, 0, -0.62],
      colour: WORKWEAR,
    },
  )
  into.cylinder(
    { radius: 0.1, height: 0.74, sides: 10 },
    {
      at: [-12.62, y + 0.02, 3.67],
      rotation: [Math.PI / 2, 0, 0.48],
      colour: WORKWEAR,
    },
  )
}

function disposalTable(scene: DisposalScene): void {
  const { into, floor } = scene
  const x = -13.12
  const z = 3.3
  into.box([4.35, 0.13, 1.7], { at: [x, floor + 0.87, z], colour: STEEL_BRUSHED })
  into.box([4.05, 0.035, 1.4], { at: [x, floor + 0.95, z], colour: PANEL_DARK })
  for (const edgeZ of [z - 0.82, z + 0.82]) {
    into.box([4.35, 0.09, 0.07], { at: [x, floor + 0.99, edgeZ], colour: CHROME })
  }
  for (const edgeX of [x - 2.13, x + 2.13]) {
    into.box([0.07, 0.09, 1.7], { at: [edgeX, floor + 0.99, z], colour: CHROME })
  }
  into.box([3.8, 0.035, 1.26], { at: [x, floor + 0.24, z], colour: STEEL_DARK })
  for (const legX of [x - 1.88, x + 1.88]) {
    for (const legZ of [z - 0.62, z + 0.62]) tableLeg(scene, [legX, 0, legZ])
  }
  bodyOnTray(scene)
}

function coldCabinet(scene: DisposalScene): void {
  const { into, floor } = scene
  into.box([0.72, 2.5, 1.85], { at: [-17.95, floor + 1.25, 2.32], colour: ENAMEL })
  for (const z of [1.87, 2.78]) {
    into.box([0.035, 2.3, 0.84], { at: [-17.57, floor + 1.27, z], colour: PANEL })
    into.box([0.045, 0.34, 0.04], {
      at: [-17.53, floor + 1.25, z + 0.29],
      colour: STEEL_DARK,
    })
  }
}

function privacyScreen(scene: DisposalScene): void {
  const { into, floor } = scene
  into.box([2.45, 1.5, 0.07], { at: [-16.1, floor + 1.47, 1.05], colour: ENAMEL })
  for (const x of [-17.28, -14.92]) {
    into.cylinder(
      { radius: 0.035, height: 1.95, sides: 8 },
      { at: [x, floor + 0.98, 1.05], colour: STEEL_DARK },
    )
    into.box([0.55, 0.05, 0.06], { at: [x, floor + 0.06, 1.05], colour: STEEL_DARK })
    for (const wheelX of [x - 0.23, x + 0.23]) {
      into.sphere([0.07, 0.07, 0.05], {
        at: [wheelX, floor + 0.06, 1.05],
        colour: PANEL_DARK,
      })
    }
  }
}

function hangingLaundry(scene: DisposalScene): void {
  const { into, floor } = scene
  into.cylinder(
    { radius: 0.035, height: 4.7, sides: 8 },
    {
      at: [-15.55, floor + 3.28, 7.16],
      rotation: [0, 0, Math.PI / 2],
      colour: STEEL_DARK,
    },
  )
  const pieces = [
    [-17.55, 0.65, 1.1],
    [-16.72, 0.82, 1.42],
    [-15.73, 0.72, 0.92],
    [-14.86, 0.66, 1.28],
    [-14.04, 0.58, 0.8],
  ] as const
  for (let index = 0; index < pieces.length; index += 1) {
    const [x, width, height] = pieces[index]
    into.box([width, height, 0.045], {
      at: [x, floor + 3.15 - height / 2, 7.1],
      colour: index % 2 === 0 ? CLOTH : CLOTH_DARK,
    })
  }
}

function consolePanel(scene: DisposalScene): void {
  const { into, floor } = scene
  into.box([2.45, 2.7, 0.62], { at: [-12.85, floor + 1.35, 7.18], colour: PANEL })
  into.box([2.16, 0.82, 0.08], { at: [-12.85, floor + 1.28, 6.83], colour: ENAMEL })
  into.box([1.2, 0.74, 0.08], { at: [-12.85, floor + 2.25, 6.83], colour: PANEL_DARK })
  for (const x of [-13.65, -13.28, -12.91, -12.54, -12.17]) {
    into.box([0.2, 0.13, 0.035], {
      at: [x, floor + 1.48, 6.77],
      colour: x === -12.91 ? 0x8d3f38 : STEEL_DARK,
    })
  }
  for (const y of [0.48, 0.78, 1.08]) {
    into.box([0.72, 0.18, 0.045], {
      at: [-13.48, floor + y, 6.76],
      colour: PANEL_DARK,
    })
  }
  into.box([0.62, 1.05, 0.54], { at: [-10.95, floor + 1.68, 7.2], colour: ENAMEL })
  into.box([0.46, 0.38, 0.05], { at: [-10.95, floor + 1.84, 6.9], colour: PANEL_DARK })
}

function tank(scene: DisposalScene, z: number): void {
  const { into, floor } = scene
  into.cylinder(
    { radius: 0.53, height: 1.45, sides: 18 },
    { at: [-8.55, floor + 2.78, z], colour: STEEL_BRUSHED },
  )
  for (const y of [2.13, 3.43]) {
    into.ring(
      { radius: 0.53, tube: 0.035 },
      { at: [-8.55, floor + y, z], rotation: [Math.PI / 2, 0, 0], colour: STEEL_DARK },
    )
  }
  into.box([0.13, 0.42, 0.11], { at: [-9.1, floor + 2.72, z], colour: PANEL_DARK })
}

function tiedBag(scene: DisposalScene, at: Point3, dark = false): void {
  const { into, floor } = scene
  into.sphere([0.52, 0.4, 0.38], {
    at: [at[0], floor + at[1], at[2]],
    colour: dark ? WASTE : BAG,
  })
  into.cylinder(
    { radius: 0.07, height: 0.18, bottom: 0.12, sides: 8 },
    { at: [at[0], floor + at[1] + 0.42, at[2]], colour: dark ? WASTE : BAG },
  )
}

function tankAndBagRack(scene: DisposalScene): void {
  const { into, floor } = scene
  for (const z of [3.45, 4.8, 6.15]) tank(scene, z)
  for (const y of [0.78, 1.65]) {
    into.box([0.12, 0.1, 4.55], { at: [-8.72, floor + y, 4.8], colour: STEEL_DARK })
  }
  for (const z of [3.15, 4.2, 5.25, 6.3]) tiedBag(scene, [-8.85, 1.16, z])
  for (const z of [3.5, 4.6, 5.7]) tiedBag(scene, [-8.86, 0.42, z], true)
}

function wastePile(scene: DisposalScene): void {
  const positions = [
    [-9.05, 0.44, 0.85],
    [-8.62, 0.46, 1.4],
    [-9.32, 0.43, 1.65],
    [-8.7, 0.45, 2],
    [-9.55, 0.42, 2.25],
    [-8.45, 0.44, 2.45],
  ] as const
  for (const at of positions) tiedBag(scene, at, true)
}

function serviceCart(scene: DisposalScene): void {
  const { into, floor } = scene
  into.box([1.25, 0.08, 0.72], { at: [-16.62, floor + 0.72, 4.55], colour: STEEL_BRUSHED })
  into.box([1.15, 0.04, 0.65], { at: [-16.62, floor + 0.25, 4.55], colour: STEEL_DARK })
  for (const x of [-17.1, -16.14]) {
    for (const z of [4.29, 4.81]) {
      into.cylinder(
        { radius: 0.035, height: 0.68, sides: 8 },
        { at: [x, floor + 0.36, z], colour: STEEL_DARK },
      )
    }
  }
  tiedBag(scene, [-16.62, 1.05, 4.55])
}

/** Chapter 394 disposal room: a body-processing workspace, not a laundromat. */
export function dressHeillyLaundryArchitecture(context: LaundryContext): void {
  const scene = { into: context.into, floor: context.floor }
  floorGrid(scene)
  disposalTable(scene)
  coldCabinet(scene)
  privacyScreen(scene)
  hangingLaundry(scene)
  consolePanel(scene)
  tankAndBagRack(scene)
  wastePile(scene)
  serviceCart(scene)
}
