import { fightContactStyle } from '../fightContactStyle'
import { isKameoId, kameoDefinition } from '../kameos/catalogue'
import { fighterDefinition } from '../roster'
import type { FightSide, FightState } from '../types'
import { fightSoundEvents, type FightSoundEvent, type FightSoundKind } from './events'
import { matchVoiceLines, type BoardLine } from './matchVoiceLines'
import type { VoiceLocale } from './speechSamples'

export interface SoundCaption {
  text: string
  priority: 1 | 2 | 3
}

const SIGNALS: Partial<Record<FightSoundKind, readonly [string, string]>> = {
  burst: ['Burst', 'Burst'],
  'ko-clash': ['Choc de Ko', 'Ko clash'],
  breach: ['Mur brisé', 'Wall broken'],
  'projectile-intercept': ['Projectile intercepté', 'Projectile intercepted'],
  'throw-tech': ['Projection contrée', 'Throw escaped'],
  'assist-action': ['Kaméo en action', 'Kameo attack'],
  'assist-exit': ['Retrait du Kaméo', 'Kameo withdraws'],
  'assist-interrupted': ['Kaméo interrompu', 'Kameo interrupted'],
  'assist-ready': ['Kaméo disponible', 'Kameo ready'],
  'nen-low': ['Nen faible', 'Nen low'],
  'nen-empty': ['Nen épuisé', 'Nen depleted'],
  'hatsu-ready': ['Hatsu disponible', 'Hatsu ready'],
  'charge-ready': ['Charge prête', 'Charge ready'],
  refused: ['Commande refusée', 'Command rejected'],
  'health-low': ['Vie faible', 'Low health'],
  'emperor-on': ['Emperor Time activé', 'Emperor Time activated'],
  'emperor-off': ['Emperor Time terminé', 'Emperor Time ended'],
  watch: ['Il reste 15 secondes', '15 seconds remaining'],
}
const ROUTINE_SIGNALS = new Set<FightSoundKind>(['assist-action', 'assist-exit'])

const CONTACT = {
  hit: ['Impact', 'Hit'],
  guard: ['Garde', 'Guard'],
  parry: ['Parade', 'Parry'],
  evaded: ['Esquive', 'Evaded'],
} as const

const BOARD: Partial<Record<BoardLine, readonly [string, string]>> = {
  start: ['Combat !', 'Fight!'],
  decisive: ['Manche décisive !', 'Final round!'],
  time: ['Temps écoulé', 'Time up'],
  draw: ['Égalité', 'Draw'],
  knockout: ['K.-O.', 'Knockout'],
  technical: ['K.-O. technique', 'Technical knockout'],
  points: ['Victoire aux points', 'Win by points'],
  expulsion: ['Expulsion', 'Ring out'],
}

function name(state: FightState, side: FightSide) {
  return fighterDefinition(state[side].id).name
}

function boardCaption(line: BoardLine, state: FightState, en: number): string {
  const fixed = BOARD[line]
  if (fixed) return fixed[en]
  const winner = name(state, line.startsWith('player') ? 'player' : 'opponent')
  const match = line.endsWith('-match')
  if (en) return match ? `${winner} wins the match` : `${winner} wins the round`
  return match ? `${winner} remporte le match` : `${winner} remporte la manche`
}

function eventCaption(event: FightSoundEvent, en: number): SoundCaption | undefined {
  const { kind, impact, source } = event
  if (kind === 'impact' && impact) {
    const style = fightContactStyle(impact)
    return { text: CONTACT[style][en], priority: style === 'parry' ? 2 : 1 }
  }
  if (kind === 'assist-entry' && source && isKameoId(source)) {
    const fighter = kameoDefinition(source).name
    return { text: en ? `Kameo · ${fighter}` : `Kaméo · ${fighter}`, priority: 2 }
  }
  const label = SIGNALS[kind]
  if (label) return { text: label[en], priority: ROUTINE_SIGNALS.has(kind) ? 1 : 2 }
}

export function soundCaptions(
  before: FightState,
  after: FightState,
  { viewer, locale }: { viewer: FightSide; locale: VoiceLocale },
): SoundCaption[] {
  if (before === after) return []
  const en = locale === 'en' ? 1 : 0
  const cues = fightSoundEvents(before, after, viewer).flatMap((event) => {
    const caption = eventCaption(event, en)
    return caption ? [caption] : []
  })
  const lines = matchVoiceLines(before, after)
  if (lines.length)
    cues.push({ text: lines.map((line) => boardCaption(line, after, en)).join(' · '), priority: 3 })
  return cues
}

export interface TimedSoundCaption extends SoundCaption {
  expires: number
}

export function retainSoundCaptions(
  current: TimedSoundCaption[],
  incoming: SoundCaption[],
  now: number,
): TimedSoundCaption[] {
  const combined = new Map(current.filter((cue) => cue.expires > now).map((cue) => [cue.text, cue]))
  for (const cue of incoming) {
    if (combined.has(cue.text)) continue
    const duration = cue.priority === 3 ? 3000 : cue.priority === 2 ? 2000 : 1200
    combined.set(cue.text, { ...cue, expires: now + duration })
  }
  return [...combined.values()]
    .sort((a, b) => b.priority - a.priority || b.expires - a.expires)
    .slice(0, 2)
}
