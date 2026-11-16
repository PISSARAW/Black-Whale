import type { BackgroundSpectator, StageBackgroundDefinition } from './stageBackgroundTypes'

export type BackgroundPoint = readonly [number, number, number]
export type BackgroundMedium = 'poster' | 'portrait' | 'graffiti' | 'floor-mark' | 'monitor'
export type BackgroundEvent =
  | 'porthole-shadow'
  | 'distant-boat'
  | 'cat-prowl'
  | 'projector'
  | 'door-eyes'
  | 'aquarium'
  | 'bird'
  | 'chandelier'
  | 'clock'
  | 'paper-drift'
  | 'music-box'
  | 'mobile'
  | 'chess'
  | 'tea'
  | 'cargo-lid'
  | 'memorial-lights'
  | 'wind-bell'
  | 'spring-gauge'
  | 'lab-bubbles'
  | 'flower-door'
  | 'toy-box'
export interface CameoPlacement {
  actor: number
  at: BackgroundPoint
  scale?: number
  heading?: number
  tilt?: number
  pose?: BackgroundSpectator['pose']
}
export type BackgroundElement =
  | { kind: 'cameo'; people: readonly CameoPlacement[] }
  | { kind: 'art'; medium: BackgroundMedium; at: BackgroundPoint; size: number; tilt?: number }
  | {
      kind: 'object'
      object: StageBackgroundDefinition['secret']['motif']
      at: BackgroundPoint
      size?: number
      motion?: 'still' | 'rock' | 'spin' | 'roll' | 'drift'
      support?: 'crate' | 'table' | 'shelf'
    }
  | {
      kind: 'event'
      event: BackgroundEvent
      at: BackgroundPoint
      size?: number
      trigger?: 'loop' | 'impact' | 'finish'
      period?: number
    }

export interface BackgroundFrame {
  seconds: number
  excitement: number
  finished: boolean
  reducedMotion: boolean
}
export type BackgroundScene = readonly BackgroundElement[]

export function cameo(...people: CameoPlacement[]): BackgroundElement {
  return { kind: 'cameo', people }
}
export function art(medium: BackgroundMedium, at: BackgroundPoint, size = 1): BackgroundElement {
  return { kind: 'art', medium, at, size }
}
export function object(
  object: Extract<BackgroundElement, { kind: 'object' }>['object'],
  at: BackgroundPoint,
  options: Omit<Extract<BackgroundElement, { kind: 'object' }>, 'kind' | 'object' | 'at'> = {},
): BackgroundElement {
  return { kind: 'object', object, at, ...options }
}
export function event(
  event: BackgroundEvent,
  at: BackgroundPoint,
  options: Omit<Extract<BackgroundElement, { kind: 'event' }>, 'kind' | 'event' | 'at'> = {},
): BackgroundElement {
  return { kind: 'event', event, at, ...options }
}
