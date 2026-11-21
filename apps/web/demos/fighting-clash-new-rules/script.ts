import { Shot } from '../fighting-chrollo-intro/reel'
import { split } from '../fighting-chrollo-intro/script'
import { applyCareerMorale } from '../../src/lib/fighting/career/morale'
import { performAttack } from '../../src/lib/fighting/engine'
import type { CareerProfile } from '../../src/lib/fighting/career/types'
import type { NenSegment, NenTopic } from '../fighting-nen-explained/chapters'

/**
 * Six rules that can turn a Clash fight, each filmed through the production engine:
 * Burst, last-HP rage, Ko clashes, body memory, career morale and wall-breaking KOs.
 */
type Scene = () => Shot
const until = (s: Shot, done: () => boolean, limit = 90) => {
  for (let i = 0; i < limit && !done(); i++) s.step()
}
const special = (s: Shot) => {
  s.state = performAttack(s.state, 'player', 'special')
  s.states[s.frame] = s.state
}
const SECTION = {
  title: 'HOW A FIGHT TURNS',
  items: ['BURST', 'RAGE', 'KO CLASH', 'BODY MEMORY', 'MORALE', 'WALL BREAK'],
}
const topic = (concept: string, example: string, meters?: NenTopic['meters']): NenTopic => ({
  chapter: 1,
  concept,
  example,
  section: SECTION,
  meters,
})

const title: Scene = () => {
  const s = new Shot('heavens-arena', 'hisoka', { hero: 'phinks', gap: 10 })
  s.card = 'title'
  s.held.player = { aura: true }
  s.portrait('face', 84)
  s.step(84)
  return s
}

/** Caught in Phinks's chain, Hisoka spends half his aura to break out, then pays in Zetsu. */
const burst: Scene = () => {
  const s = new Shot('banquet-hall', 'phinks', { hero: 'hisoka', gap: 5 })
  s.step(6)
  s.press('light', {}, 'opponent')
  s.hits(1, 'opponent', 40)
  s.press('light', {}, 'opponent')
  s.hits(1, 'opponent', 40)
  s.beat('BURST', 'Once per round: break the combo')
  s.step(1, { burst: true })
  s.beat('', 'Half the aura, and two seconds of Zetsu')
  s.step(110)
  return s
}

/** Under 20% HP with On sworn, one clean heavy ends it, whatever is left to take. */
const rage: Scene = () => {
  const s = new Shot('heilly-hideout', 'phinks', { hero: 'kurapika', gap: 6, heroHealth: 70 })
  s.step(4)
  for (let round = 0; round < 5 && (s.state.player.on?.grudge ?? 0) < 52; round++) {
    s.approach('opponent', 4)
    s.press('light', {}, 'opponent')
    s.hits(1, 'opponent', 50)
    s.step(16)
  }
  until(s, () => !s.state.player.hitStun && !s.state.player.knockdownFrames, 90)
  s.held.player = { aura: true, hatsu: true }
  s.step(3)
  s.held.player = {}
  s.beat('RAGE', 'Last HP, sworn On: the next clean heavy is lethal')
  s.step(20)
  s.approach('player', 5)
  s.press('heavy')
  s.hits(1, 'player', 60)
  s.step(50)
  return s
}

/** Both throw Ko on the same frame: the blows cancel, and the stronger Ren pushes through. */
const clash: Scene = () => {
  const s = new Shot('heavens-arena', 'franklin', { hero: 'phinks', gap: 10 })
  s.step(10)
  s.press('light', { aura: true })
  s.press('light', { aura: true }, 'opponent')
  s.beat('KO CLASH', 'Ko against Ko: both blows cancel')
  until(s, () => Boolean(s.state.attackClash), 30)
  s.beat('', 'The stronger Ren holds. The other is pushed back.')
  s.step(60)
  return s
}

/** Three sweeps on the same legs: Leorio's body remembers, and those legs weaken. */
const body: Scene = () => {
  const s = new Shot('supreme-court', 'leorio', { hero: 'biscuit', gap: 5 })
  s.step(4)
  s.beat('BODY MEMORY', 'The body remembers where it was hit')
  for (let i = 0; i < 3; i++) {
    s.approach('player', 5)
    s.held.player = { down: true }
    s.press('light', { down: true })
    s.hits(1, 'player', 40)
    s.held.player = {}
    s.idle()
    s.step(10)
  }
  s.beat('', 'Three on the legs: they now cost more aura and hit softer')
  s.step(50)
  return s
}

/** Two openings: after a 0-2 loss above, after a 2-0 win below. */
function opening(won: boolean) {
  const s = new Shot('observation-deck', 'machi', { hero: 'feitan', gap: 10 })
  const profile: CareerProfile = {
    version: 1,
    name: 'Clash',
    appearance: { theme: 'whale' } as CareerProfile['appearance'],
    history: [
      {
        id: won ? 'previous-win' : 'previous-loss',
        at: 1,
        source: 'versus-local',
        player: 'feitan',
        opponent: 'machi',
        stage: 'observation-deck',
        format: 'knockout',
        winner: won ? 'player' : 'opponent',
        rounds: won ? { player: 2, opponent: 0 } : { player: 0, opponent: 2 },
        practice: {} as CareerProfile['history'][number]['practice'],
        ruleset: 'current',
      },
    ],
    totals: {},
    seen: [],
    moraleSeen: [],
    revision: 1,
  }
  s.state = applyCareerMorale(s.state, profile)
  s.states[0] = s.state
  s.step(150)
  return s
}
const morale: Scene = () => {
  const top = opening(false)
  top.twin = opening(true)
  top.beats.push({ at: 4, word: 'MORALE', line: 'The last match follows you into the next one' })
  return top
}

/** A Ripper Cyclotron KO against the wall breaks it: the fight moves to the next room. */
const wall: Scene = () => {
  const s = new Shot('vip-casino', 'kalluto', {
    hero: 'phinks',
    gap: 6,
    centre: 86,
    opponentHealth: 20,
  })
  s.step(4)
  special(s)
  s.beat('WALL BREAK', 'A knockdown blow into the wall breaks through it')
  s.step(40)
  special(s)
  s.step(2)
  s.press('finisher')
  until(s, () => Boolean(s.state.stageTransition), 160)
  if (!s.state.stageTransition) throw new Error('the wall did not break')
  s.cut('vip-casino')
  s.beat('', `Next room: ${s.state.stageTransition.toNameEn}`)
  s.step(80)
  return s
}

/** The six rules, in order, for this video and for the full Clash systems video. */
export const RULE_SCENES: Array<[string, Scene, NenTopic]> = [
  ['burst', burst, topic('BURST', 'HISOKA BREAKS PHINKS’S COMBO', 'burst')],
  ['rage', rage, topic('RAGE', 'KURAPIKA · LAST STAND', 'rage')],
  ['clash', clash, topic('KO CLASH', 'PHINKS VS FRANKLIN', 'clash')],
  ['body', body, topic('BODY MEMORY', 'BISCUIT SWEEPS LEORIO', 'body')],
  ['morale', morale, topic('MORALE', 'FEITAN · AFTER A LOSS / AFTER A WIN', 'morale')],
  ['wall', wall, topic('WALL BREAK', 'PHINKS · RIPPER CYCLOTRON INTO THE WALL')],
]
const PLAN: Array<[string, Scene, NenTopic | null]> = [['title', title, null], ...RULE_SCENES]

export function buildRulesReel(): NenSegment[] {
  return PLAN.flatMap(([id, scene, t], index) => {
    let parts
    try {
      parts = split(id, scene().segment())
    } catch (error) {
      parts = [{ id, ...new Shot('heavens-arena', 'hisoka').segment((error as Error).message) }]
    }
    // On its own, this video is a single chapter.
    const own = t ? { ...t, chapter: 0 } : t
    return parts.map((part, i) => ({ ...part, ...own, chapterStart: index === 1 && i === 0 }))
  })
}
