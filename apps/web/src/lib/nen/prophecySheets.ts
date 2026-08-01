/**
 * The sheets Lovely Ghostwriter reads from.
 *
 * `data/prophecies/prophecies.json` holds one poem per passenger, and the
 * character page has been rendering them since they were written. The Hatsu
 * overlay was inventing four generic lines instead, so the same technique said
 * something different depending on where it was used. It now reads the same
 * sheet the page does, and only falls back to improvising when the click did
 * not land on anyone.
 *
 * The catalogue is loaded on demand — the overlay is mounted on every page and
 * the file is 90 kB, so it must not sit in the main bundle. `loadProphecySheets`
 * is called when the technique is selected, well before the first click.
 */

interface RawProphecy {
  subjectId: string
  subjectName: string
  poem: string[]
  blank?: boolean
  desire: string
  foretells: string
}

export interface ProphecySheet {
  subjectId: string
  subjectName: string
  /** The four quatrain openers. Empty when the sheet was left blank. */
  poem: string[]
  /** Chrollo holds the pen, so his page stays unwritten. */
  blank: boolean
  foretells: string
}

let byId: Map<string, ProphecySheet> | null = null
let byName: Map<string, ProphecySheet> | null = null
let loading: Promise<void> | null = null

export function loadProphecySheets(): Promise<void> {
  loading ??= import('../../../../../data/prophecies/prophecies.json').then((module) => {
    const records = (module.default ?? module) as unknown as RawProphecy[]
    const sheets = records.map((record) => ({
      subjectId: record.subjectId,
      subjectName: record.subjectName,
      poem: record.blank ? [] : record.poem,
      blank: Boolean(record.blank),
      foretells: record.foretells,
    }))
    byId = new Map(sheets.map((sheet) => [sheet.subjectId, sheet]))
    byName = new Map(sheets.map((sheet) => [sheet.subjectName.toLowerCase(), sheet]))
  })
  return loading
}

/** Whether a click can be answered now, or has to wait for the catalogue. */
export const prophecySheetsReady = () => byId !== null

/** Only for tests: forgets the loaded catalogue so a case can load it again. */
export function resetProphecySheets() {
  byId = null
  byName = null
  loading = null
}

const CHARACTER_PATH = /\/characters\/([^/?#]+)/

/**
 * Who the quill was pointed at.
 *
 * A passenger is named in four places, in falling order of certainty: the map
 * marker's own id, a link to their page inside or around the target, the page
 * the visitor is standing on, and finally the name the marker carries.
 */
export function prophecySubjectFor(target: HTMLElement, pathname: string): ProphecySheet | null {
  if (!byId || !byName) return null

  const marker = target.closest<HTMLElement>('[data-hatsu-character]')
  const markerId = marker?.dataset.hatsuCharacter
  if (markerId && byId.has(markerId)) return byId.get(markerId) ?? null

  const link =
    target.closest<HTMLAnchorElement>('a[href*="/characters/"]') ??
    target.querySelector<HTMLAnchorElement>('a[href*="/characters/"]')
  const linked = link?.getAttribute('href')?.match(CHARACTER_PATH)?.[1]
  if (linked) {
    const sheet = byId.get(decodeURIComponent(linked))
    if (sheet) return sheet
  }

  const standing = pathname.match(CHARACTER_PATH)?.[1]
  if (standing) {
    const sheet = byId.get(decodeURIComponent(standing))
    if (sheet) return sheet
  }

  const named = marker?.dataset.hatsuCharacterName ?? target.dataset.hatsuCharacterName
  if (named) {
    const sheet = byName.get(named.trim().toLowerCase())
    if (sheet) return sheet
  }

  return null
}
