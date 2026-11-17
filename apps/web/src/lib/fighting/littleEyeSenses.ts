import { advancePersonLittleEyeSenses, capturePersonLittleEyeSpeech } from './dolphinPeopleSenses'
import { changeDolphinBody, dolphinBody } from './dolphinBodies'
import { arsenalMindAvailable } from './arsenalMind'
import { sleepingBody } from './hanzoProjection'
import { visibleBodyAppearance } from './fightBodyIdentity'
import { gyoSight } from './nenPerception'
import { liveEntity } from './preparationWorld'
import type { LittleEyeScreen } from './littleEyeTypes'
import type { PreparedEntity } from './preparationTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** The subject's natural field of vision; arena distances are scenario tuning. */
export function animalSeesPoint(
  state: FightState,
  animal: PreparedEntity,
  point: { x: number; y: number },
): boolean {
  if ((point.x - animal.x) * (animal.littleEye?.facing ?? 1) < 0) return false
  if (Math.hypot(point.x - animal.x, point.y - animal.y) > 80) return false
  return !(state.battlefield?.entities ?? []).some((entry) => {
    if (!entry.arena || !liveEntity(entry)) return false
    const fraction = (entry.x - animal.x) / (point.x - animal.x)
    if (fraction <= 0 || fraction >= 1) return false
    const height = animal.y + 0.5 + (point.y + 4 - animal.y - 0.5) * fraction
    return height >= entry.y && height <= entry.y + entry.arena.height
  })
}
export function advanceLittleEyeSenses(state: FightState): FightState {
  if (state.pvpSeat) return state // The referee supplies private perception; clients cannot reconstruct it from redacted bodies.
  let next = advancePersonLittleEyeSenses(state)
  for (const animal of state.battlefield?.entities ?? []) {
    const body = sensoryUser(state, animal)
    if (!body) continue
    const control = animal.controller!
    next = changeDolphinBody(
      next,
      { owner: control.side, member: control.member ?? 0 },
      (actor) => ({
        ...actor,
        littleEyeScreen: {
          animal: animal.id,
          frame: state.frame,
          x: animal.x,
          y: animal.y,
          pictures: animalPictures(state, animal, gyoSight(body)),
          words: actor.littleEyeScreen?.animal === animal.id ? actor.littleEyeScreen.words : [],
        },
      }),
    )
  }
  return next
}
function sensoryUser(state: FightState, animal: PreparedEntity): ArcadeFighter | undefined {
  const control = animal.controller
  if (
    !control ||
    control.person ||
    control.source !== 'sayird' ||
    !liveEntity(animal) ||
    animal.sleepingFrames
  )
    return undefined
  const body = dolphinBody(state, { owner: control.side, member: control.member ?? 0 })
  return body && arsenalMindAvailable(body) ? body : undefined
}
export function animalPictures(
  state: FightState,
  animal: PreparedEntity,
  observerGyo: boolean,
): LittleEyeScreen['pictures'] {
  return (['player', 'opponent'] as const).flatMap((side) => {
    const actor = state[side]
    if (actor.clothCapture) return []
    const body = sleepingBody(actor)
    const pictures: LittleEyeScreen['pictures'][number][] = animalSeesPoint(state, animal, body)
      ? [
          {
            appearance: visibleBodyAppearance(actor),
            x: body.x,
            y: body.y,
            auraVisible: visibleAura(actor, observerGyo),
          },
        ]
      : []
    if (actor.hanzoProjection && animalSeesPoint(state, animal, actor))
      pictures.push({
        appearance: visibleBodyAppearance(actor),
        x: actor.x,
        y: actor.y,
        projection: true,
        auraVisible: true,
      })
    return pictures
  })
}
function visibleAura(actor: ArcadeFighter, observerGyo: boolean): boolean {
  return actor.nen.mode !== 'zetsu' && actor.aura > 0 && (!actor.nen.in || observerGyo)
}
export function captureLittleEyeSpeech(
  state: FightState,
  speech: { side: FightSide; text: string },
): FightState {
  if (state.pvpSeat) return state // The referee supplies private perception; clients cannot reconstruct it from redacted bodies.
  let next = capturePersonLittleEyeSpeech(state, speech)
  for (const animal of state.battlefield?.entities ?? []) {
    if (!sensoryUser(state, animal)) continue
    const speaker = state[speech.side]
    if (Math.hypot(speaker.x - animal.x, speaker.y - animal.y) > 18) continue
    const control = animal.controller!
    next = changeDolphinBody(next, { owner: control.side, member: control.member ?? 0 }, (body) => {
      const screen = body.littleEyeScreen
      return !screen || screen.animal !== animal.id
        ? body
        : {
            ...body,
            littleEyeScreen: {
              ...screen,
              words: [...screen.words, { frame: state.frame, text: speech.text }].slice(-4),
            },
          }
    })
  }
  return next
}
