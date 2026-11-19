import { personDolphinAwake } from './dolphinPeopleState'
import { changeDolphinPerson } from './dolphinRecipients'
import { animalPictures } from './littleEyeSenses'
import { liveEntity } from './preparationWorld'
import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FightState } from './types'

function receivingPerson(state: FightState, animal: PreparedEntity) {
  if (!liveEntity(animal) || animal.sleepingFrames || animal.controller?.source !== 'sayird')
    return undefined
  const person = state.battlefield?.entities.find((entry) => entry.id === animal.controller?.person)
  return person && personDolphinAwake(state, person) ? person : undefined
}
export function advancePersonLittleEyeSenses(state: FightState): FightState {
  if (state.pvpSeat) return state
  let next = state
  for (const animal of state.battlefield?.entities ?? []) {
    const person = receivingPerson(state, animal)
    if (!person) continue
    const old = person.person!.littleEyeScreen
    next = changeDolphinPerson(next, person.id, {
      littleEyeScreen: {
        animal: animal.id,
        frame: state.frame,
        x: animal.x,
        y: animal.y,
        pictures: animalPictures(state, animal, false),
        words: old?.animal === animal.id ? old.words : [],
      },
    })
  }
  return next
}
export function capturePersonLittleEyeSpeech(
  state: FightState,
  speech: { side: FightSide; text: string },
): FightState {
  if (state.pvpSeat) return state
  let next = state
  const speaker = state[speech.side]
  for (const animal of state.battlefield?.entities ?? []) {
    const person = receivingPerson(state, animal)
    if (!person || Math.hypot(speaker.x - animal.x, speaker.y - animal.y) > 18) continue
    const screen = person.person!.littleEyeScreen
    if (!screen || screen.animal !== animal.id) continue
    next = changeDolphinPerson(next, person.id, {
      littleEyeScreen: {
        ...screen,
        words: [...screen.words, { frame: state.frame, text: speech.text }].slice(-4),
      },
    })
  }
  return next
}
