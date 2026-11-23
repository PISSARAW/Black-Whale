/**
 * Chapters 351-357 as data: the order of the beats follows the audit of the canonical fight.
 * Chapter boundaries and puppet ranges are working estimates, to check against the panels;
 * every line of text is a paraphrase, never a quotation.
 */
export const DEATH_MATCH_CHAPTERS = [351, 352, 353, 354, 355, 356, 357] as const
export type DeathMatchChapter = (typeof DEATH_MATCH_CHAPTERS)[number]

export type DeathMatchActor = 'chrollo' | 'hisoka' | 'arena' | 'troupe'

export interface DeathMatchBeatSpec {
  id: string
  chapter: DeathMatchChapter
  actor: DeathMatchActor
  /** The semi-free mode may skip this beat and let the player change what happens. */
  branchable: boolean
  /** Choreographed shot taken for this beat; free phases keep the playable camera. */
  camera?: string
}

type BeatExtra = { branchable?: boolean; camera?: string }

/** One helper per chapter keeps every beat line short and under three parameters. */
const inChapter =
  (chapter: DeathMatchChapter) =>
  <Id extends string>(
    id: Id,
    actor: DeathMatchActor,
    extra: BeatExtra = {},
  ): DeathMatchBeatSpec & { id: Id } => ({
    id,
    chapter,
    actor,
    branchable: extra.branchable ?? false,
    ...extra,
  })
const [c351, c352, c353, c354, c355, c356, c357] = DEATH_MATCH_CHAPTERS.map(inChapter)

export const DEATH_MATCH_BEATS = [
  c351('floor-masters-enter', 'arena', { camera: 'entrance' }),
  c351('death-agreement', 'arena', { camera: 'referee-between' }),
  c351('referee-marked-black-voice', 'chrollo', { camera: 'antennas' }),
  c351('chrollo-feint-kick-flurry', 'chrollo', { branchable: true }),
  c351('abilities-presented', 'chrollo', { camera: 'sun-moon-palms' }),
  c351('hisoka-gum-to-referee', 'hisoka', { branchable: true }),
  c351('referee-throat-cut', 'hisoka'),
  c351('first-explosion', 'chrollo', { camera: 'first-explosion' }),
  c351('hisoka-retreats-ceiling', 'hisoka', { branchable: true }),
  c352('chrollo-vanishes-crowd', 'chrollo', { camera: 'dive-to-crowd' }),
  c352('gallery-fake-copies', 'chrollo'),
  c352('convert-hands-disguise', 'chrollo', { branchable: true, camera: 'hidden-chrollo' }),
  c352('surprise-strike', 'chrollo', { branchable: true, camera: 'strike-from-behind' }),
  c352('puppets-decapitated', 'hisoka'),
  c352('head-hammer', 'hisoka', { branchable: true }),
  c352('double-head-counter', 'hisoka', { camera: 'second-head-hits' }),
  c353('amputated-hostage', 'hisoka', { branchable: true }),
  c353('crowd-launched', 'hisoka', { branchable: true }),
  c353('fake-chrollo-decoy', 'chrollo'),
  c353('fake-chrollo-crushed', 'hisoka', { camera: 'fake-crushed' }),
  c353('true-face-revealed', 'arena', { camera: 'true-face' }),
  c354('head-body-link-tracked', 'chrollo'),
  c354('max-charge-during-feint', 'chrollo'),
  c355('microphone-taken', 'chrollo', { camera: 'microphone' }),
  c355('collective-order', 'chrollo', { camera: 'puppet-wave' }),
  c355('five-body-hammer', 'hisoka', { camera: 'five-body-hammer' }),
  c355('hammer-breaks', 'hisoka', { branchable: true }),
  c355('hand-destroyed', 'chrollo', { camera: 'hand-explosion' }),
  c356('upper-level-escape', 'hisoka', { branchable: true }),
  c356('leg-destroyed', 'chrollo', { camera: 'leg-torn' }),
  c356('reattach-attempt', 'hisoka', { branchable: true }),
  c356('puppet-wave', 'chrollo', { camera: 'fall-to-ring' }),
  c356('net-closes', 'chrollo', { camera: 'zenith-net' }),
  c356('final-explosion', 'chrollo', { camera: 'final-explosion' }),
  c356('hisoka-buried', 'arena'),
  c356('hisoka-asphyxiated', 'arena'),
  c357('chrollo-declared-winner', 'arena', { camera: 'crater-rescue' }),
  c357('rescue-arrives', 'arena'),
  c357('troupe-gathers', 'troupe'),
  c357('resuscitation', 'hisoka', { camera: 'resuscitation' }),
  c357('prosthetics-formed', 'hisoka'),
  c357('machi-bound', 'hisoka'),
] as const satisfies readonly DeathMatchBeatSpec[]

export type DeathMatchBeat = (typeof DEATH_MATCH_BEATS)[number]['id']

/** Narrative causality, held in every play mode, the free one included. */
export const BEAT_REQUIRES: Partial<Record<DeathMatchBeat, readonly DeathMatchBeat[]>> = {
  'referee-throat-cut': ['death-agreement'],
  'first-explosion': ['abilities-presented'],
  'fake-chrollo-crushed': ['fake-chrollo-decoy'],
  'true-face-revealed': ['fake-chrollo-crushed'],
  'collective-order': ['microphone-taken'],
  'hammer-breaks': ['five-body-hammer'],
  'hand-destroyed': ['hammer-breaks'],
  'leg-destroyed': ['upper-level-escape'],
  'reattach-attempt': ['leg-destroyed'],
  'hisoka-buried': ['final-explosion'],
  'hisoka-asphyxiated': ['hisoka-buried'],
  'chrollo-declared-winner': ['hisoka-asphyxiated'],
  'rescue-arrives': ['chrollo-declared-winner'],
  resuscitation: ['chrollo-declared-winner', 'troupe-gathers'],
  'prosthetics-formed': ['resuscitation'],
  'machi-bound': ['resuscitation'],
}

export interface ChapterSpec {
  chapter: DeathMatchChapter
  objectiveFr: string
  objectiveEn: string
  /** Estimated Chrollo puppets on the field during the chapter; null is not checked. */
  puppets: readonly [min: number, max: number] | null
}

export const DEATH_MATCH_CHAPTER_SPECS: readonly ChapterSpec[] = [
  {
    chapter: 351,
    objectiveFr: 'Survivre à l’arbitre marqué et à la première détonation.',
    objectiveEn: 'Survive the marked referee and the first detonation.',
    puppets: [0, 1],
  },
  {
    chapter: 352,
    objectiveFr: 'Retrouver Chrollo caché dans les gradins.',
    objectiveEn: 'Find Chrollo hidden in the stands.',
    puppets: [20, 30],
  },
  {
    chapter: 353,
    objectiveFr: 'Distinguer le vrai Chrollo de ses doubles.',
    objectiveEn: 'Tell the real Chrollo from his doubles.',
    puppets: [20, 40],
  },
  {
    chapter: 354,
    objectiveFr: 'Comprendre ce que relient les têtes détachées.',
    objectiveEn: 'Understand what the detached heads are still tied to.',
    puppets: [30, 60],
  },
  {
    chapter: 355,
    objectiveFr: 'Tenir face à l’ordre donné à toute la salle.',
    objectiveEn: 'Hold against the order given to the whole hall.',
    puppets: [60, 120],
  },
  {
    chapter: 356,
    objectiveFr: 'Échapper à la nasse qui se referme.',
    objectiveEn: 'Escape the closing net.',
    puppets: [100, 200],
  },
  {
    chapter: 357,
    objectiveFr: 'Après le verdict : le corps, la Brigade et le cœur.',
    objectiveEn: 'After the verdict: the body, the Troupe and the heart.',
    puppets: null,
  },
]

const BY_ID = new Map<string, DeathMatchBeatSpec>(DEATH_MATCH_BEATS.map((spec) => [spec.id, spec]))

export function beatSpec(id: DeathMatchBeat): DeathMatchBeatSpec {
  return BY_ID.get(id) as DeathMatchBeatSpec
}

export function isDeathMatchBeat(id: string): id is DeathMatchBeat {
  return BY_ID.has(id)
}

export function beatIndex(id: DeathMatchBeat): number {
  return DEATH_MATCH_BEATS.findIndex((spec) => spec.id === id)
}

export function chapterSpec(chapter: DeathMatchChapter): ChapterSpec {
  return DEATH_MATCH_CHAPTER_SPECS.find((spec) => spec.chapter === chapter) as ChapterSpec
}

/** True when the puppet census sits inside the chapter estimate (or is not checked). */
export function puppetCensusWithin(chapter: DeathMatchChapter, puppets: number): boolean {
  const range = chapterSpec(chapter).puppets
  return range === null || (puppets >= range[0] && puppets <= range[1])
}
