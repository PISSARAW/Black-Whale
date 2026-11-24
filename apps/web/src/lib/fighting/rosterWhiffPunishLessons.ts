import type { CombatRoute } from './combatRoutes'
import type { CombatWhiffPractice } from './combatWhiffPractice'
import type { RosterFighterId } from './rosterChoreography'
import { rosterPhysicalBranch } from './rosterComboBranches'
import { WHIFF_PUNISH_VARIANTS } from './whiffPunishVariants'

type Fighter = Exclude<RosterFighterId, 'kurapika' | 'hisoka' | 'franklin'>

// Start close enough for Chrollo's heavy to hit a stationary target. Walk speed and the
// fighter's advancing light determine where each exercise can evade and still retaliate.
const CHROLLO_GAPS = {
  benjamin: 11.5,
  tserriednich: 10.5,
  feitan: 10,
  saiyu: 10.5,
  theta: 11,
  biscuit: 10.5,
  phinks: 11,
  machi: 10,
  illumi: 10.5,
  kalluto: 9.5,
  bonolenov: 11,
  shizuku: 10.5,
  hinrigh: 10.5,
  mizaistom: 11,
  leorio: 11,
  hanzo: 8.25,
  rihan: 11,
  zakuro: 10.5,
  melody: 11,
  basho: 10.5,
  camilla: 11,
  halkenburg: 11,
  gel: 11,
  lynch: 11,
  luini: 10.25,
  bill: 11,
  furykov: 10.5,
  cluck: 10.5,
  beyond: 11,
  longhi: 10.5,
  musse: 11,
  padaille: 11,
  sayird: 10.5,
  terebellum: 11.5,
  voconte: 10.5,
  yokotani: 11,
} satisfies Record<Exclude<Fighter, 'chrollo'>, number>

// These profiles need an extra step to get back into strike range.
const WHIFF_ADVANCE: Partial<Record<Fighter, number>> = {
  camilla: 2,
  cluck: 2,
  furykov: 2,
  hanzo: 2,
  longhi: 2,
  luini: 2,
  lynch: 1,
  machi: 2,
  melody: 1,
  musse: 2,
  saiyu: 1,
  theta: 1,
  zakuro: 2,
}

function practice(fighter: Fighter): CombatWhiffPractice {
  if (fighter === 'chrollo') return { opponent: 'kurapika', gap: 11.5, advanceFrames: 9 }
  if (fighter === 'feitan')
    return { opponent: 'chrollo', gap: CHROLLO_GAPS.feitan, advanceFrames: 3 }
  const advanceFrames = WHIFF_ADVANCE[fighter]
  return { opponent: 'chrollo', gap: CHROLLO_GAPS[fighter], advanceFrames }
}

function lesson(fighter: Fighter): CombatRoute {
  const whiff = practice(fighter)
  const ender =
    fighter === 'feitan'
      ? ('forwardHeavy' as const)
      : rosterPhysicalBranch(fighter, 'whiff-punish')!.slot
  return {
    id: `${fighter}:whiff-punish`,
    fighter,
    kind: 'punish',
    title: ['Faire manquer puis punir', 'Make it miss and punish'],
    moves: [fighter === 'chrollo' ? 'standingLight' : 'forwardLight', ender],
    requirement: [
      'Recule pendant le lourd, puis reviens frapper pendant sa récupération. Confirme le léger avant d’enchaîner. Garde ton aura pour l’échange suivant.',
      'Step out of the heavy, then come back in during its recovery. Confirm the light before following up. Save your aura for the next exchange.',
    ],
    whiff,
  }
}

const PHYSICAL_LESSONS = [
  lesson('chrollo'),
  ...(Object.keys(CHROLLO_GAPS) as Exclude<Fighter, 'chrollo'>[]).map(lesson),
]

function variantLesson(route: CombatRoute): CombatRoute[] {
  const variant = WHIFF_PUNISH_VARIANTS[route.fighter]
  if (!variant) return []
  return [
    {
      ...route,
      id: `${route.fighter}:whiff-variant`,
      title: [
        'Faire manquer puis convertir avec une technique',
        'Make it miss and convert with a technique',
      ],
      moves: variant.via
        ? [route.moves[0], variant.via, variant.slot]
        : [route.moves[0], variant.slot],
      setup: variant.setup,
      requirement: variant.requirement,
    },
  ]
}

export const ROSTER_WHIFF_PUNISH_LESSONS: readonly CombatRoute[] = [
  ...PHYSICAL_LESSONS,
  ...PHYSICAL_LESSONS.flatMap(variantLesson),
]
