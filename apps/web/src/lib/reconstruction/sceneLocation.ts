export interface CatalogScene {
  event: string
  locationId?: string
}

export interface CatalogChapterScenes {
  number: number
  timeline?: readonly CatalogScene[]
}

interface SceneLocationRequest {
  chapterNumber: number
  eventTitle: string
  chapters: readonly CatalogChapterScenes[]
}

const IGNORED_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'at',
  'from',
  'in',
  'is',
  'of',
  'on',
  'the',
  'their',
  'to',
  'with',
])

const MINIMUM_SCORE = 0.5
const AMBIGUITY_MARGIN = 0.05

function words(value: string): Set<string> {
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
  return new Set(normalized.split(/\s+/).filter((word) => word && !IGNORED_WORDS.has(word)))
}

function similarity(left: Set<string>, right: Set<string>): number {
  if (left.size === 0 || right.size === 0) return 0
  let shared = 0
  for (const word of left) if (right.has(word)) shared += 1
  return (2 * shared) / (left.size + right.size)
}

/**
 * Recover an event's room from the chapter catalogue when an older database
 * row predates NarrativeEvent.locationId.
 *
 * Titles in the event log and the atomic chapter scenes are independently
 * edited, so exact equality would miss small clarifications such as “Sandra”
 * replacing “a servant”. A token score accepts those edits but refuses both a
 * weak match and two similarly plausible scenes in different rooms.
 */
export function catalogSceneLocation(request: SceneLocationRequest): string | null {
  const chapter = request.chapters.find((candidate) => candidate.number === request.chapterNumber)
  const candidates = (chapter?.timeline ?? []).filter((scene) => scene.locationId)
  const titleWords = words(request.eventTitle)
  const ranked = candidates
    .map((scene) => ({ scene, score: similarity(titleWords, words(scene.event)) }))
    .sort((left, right) => right.score - left.score)
  const best = ranked[0]
  if (!best || best.score < MINIMUM_SCORE) return null

  const rival = ranked.find((candidate) => candidate.scene.locationId !== best.scene.locationId)
  if (rival && best.score - rival.score < AMBIGUITY_MARGIN) return null
  return best.scene.locationId ?? null
}
