import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import type { CineplexFormat } from './cineplexFormats'
import {
  CINE_SCREEN_BORDER,
  CINE_SCREEN_GLOW,
  CINE_SPEAKER_BLACK,
  CINE_STEEL,
} from './cineplexDetailSurface'

export interface AuditoriumTechContext {
  into: BanquetDetailBuilder
  centerX: number
  floor: number
  format: CineplexFormat
}

function dressSideProjection(context: AuditoriumTechContext): void {
  const { into, centerX, floor, format } = context
  if (!format.sideProjection) return
  for (const side of [-1, 1]) {
    into.box([0.045, 2.45, 13.4], {
      at: [centerX + side * 3.31, floor + 2.25, 29.1],
      colour: CINE_SCREEN_GLOW,
      glow: true,
    })
    for (const z of [23.2, 26.2, 29.2, 32.2, 35.2]) {
      into.box([0.06, 2.55, 0.045], {
        at: [centerX + side * 3.28, floor + 2.25, z],
        colour: CINE_SCREEN_BORDER,
      })
    }
  }
}

function dressEnvironmentalRig(context: AuditoriumTechContext): void {
  const { into, centerX, floor, format } = context
  if (!format.environmentalEffects) return
  for (const side of [-1, 1]) {
    const x = centerX + side * 2.9
    for (const z of [24.2, 29.4, 34.0]) {
      into.cylinder(
        { radius: 0.24, height: 0.16, sides: 12 },
        {
          at: [x, floor + 3.5, z],
          rotation: [0, 0, Math.PI / 2],
          colour: CINE_STEEL,
        },
      )
      into.ring(
        { radius: 0.15, tube: 0.025 },
        {
          at: [x - side * 0.1, floor + 3.5, z],
          rotation: [0, Math.PI / 2, 0],
          colour: format.accent,
        },
      )
    }
  }
  for (const x of [centerX - 1.7, centerX, centerX + 1.7]) {
    into.cylinder(
      { radius: 0.07, height: 0.3, sides: 8 },
      { at: [x, floor + 4.7, 31.0], colour: CINE_STEEL },
    )
    into.box([0.22, 0.1, 0.22], {
      at: [x, floor + 4.52, 31.0],
      colour: 0xe8f4ff,
      glow: true,
    })
  }
}

function dressLightVibes(context: AuditoriumTechContext): void {
  const { into, centerX, floor, format } = context
  if (!format.lightVibes) return
  for (const side of [-1, 1]) {
    for (const z of [23.0, 26.2, 29.4, 32.6, 35.0]) {
      into.box([0.08, 1.3, 2.25], {
        at: [centerX + side * 3.27, floor + 2.35, z],
        colour: format.accent,
        glow: true,
      })
    }
  }
}

function dressAtmosArray(context: AuditoriumTechContext): void {
  const { into, centerX, floor } = context
  for (const x of [centerX - 2.1, centerX, centerX + 2.1]) {
    for (const z of [24.0, 29.0, 34.0]) {
      into.box([0.46, 0.16, 0.46], {
        at: [x, floor + 4.75, z],
        colour: CINE_SPEAKER_BLACK,
      })
    }
  }
}

function dressSeventyMillimetreBooth(context: AuditoriumTechContext): void {
  const { into, centerX, floor, format } = context
  if (format.screenKind !== 'imax') return
  for (const side of [-1, 1]) {
    into.cylinder(
      { radius: 0.48, height: 0.12, sides: 20 },
      {
        at: [centerX + side * 0.58, floor + 3.75, 17.78],
        rotation: [Math.PI / 2, 0, 0],
        colour: CINE_STEEL,
      },
    )
    into.cylinder(
      { radius: 0.12, height: 0.14, sides: 14 },
      {
        at: [centerX + side * 0.58, floor + 3.75, 17.7],
        rotation: [Math.PI / 2, 0, 0],
        colour: 0x151519,
      },
    )
  }
}

export function dressAuditoriumTechnology(context: AuditoriumTechContext): void {
  dressSideProjection(context)
  dressEnvironmentalRig(context)
  dressLightVibes(context)
  dressAtmosArray(context)
  dressSeventyMillimetreBooth(context)
}
