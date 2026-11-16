import { fighterDefinition } from './roster'
import type { FightPose } from './fightPose'
import type {
  EasterEggDefinition,
  EasterEggSecret,
  EasterEggSlot,
  EggGesture,
  EggPropKind,
  EggPropAction,
} from './easterEggTypes'

type PropShorthand = EggPropKind | `${EggPropKind}:${EggPropAction}`
export type EggSceneSeed = readonly [
  nameFr: string,
  nameEn: string,
  actionFr: string,
  actionEn: string,
  gesture: EggGesture,
  prop?: PropShorthand,
]
interface EggSeries {
  scenes: readonly [EggSceneSeed, EggSceneSeed, EggSceneSeed, EggSceneSeed]
  /** Authored posture and cadence give the shared rig this character's attitude. */
  accent: FightPose
  energy?: number
  tempo?: number
  secret?: EasterEggSecret
}

export function fourEasterEggs(series: EggSeries): readonly EasterEggDefinition[] {
  return series.scenes.map((seed, index) => {
    const slot = (index + 1) as EasterEggSlot
    const secret = series.secret ?? { kind: 'sequence' }
    const [nameFr, nameEn, actionFr, actionEn, gesture, shorthand] = seed
    const prop = shorthand?.split(':')
    return {
      slot,
      name: { fr: nameFr, en: nameEn },
      frames: Math.round([90, 108, 150, 180][index] * (series.tempo ?? 1)),
      hint: slot === 4 ? secretHint(secret) : { fr: actionFr, en: actionEn },
      ending: { fr: actionFr, en: actionEn },
      motion: {
        gesture,
        accent: series.accent,
        cycles: gestureCycles(gesture, index),
        energy: series.energy ?? 1,
      },
      prop: prop
        ? {
            kind: prop[0] as EggPropKind,
            action: (prop[1] ?? 'hold') as EggPropAction,
            hand: propHand(gesture),
          }
        : undefined,
      secret: slot === 4 ? secret : undefined,
    }
  })
}

function propHand(gesture: EggGesture): 'lead' | 'rear' {
  return ['write', 'owlSketch', 'ledger'].includes(gesture) ? 'rear' : 'lead'
}

function gestureCycles(gesture: EggGesture, index: number): number {
  if (gesture === 'tap') return 3
  if (gesture === 'metronome') return 5
  return [2, 3, 4, 2][index]
}

function secretHint(secret: EasterEggSecret) {
  if (secret.kind === 'gesture')
    return {
      fr: `Terminer le geste ${secret.slot} dans cette manche.`,
      en: `Finish gesture ${secret.slot} in this round.`,
    }
  if (secret.kind === 'opponent') {
    const names = secret.fighters.map((id) => fighterDefinition(id).name).join(' / ')
    return { fr: `Affronter : ${names}.`, en: `Face: ${names}.` }
  }
  return {
    fr: 'Terminer les gestes 1, 2 puis 3 dans cette manche.',
    en: 'Finish gestures 1, 2, then 3 in this round.',
  }
}
