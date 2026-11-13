import type { Catalogue, Finding } from './types.js'

type Invariant = (catalogue: Catalogue) => Finding[]

function finding(rule: string, where: string, message: string): Finding {
  return { rule, where, message }
}

const publicEventIdsAreUnique: Invariant = ({ events }) => {
  const findings: Finding[] = []
  const seen = new Set<string>()
  for (const event of events) {
    if (seen.has(event.id)) {
      findings.push(finding('public-event-id', `events#${event.id}`, 'duplicate public id'))
    }
    seen.add(event.id)
  }
  return findings
}

const publicationSourcesResolve: Invariant = ({ characters, abilities, events, chapters }) => {
  const findings: Finding[] = []
  const lastChapter = Math.max(...chapters.map((chapter) => chapter.number))

  const check = (where: string, chapterId: string) => {
    if (chapterId === 'ch-unknown') return
    const match = /^ch-(\d+)(?:\.\d+)?$/.exec(chapterId)
    if (!match) {
      findings.push(finding('publication-source', where, `${chapterId} is not ch-<number>`))
    } else if (Number(match[1]) > lastChapter) {
      findings.push(
        finding(
          'publication-source',
          where,
          `${chapterId} is past the last catalogued chapter ${lastChapter}`,
        ),
      )
    }
  }

  for (const character of characters) {
    for (const source of character.sources) {
      check(`characters#${character.id}.sources`, source.chapterId)
    }
  }
  for (const ability of abilities) {
    for (const source of ability.sources) {
      check(`abilities#${ability.id}.sources`, source.chapterId)
    }
  }
  for (const event of events) {
    for (const source of event.sources) check(`events#${event.id}.sources`, source.chapterId)
  }
  return findings
}

export const PUBLICATION_INVARIANTS: ReadonlyArray<{ name: string; run: Invariant }> = [
  { name: 'public-event-ids-are-unique', run: publicEventIdsAreUnique },
  { name: 'publication-sources-resolve', run: publicationSourcesResolve },
]
