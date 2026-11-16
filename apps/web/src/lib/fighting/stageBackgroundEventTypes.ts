import type { BackgroundModelKit } from './stageBackgroundProps'
import type { BackgroundElement, BackgroundFrame } from './stageBackgroundSceneTypes'
export type EventDefinition = Extract<BackgroundElement, { kind: 'event' }>
export type EventMotion = (frame: BackgroundFrame) => void
export type EventBuilder = (p: BackgroundModelKit, definition: EventDefinition) => EventMotion
export function eventDrive(frame: BackgroundFrame, definition: EventDefinition): number {
  const triggers = {
    loop: () => (1 - Math.cos((frame.seconds * Math.PI * 2) / (definition.period ?? 12))) / 2,
    impact: () => frame.excitement,
    finish: () => Number(frame.finished),
  }
  return triggers[definition.trigger ?? 'loop']()
}
