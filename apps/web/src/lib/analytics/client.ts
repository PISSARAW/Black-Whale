import { parsePathname } from '$lib/i18n/config'

type Properties = Record<string, string | number | boolean>
type Payload = Record<string, unknown>
type Tracker = { track: (build: (defaults: Payload) => Payload) => unknown }
type Entry = { path: string; locale: string; name?: string; data?: Properties }
let tracker: Tracker | null = null
let enabled = false
let pending: Entry[] = []
let lastPath = ''

export function analyticsContext(pathname: string) {
  const { path, locale } = parsePathname(pathname.split(/[?#]/)[0])
  const parts = path.split('/').filter(Boolean)
  const section = parts[0] ?? 'home'
  const mode =
    section === 'tour' && parts[1] && !['modes', 'sources'].includes(parts[1])
      ? `tour-${parts[1]}`
      : section
  return { path, locale, section, mode }
}

function excluded() {
  if (typeof window === 'undefined') return true
  try {
    return localStorage.getItem('umami.disabled') === '1' || navigator.webdriver === true
  } catch {
    return true
  }
}

function send(entry: Entry) {
  if (!enabled || excluded()) return
  if (!tracker) {
    pending = [...pending.slice(-49), entry]
    return
  }
  try {
    // No query strings, hashes, page titles, free text, or persistent user IDs.
    const result = tracker.track((defaults) => ({
      ...defaults,
      url: entry.path,
      title: entry.path,
      referrer: typeof defaults.referrer === 'string' ? safeReferrer(defaults.referrer) : '',
      ...(entry.name ? { name: entry.name, data: entry.data } : {}),
    }))
    void Promise.resolve(result).catch(() => {})
  } catch {
    /* Analytics must never interrupt a game. */
  }
}

export function safeReferrer(value: string) {
  try {
    return new URL(value).origin
  } catch {
    return ''
  }
}

export function enableAnalytics(value: boolean) {
  enabled = value
  if (!value) {
    pending = []
    tracker = null
    lastPath = ''
  }
}

export function connectAnalytics(value: Tracker) {
  tracker = value
  const queued = pending
  pending = []
  for (const entry of queued) send(entry)
}

export function trackEvent(name: string, data: Properties = {}) {
  if (typeof window === 'undefined') return
  const context = analyticsContext(window.location.pathname)
  send({
    path: context.path,
    locale: context.locale,
    name,
    data: { ...data, section: context.section, mode: context.mode, locale: context.locale },
  })
}

export function trackPage(pathname: string) {
  if (!enabled || excluded() || pathname === lastPath) return
  lastPath = pathname
  const context = analyticsContext(pathname)
  send({ path: context.path, locale: context.locale })
  trackEvent('section_enter')
}

export function trackHatsuUse(hatsu: string, kind: string, result: string) {
  const mode =
    typeof window === 'undefined' ? 'unknown' : analyticsContext(window.location.pathname).mode
  trackEvent('hatsu_use', { hatsu, kind, result, surface_hatsu: `${mode} / ${hatsu}` })
}

/** Count an explicit body interaction; a miss is left to the room cast. */
export function trackBodyReach(reached: boolean, hatsu: { id: string; kind: string } | null) {
  if (reached && hatsu) trackHatsuUse(hatsu.id, hatsu.kind, 'body')
  return reached
}
