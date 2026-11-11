import type * as Three from 'three'
import type { Structure } from './types'
import { CasinoFixture } from './casinoFixture'
import {
  SCREENING_STONE,
  SCREENING_GOLD_LEAF,
  SCREENING_CURTAIN_CRIMSON,
  SCREENING_CURTAIN_DARK,
  SCREENING_SCREEN_WHITE,
  SCREENING_SCREEN_FRAME,
  SCREENING_STAGE_FLOOR,
  type ScreeningRoomSurface,
} from './screeningRoomDetailSurface'
import { screeningProscenium } from './screeningRoomOrnaments'
import { dressScreeningDiagram } from './screeningRoomDiagram'

interface StageContext {
  THREE: typeof Three
  surface: ScreeningRoomSurface
  floor: number
  structures: Structure[]
}

function platform(model: CasinoFixture): void {
  model.box([1, 0.94, 1], [0, 0.47, 0], SCREENING_STAGE_FLOOR)
  model.box([1, 0.06, 1], [0, 0.97, 0], SCREENING_STONE)
}

function curtain(model: CasinoFixture): void {
  // The supplied panel has a pleated backdrop and a shorter pleated valance,
  // rather than side curtains tied back around a blank opening.
  model.box([0.18, 0.98, 0.98], [-0.3, 0.5, 0], SCREENING_CURTAIN_DARK)
  for (let fold = 0; fold < 80; fold++) {
    const z = -0.488 + ((fold + 0.5) * 0.976) / 80
    model.box(
      [0.32, 0.98, 0.009],
      [fold % 2 ? 0 : -0.1, 0.5, z],
      fold % 2 ? SCREENING_CURTAIN_CRIMSON : SCREENING_CURTAIN_DARK,
    )
    const drop = 0.23 + 0.02 * Math.cos((fold * Math.PI) / 8)
    model.box(
      [0.3, drop, 0.011],
      [0.28, 0.99 - drop / 2, z],
      fold % 2 ? SCREENING_CURTAIN_CRIMSON : SCREENING_CURTAIN_DARK,
    )
    model.box([0.33, 0.006, 0.011], [0.28, 0.99 - drop, z], SCREENING_GOLD_LEAF)
  }
}

function screen(model: CasinoFixture, THREE: typeof Three): void {
  model.box([0.7, 1, 1], [0, 0.5, 0], SCREENING_SCREEN_FRAME)
  model.box([0.05, 0.94, 0.94], [0.38, 0.5, 0], SCREENING_SCREEN_WHITE)
  dressScreeningDiagram(THREE, model)
}

function pier(model: CasinoFixture): void {
  model.box([0.88, 0.98, 0.88], [0, 0.5, 0], SCREENING_STONE)
  for (const y of [0.04, 0.12, 0.55, 0.91, 0.97])
    model.box([0.98, 0.035, 0.98], [0, y, 0], SCREENING_GOLD_LEAF)
  for (const z of [-0.32, -0.16, 0, 0.16, 0.32])
    model.box([0.035, 0.7, 0.025], [0.46, 0.51, z], SCREENING_GOLD_LEAF)
}

export function dressScreeningRoomStage(context: StageContext): void {
  const { THREE, surface, floor, structures } = context
  for (const s of structures) {
    const model = new CasinoFixture(THREE, surface.into, { structure: s, floor })
    if (s.id.endsWith('-stage') || s.id.includes('-stage-stair-')) platform(model)
    if (s.id.endsWith('-curtain')) curtain(model)
    if (s.id.endsWith('-screen')) screen(model, THREE)
    if (s.id.includes('-proscenium-')) pier(model)
  }
  screeningProscenium({ surface, floor, structures })
}
