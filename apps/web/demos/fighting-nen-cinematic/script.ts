import { Shot } from '../fighting-chrollo-intro/reel'
import { split } from '../fighting-chrollo-intro/script'
import type { FightStageId } from '../../src/lib/fighting/stages'
import type { FighterId } from '../../src/lib/fighting/types'
import type { NenSegment, NenTopic } from '../fighting-nen-explained/chapters'
import { curses, finishAndFilm, type Windows } from './films'

/**
 * Nen explained through the fighters' own cinematics only: each concept is the victory
 * film that shows it best. The KO that opens each film is real, but cut out of the edit.
 */
const TYPES = {
  title: 'HATSU · THE SIX TYPES',
  items: ['ENHANCER', 'TRANSMUTER', 'EMITTER', 'CONJURER', 'MANIPULATOR', 'SPECIALIST'],
}
const BEYOND = { title: 'VOWS AND BEYOND', items: ['VOW', 'POST-MORTEM', 'CURSE', 'FULL POWER'] }

interface Take {
  id: string
  hero: FighterId
  vs: FighterId
  stage: FightStageId
  windows: Windows
  topic: NenTopic | null
  beat?: [string, string]
}

/** A real KO, then the film windows; the fight itself never reaches the edit. */
function film(take: Take): Shot {
  const s = new Shot(take.stage, take.vs, { hero: take.hero, gap: 5, opponentHealth: 8 })
  s.step(4)
  finishAndFilm(s, take.windows)
  if (take.beat) s.beats.push({ at: s.splits[0].at + 4, word: take.beat[0], line: take.beat[1] })
  return s
}

/** Camilla is really killed; the cat takes her killer, and her own film follows. */
function catsName(): Shot {
  const s = new Shot('heilly-hideout', 'hisoka', { hero: 'camilla', gap: 6, heroHealth: 14 })
  s.step(4)
  for (let round = 0; round < 3 && !s.state.catsName; round++) {
    s.approach('opponent', 4)
    s.press('heavy', {}, 'opponent')
    for (let i = 0; i < 60 && !s.state.catsName && s.state.opponent.attack; i++) s.step()
    s.step(6)
  }
  for (let i = 0; i < 200 && s.state.phase !== 'finished'; i++) s.step()
  finishAndFilm(s, [[1.2, 3.8]])
  s.beats.push({ at: s.splits[0].at + 4, word: 'POST-MORTEM', line: 'Some Nen only wakes when you die' })
  return s
}

const t = (chapter: number, concept: string, example: string): NenTopic => ({
  chapter,
  concept,
  example,
  section: chapter === 0 ? TYPES : BEYOND,
})

const TAKES: Take[] = [
  { id: 'title', hero: 'hisoka', vs: 'kurapika', stage: 'heavens-arena', windows: [[3.1, 1.6]], topic: null },
  {
    id: 'enhancer', hero: 'phinks', vs: 'hisoka', stage: 'heavens-arena', windows: [[2.5, 3]],
    topic: t(0, 'ENHANCER', 'PHINKS · THE LAST REVOLUTION'),
    beat: ['ENHANCER', 'Strengthen what you already have'],
  },
  {
    id: 'transmuter', hero: 'machi', vs: 'kalluto', stage: 'heavens-arena', windows: [[3.9, 2.6]],
    topic: t(0, 'TRANSMUTER', 'MACHI · THE FINAL STITCH'),
    beat: ['TRANSMUTER', 'Aura with the properties of thread'],
  },
  {
    id: 'emitter', hero: 'franklin', vs: 'phinks', stage: 'heavens-arena', windows: [[2.5, 2.5]],
    topic: t(0, 'EMITTER', 'FRANKLIN · SILENCE AFTER THE BARRAGE'),
    beat: ['EMITTER', 'Send the aura away from the body'],
  },
  {
    id: 'conjurer', hero: 'kurapika', vs: 'chrollo', stage: 'heavens-arena', windows: [[1.5, 2.6]],
    topic: t(0, 'CONJURER', 'KURAPIKA · CHAIN JAIL'),
    beat: ['CONJURER', 'Make a real object out of aura'],
  },
  {
    id: 'manipulator', hero: 'illumi', vs: 'leorio', stage: 'heavens-arena', windows: [[3.8, 2.5]],
    topic: t(0, 'MANIPULATOR', 'ILLUMI · EVEN AFTER DEATH'),
    beat: ['MANIPULATOR', 'Control people and things'],
  },
  {
    id: 'specialist', hero: 'chrollo', vs: 'franklin', stage: 'heavens-arena', windows: [[2.8, 3.4]],
    topic: t(0, 'SPECIALIST', 'CHROLLO · STOLEN PAGES'),
    beat: ['SPECIALIST', 'An ability no other type can learn'],
  },
  {
    id: 'vow', hero: 'kurapika', vs: 'hisoka', stage: 'heavens-arena', windows: [[1.2, 3.6]],
    topic: t(1, 'VOW', 'KURAPIKA · JUDGMENT CHAIN'),
    beat: ['VOW', 'A strict rule makes the ability stronger'],
  },
  {
    id: 'full-power', hero: 'feitan', vs: 'hisoka', stage: 'heavens-arena', windows: [[4.5, 3]],
    topic: t(1, 'FULL POWER', 'FEITAN · THE SUN OF TORMENT'),
    beat: ['FULL POWER', 'Every wound paid back as a sun'],
  },
  {
    id: 'finale', hero: 'hisoka', vs: 'kurapika', stage: 'heavens-arena', windows: [[8.2, 1.8]],
    topic: t(1, 'FULL POWER', 'HISOKA · LOOK AT ME'),
    beat: ['LOOK AT ME', ''],
  },
]

type Built = [string, () => Shot, NenTopic | null]
const takes = (ids: string[]): Built[] =>
  ids.map((id) => {
    const take = TAKES.find((entry) => entry.id === id)!
    return [id, () => film(take), take.topic]
  })

const PLAN: Built[] = [
  ...takes(['title', 'enhancer', 'transmuter', 'emitter', 'conjurer', 'manipulator', 'specialist', 'vow']),
  ['post-mortem', catsName, t(1, 'POST-MORTEM', 'CAMILLA · CAT’S NAME')],
  [
    'curses',
    () => {
      const s = curses()
      s.beats.splice(0, s.beats.length, {
        at: s.splits[0].at + 4,
        word: 'CURSE',
        line: 'Nen that kills from beyond the grave',
      })
      return s
    },
    t(1, 'CURSE', 'FURYKOV & LONGHI · BEYOND’S SEAL'),
  ],
  ...takes(['full-power', 'finale']),
]

/** Only the film parts of each shot reach the edit; the KO before them is dropped. */
export function buildNenFilmReel(): NenSegment[] {
  let chapter = -1
  return PLAN.flatMap(([id, scene, topic]) => {
    const start = topic !== null && topic.chapter !== chapter
    if (topic) chapter = topic.chapter
    let parts
    try {
      parts = split(id, scene().segment()).filter((part) => part.victory?.length)
    } catch (error) {
      parts = [{ id, ...new Shot('heavens-arena', 'chrollo').segment((error as Error).message) }]
    }
    if (id === 'title') parts = parts.map((part) => ({ ...part, card: 'title' as const }))
    return parts.map((part, i) => ({ ...part, ...topic, chapterStart: start && i === 0 }))
  })
}
