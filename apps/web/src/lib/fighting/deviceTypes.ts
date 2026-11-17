import type { FighterId, FightSide } from './types'

export type PhysicalDeviceKind = 'camera' | 'firearm' | 'transmitter' | 'receiver'
export type BiohazardDeviceForm = 'cat' | 'snake' | 'oyster'
export interface RecordedBody {
  projection?: boolean
  frame: number
  subject: FightSide
  appearance: FighterId
  x: number
  y: number
}
export interface RecordedSpeech {
  projection?: boolean
  sampleId?: number
  frame: number
  subject: FightSide
  appearance: FighterId
  text: string
  bodyKey?: string
  /** Simulation of a recorded behavioural cue; raw playback must never disclose it. */
  deliberateLie?: boolean
  visibleBody?: boolean
}
export interface PhysicalDevice {
  kind: PhysicalDeviceKind
  carrier?: FightSide
  carrierMember?: number
  hand?: import('./deviceHands').DeviceHand
  swallowed?: boolean
  depositedAt?: number
  ammunition?: number
  batteryFrames: number
  facing?: -1 | 1
  recording?: boolean
  speechSerial?: number
  pictures?: readonly RecordedBody[]
  words?: readonly RecordedSpeech[]
  channel?: string
  form?: {
    kind: BiohazardDeviceForm
    owner: FightSide
    remainingFrames: number
    sourceMoveId: string
    targetX?: number
  }
  transforming?: { owner: FightSide; frames: number; originX: number }
}
export interface DevicePlayback {
  deviceId: string
  viewedAt: number
  pictures: readonly RecordedBody[]
  words: readonly Omit<RecordedSpeech, 'deliberateLie'>[]
}
export interface ReceiverReading {
  frame: number
  transmitterId: string
  x: number
  y: number
}

/** The oyster estimate is two real simulated hours; other values are explicit scenario tuning. */
export const OYSTER_AURA_FRAMES = 2 * 60 * 60 * 60
export const DEVICE_BATTERY_FRAMES = 4 * 60 * 60 * 60
export const DEVICE_FORM_FRAMES = 10 * 60 * 60
export const DEVICE_TRANSFORM_FRAMES = 18
export const DEVICE_TOUCH_RANGE = 3
export const DEVICE_TRANSFORM_COST = 20
export const DEVICE_CAMERA_RANGE = 28
export const DEVICE_MEMORY_LIMIT = 480

declare module './types' {
  interface FightProjectile {
    /** Only the actual muzzle is ignored during initial release; a returned bullet may hit it. */
    deviceOrigin?: { id: string; owner: FightSide }
  }
}
