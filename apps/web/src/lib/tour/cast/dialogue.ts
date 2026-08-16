import { pairFor } from './dialogueCatalog'

export type Beat =
  | 'martial-law'
  | 'death'
  | 'nen'
  | 'hunt'
  | 'escape'
  | 'negotiation'
  | 'succession'
  | 'danger'
  | 'watch'

export type Voice =
  | 'kurapika'
  | 'oito'
  | 'benjamin'
  | 'camilla'
  | 'tserriednich'
  | 'halkenburg'
  | 'nasubi'
  | 'melody'
  | 'morena'
  | 'chrollo'
  | 'hisoka'
  | 'military'
  | 'hunter'
  | 'royal'
  | 'mafia'
  | 'child'
  | 'civilian'

/**
 * One sentence a person can say at the event currently projected in the walk.
 *
 * These are deliberately paraphrases, never copied manga dialogue. The server
 * supplies only the line for the event the reader is allowed to load, so this
 * cannot become a second path around the spoiler cap.
 */

export interface DialogueEvent {
  id: string
  chapter: number
  title: string
  summary: string
}

export interface DialogueMember {
  characterId: string
  role: string
}

export interface ContextLine {
  eventId: string
  chapter: number
  text: string
  textFr: string
  /** Every current line is an authored summary of the situation, not a quote. */
  kind: 'paraphrase'
}

const CHARACTER_VOICES: Record<string, Voice> = {
  kurapika: 'kurapika',
  'queen-oito': 'oito',
  'prince-benjamin': 'benjamin',
  'prince-camilla': 'camilla',
  'prince-tserriednich': 'tserriednich',
  'prince-halkenburg': 'halkenburg',
  'nasubi-hui-guo-rou': 'nasubi',
  melody: 'melody',
  senritsu: 'melody',
  morena: 'morena',
  'morena-prudo': 'morena',
  chrollo: 'chrollo',
  'chrollo-lucilfer': 'chrollo',
  hisoka: 'hisoka',
  'hisoka-morow': 'hisoka',
}

function beatOf(event: DialogueEvent): Beat {
  const words = `${event.title} ${event.summary}`.toLowerCase()
  if (/martial law|military|soldier|army|arrest|detain/.test(words)) return 'martial-law'
  if (/kill|murder|assassin|death|dead|dies|corpse|funeral|burial/.test(words)) return 'death'
  if (/nen|aura|beast|ability|zetsu|emperor time|contagion/.test(words)) return 'nen'
  if (/hisoka|hunt|search|track|trace|find/.test(words)) return 'hunt'
  if (/escape|flee|door|worm|vanish|disappear/.test(words)) return 'escape'
  if (/negotiat|offer|alliance|plead|court|letter|message/.test(words)) return 'negotiation'
  if (/succession|prince|king|throne|heir|regalia/.test(words)) return 'succession'
  if (/attack|shoot|clash|war|threat|hostage|abduct/.test(words)) return 'danger'
  return 'watch'
}

function voiceOf(member: DialogueMember): Voice {
  const fixed = CHARACTER_VOICES[member.characterId]
  if (fixed) return fixed
  const role = member.role.toLowerCase()
  if (/guard|soldier|military|army|captain|security/.test(role)) return 'military'
  if (/prince|princess|queen|royal|king/.test(role) || member.characterId.startsWith('prince-'))
    return 'royal'
  if (/hunter|zodiac|protector|investigat|teacher/.test(role)) return 'hunter'
  if (/mafia|heil-ly|cha-r|xi-yu|underboss|associate/.test(role)) return 'mafia'
  if (/child|baby|servant|maid|attendant/.test(role)) return 'child'
  return 'civilian'
}

export function contextLineFor(member: DialogueMember, event: DialogueEvent): ContextLine {
  const pair = pairFor(voiceOf(member), beatOf(event))
  return {
    eventId: event.id,
    chapter: event.chapter,
    text: pair.text,
    textFr: pair.textFr,
    kind: 'paraphrase',
  }
}

export function contextLinesFor(
  members: readonly DialogueMember[],
  event: DialogueEvent,
): Record<string, ContextLine> {
  return Object.fromEntries(
    members.map((member) => [member.characterId, contextLineFor(member, event)]),
  )
}
