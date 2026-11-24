import { FIGHTING_ROSTER } from '../roster'
import { FIGHT_STAGES } from '../stages'
import { CAREER_STORAGE, emptyCareer, type CareerMatch, type CareerProfile } from './types'
import { record } from '../pvp/protocol'

const isNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0
const oneOf = (value: unknown, list: readonly string[]) =>
  typeof value === 'string' && list.includes(value)
export function careerMatch(value: unknown): value is CareerMatch {
  if (
    !record(value) ||
    typeof value.id !== 'string' ||
    value.id.length > 100 ||
    !isNumber(value.at)
  )
    return false
  return validIdentity(value) && validResult(value)
}
function validIdentity(value: Record<string, unknown>) {
  const ids = FIGHTING_ROSTER.map(({ id }) => id)
  return (
    oneOf(value.player, ids) &&
    oneOf(value.opponent, ids) &&
    oneOf(value.source, ['versus-ai', 'versus-local', 'pvp']) &&
    oneOf(
      value.stage,
      FIGHT_STAGES.map(({ id }) => id),
    ) &&
    oneOf(value.format, ['heavens-arena', 'knockout', 'arcade'])
  )
}
function validResult(value: Record<string, unknown>) {
  if (!oneOf(value.winner, ['player', 'opponent']) || typeof value.ruleset !== 'string')
    return false
  if (!record(value.rounds) || !record(value.practice)) return false
  const rounds = value.rounds
  return (
    [rounds.player, rounds.opponent].every(
      (n) => Number.isInteger(n) && Number(n) >= 0 && Number(n) <= 2,
    ) &&
    rounds[String(value.winner)] === 2 &&
    validPractice(value.practice)
  )
}
export function validPractice(value: unknown): boolean {
  if (!record(value) || !isNumber(value.frames)) return false
  return ['player', 'opponent'].every((side) => {
    const stats = value[side]
    return (
      record(stats) && [stats.bestCombo, stats.bestComboDamage, stats.healthLost].every(isNumber)
    )
  })
}
export function readCareer(storage?: Pick<Storage, 'getItem'>): CareerProfile {
  try {
    const text = storage?.getItem(CAREER_STORAGE)
    if (!text || text.length > 400_000) return emptyCareer()
    const value = JSON.parse(text)
    if (
      !record(value) ||
      value.version !== 1 ||
      !record(value.appearance) ||
      !Array.isArray(value.history)
    )
      return emptyCareer()
    return {
      version: 1,
      name: cleanCareerName(value.name),
      ...readTotals(value),
      appearance: readAppearance(value.appearance),
      history: mergeHistory(value.history.filter(careerMatch), []),
      opponentKnowledge: readOpponentKnowledge(value.opponentKnowledge),
      rematchVows: readRematchVows(value.rematchVows),
    }
  } catch {
    return emptyCareer()
  }
}

function readRematchVows(value: unknown): CareerProfile['rematchVows'] {
  const vows: CareerProfile['rematchVows'] = {}
  if (!record(value)) return vows
  const ids = new Set(FIGHTING_ROSTER.map(({ id }) => id))
  for (const [id, vow] of Object.entries(value)) {
    if (
      !ids.has(id as never) ||
      !record(vow) ||
      vow.opponent !== id ||
      !oneOf(vow.kind, ['no-retreat', 'open-hatsu', 'single-hatsu']) ||
      typeof vow.sourceMatchId !== 'string'
    )
      continue
    vows[id as keyof typeof vows] = vow as never
  }
  return vows
}

function readOpponentKnowledge(value: unknown): CareerProfile['opponentKnowledge'] {
  const knowledge: CareerProfile['opponentKnowledge'] = {}
  if (!record(value)) return knowledge
  const ids = new Set(FIGHTING_ROSTER.map(({ id }) => id))
  for (const [id, dossier] of Object.entries(value)) {
    if (!ids.has(id as never) || !record(dossier) || !Array.isArray(dossier.entries)) continue
    const entries = dossier.entries.filter((entry) => {
      if (!record(entry) || typeof entry.fact !== 'string') return false
      return (
        (entry.fact === 'aura' || entry.fact === 'kameo' || entry.fact.startsWith('condition:')) &&
        isNumber(entry.observations) &&
        oneOf(entry.confidence, ['suspected', 'confirmed', 'established']) &&
        typeof entry.lastMatchId === 'string' &&
        isNumber(entry.lastSeenAt)
      )
    })
    knowledge[id as keyof typeof knowledge] = {
      opponent: id as keyof typeof knowledge,
      entries: entries.slice(0, 32) as never,
    }
  }
  return knowledge
}
function readAppearance(value: Record<string, unknown>): CareerProfile['appearance'] {
  return {
    theme: oneOf(value.theme, ['whale', 'heavens', 'nocturne']) ? value.theme : 'whale',
    intro: oneOf(value.intro, ['full', 'brief', 'off']) ? value.intro : 'full',
    victory: oneOf(value.victory, ['salute', 'ready', 'still']) ? value.victory : 'salute',
  } as CareerProfile['appearance']
}
function readTotals(value: Record<string, unknown>) {
  const totals: CareerProfile['totals'] = {}
  if (record(value.totals))
    for (const { id } of FIGHTING_ROSTER) {
      const entry = value.totals[id]
      if (
        record(entry) &&
        ['matches', 'wins', 'points', 'frames', 'bestCombo', 'bestComboDamage'].every((key) =>
          isNumber(entry[key]),
        )
      )
        totals[id] = entry as unknown as NonNullable<CareerProfile['totals'][typeof id]>
    }
  return {
    totals,
    revision: isNumber(value.revision) ? Number(value.revision) : 0,
    seen: Array.isArray(value.seen)
      ? value.seen
          .filter((id): id is string => typeof id === 'string' && id.length <= 100)
          .slice(-2000)
      : [],
    moraleSeen: Array.isArray(value.moraleSeen)
      ? value.moraleSeen
          .filter((id): id is string => typeof id === 'string' && id.length <= 100)
          .slice(-2000)
      : [],
  }
}
export function cleanCareerName(value: unknown): string {
  if (typeof value !== 'string') return 'Hunter'
  return (
    [...value]
      .filter((char) => char.charCodeAt(0) >= 32 && char.charCodeAt(0) !== 127)
      .join('')
      .trim()
      .slice(0, 24) || 'Hunter'
  )
}
export function mergeHistory(left: CareerMatch[], right: CareerMatch[]): CareerMatch[] {
  return [...new Map([...left, ...right].map((match) => [match.id, match])).values()]
    .sort((a, b) => b.at - a.at || a.id.localeCompare(b.id))
    .slice(0, 200)
}
export function browserCareerStorage(): Storage | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}
