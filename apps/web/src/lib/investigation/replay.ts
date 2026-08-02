export type ReplayStage = 'warning' | 'diversion' | 'attack' | 'draining' | 'death'

export interface ReplayFrame {
  second: number
  stage: ReplayStage
  title: string
  description: string
  activeSubjectIds: string[]
  snakes: number
  bloodLevel: number
}

import { messagesFor } from '$lib/i18n'
import type { Locale } from '$lib/i18n/config'

export function frameAt(second: number, locale: Locale = 'en'): ReplayFrame {
  const time = Math.max(0, Math.min(11, Math.round(second)))
  const msg = messagesFor(locale).investigation.replay
  if (time === 0) {
    return {
      second: time,
      stage: 'warning',
      title: 'Doll appears',
      description: 'Loberry alone sees the masked figure behind Furykov.',
      activeSubjectIds: ['loberry', 'furykov'],
      snakes: 0,
      bloodLevel: 100,
    }
  }
  if (time === 1) {
    return {
      second: time,
      stage: 'diversion',
      title: msg.allEyesDiverge.title,
      description: msg.allEyesDiverge.description,
      activeSubjectIds: ['loberry'],
      snakes: 0,
      bloodLevel: 100,
    }
  }
  if (time === 2) {
    return {
      second: time,
      stage: 'attack',
      title: msg.fourCreaturesStrike.title,
      description: msg.fourCreaturesStrike.description,
      activeSubjectIds: ['body'],
      snakes: 4,
      bloodLevel: 92,
    }
  }
  if (time < 11) {
    return {
      second: time,
      stage: 'draining',
      title: msg.simultaneousDrain.title,
      description: msg.simultaneousDrain.description,
      activeSubjectIds: ['body', 'bill', 'sakata'],
      snakes: 4,
      bloodLevel: Math.max(8, 100 - time * 9),
    }
  }
  return {
    second: time,
    stage: 'death',
    title: msg.barrigenIsDead.title,
    description: msg.barrigenIsDead.description,
    activeSubjectIds: ['body'],
    snakes: 0,
    bloodLevel: 0,
  }
}
