import type * as Three from 'three'
import type { Structure } from './types'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { CARVED, STONE, pleatedCloth, rosette, scroll } from './banquetOrnaments'
import { dressBanquetColumn } from './banquetArchitecture'

interface StageContext {
  THREE: typeof Three
  into: BanquetDetailBuilder
  structures: readonly Structure[]
  floor: number
}

function performanceCurtain({ THREE, into, structures, floor }: StageContext): void {
  const curtain = structures.find(({ id }) => id === 'tier-1-banquet-hall-curtain')
  if (!curtain) return
  const [x, z] = curtain.at
  const width = Math.max(...curtain.size)
  pleatedCloth({
    THREE,
    into,
    at: [x, floor + curtain.base, z - 0.24],
    width,
    height: curtain.height,
    colour: 0xcac5b7,
    facing: -1,
  })
  // The stage's scalloped upper drape and the row of small lighting heads,
  // visible in ch. 383, complement the earlier room's architectural shell.
  pleatedCloth({
    THREE,
    into,
    at: [x, floor + curtain.base + curtain.height - 1.35, z - 0.55],
    width,
    height: 1.35,
    colour: 0xaaa18b,
    facing: -1,
    swag: true,
  })
  into.box([width, 0.1, 0.12], {
    at: [x, floor + curtain.base + curtain.height - 1.45, z - 0.5],
    colour: CARVED,
  })
  for (let light = 0; light < 12; light++) {
    into.box([0.13, 0.17, 0.22], {
      at: [
        x - width / 2 + 0.5 + (light * (width - 1)) / 11,
        floor + curtain.base + curtain.height - 1.57,
        z - 0.52,
      ],
      colour: 0x57564f,
    })
  }
}

function stageFront({ into, structures, floor }: StageContext): void {
  const stage = structures.find(({ id }) => id === 'tier-1-banquet-hall-stage')
  if (!stage) return
  const [x, z] = stage.at
  const width = Math.max(...stage.size),
    depth = Math.min(...stage.size)
  const front = z - depth / 2
  into.box([width + 0.04, 0.055, depth], {
    at: [x, floor + stage.height + 0.0275, z],
    colour: 0x746957,
  })
  for (const offset of [0.08, 0.25]) {
    into.box([width + 0.06, 0.07, 0.075], {
      at: [x, floor + stage.height - offset, front - 0.025],
      colour: STONE,
    })
  }
}

function proscenium({ into, structures, floor }: StageContext): void {
  for (const pier of structures.filter(({ id }) => id.includes('-proscenium-'))) {
    const [x, z] = pier.at
    const width = Math.max(...pier.size),
      depth = Math.min(...pier.size)
    const front = z - depth / 2 - 0.03
    into.box([width - 0.3, pier.height - 1, 0.08], {
      at: [x, floor + pier.height / 2, front],
      colour: STONE,
    })
    for (const side of [-1, 1]) {
      into.box([0.11, pier.height - 0.7, 0.13], {
        at: [x + side * (width / 2 - 0.25), floor + pier.height / 2, front - 0.05],
        colour: CARVED,
      })
    }
    for (let row = 0; row < 5; row++) {
      // Relief faces into the hall, along -Z at this end.
      scroll(into, {
        at: [x, floor + 1.1 + row * 1.45, front - 0.14],
        size: 0.36,
        mirror: row % 2 ? -1 : 1,
      })
    }
  }
}

export function dressBanquetStage(context: StageContext): void {
  performanceCurtain(context)
  stageFront(context)
  proscenium(context)
}

/** The king's curtained bay and carved balcony remain at the opposite end. */
export function dressRoyalPlatform({ THREE, into, structures, floor }: StageContext): void {
  for (const pillar of structures.filter(({ id }) => id.includes('-royal-column-'))) {
    dressBanquetColumn(into, [pillar.at[0], floor + pillar.base, pillar.at[1]], pillar.height)
  }
  const backdrop = structures.find(({ id }) => id === 'tier-1-banquet-hall-royal-drape')
  if (backdrop) {
    pleatedCloth({
      THREE,
      into,
      at: [backdrop.at[0], floor + backdrop.base, backdrop.at[1] + 0.2],
      width: Math.max(...backdrop.size),
      height: backdrop.height,
      colour: 0xaaa18e,
      facing: 1,
    })
  }
  const parapet = structures.find(({ id }) => id === 'tier-1-banquet-hall-throne-parapet')
  if (!parapet) return
  const width = Math.max(...parapet.size)
  const [x, z] = parapet.at
  const top = floor + parapet.base + parapet.height
  into.box([width + 0.08, 0.1, 0.23], { at: [x, top + 0.05, z], colour: CARVED })
  into.box([width, parapet.height - 0.22, 0.06], {
    at: [x, top - parapet.height / 2, z + 0.12],
    colour: STONE,
  })
  for (const offset of [-width / 3, 0, width / 3]) {
    const px = x + offset
    for (const side of [-1, 1]) {
      into.box([0.055, parapet.height - 0.25, 0.045], {
        at: [px + ((side * width) / 6) * 0.84, top - parapet.height / 2, z + 0.17],
        colour: CARVED,
      })
      scroll(into, { at: [px + side * 0.22, top - 0.48, z + 0.21], size: 0.19, mirror: side })
    }
    rosette(into, [px, top - 0.48, z + 0.22], 0.13)
  }
  into.curve(
    [
      [-0.7, 0, 0],
      [-0.45, -0.46, 0.07],
      [0, -0.62, 0.09],
      [0.45, -0.46, 0.07],
      [0.7, 0, 0],
    ],
    0.1,
    { at: [x, top - 0.04, z + 0.27], colour: 0xd9d0b8 },
  )
}
