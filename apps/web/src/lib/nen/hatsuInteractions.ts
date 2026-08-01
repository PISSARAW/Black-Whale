import { goto } from '$app/navigation'
import type { Page } from '@sveltejs/kit'

import { playHatsuNote, setAmbientMuffled } from '$lib/audio/ambient.js'
import { mapState } from '$lib/state/mapState.svelte'
import { deactivateHatsu } from './hatsuState.js'
import { loadProphecySheets, prophecySheetsReady, prophecySubjectFor } from './prophecySheets.js'
import type { HatsuInteractionKind, HatsuProfile } from './hatsuRegistry.js'
import type { HatsuStatusMessages } from '$lib/i18n/hatsuStatus'

/** Where on the screen a readout is pinned, in client coordinates. */
export type ScreenPoint = {
  x: number
  y: number
}

/** What a readout says beyond its label: a warning, and lines under it. */
export type PointDetail = {
  alert?: boolean
  details?: string[]
}

export type Point = ScreenPoint &
  PointDetail & {
    label: string
    id: number
  }
export type StoredItem = {
  id: number
  element: HTMLElement
  label: string
  mode: 'cloth' | 'space' | 'vacuum' | 'relay'
}
export type FloatingCard = {
  id: number
  x: number
  y: number
  label: string
  kind: 'projection'
  href?: string | null
}
export type BirdDispatch = { id: number; label: string; href: string | null }
export type GuideItem = { id: number; label: string; element: HTMLElement; href: string | null }

/**
 * Everything a Hatsu interaction is allowed to touch.
 *
 * The component keeps owning the state: it hands over accessors whose setters
 * assign to its own `let` bindings, so the assignment still happens inside the
 * component and Svelte's legacy reactivity keeps seeing it. Mutating a plain
 * object here instead would leave the template frozen.
 */
export interface HatsuInteractionContext {
  /** The technique being run; branches read its id to exclude it from a steal. */
  profile: HatsuProfile
  /** Snapshot of the `page` store, which cannot be auto-subscribed outside a component. */
  page: Page
  /** What the technique says while it runs, in the visitor's language. */
  m: HatsuStatusMessages
  parallelFutureVisible: boolean

  status: string
  points: Point[]
  sequence: number
  cardIndex: number
  selectedElements: HTMLElement[]
  floatingCards: FloatingCard[]
  prophecyLines: string[]
  stolenTarget: HTMLElement | null
  puppetTarget: HTMLElement | null
  puppetExecuting: boolean
  sensesStage: number
  windupPower: number
  infectionLevel: number
  studyTarget: string
  studyCount: number
  trainingTarget: HTMLElement | null
  trainingOrigin: { x: number; y: number }
  observerReports: { label: string; count: number }[]
  birdDispatches: BirdDispatch[]
  capturedTechniques: HatsuProfile[]
  dowsingSignal: number
  crossGameTarget: HTMLElement | null
  guideTitle: string
  guideItems: GuideItem[]
  dialBest: { score: number; item: GuideItem } | null

  readonly cursor: { x: number; y: number }
  readonly storedItems: StoredItem[]
  readonly observers: MutationObserver[]
  readonly tribunalCards: string[]

  remember: (element: HTMLElement) => HTMLElement
  addPoint: (at: ScreenPoint, label: string, extra?: PointDetail) => void
  targetLabel: (target: HTMLElement) => string
  applyTransform: (element: HTMLElement, transform: string) => void
  guideItemFor: (target: HTMLElement, label?: string) => GuideItem
  executeSiteTarget: (element: HTMLElement) => void
  schedule: (callback: () => void, delay: number) => void
  storeElement: (element: HTMLElement, label: string, mode: StoredItem['mode']) => void
  profilesFromTarget: (target: HTMLElement) => HatsuProfile[]
  moveByRects: (first: HTMLElement, second: HTMLElement) => void
  followGuide: (item: GuideItem) => void
}

export interface HatsuInteractionArgs {
  event: MouseEvent
  target: HTMLElement
  x: number
  y: number
  label: string
}

/**
 * Returns true when the technique consumed the click. Returning false lets the
 * caller fall through to the page's own behaviour.
 */
export type HatsuInteractionHandler = (
  ctx: HatsuInteractionContext,
  args: HatsuInteractionArgs,
) => boolean

/**
 * Kinds whose interaction is not a plain per-click effect and stays in the
 * component: they own timers, portals or a recording loop that spans clicks.
 */
export const HATSU_KINDS_HANDLED_IN_COMPONENT = new Set<HatsuInteractionKind>([
  'arrow',
  'capture',
  'elastic',
  'guardian',
  'inherit',
  'portal',
])

/** Marks every Gallery Fake replica so the cleanup pass can sweep them away. */
export const GALLERY_FAKE_CLASS = 'hatsu-gallery-fake'

/**
 * Freeze the rendered appearance of the clicked node onto its copy.
 *
 * Only the root needs this: the copy is re-parented to `body`, so it loses the
 * cascade it was inheriting from — font, colour, background. Everything below
 * it keeps its own classes and goes on matching its own rules inside the copied
 * subtree, so walking the descendants would buy almost nothing and cost a full
 * style read per node. On a section with a few hundred children that read is
 * the difference between the copy appearing at once and the page hanging on the
 * click, which is the whole point of a technique that fires on a click.
 */
function freezeComputedStyle(source: Element, copy: HTMLElement) {
  const computed = getComputedStyle(source)
  let declarations = ''
  for (const property of computed)
    declarations += `${property}:${computed.getPropertyValue(property)};`
  copy.style.cssText = declarations
}

/**
 * Where the copy lands. Kortopi holds his copies next to what he copied, and a
 * duplicate stacked on the original would be invisible: the reader has to be
 * able to see that there are now two of the object. Beside it when the viewport
 * has the room, under it otherwise.
 */
function galleryFakeOffset(rect: DOMRect) {
  const gap = 12
  if (rect.right + gap + rect.width <= innerWidth) return { dx: rect.width + gap, dy: 0 }
  if (rect.left - gap - rect.width >= 0) return { dx: -(rect.width + gap), dy: 0 }
  return { dx: 0, dy: rect.height + gap }
}

/**
 * Build the perfect-looking inert duplicate: a real copy of the clicked node,
 * laid beside the original. It looks like the object and swallows the clicks
 * aimed at it, but every control inside it is dead — the copy has the shape and
 * none of the powers.
 */
function buildGalleryFake(target: HTMLElement): HTMLElement | null {
  const rect = target.getBoundingClientRect()
  if (!rect.width || !rect.height) return null

  const { dx, dy } = galleryFakeOffset(rect)
  const replica = target.cloneNode(true) as HTMLElement
  freezeComputedStyle(target, replica)
  // Attribute writes only, on a subtree that is not in the document yet: no
  // style is read here, so this stays cheap however deep the copy runs.
  for (const copy of [replica, ...replica.querySelectorAll<HTMLElement>('*')]) {
    copy.removeAttribute('id')
    copy.setAttribute('tabindex', '-1')
    if (copy instanceof HTMLAnchorElement) copy.removeAttribute('href')
    if ('disabled' in copy) (copy as HTMLButtonElement).disabled = true
  }

  replica.classList.add(GALLERY_FAKE_CLASS)
  replica.setAttribute('aria-hidden', 'true')
  replica.dataset.hatsuFake = 'gallery-fake'
  // Document coordinates, so the copy stays glued to the page on scroll.
  replica.style.setProperty('position', 'absolute', 'important')
  replica.style.setProperty('left', `${rect.left + scrollX + dx}px`, 'important')
  replica.style.setProperty('top', `${rect.top + scrollY + dy}px`, 'important')
  replica.style.setProperty('width', `${rect.width}px`, 'important')
  replica.style.setProperty('height', `${rect.height}px`, 'important')
  replica.style.setProperty('margin', '0', 'important')
  // Above the page it sits on, below the technique's own overlay.
  replica.style.setProperty('z-index', '60', 'important')
  replica.style.setProperty('pointer-events', 'auto', 'important')
  // Not `!important`: the peel-off animation has to be able to drive it.
  replica.style.setProperty('transform', 'none')
  // The animation starts the copy on top of the original and slides it out.
  replica.style.setProperty('--gallery-fake-dx', `${-dx}px`)
  replica.style.setProperty('--gallery-fake-dy', `${-dy}px`)
  return replica
}

/** Everything a technique can seal, hand back, or count as a control. */
const CONTROL_SELECTOR = 'a,button,input,select,textarea'

const RESTRICTED_SELECTOR = '[hidden],[disabled],[aria-disabled="true"],[aria-hidden="true"]'

const controlsOf = (element: HTMLElement) =>
  Array.from(element.querySelectorAll<HTMLElement>(CONTROL_SELECTOR))

const isRestricted = (element: HTMLElement) =>
  element.hidden ||
  ('disabled' in element && (element as HTMLButtonElement).disabled) ||
  element.getAttribute('aria-disabled') === 'true' ||
  element.getAttribute('aria-hidden') === 'true'

/**
 * Hands a sealed control back to the page. Several techniques restore things,
 * so the *mechanism* is shared here on purpose; what differs between them is
 * which element they are allowed to reach and what it costs, not this.
 */
const liftRestriction = (element: HTMLElement) => {
  element.hidden = false
  element.removeAttribute('aria-disabled')
  element.removeAttribute('aria-hidden')
  if ('disabled' in element) (element as HTMLButtonElement).disabled = false
  element.style.pointerEvents = 'auto'
  element.style.opacity = '1'
}

/** Per-element counter kept in the DOM so it survives across clicks. */
const counterOn = (element: HTMLElement, step = 1) => {
  const next = Number(element.dataset.hatsuLevel || 0) + step
  element.dataset.hatsuLevel = String(next)
  return next
}

/** Centre-to-centre pixels, for the techniques whose canon range is real. */
const distanceBetween = (first: HTMLElement, second: HTMLElement) => {
  const a = first.getBoundingClientRect()
  const b = second.getBoundingClientRect()
  return Math.hypot(
    a.left + a.width / 2 - b.left - b.width / 2,
    a.top + a.height / 2 - b.top - b.height / 2,
  )
}

/**
 * The other passengers of a marker's own camp, on the map as it stands.
 *
 * The map tags every marker with the faction chips it belongs to, so "among its
 * own" can be read off the page instead of guessed. A passenger with no chip at
 * all falls back to the rest of the manifest — a curse still has to land on
 * somebody.
 */
function kinOf(target: HTMLElement) {
  const own = (target.dataset.hatsuFactions || '').split('|').filter(Boolean)
  const manifest = Array.from(
    document.querySelectorAll<HTMLElement>('[data-hatsu-character]'),
  ).filter((candidate) => candidate !== target && !target.contains(candidate))
  if (!own.length) return manifest
  const kin = manifest.filter((candidate) =>
    (candidate.dataset.hatsuFactions || '')
      .split('|')
      .some((faction) => faction && own.includes(faction)),
  )
  return kin.length ? kin : manifest
}

/**
 * Whether a technique made this. Little Eye refuses conjured creatures, Blinky
 * refuses Nen outright, Voconte's door will not move it and Double Machine Gun
 * tears through it — so they all need the same question answered.
 */
const isNenMade = (element: HTMLElement) =>
  Boolean(element.dataset.hatsuConjured) ||
  Array.from(element.classList).some((name) => name.startsWith('hatsu-'))

/** Little Eye tops out at a hamster; this is that hamster, in pixels². */
const SMALL_HOST_AREA = 26000

/**
 * Marks what Pain Packer has packed away. It is a class rather than a counter
 * held in the technique's state because the two halves of Feitan's kit are cast
 * separately: Rising Sun has to be able to read what the armour stored, and the
 * page is the only thing both of them see.
 */
export const PAIN_PACKER_CLASS = 'hatsu-pain-packer'

const packedHits = () => Array.from(document.querySelectorAll<HTMLElement>(`.${PAIN_PACKER_CLASS}`))

/**
 * How many heads Order Stamp's 人 can be on at once.
 *
 * The walk keeps a count of its own under the same figure — see `STAMP_LIMIT`
 * in `$lib/tour/hatsu` — because nothing pure may reach into this file, which
 * is a page's worth of DOM from end to end.
 */
const STAMP_LIMIT = 20

/** Zazan's radius came from the damage taken first; so does this one, in pixels. */
const SUN_FLARE_BASE_RADIUS = 140
const SUN_FLARE_RADIUS_PER_HIT = 90

/**
 * One entry per technique, replacing the `else if (profile.kind === …)` chain
 * that used to carry all of them in a single function. The kind is the key, so
 * a technique is added by adding a row rather than by editing a branch.
 *
 * Every entry is written against its canon mechanics rather than against a
 * generic shape: where two techniques used to share a skeleton, the difference
 * that separates them in the manga is what the code now branches on.
 */
export const HATSU_INTERACTION_BY_KIND: Partial<
  Record<HatsuInteractionKind, HatsuInteractionHandler>
> = {
  disguise: (ctx, { target, x, y, label }) => {
    const element = ctx.remember(target)
    const texture = (Number(element.dataset.hatsuLevel || 0) + 1) % 4
    const forgery = ctx.m.tokens.forgeries[texture]
    element.dataset.hatsuLevel = String(texture)
    element.dataset.hatsuForgery = forgery
    element.classList.add('hatsu-texture-surprise')
    element.style.setProperty('--texture-index', String(texture))
    element.setAttribute('aria-label', ctx.m.tokens.forgeryAria(forgery))
    ctx.status = ctx.m['disguise'].forged(label, forgery)
    ctx.addPoint({ x, y }, label)
    return true
  },
  scarlet: (ctx, { target, x, y }) => {
    // Emperor Time is not a repair job on one element: it raises Force and
    // Accuracy to 100% in every category at once, and bills an hour of life per
    // second it stays on. So it sweeps a whole scope, and it keeps the tab.
    const scope = target.closest<HTMLElement>('section, article, main') || target
    const sealed = [scope, ...scope.querySelectorAll<HTMLElement>(RESTRICTED_SELECTOR)]
    let freed = 0
    for (const element of sealed) {
      if (!isRestricted(element)) continue
      ctx.remember(element).classList.add('hatsu-full-efficiency')
      liftRestriction(element)
      freed += 1
    }
    for (const details of scope.querySelectorAll('details')) {
      if (!(details instanceof HTMLDetailsElement) || details.open) continue
      ctx.remember(details)
      details.open = true
      freed += 1
    }
    ctx.studyCount += 1
    const life = ctx.studyCount * 3
    ctx.status = ctx.m['scarlet'].swept(ctx.targetLabel(scope), freed, life)
    ctx.addPoint({ x, y }, `100% · −${life}h`, { alert: !freed })
    return true
  },
  'chain-rule': (ctx, { target, x, y, label }) => {
    // The syringe asks no questions and sets no conditions: it drains the aura,
    // takes one ability with it, and the owner stays in Zetsu until it is given
    // back. Stealth Dolphin is what does something with what it took.
    const techniques = ctx.profilesFromTarget(target)
    const drained = ctx.remember(target)
    drained.classList.add('hatsu-aura-drained')
    drained.style.filter = 'saturate(.25)'
    if (!techniques.length) {
      ctx.status = ctx.m['chain-rule'].nothingToTake(label)
      ctx.addPoint({ x, y }, label, { alert: true })
      return true
    }
    ctx.capturedTechniques = techniques.slice(0, 1)
    drained.setAttribute('aria-disabled', 'true')
    for (const control of controlsOf(drained)) {
      ctx.remember(control)
      control.style.pointerEvents = 'none'
    }
    ctx.status = ctx.m['chain-rule'].drained(ctx.capturedTechniques[0].name, label)
    ctx.addPoint({ x, y }, label, { details: techniques.map((technique) => technique.name) })
    return true
  },
  'chain-bind': (ctx, { target, x, y, label }) => {
    const name = target.dataset.hatsuCharacterName || label
    const spiders =
      /chrollo|nobunaga|feitan|phinks|franklin|machi|shizuku|bonolenov|kalluto|illumi/i
    if (!spiders.test(name)) {
      ctx.remember(target).classList.add('hatsu-invalid-chain-target')
      ctx.status = ctx.m['chain-bind'].vowViolated(name)
      ctx.addPoint({ x, y }, ctx.m.tokens.fatalVow, { alert: true })
      ctx.schedule(() => deactivateHatsu(), 1400)
    } else {
      ctx.remember(target).classList.add('hatsu-chain-jailed')
      target.style.pointerEvents = 'none'
      ctx.status = ctx.m['chain-bind'].bound(name)
      ctx.addPoint({ x, y }, name)
    }
    return true
  },
  dowsing: (ctx, { target, x, y, label }) => {
    const uncertainty = /unknown|suspect|probable|unconfirmed|possibly|alleged/i.test(
      `${label} ${target.textContent || ''}`,
    )
    ctx.dowsingSignal = uncertainty
      ? 92
      : Math.min(88, 35 + target.querySelectorAll('a,button').length * 12)
    ctx.remember(target).classList.add(uncertainty ? 'hatsu-dowsing-alert' : 'hatsu-dowsing-found')
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    target.focus({ preventScroll: true })
    ctx.status = ctx.m['dowsing'].probed(uncertainty, label, ctx.dowsingSignal)
    ctx.addPoint({ x, y }, label, { alert: uncertainty, details: [`Signal ${ctx.dowsingSignal}%`] })
    return true
  },
  enhance: (ctx, { target, x, y, label }) => {
    // Enhancement makes what is already there bigger and harder. It never opens
    // anything that was closed — that is somebody else's category.
    const element = ctx.remember(target)
    const level = Math.min(5, counterOn(element))
    element.dataset.hatsuLevel = String(level)
    element.classList.add('hatsu-reinforced')
    // The scale is on `.hatsu-reinforced` itself, keyed off this variable.
    element.style.setProperty('--reinforcement', String(level))
    if (level === 5) {
      for (const neighbour of Array.from(element.parentElement?.children || [])) {
        if (!(neighbour instanceof HTMLElement) || neighbour === element) continue
        ctx.remember(neighbour).classList.add('hatsu-reinforced-spill')
      }
    }
    ctx.status = ctx.m['enhance'].reinforced(level === 5, label, level)
    ctx.addPoint({ x, y }, ctx.m.tokens.ren(level))
    return true
  },
  growth: (ctx, { target, x, y, label }) => {
    const element = ctx.remember(target)
    const living = Boolean(target.closest('[data-hatsu-character]'))
    const increment = living ? 1 : 2
    const level = Math.min(10, Number(element.dataset.hatsuLevel || 0) + increment)
    element.dataset.hatsuLevel = String(level)
    element.classList.add('hatsu-erigeron-grown')
    ctx.applyTransform(element, `scale(${1 + level * 0.035})`)
    element.style.filter = `saturate(${1 + level * 0.08}) brightness(${1 + level * 0.025})`
    const details = target.closest('details') || target.querySelector('details')
    if (details instanceof HTMLDetailsElement) {
      ctx.remember(details)
      details.open = true
    }
    const dormant = target.querySelector<HTMLElement>('[hidden], [aria-hidden="true"]')
    if (dormant) {
      ctx.remember(dormant)
      dormant.hidden = false
      dormant.removeAttribute('aria-hidden')
    }
    ctx.status = ctx.m['growth'].grown(living, label, level)
    ctx.addPoint({ x, y }, ctx.m.tokens.grow(level))
    return true
  },
  vehicle: (ctx, { target, x, y, label }) => {
    if (ctx.selectedElements.includes(target) && ctx.selectedElements.length >= 2) {
      const fuel = ctx.selectedElements.length * 20
      ctx.selectedElements.forEach((passenger, index) => {
        ctx.remember(passenger)
        passenger.style.transition = 'transform 1s cubic-bezier(.2,.8,.2,1), filter .9s ease'
        // The fuel is the passengers' own aura, so they arrive spent.
        passenger.style.filter = 'saturate(.35) brightness(.85)'
        ctx.applyTransform(
          passenger,
          `translateX(${Math.min(innerWidth * 0.45, 360)}px) translateY(${index * 4}px) scale(.82)`,
        )
      })
      ctx.status = ctx.m['vehicle'].launched(ctx.selectedElements.length, fuel)
    } else if (ctx.selectedElements.length < 5 && !ctx.selectedElements.includes(target)) {
      ctx.selectedElements = [...ctx.selectedElements, target]
      ctx.remember(target).classList.add('hatsu-passenger')
      ctx.status = ctx.m['vehicle'].boarding(ctx.selectedElements.length)
      ctx.addPoint({ x, y }, label)
    } else if (ctx.selectedElements.includes(target)) {
      ctx.status = ctx.m['vehicle'].alreadyAboard(label)
    } else {
      ctx.status = ctx.m['vehicle'].full(label)
    }
    return true
  },
  scout: (ctx, { target, x, y, label }) => {
    // The aura ball can only take hold of a small living thing — a hamster is
    // the ceiling — and it slides off anything that was made out of aura.
    if (isNenMade(target)) {
      ctx.status = ctx.m['scout'].conjured(label)
      ctx.addPoint({ x, y }, ctx.m.tokens.conjured, { alert: true })
      return true
    }
    const rect = target.getBoundingClientRect()
    const size = Math.round(rect.width * rect.height)
    if (size > SMALL_HOST_AREA) {
      ctx.status = ctx.m['scout'].tooBig(Math.round(size / SMALL_HOST_AREA), label)
      ctx.addPoint({ x, y }, ctx.m.tokens.tooBig, { alert: true })
      return true
    }
    ctx.floatingCards = [
      {
        id: ++ctx.sequence,
        x: Math.min(innerWidth - 270, x + 25),
        y: Math.min(innerHeight - 160, y + 20),
        label: `${label} · ${target.querySelectorAll('a').length} paths · ${target.querySelectorAll('[data-hatsu-character]').length} auras`,
        kind: 'projection',
      },
    ]
    ctx.remember(target).classList.add('hatsu-little-eye-host')
    ctx.status = ctx.m['scout'].taken(size)
    ctx.addPoint({ x, y }, label)
    return true
  },
  tribunal: (ctx, { target, x, y, label }) => {
    // Blue admits to the court, Yellow puts the defendant under its control,
    // the reversed Yellow boxes them in — briefly, it wears off — and Red
    // dismisses them, which means out of the court, not off the page.
    if (ctx.crossGameTarget !== target) {
      ctx.crossGameTarget = target
      ctx.cardIndex = 0
    }
    const element = ctx.remember(target)
    if (ctx.cardIndex === 0) {
      element.classList.add('hatsu-cross-blue')
      ctx.status = ctx.m['tribunal'].blue(label)
      ctx.cardIndex = 1
    } else if (ctx.cardIndex === 1) {
      element.classList.add('hatsu-cross-warning')
      ctx.executeSiteTarget(element)
      ctx.status = ctx.m['tribunal'].yellow(label)
      ctx.cardIndex = 2
    } else if (ctx.cardIndex === 2) {
      element.classList.add('hatsu-cross-restrained')
      element.setAttribute('aria-disabled', 'true')
      for (const control of controlsOf(element)) {
        ctx.remember(control)
        control.style.pointerEvents = 'none'
      }
      ctx.status = ctx.m['tribunal'].yellowReversed(label)
      ctx.cardIndex = 3
      // Restraint wears off quickly and can simply be issued again.
      ctx.schedule(() => {
        element.classList.remove('hatsu-cross-restrained')
        element.removeAttribute('aria-disabled')
        for (const control of controlsOf(element)) control.style.pointerEvents = 'auto'
        if (ctx.crossGameTarget === element) ctx.cardIndex = 1
        ctx.status = ctx.m['tribunal'].released(label)
      }, 3200)
    } else {
      element.classList.add('hatsu-cross-expelled')
      element.style.opacity = '.3'
      element.style.pointerEvents = 'none'
      ctx.crossGameTarget = null
      ctx.cardIndex = 0
      ctx.status = ctx.m['tribunal'].red(label)
    }
    ctx.addPoint({ x, y }, ctx.tribunalCards[Math.min(3, ctx.cardIndex)])
    return true
  },
  curse: (ctx, { target, x, y, label }) => {
    // Beyond chose the victim decades ago and chose the sacrifice himself, in
    // the same moment. Nobody picks the carrier, the mark cannot be seen without
    // Gyo, and he left no signature on it that points back at him.
    if (!ctx.selectedElements.length) {
      // "Among its own": the sacrifice is a different passenger of the victim's
      // own camp, chosen at the same moment and left somewhere else entirely.
      // Hiding it inside the victim, as this did, left Gyo nothing to search.
      const kin = kinOf(target)
      if (!kin.length) {
        ctx.status = ctx.m['curse'].noKin(label)
        ctx.addPoint({ x, y }, ctx.m.tokens.noTrace, { alert: true })
        return true
      }
      const sacrifice = kin[label.length % kin.length]
      ctx.selectedElements = [target, sacrifice]
      ctx.remember(target).classList.add('hatsu-curse-victim')
      // The mark shows nothing: no class, only the bookkeeping Gyo answers to.
      ctx.remember(sacrifice).dataset.hatsuLevel = 'cursed'
      ctx.status = ctx.m['curse'].victim(label)
      ctx.addPoint({ x, y }, ctx.m.tokens.victim(label))
      return true
    }
    const [victim, sacrifice] = ctx.selectedElements
    if (target !== sacrifice) {
      // Gyo: the mark is invisible, so all the search returns is how close the
      // aura felt — which is what makes finding it worth doing.
      const near = distanceBetween(target, sacrifice) < 160
      ctx.remember(target).classList.add(near ? 'hatsu-beyond-cursed' : 'hatsu-gyo-empty')
      ctx.status = ctx.m['curse'].searched(near, label)
      ctx.addPoint({ x, y }, near ? ctx.m.tokens.markFound : ctx.m.tokens.noTrace, { alert: !near })
      return true
    }
    ctx.remember(sacrifice).classList.add('hatsu-sacrifice-dead')
    ctx.remember(victim).classList.add('hatsu-curse-triggered')
    victim.style.pointerEvents = 'none'
    // The victim is somewhere else on the ship, which is the whole point of the
    // technique: it has to be shown dying at that distance.
    victim.scrollIntoView({ behavior: 'smooth', block: 'center' })
    ctx.status = ctx.m['curse'].spent(ctx.targetLabel(victim))
    ctx.addPoint({ x, y }, 'POST-MORTEM', { alert: true })
    return true
  },
  blast: (ctx, { target, x, y, label }) => {
    // Vincent aimed it at someone stopping bullets with their aura. The point
    // is the guard, not the knockback, and it never needed to touch anything.
    const guarded = [target, ...target.querySelectorAll<HTMLElement>('[class*="hatsu-"]')]
    let broken = 0
    for (const element of guarded) {
      if (!(element instanceof HTMLElement)) continue
      const guards = Array.from(element.classList).filter(
        (name) => name.startsWith('hatsu-') && name !== 'hatsu-air-blown',
      )
      if (!guards.length && element.style.pointerEvents !== 'none') continue
      ctx.remember(element)
      for (const guard of guards) element.classList.remove(guard)
      element.style.pointerEvents = 'auto'
      element.removeAttribute('aria-disabled')
      broken += 1
    }
    ctx.remember(target).classList.add('hatsu-air-blown')
    ctx.status = ctx.m['blast'].fired(broken, label)
    ctx.addPoint({ x, y }, broken ? ctx.m.tokens.guardsBroken(broken) : ctx.m.tokens.noGuard, {
      alert: !broken,
    })
    return true
  },
  surveillance: (ctx, { target, x, y, label }) => {
    ctx.selectedElements.forEach((element) => element.classList.remove('hatsu-secret-window'))
    ctx.selectedElements = [target]
    ctx.remember(target).classList.add('hatsu-secret-window')
    const change = target.dataset.hatsuNextChange || 'stable'
    const alert = change === 'dead' || change === 'moved'
    ctx.points = [{ x, y, label, id: ++ctx.sequence, alert, details: [`Next chapter: ${change}`] }]
    ctx.status = ctx.m['surveillance'].recorded(change === 'dead', change === 'moved', label)
    return true
  },
  future: (ctx, { target, x, y, label }) => {
    ctx.addPoint({ x, y }, ctx.m.tokens.predicted(label))
    ctx.remember(target).classList.add('hatsu-future-afterimage')
    ctx.status = ctx.m['future'].predicted(ctx.parallelFutureVisible, label, ctx.points.length)
    return true
  },
  resurrection: (ctx, { target, x, y, label }) => {
    const killer = target
    ctx.remember(killer).classList.add('hatsu-camilla-killer')
    ctx.status = ctx.m['resurrection'].killed(label)
    ctx.addPoint({ x, y }, label)
    ctx.schedule(() => {
      ctx.remember(killer).classList.add('hatsu-cat-crushed')
      killer.style.pointerEvents = 'none'
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' })
      ctx.status = ctx.m['resurrection'].absorbed(label)
    }, 900)
    return true
  },
  poetry: (ctx, { target, x, y, label }) => {
    // Whatever Basho writes becomes real, and *which* real thing depends on the
    // word of invocation in it: "light" purifies, fire burns. A seasonal word
    // makes it stronger, and a poem with neither stays a piece of paper.
    ctx.addPoint({ x, y }, label)
    ctx.cardIndex += 1
    if (ctx.cardIndex < 3) {
      ctx.remember(target).classList.add('hatsu-haiku-line')
      ctx.status = ctx.m['poetry'].line(ctx.cardIndex)
      return true
    }
    ctx.cardIndex = 0
    const poem = ctx.points
      .slice(-3)
      .map((point) => point.label)
      .join(' / ')
    const seasonal = /spring|summer|autumn|winter|snow|frost|tide|storm|dawn|bloom/i.test(poem)
    document.body.classList.add('hatsu-haiku-weather')
    if (/light|clear|pure|holy|bright|glitter/i.test(poem)) {
      const purified = target.closest<HTMLElement>('section, article') || target
      let cleared = 0
      for (const sealed of [
        purified,
        ...purified.querySelectorAll<HTMLElement>(RESTRICTED_SELECTOR),
      ]) {
        if (!isRestricted(sealed)) continue
        ctx.remember(sealed)
        liftRestriction(sealed)
        cleared += 1
      }
      ctx.status = ctx.m['poetry'].light(ctx.targetLabel(purified), poem, cleared, seasonal)
      ctx.addPoint({ x, y }, seasonal ? ctx.m.tokens.lightSeasonal : ctx.m.tokens.light)
      return true
    }
    if (/fire|burn|flame|ash|blood|death|kill|break/i.test(poem)) {
      const burnt = ctx.remember(target)
      burnt.classList.add('hatsu-haiku-burnt')
      burnt.style.pointerEvents = 'none'
      burnt.style.opacity = seasonal ? '.1' : '.3'
      ctx.status = ctx.m['poetry'].fire(poem, label, seasonal)
      ctx.addPoint({ x, y }, seasonal ? ctx.m.tokens.fireSeasonal : ctx.m.tokens.fire, {
        alert: true,
      })
      return true
    }
    ctx.remember(target).classList.add('hatsu-haiku-weak')
    ctx.status = ctx.m['poetry'].inert(poem)
    ctx.addPoint({ x, y }, ctx.m.tokens.noInvocation, { alert: true })
    return true
  },
  restoration: (ctx, { target, x, y, label }) => {
    // A massage, not a reset button: Cookie works on the thing under her hands
    // and what it can no longer do. Whatever the section holds shut — a control
    // that answers to nothing, a fold nobody opened, a body kept out of reach —
    // is what hours of rest would have given back, so that is what she gives.
    const scope = target.closest<HTMLElement>('article, section, main') ?? target
    // Only what the section can no longer *do* counts as tired: a control that
    // answers to nothing, a fold nobody opened. Decorative `aria-hidden` markup
    // is not exhaustion — counting it reported hundreds of things restored.
    const tiredControls = Array.from(
      scope.querySelectorAll<HTMLElement>(`${CONTROL_SELECTOR},details`),
    )
    let relieved = 0
    for (const tired of tiredControls) {
      if (tired.hasAttribute('hidden') || tired.matches('[disabled],[aria-disabled="true"]')) {
        ctx.remember(tired)
        liftRestriction(tired)
        relieved += 1
      }
      if (tired instanceof HTMLDetailsElement && !tired.open) {
        ctx.remember(tired)
        tired.open = true
        relieved += 1
      }
    }
    ctx.remember(target).classList.add('hatsu-restored')
    mapState.currentZoomLevel = 'OVERVIEW'
    mapState.selectedTier = null
    mapState.selectedLocationId = null
    mapState.currentEventIndex = 0
    const cleanUrl = ctx.page.url.pathname
    if (ctx.page.url.search)
      void goto(cleanUrl, { replaceState: true, noScroll: true, keepFocus: true })
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    ctx.status = ctx.m['restoration'].restored(relieved, label)
    ctx.addPoint({ x, y }, relieved ? ctx.m.tokens.rested(relieved) : label)
    return true
  },
  transformation: (ctx, { target, x, y, label }) => {
    // The small body is a real trade: it hides how strong she is by actually
    // being weaker. Reverting gives all of it back, and then some.
    const element = ctx.remember(target)
    const small = element.classList.toggle('hatsu-transformed-body')
    element.style.transition = 'transform .45s ease'
    ctx.applyTransform(element, small ? 'scale(.74)' : 'scale(1.05)')
    const controls = controlsOf(element)
    // One control still works small: the disguise has to remain convincing.
    for (const control of controls.slice(small ? 1 : 0)) {
      ctx.remember(control)
      control.style.pointerEvents = small ? 'none' : 'auto'
      control.style.opacity = small ? '.4' : '1'
    }
    ctx.status = ctx.m['transformation'].toggled(
      small,
      Math.max(0, controls.length - 1),
      controls.length,
      label,
    )
    ctx.addPoint({ x, y }, small ? ctx.m.tokens.small(label) : ctx.m.tokens.trueForm(label))
    return true
  },
  rhythm: (ctx, { target, x, y, label }) => {
    // Prologue is not a rhythm game. The piece conjures warrior attire and a
    // spear: what it dresses gains reach, and stops being easy to reach.
    const armed = ctx.remember(target)
    armed.classList.add('hatsu-prologue-armed')
    armed.dataset.hatsuConjured = 'prologue'
    document.body.classList.add('hatsu-rhythm')
    const reach = Array.from(target.parentElement?.children || [])
      .filter(
        (sibling): sibling is HTMLElement => sibling instanceof HTMLElement && sibling !== target,
      )
      .slice(0, 3)
    for (const struck of reach) {
      ctx.remember(struck).classList.add('hatsu-spear-reach')
      struck.style.transition = 'transform .35s ease'
      ctx.applyTransform(struck, 'translateX(-10px)')
    }
    ctx.status = ctx.m['rhythm'].armed(reach.length, label)
    ctx.addPoint({ x, y }, ctx.m.tokens.armed(label))
    return true
  },
  impact: (ctx, { target, x, y, label }) => {
    // Once the dance is finished the sphere does not drop, it chases — and the
    // only thing that saves you is being out of earshot of the music.
    const element = ctx.remember(target)
    element.classList.add('hatsu-jupiter-impact')
    document.body.classList.add('hatsu-rhythm')
    let pass = 0
    const pursue = () => {
      if (!element.isConnected) return
      const rect = element.getBoundingClientRect()
      if (rect.bottom < 0 || rect.top > innerHeight) {
        ctx.status = ctx.m['impact'].escaped(label)
        return
      }
      pass += 1
      element.style.transition = 'transform .45s cubic-bezier(.3,.9,.2,1), max-height .45s ease'
      ctx.applyTransform(element, `scale(${1 - pass * 0.13})`)
      if (pass >= 4) {
        element.style.maxHeight = '0'
        element.style.minHeight = '0'
        element.style.overflow = 'hidden'
        element.style.opacity = '.08'
        ctx.status = ctx.m['impact'].caught(label)
        return
      }
      ctx.status = ctx.m['impact'].chasing(label, pass)
      ctx.schedule(pursue, 700)
    }
    ctx.status = ctx.m['impact'].conjured(label)
    ctx.addPoint({ x, y }, label)
    ctx.schedule(pursue, 500)
    return true
  },
  mimicry: (ctx, { target, x, y, label }) => {
    // He can hold a face only as long as he spent with it. Watching longer buys
    // more time; there is no size limit, and the form drops on its own.
    const model = ctx.selectedElements[0]
    if (!model || model === target) {
      if (!model) ctx.selectedElements = [target]
      const studied = ctx.remember(ctx.selectedElements[0])
      const spoken = counterOn(studied)
      studied.classList.add('hatsu-model')
      ctx.status = ctx.m['mimicry'].studied(spoken * 2, label)
      ctx.addPoint({ x, y }, `${spoken * 2}s`)
      return true
    }
    const budget = Number(model.dataset.hatsuLevel || 1) * 2000
    const source = getComputedStyle(model)
    const shape = model.getBoundingClientRect()
    const transformed = ctx.remember(target)
    // Copying the model's colours changed nothing: everything in the archive is
    // already the same colour. What tells two things apart here is their size
    // and what they say, so that is what the form takes — the target ends up the
    // model's shape, wearing the model's name.
    transformed.style.width = `${Math.round(shape.width)}px`
    transformed.style.height = `${Math.round(shape.height)}px`
    transformed.style.overflow = 'hidden'
    transformed.style.boxSizing = 'border-box'
    transformed.style.transition = 'width .4s ease, height .4s ease'
    transformed.style.background = source.backgroundColor
    transformed.style.color = source.color
    transformed.style.borderRadius = source.borderRadius
    transformed.style.fontFamily = source.fontFamily
    transformed.dataset.hatsuForgery = ctx.targetLabel(model).slice(0, 24)
    transformed.classList.add('hatsu-metamorphosen')
    ctx.selectedElements = [model, transformed]
    ctx.status = ctx.m['mimicry'].copied(ctx.targetLabel(model), label, budget / 1000)
    ctx.addPoint({ x, y }, label)
    ctx.schedule(() => {
      transformed.classList.remove('hatsu-metamorphosen')
      delete transformed.dataset.hatsuForgery
      for (const property of [
        'background',
        'color',
        'border-radius',
        'font-family',
        'width',
        'height',
        'overflow',
        'box-sizing',
      ])
        transformed.style.removeProperty(property)
      ctx.status = ctx.m['mimicry'].expired(ctx.targetLabel(model), label)
    }, budget)
    return true
  },
  theft: (ctx, { target, x, y }) => {
    const control = target.closest<HTMLElement>('a, button')
    if (!control) {
      ctx.status = ctx.m['theft'].needsControl()
      return true
    }
    ctx.stolenTarget = control
    ctx.remember(control)
    control.style.opacity = '.22'
    control.style.pointerEvents = 'none'
    control.classList.add('hatsu-stolen')
    ctx.status = ctx.m['theft'].sealed(ctx.targetLabel(control))
    ctx.addPoint({ x, y }, ctx.targetLabel(control))
    return true
  },
  bookmark: (ctx, { target, x, y, label }) => {
    // The bookmark is the loophole in Skill Hunter: it keeps one page usable
    // while the book is open on another, which is what gets him two at once.
    const held = ctx.selectedElements.filter((element) => element.isConnected)
    if (held.includes(target)) {
      ctx.status = ctx.m['bookmark'].alreadyHeld(label)
      return true
    }
    if (held.length >= 2) {
      ctx.status = ctx.m['bookmark'].twoOnly(label)
      ctx.addPoint({ x, y }, ctx.m.tokens.twoOnly, { alert: true })
      return true
    }
    ctx.selectedElements = [...held, target]
    ctx.remember(target)
    target.style.position = 'sticky'
    target.style.top = `${5 + held.length * 5}rem`
    target.style.zIndex = String(35 - held.length)
    target.classList.add('hatsu-bookmarked')
    ctx.status = ctx.m['bookmark'].pinned(held.length === 0, ctx.targetLabel(held[0]), label)
    ctx.addPoint({ x, y }, label)
    return true
  },
  devour: (ctx, { target, x, y, label }) => {
    // The fish only lives behind closed doors, and its victim keeps standing:
    // no pain, no bleeding, nothing visibly wrong, right up until it is gone.
    const room = target.closest<HTMLElement>('section, article, li') || target
    if (room.querySelector('a[href]')) {
      ctx.status = ctx.m['devour'].notSealed(label)
      ctx.addPoint({ x, y }, ctx.m.tokens.notSealed, { alert: true })
      return true
    }
    const element = ctx.remember(target)
    const bites = counterOn(element)
    element.classList.add('hatsu-devoured')
    element.style.setProperty('--devoured', String(Math.min(1, bites / 4)))
    if (bites >= 4) {
      element.style.color = 'transparent'
      element.style.textShadow = 'none'
      ctx.status = ctx.m['devour'].eaten(label)
    } else ctx.status = ctx.m['devour'].biting(label, bites)
    ctx.addPoint({ x, y }, ctx.m.tokens.bite(bites))
    return true
  },
  pocket: (ctx, { target, x, y, label }) => {
    // The cloth takes nothing away. It wraps, it shrinks, and it lets the same
    // thing back out at full size, unharmed — people included.
    const element = ctx.remember(target)
    const wrapped = element.classList.toggle('hatsu-fun-fun-wrapped')
    element.style.transition = 'transform .5s cubic-bezier(.2,.8,.2,1)'
    element.style.transformOrigin = 'left top'
    ctx.applyTransform(element, wrapped ? 'scale(.16) rotate(-6deg)' : 'scale(1)')
    ctx.status = ctx.m['pocket'].wrapped(wrapped, label)
    ctx.addPoint({ x, y }, wrapped ? ctx.m.tokens.wrapped(label) : ctx.m.tokens.released(label))
    return true
  },
  teleport: (ctx, { target, x, y, label }) => {
    // Chrollo moved Nobunaga without touching him, without looking at him, and
    // without choosing where he went. There is no second target to pick.
    const element = ctx.remember(target)
    const elsewhere = Array.from(
      document.querySelectorAll<HTMLElement>('main section, main article, main li'),
    ).filter((candidate) => candidate !== target && !candidate.contains(target))
    if (!elsewhere.length) {
      ctx.status = ctx.m['teleport'].nowhere(label)
      return true
    }
    const landing = elsewhere[(ctx.points.length * 7 + label.length) % elsewhere.length]
    const from = element.getBoundingClientRect()
    const to = landing.getBoundingClientRect()
    element.style.transition = 'opacity .12s linear'
    element.style.opacity = '.1'
    ctx.applyTransform(element, `translate(${to.left - from.left}px, ${to.top - from.top}px)`)
    ctx.schedule(() => {
      element.style.opacity = '1'
    }, 130)
    ctx.status = ctx.m['teleport'].moved(ctx.targetLabel(landing), label)
    ctx.addPoint({ x, y }, label)
    return true
  },
  polarity: (ctx, { target, x, y, label }) => {
    // A mark can be charged after it is placed, and the pair only goes off when
    // the two marks actually touch. Fully charged, it takes the neighbours too.
    const marked = ctx.selectedElements.includes(target)
    if (!marked && ctx.selectedElements.length < 2) {
      ctx.selectedElements = [...ctx.selectedElements, target]
      const sun = ctx.selectedElements.length === 1
      ctx.remember(target).classList.add(sun ? 'hatsu-sun-mark' : 'hatsu-moon-mark')
      target.dataset.hatsuLevel = '1'
      ctx.status = ctx.m['polarity'].marked(sun, label)
      ctx.addPoint({ x, y }, sun ? `☀ ${label}` : `☾ ${label}`)
      return true
    }
    if (marked && ctx.selectedElements.length < 2) {
      const charge = counterOn(target)
      ctx.applyTransform(target, `scale(${1 + charge * 0.02})`)
      ctx.status = ctx.m['polarity'].charging(charge, label)
      ctx.addPoint({ x, y }, ctx.m.tokens.chargeLevel(charge))
      return true
    }
    const [sun, moon] = ctx.selectedElements
    const charge = Math.max(
      Number(sun.dataset.hatsuLevel || 1),
      Number(moon.dataset.hatsuLevel || 1),
    )
    const gap = distanceBetween(sun, moon)
    if (gap > 220) {
      ctx.moveByRects(sun, moon)
      ctx.status = ctx.m['polarity'].closing(Math.round(gap))
      ctx.addPoint({ x, y }, ctx.m.tokens.closing)
      return true
    }
    const caught =
      charge >= 4 ? [sun, moon, ...Array.from(moon.parentElement?.children || [])] : [sun, moon]
    let killed = 0
    for (const body of caught) {
      if (!(body instanceof HTMLElement)) continue
      ctx.remember(body).classList.add('hatsu-polarity-detonate')
      body.style.pointerEvents = 'none'
      killed += 1
    }
    ctx.status = ctx.m['polarity'].detonated(charge >= 4, killed, charge)
    ctx.addPoint({ x, y }, ctx.m.tokens.detonation, { alert: true })
    return true
  },
  command: (ctx, { target, x, y, label }) => {
    // A puppet has to have a head and has to be lifeless. Corpses are refused
    // outright; Nen copies of them are not. And the orders stay simple.
    //
    // The click lands on the innermost thing under the pointer — a paragraph, a
    // line, a heading — and none of those carry a head of their own. The puppet
    // is the block that owns them, which is the body the stamp is put on.
    const HEADS = 'h1,h2,h3,h4,h5,h6,summary,legend,dt'
    const BODIES = 'article, section, li, details, figure, aside, blockquote'
    // Climb until a block with a head is found: the first block above a line of
    // prose is often a bare wrapper, and stopping there refused everything.
    let puppet = target.matches(HEADS) ? (target.parentElement ?? target) : target
    let head = target.matches(HEADS) ? target : null
    while (!head) {
      const body = puppet.closest<HTMLElement>(BODIES)
      if (!body) break
      head = body.querySelector<HTMLElement>(HEADS)
      puppet = body
      if (head) break
      if (!body.parentElement) break
      puppet = body.parentElement
    }
    if (!head) puppet = target.closest<HTMLElement>(BODIES) ?? target
    const stamped = ctx.selectedElements.filter((body) => body.isConnected)
    const lockedOf = (bodies: HTMLElement[]) =>
      bodies.filter((body) => body.classList.contains('hatsu-puppet-locked'))

    // Twenty puppets is far too many to speak to as a crowd, so a second click
    // on a head that already wears the 人 locks it instead of stamping it
    // again: the lock is who the next order is addressed to, and nothing else.
    //
    // Anywhere inside a puppet counts as that puppet. Blocks nest — a list
    // inside a section, a figure inside an article — so the climb above lands
    // on a different body depending on which line was under the pointer, and a
    // visitor clicking the same thing twice was stamping something new the
    // second time rather than locking what they had just stamped.
    const already =
      stamped.find((body) => body === puppet) ??
      stamped.filter((body) => body.contains(target)).sort((a, b) => (a.contains(b) ? 1 : -1))[0]
    if (already) {
      const locked = already.classList.toggle('hatsu-puppet-locked')
      ctx.status = ctx.m['command'].lockedToggle(
        ctx.targetLabel(already),
        locked,
        lockedOf(stamped).length,
      )
      ctx.addPoint({ x, y }, locked ? ctx.m.tokens.locked : ctx.m.tokens.unlocked)
      return true
    }

    // The lock is what tells stamping from ordering, because nothing else can.
    //
    // A page is blocks inside blocks: click a line of prose and the body that
    // owns it nearly always has a heading, so every click looks like one more
    // puppet and the order never comes. So the lock does double duty — turn one
    // and the crowd is closed: the next click on anything else is where they are
    // being sent. Unlock them all and the stamp goes back to taking heads.
    const locked = lockedOf(stamped)

    // A head nobody has stamped yet, and room left on the stamp: this is one
    // more puppet rather than a place to send the ones already standing.
    if (!locked.length && head && stamped.length < STAMP_LIMIT) {
      const conjured = isNenMade(puppet) || Boolean(puppet.dataset.hatsuFake)
      // Alive means a passenger, not a control and not a room with people in
      // it. Chrollo puppeteers objects, and a block of the archive is an object
      // however many links hang off it or passengers stand inside it.
      const living = puppet.matches('[data-hatsu-character]')
      if (living && !conjured) {
        ctx.status = ctx.m['command'].alive(label)
        ctx.addPoint({ x, y }, ctx.m.tokens.alive, { alert: true })
        return true
      }
      ctx.selectedElements = [...stamped, puppet]
      ctx.remember(head).classList.add('hatsu-stamped-head')
      head.dataset.hatsuForgery = '人'
      ctx.remember(puppet).classList.add('hatsu-stamped')
      ctx.status = ctx.m['command'].stamped(stamped.length + 1, ctx.targetLabel(puppet))
      ctx.addPoint({ x, y }, ctx.targetLabel(puppet))
      return true
    }

    // Nothing stamped yet and nothing here to stamp: the stamp has not started.
    if (!head && stamped.length === 0) {
      ctx.status = ctx.m['command'].noHead(label)
      ctx.addPoint({ x, y }, ctx.m.tokens.noHead, { alert: true })
      return true
    }

    // Everything left is the order, and the order goes to the locked ones only.
    // Given with none locked it is spoken to nobody, which is the whole point
    // of the lock: twenty puppets do not all move because one click missed.
    if (!locked.length) {
      ctx.status = ctx.m['command'].noPuppetsLocked(stamped.length)
      ctx.addPoint({ x, y }, ctx.m.tokens.noLock, { alert: true })
      return true
    }

    const destination = target.getBoundingClientRect()
    for (const obedient of locked) {
      const rect = obedient.getBoundingClientRect()
      ctx.remember(obedient)
      obedient.style.transition = 'transform .7s ease'
      ctx.applyTransform(
        obedient,
        `translate(${destination.left - rect.left}px, ${destination.top - rect.top}px) scale(.72)`,
      )
    }
    ctx.status = ctx.m['command'].order(label, locked.length)
    ctx.addPoint({ x, y }, ctx.m.tokens.order(label))
    return true
  },
  'identity-swap': (ctx, { target, x, y, label }) => {
    // The left hand takes a likeness, the right hand gives one, both hands
    // exchange them. Only appearances move — nothing about what they do.
    if (!ctx.selectedElements.length) {
      ctx.selectedElements = [target]
      ctx.remember(target).classList.add('hatsu-left-hand')
      ctx.status = ctx.m['identity-swap'].leftHand(label)
      ctx.addPoint({ x, y }, `↓ ${label}`)
      return true
    }
    const model = ctx.selectedElements[0]
    if (model === target) {
      ctx.status = ctx.m['identity-swap'].ownFace(label)
      return true
    }
    const modelLabel = ctx.targetLabel(model)
    const modelStyle = getComputedStyle(model)
    const targetStyle = getComputedStyle(target)
    const dressed = ctx.remember(target)
    const undressed = ctx.remember(model)
    for (const property of [
      'background',
      'color',
      'border',
      'borderRadius',
      'fontFamily',
    ] as const) {
      const carried = modelStyle[property]
      dressed.style[property] = carried
      undressed.style[property] = targetStyle[property]
    }
    model.setAttribute('aria-label', label)
    target.setAttribute('aria-label', modelLabel)
    dressed.classList.add('hatsu-right-hand')
    ctx.selectedElements = [model, target]
    ctx.status = ctx.m['identity-swap'].swapped(modelLabel, label)
    ctx.addPoint({ x, y }, `↕ ${label}`)
    return true
  },
  divination: (ctx, { target, x, y, label }) => {
    // The dial never points at anyone. It says whether they are in range, and
    // then refuses to be called again until you have moved somewhere else.
    const area = ctx.targetLabel(target.closest<HTMLElement>('section, article, main') || target)
    if (ctx.studyTarget === area) {
      ctx.status = ctx.m['divination'].sameArea()
      ctx.addPoint({ x, y }, ctx.m.tokens.refused, { alert: true })
      return true
    }
    ctx.studyCount += 1
    if (ctx.studyCount > 6) {
      ctx.status = ctx.m['divination'].noCalls()
      ctx.addPoint({ x, y }, ctx.m.tokens.noCalls, { alert: true })
      return true
    }
    ctx.studyTarget = area
    const affinity = 50 + Math.abs(Math.round(Math.sin((x + y + label.length) * 0.01) * 50))
    const digits = String(Math.abs(Math.round(Math.sin((x + y) * 0.017) * 1e14))).slice(
      0,
      6 + (label.length % 15),
    )
    const band =
      affinity > 80
        ? 'somewhere in this very area'
        : affinity > 62
          ? 'within range, but too far to place'
          : 'far outside range'
    const item = ctx.guideItemFor(target, label)
    if (!ctx.dialBest || affinity > ctx.dialBest.score) ctx.dialBest = { score: affinity, item }
    ctx.guideTitle = ctx.m['divination'].guideTitle(ctx.studyCount)
    ctx.guideItems = ctx.dialBest ? [ctx.dialBest.item] : []
    ctx.status = ctx.m['divination'].reading(digits, band, affinity)
    ctx.addPoint({ x, y }, `${affinity}%`, { details: [digits, band] })
    return true
  },
  prophecy: (ctx, args) => {
    // Neon needed a full name, a date of birth and a blood type before the quill
    // would move, she could never write her own, and the first verse is always
    // about something that has already happened.
    //
    // When the quill lands on a passenger it writes that passenger's sheet from
    // data/prophecies — the same poem the character page prints. Everything else
    // on the ship gets an improvised page.
    const { target, x, y, label } = args
    if (target.closest('[data-hatsu-ui]')) {
      ctx.status = ctx.m['prophecy'].ownFuture()
      ctx.addPoint({ x, y }, ctx.m.tokens.noOwnFuture, { alert: true })
      return true
    }
    const name = target.dataset.hatsuCharacterName || label
    const links = Array.from(target.querySelectorAll<HTMLAnchorElement>('a')).slice(0, 4)
    if (!prophecySheetsReady()) {
      // The catalogue is fetched when the technique is selected; a click that
      // beats it waits for the page rather than improvising over it.
      ctx.status = ctx.m['prophecy'].consulting(name)
      void loadProphecySheets().then(() => {
        if (ctx.profile.kind === 'prophecy' && target.isConnected)
          HATSU_INTERACTION_BY_KIND['prophecy']?.(ctx, args)
      })
      return true
    }
    // A passenger the archive can name is a slip with nothing missing on it. The
    // date of birth and the blood type are only asked of whatever the archive
    // cannot identify, which is where the quill has to guess.
    const sheet = prophecySubjectFor(target, ctx.page.url.pathname)
    if (!sheet) {
      const text = (target.textContent || '').trim()
      const born = /\d/.test(text) || Boolean(target.querySelector('time'))
      const type = Boolean(
        target.dataset.hatsuCharacter ||
        target.dataset.hatsuList ||
        target.closest('[data-hatsu-character]'),
      )
      if (!born || !type) {
        const missing = [!born && 'a date of birth', !type && 'a blood type']
          .filter(Boolean)
          .join(' or ')
        ctx.status = ctx.m['prophecy'].incomplete(name, missing)
        ctx.addPoint({ x, y }, ctx.m.tokens.incomplete, { alert: true })
        return true
      }
    }
    if (sheet?.blank) {
      ctx.status = ctx.m['prophecy'].ownFuture()
      ctx.addPoint({ x, y }, ctx.m.tokens.noOwnFuture, { alert: true })
      return true
    }
    if (sheet) {
      ctx.prophecyLines = sheet.poem
      ctx.guideTitle = ctx.m['prophecy'].guideTitle()
      ctx.guideItems = links.map((link) => ctx.guideItemFor(link, ctx.targetLabel(link)))
      ctx.status = ctx.m['prophecy'].written(sheet.subjectName, ctx.guideItems.length)
      ctx.addPoint({ x, y }, sheet.subjectName, { details: [sheet.foretells] })
      return true
    }
    const already = ctx.points[0]?.label
    ctx.prophecyLines = [
      already
        ? `You have already been to ${already}; that much is behind you.`
        : `You came aboard and touched nothing; that much is behind you.`,
      `The ${name.slice(0, 18)} waits beneath a black tide.`,
      `${links.length || 'No'} paths open; only one returns unchanged.`,
      `Guard the final link, or the Whale will erase its name.`,
    ]
    ctx.guideTitle = ctx.m['prophecy'].guideTitle()
    ctx.guideItems = links.map((link) => ctx.guideItemFor(link, ctx.targetLabel(link)))
    ctx.status = ctx.m['prophecy'].written(name, ctx.guideItems.length)
    ctx.addPoint({ x, y }, label)
    return true
  },
  clone: (ctx, { target, x, y, label }) => {
    if (target.closest(`.${GALLERY_FAKE_CLASS}`)) {
      ctx.status = ctx.m['clone'].copyOfCopy()
      return true
    }
    const replica = buildGalleryFake(target)
    if (!replica) {
      ctx.status = ctx.m['clone'].noBody(label)
      return true
    }
    document.body.append(replica)
    const living = Boolean(target.closest('[data-hatsu-character]'))
    if (living) replica.classList.add('hatsu-gallery-corpse')
    // En on the original for as long as the copy lasts, and it lasts a day.
    ctx.remember(target).classList.add('hatsu-gallery-original')
    ctx.status = ctx.m['clone'].copied(living, label)
    ctx.addPoint({ x, y }, label)
    ctx.schedule(() => {
      replica.remove()
      target.classList.remove('hatsu-gallery-original')
      ctx.status = ctx.m['clone'].expired(label)
    }, 14000)
    return true
  },
  puppet: (ctx, { target, x, y }) => {
    // Two antennae leave the phone: one is in the target and the other is there
    // to be seen. The order goes to one of them and never says which.
    const control = target.closest<HTMLElement>('a, button')
    const planted = ctx.selectedElements.filter((element) => element.isConnected)
    if (planted.length < 2) {
      if (!control) {
        ctx.status = ctx.m['puppet'].needsControl()
        return true
      }
      ctx.selectedElements = [...planted, control]
      ctx.remember(control).classList.add('hatsu-antenna')
      if (planted.length) {
        ctx.puppetTarget = ctx.selectedElements[ctx.points.length % 2]
        ctx.status = ctx.m['puppet'].bothPlanted()
      } else ctx.status = ctx.m['puppet'].planted(ctx.targetLabel(control))
      ctx.addPoint({ x, y }, ctx.targetLabel(control))
      return true
    }
    if (!ctx.puppetTarget || ctx.puppetExecuting) return true
    ctx.puppetExecuting = true
    const feint = planted.find((element) => element !== ctx.puppetTarget)
    if (feint) ctx.remember(feint).classList.add('hatsu-antenna-feint')
    ctx.status = ctx.m['puppet'].ordered(
      ctx.targetLabel(ctx.puppetTarget),
      feint ? ctx.targetLabel(feint) : null,
    )
    ctx.puppetTarget.click()
    ctx.schedule(() => {
      ctx.puppetExecuting = false
    }, 0)
    return true
  },
  barrage: (ctx, { event, target, x, y, label }) => {
    // A rate of fire, not a punch: the volley catches whatever is standing next
    // to the target, and Nen puppets do not stop the bullets.
    const line = [target, ...Array.from(target.parentElement?.children || [])]
      .filter((element): element is HTMLElement => element instanceof HTMLElement)
      .slice(0, 6)
    const force = Math.min(120, 18 + ctx.points.length * 12)
    const direction = event.clientX < innerWidth / 2 ? 1 : -1
    let pierced = 0
    for (const [index, hit] of line.entries()) {
      // Read what the bullets are going through before the volley marks it:
      // asking afterwards counted the technique's own mark as a Nen construct,
      // so every wall the gun hit was reported as torn through and erased.
      const conjured = isNenMade(hit) || Boolean(hit.dataset.hatsuFake)
      const element = ctx.remember(hit)
      element.style.transition = 'transform .18s ease-out'
      ctx.applyTransform(element, `translate(${direction * force}px, ${((index % 3) - 1) * 10}px)`)
      element.classList.add('hatsu-bullet-hit')
      if (!conjured) continue
      pierced += 1
      element.style.opacity = '.2'
      element.style.pointerEvents = 'none'
    }
    // The volley is sustained, not a single shove: everything it caught rides
    // back down once the burst is over, and the recoil is what is seen of it.
    ctx.schedule(() => {
      for (const hit of line) {
        if (!hit.isConnected) continue
        hit.style.transition = 'transform .5s cubic-bezier(.2,.9,.3,1)'
        ctx.applyTransform(hit, `translate(${direction * Math.round(force / 4)}px, 0)`)
      }
    }, 220)
    // Conjured cards are no protection either.
    ctx.floatingCards = []
    ctx.status = ctx.m['barrage'].fired(line.length * 2, label, pierced)
    ctx.addPoint({ x, y }, label)
    return true
  },
  projection: (ctx, { target, x, y, label }) => {
    // The double walks through matter, but the body lies there asleep and
    // anyone who touches it or speaks to it pulls him straight back into it.
    const body = ctx.selectedElements[0]
    if (body?.isConnected && (body === target || body.contains(target))) {
      ctx.floatingCards = []
      body.classList.remove('hatsu-sleeping-body')
      for (const control of controlsOf(body)) control.style.pointerEvents = 'auto'
      ctx.selectedElements = []
      ctx.status = ctx.m['projection'].recalled(ctx.targetLabel(body))
      ctx.addPoint({ x, y }, ctx.m.tokens.recalled, { alert: true })
      return true
    }
    if (body?.isConnected) {
      // Passing through was a status line and nothing else. The double is out
      // walking: it moves to where it was sent, the matter it crossed opens for
      // the length of the crossing, and a door it walks into is a door it can
      // take — the body it left behind still cannot touch any of it.
      const crossed = ctx.remember(target)
      crossed.classList.add('hatsu-phased-through')
      ctx.schedule(() => crossed.classList.remove('hatsu-phased-through'), 900)
      const door =
        target.closest<HTMLAnchorElement>('a') || target.querySelector<HTMLAnchorElement>('a')
      ctx.floatingCards = [
        {
          id: ++ctx.sequence,
          x: Math.max(16, Math.min(innerWidth - 320, x)),
          y: Math.max(80, Math.min(innerHeight - 220, y)),
          label,
          kind: 'projection',
          href: door?.href || null,
        },
      ]
      ctx.status = ctx.m['projection'].passedThrough(label)
      ctx.addPoint({ x, y }, label)
      return true
    }
    const link =
      target.closest<HTMLAnchorElement>('a') || target.querySelector<HTMLAnchorElement>('a')
    ctx.selectedElements = [target]
    ctx.floatingCards = [
      {
        id: ++ctx.sequence,
        x: Math.max(16, Math.min(innerWidth - 320, x)),
        y: Math.max(80, Math.min(innerHeight - 220, y)),
        label,
        kind: 'projection',
        href: link?.href || null,
      },
    ]
    const sleeping = ctx.remember(target)
    sleeping.classList.add('hatsu-sleeping-body')
    // The body itself stays touchable — that is the only way back.
    for (const control of controlsOf(sleeping)) {
      ctx.remember(control)
      control.style.pointerEvents = 'none'
    }
    ctx.status = ctx.m['projection'].left(label)
    ctx.addPoint({ x, y }, label)
    return true
  },
  animate: (ctx, { target, x, y, label }) => {
    // Ten small bodies a day and two large ones. The change lands a few seconds
    // after the touch, keeps the object's job, and wears off when the aura goes.
    const rect = target.getBoundingClientRect()
    const large = rect.width * rect.height > SMALL_HOST_AREA
    const live = ctx.selectedElements.filter((element) => element.isConnected)
    const largeCount = live.filter((element) => {
      const box = element.getBoundingClientRect()
      return box.width * box.height > SMALL_HOST_AREA
    }).length
    if (large ? largeCount >= 2 : live.length - largeCount >= 10) {
      ctx.status = ctx.m['animate'].noAura(label, large)
      ctx.addPoint({ x, y }, ctx.m.tokens.noAura, { alert: true })
      return true
    }
    ctx.selectedElements = [...live, target]
    ctx.status = ctx.m['animate'].touched(label)
    ctx.addPoint({ x, y }, label)
    ctx.schedule(() => {
      ctx.remember(target).classList.add('hatsu-animated-object')
      target.dataset.hatsuConjured = 'biohazard'
      ctx.status = ctx.m['animate'].alive(label, large)
    }, 2200)
    ctx.schedule(
      () => {
        target.classList.remove('hatsu-animated-object')
        delete target.dataset.hatsuConjured
        ctx.status = ctx.m['animate'].spent(label)
      },
      large ? 9000 : 15000,
    )
    return true
  },
  needle: (ctx, { target, x, y, label }) => {
    // One needle, one order, carried out until the body gives. Whoever lives
    // through it does not work properly again.
    const element = ctx.remember(target)
    if (element.classList.contains('hatsu-needle-crippled')) {
      ctx.status = ctx.m['needle'].crippled(label)
      return true
    }
    element.classList.add('hatsu-needle-puppet')
    ctx.selectedElements = [...ctx.selectedElements.filter((puppet) => puppet.isConnected), element]
    ctx.status = ctx.m['needle'].inserted(label)
    ctx.addPoint({ x, y }, label)
    let strain = 0
    const obey = () => {
      if (!element.isConnected) return
      strain += 1
      ctx.applyTransform(element, `translateX(${strain * 8}px) rotate(${strain}deg)`)
      element.style.transition = 'transform .3s ease'
      if (strain < 3) {
        ctx.status = ctx.m['needle'].straining(label, strain)
        ctx.schedule(obey, 1300)
        return
      }
      ctx.executeSiteTarget(element)
      element.classList.remove('hatsu-needle-puppet')
      element.classList.add('hatsu-needle-crippled')
      element.style.pointerEvents = 'none'
      element.style.filter = 'grayscale(1)'
      ctx.status = ctx.m['needle'].burntOut(label)
    }
    ctx.schedule(obey, 900)
    return true
  },
  'paper-spy': (ctx, { target, x, y, label }) => {
    ctx.remember(target).classList.add('hatsu-paper-observed')
    const report = { label, count: 0 }
    ctx.observerReports = [...ctx.observerReports, report]
    const observer = new MutationObserver((mutations) => {
      report.count += mutations.length
      ctx.observerReports = [...ctx.observerReports]
      ctx.status = ctx.m['paper-spy'].reported(label, report.count)
    })
    observer.observe(target, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true,
    })
    ctx.observers.push(observer)
    ctx.status = ctx.m['paper-spy'].deployed(label)
    ctx.addPoint({ x, y }, label)
    return true
  },
  shred: (ctx, { event, target, x, y, label }) => {
    // One piece of confetti sticks somewhere precise. Every volley after that
    // gathers up and comes back to that same spot, whatever you aim at.
    const anchor = ctx.selectedElements[0]
    if (!anchor?.isConnected) {
      const rect = target.getBoundingClientRect()
      const px = Math.round(((event.clientX - rect.left) / (rect.width || 1)) * 100)
      const py = Math.round(((event.clientY - rect.top) / (rect.height || 1)) * 100)
      ctx.selectedElements = [target]
      ctx.remember(target).classList.add('hatsu-confetti-stuck')
      target.dataset.hatsuLevel = '0'
      target.dataset.hatsuForgery = `${px},${py}`
      ctx.status = ctx.m['shred'].stuck(label, px, py)
      ctx.addPoint({ x, y }, ctx.m.tokens.stuck)
      return true
    }
    const cuts = counterOn(anchor)
    const [px, py] = (anchor.dataset.hatsuForgery || '50,50').split(',').map(Number)
    ctx.remember(anchor).classList.add('hatsu-serpent-cut')
    anchor.style.transition = 'transform .35s ease, opacity .35s ease'
    anchor.style.transformOrigin = `${px}% ${py}%`
    ctx.applyTransform(anchor, `rotate(${cuts * 3}deg) scale(${Math.max(0.15, 1 - cuts * 0.17)})`)
    if (cuts >= 5) {
      anchor.style.opacity = '.05'
      anchor.style.pointerEvents = 'none'
    }
    ctx.status = ctx.m['shred'].tracking(ctx.targetLabel(anchor), target === anchor, cuts, label)
    ctx.addPoint({ x, y }, ctx.m.tokens.pass(cuts))
    return true
  },
  'remote-strike': (ctx, { event, target, x, y, label }) => {
    // The aura runs along the surface it was struck on and comes up somewhere
    // else on that same surface. It cannot leave it, and it can be repeated.
    const surface = target.closest<HTMLElement>('section, article, ul, ol, main') || target
    const along = Array.from(surface.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement && child !== target,
    )
    if (!along.length) {
      ctx.status = ctx.m['remote-strike'].alone(label)
      ctx.addPoint({ x, y }, ctx.m.tokens.noSurface, { alert: true })
      return true
    }
    const punches = counterOn(surface)
    const emerging = along[(punches + label.length) % along.length]
    const fist = ctx.remember(emerging)
    fist.classList.remove('hatsu-remote-punched')
    void fist.offsetWidth
    fist.classList.add('hatsu-remote-punched')
    ctx.executeSiteTarget(fist)
    ctx.status = ctx.m['remote-strike'].emerged(
      ctx.targetLabel(surface),
      ctx.targetLabel(emerging),
      label,
      punches,
    )
    ctx.addPoint({ x: event.clientX, y }, ctx.targetLabel(emerging))
    return true
  },
  spatial: (ctx, { target, x, y, label }) => {
    // Luini could only open the passage from a room with one closed door and
    // solid walls. Open that door once and the room never works again.
    const room = target.closest<HTMLElement>('section, article, details, li') || target
    if (room.dataset.hatsuLevel === 'burnt') {
      ctx.status = ctx.m['spatial'].burnt(ctx.targetLabel(room))
      ctx.addPoint({ x, y }, ctx.m.tokens.reset, { alert: true })
      return true
    }
    const doors = room.querySelectorAll('a[href], details[open], [aria-expanded="true"]').length
    if (doors > 1) {
      room.dataset.hatsuLevel = 'burnt'
      ctx.remember(room).classList.add('hatsu-room-unsealed')
      ctx.status = ctx.m['spatial'].tooManyDoors(ctx.targetLabel(room), doors)
      ctx.addPoint({ x, y }, ctx.m.tokens.doors(doors), { alert: true })
      return true
    }
    ctx.storeElement(target, label, 'space')
    ctx.status = ctx.m['spatial'].carried(label)
    ctx.addPoint({ x, y }, label)
    return true
  },
  stitch: (ctx, { target, x, y, label }) => {
    // A short thread lifts a ton and a long one is cotton, so the distance is
    // the whole ability. The same thread also puts severed things back on.
    if (!ctx.selectedElements.length) {
      ctx.selectedElements = [target]
      ctx.remember(target).classList.add('hatsu-stitch-edge')
      ctx.status = ctx.m['stitch'].threadOut(label)
      ctx.addPoint({ x, y }, label)
      return true
    }
    const [first] = ctx.selectedElements
    if (first === target) {
      const severed = Array.from(
        target.querySelectorAll<HTMLElement>(
          '.hatsu-cyclotron-release, .hatsu-body-weapon-severed',
        ),
      )
      for (const limb of severed) {
        limb.style.opacity = '1'
        limb.style.pointerEvents = 'auto'
        limb.style.removeProperty('max-height')
      }
      ctx.status = ctx.m['stitch'].reattached(severed.length, label)
      ctx.addPoint({ x, y }, severed.length ? ctx.m.tokens.reattached : ctx.m.tokens.nothingTorn, {
        alert: !severed.length,
      })
      return true
    }
    const length = Math.round(distanceBetween(first, target))
    const strong = length < 260
    ctx.remember(first).classList.add('hatsu-stitched')
    ctx.remember(target).classList.add('hatsu-stitched')
    if (strong) {
      first.style.marginBottom = '0'
      target.style.marginTop = '0'
      first.style.position = target.style.position = 'sticky'
      first.style.top = '5rem'
      target.style.top = `calc(5rem + ${Math.max(36, first.getBoundingClientRect().height)}px)`
      ctx.selectedElements = [first, target]
      ctx.status = ctx.m['stitch'].strong(ctx.targetLabel(first), length, label)
    } else {
      first.style.transition = target.style.transition = 'transform .5s ease'
      ctx.applyTransform(target, 'translateY(-6px)')
      ctx.selectedElements = []
      ctx.status = ctx.m['stitch'].slack(length)
    }
    ctx.addPoint({ x, y }, strong ? ctx.m.tokens.sewn(length) : ctx.m.tokens.slack(length), {
      alert: !strong,
    })
    return true
  },
  melody: (ctx, { target, x, y, label }) => {
    // The piece reaches everyone in earshot at once, and what it buys is three
    // minutes in which none of them notice anything else is happening.
    document.body.classList.add('hatsu-melody')
    ctx.remember(target).classList.add('hatsu-note')
    // The score is written on screen as DO…SI, so it has to be heard as well.
    const note = ctx.points.length
    playHatsuNote(note)
    ctx.addPoint({ x, y }, ctx.m.tokens.notes[note % 7])
    if (note + 1 < 3) {
      ctx.status = ctx.m['melody'].playing(note + 1)
      return true
    }
    const listeners = Array.from(
      document.querySelectorAll<HTMLElement>('main section, main article'),
    ).filter((section) => !section.contains(target) && !target.contains(section))
    for (const listener of listeners) {
      ctx.remember(listener).classList.add('hatsu-enchanted-listener')
      listener.style.pointerEvents = 'none'
      listener.style.opacity = '.35'
    }
    // The three notes that landed it are played back as the phrase they are,
    // so what enchants the room is something the visitor hears too.
    for (let replay = 0; replay < 3; replay += 1)
      ctx.schedule(
        () => playHatsuNote(Math.max(0, note - 2 + replay), { velocity: 0.6 }),
        replay * 550,
      )
    ctx.status = ctx.m['melody'].landed(listeners.length, label)
    ctx.schedule(() => {
      for (const listener of listeners) {
        listener.classList.remove('hatsu-enchanted-listener')
        listener.style.pointerEvents = 'auto'
        listener.style.opacity = '1'
      }
      ctx.status = ctx.m['melody'].ended()
    }, 9000)
    return true
  },
  infection: (ctx, { target, x, y, label }) => {
    // Levels are paid for in kills, not in clicks: a non-user is worth 1, a Nen
    // user 10, a prince 50. An ability manifests at 20 and Member Zero at 100.
    const members = ctx.selectedElements.filter((element) => element.isConnected)
    if (members.includes(target)) {
      ctx.selectedElements = [...members.filter((member) => member !== target), target]
      ctx.status = ctx.m['infection'].holdingKnife(label, target.dataset.hatsuLevel || 0)
      ctx.addPoint({ x, y }, ctx.m.tokens.level(target.dataset.hatsuLevel || 0))
      return true
    }
    const killer = members[members.length - 1]
    if (!killer) {
      ctx.selectedElements = [target]
      ctx.remember(target).classList.add('hatsu-infected')
      target.dataset.hatsuLevel = '0'
      ctx.infectionLevel = 0
      ctx.status = ctx.m['infection'].kissed(label)
      ctx.addPoint({ x, y }, ctx.m.tokens.levelZero)
      return true
    }
    const worth = /^h[1-6]$/i.test(target.tagName)
      ? 50
      : target.closest('[data-hatsu-character]')
        ? 10
        : 1
    const level = Number(killer.dataset.hatsuLevel || 0) + worth
    killer.dataset.hatsuLevel = String(level)
    ctx.infectionLevel = Math.max(ctx.infectionLevel, level)
    ctx.remember(target).classList.add('hatsu-contagion-victim')
    target.style.pointerEvents = 'none'
    target.style.opacity = '.2'
    let note = ''
    if (level >= 20) {
      ctx.remember(killer).classList.add('hatsu-contagion-awakened')
      const dormant = killer.querySelector<HTMLElement>(RESTRICTED_SELECTOR)
      if (dormant) {
        ctx.remember(dormant)
        liftRestriction(dormant)
        note = ' · its own ability came through'
      }
    }
    if (level >= 100 && members.length < 22) {
      const recruit = target.parentElement
      if (recruit instanceof HTMLElement) {
        ctx.selectedElements = [...members, recruit]
        ctx.remember(recruit).classList.add('hatsu-infected')
        recruit.dataset.hatsuLevel = '0'
        note += ` · Member Zero now, and it has started its own community (${members.length + 1}/22)`
      }
    }
    ctx.status = ctx.m['infection'].killed(ctx.targetLabel(killer), label, worth, level, note)
    ctx.addPoint({ x, y }, ctx.m.tokens.levelGain(worth, level), { alert: level >= 20 })
    return true
  },
  windup: (ctx, { target, x, y, label }) => {
    // Winding is free and unbounded; the problem is that Phinks cannot
    // calibrate. Too few rotations and it stands, too many and so does everyone
    // standing next to it. The punch lands on whatever you hit afterwards.
    const arm = ctx.selectedElements[0]
    if (!arm?.isConnected || arm === target) {
      if (!arm?.isConnected) ctx.selectedElements = [target]
      ctx.windupPower += 1
      const winding = ctx.remember(ctx.selectedElements[0])
      winding.style.transition = 'transform .2s ease'
      winding.classList.add('hatsu-cyclotron-arm')
      ctx.applyTransform(winding, `rotate(${ctx.windupPower * 24}deg)`)
      ctx.status = ctx.m['windup'].winding(ctx.windupPower)
      ctx.addPoint({ x, y }, `×${ctx.windupPower}`)
      return true
    }
    const power = ctx.windupPower
    const struck = ctx.remember(target)
    struck.classList.add('hatsu-cyclotron-release')
    if (power < 4) {
      ctx.applyTransform(struck, 'translateX(24px)')
      ctx.status = ctx.m['windup'].tooFew(power, label)
    } else {
      struck.style.pointerEvents = 'none'
      struck.style.maxHeight = '0'
      struck.style.overflow = 'hidden'
      const splash =
        power > 7
          ? Array.from(target.parentElement?.children || []).filter(
              (body): body is HTMLElement => body instanceof HTMLElement && body !== target,
            )
          : []
      for (const bystander of splash) {
        ctx.remember(bystander).classList.add('hatsu-cyclotron-splash')
        bystander.style.opacity = '.35'
      }
      ctx.status = ctx.m['windup'].landed(power > 7, power, label, splash.length)
    }
    ctx.addPoint({ x, y }, ctx.m.tokens.hit(power), { alert: power > 7 || power < 4 })
    ctx.windupPower = 0
    ctx.selectedElements = []
    return true
  },
  predator: (ctx, { target, x, y, label }) => {
    // It grows on how well Rihan understands one ability, gathered by himself.
    // Several abilities on the same target and it is born too weak to bother.
    const techniques = ctx.profilesFromTarget(target)
    if (!techniques.length) {
      ctx.status = ctx.m['predator'].nothingToRead(label)
      ctx.addPoint({ x, y }, ctx.m.tokens.nothingToRead, { alert: true })
      return true
    }
    if (techniques.length > 1) {
      ctx.status = ctx.m['predator'].tooMany(techniques.length, label)
      ctx.addPoint({ x, y }, ctx.m.tokens.abilities(techniques.length), { alert: true })
      return true
    }
    const [studied] = techniques
    if (ctx.studyTarget !== studied.id) {
      ctx.studyTarget = studied.id
      ctx.studyCount = 0
    }
    ctx.studyCount += 1
    ctx.remember(target).classList.add('hatsu-studied')
    if (ctx.studyCount < 3) {
      ctx.status = ctx.m['predator'].working(studied.name, ctx.studyCount)
      ctx.addPoint({ x, y }, ctx.m.tokens.read(ctx.studyCount), { details: [studied.rule] })
      return true
    }
    const prey = Array.from(
      document.querySelectorAll<HTMLElement>(`[data-hatsu-list*="${studied.id}"]`),
    )
    for (const carrier of prey) {
      ctx.remember(carrier).classList.add('hatsu-predated')
      carrier.style.pointerEvents = 'none'
    }
    ctx.capturedTechniques = [studied]
    ctx.status = ctx.m['predator'].countered(studied.name, prey.length)
    ctx.addPoint({ x, y }, ctx.m.tokens.countered, { details: [studied.name] })
    ctx.schedule(() => deactivateHatsu(), 1600)
    return true
  },
  staff: (ctx, { target, x, y, label }) => {
    // The one thing known about it is that Saiyu sets its length at will, so
    // that is what it does: every thrust reaches one body further out.
    const reach = counterOn(ctx.remember(target))
    target.classList.add('hatsu-staff-pinned')
    const row = Array.from(target.parentElement?.children || []).filter(
      (sibling): sibling is HTMLElement => sibling instanceof HTMLElement,
    )
    const index = row.indexOf(target)
    const struck = row
      .slice(Math.max(0, index - reach), index + reach + 1)
      .filter((body) => body !== target)
    for (const hit of struck) {
      ctx.remember(hit)
      hit.style.transition = 'transform .35s ease'
      ctx.applyTransform(hit, `translateX(${(row.indexOf(hit) < index ? -1 : 1) * reach * 14}px)`)
      hit.style.pointerEvents = 'none'
    }
    ctx.status = ctx.m['staff'].reached(struck.length, reach, label)
    ctx.addPoint({ x, y }, ctx.m.tokens.reach(reach))
    return true
  },
  senses: (ctx, { x, y }) => {
    ctx.sensesStage = (ctx.sensesStage + 1) % 4
    document.body.classList.toggle('hatsu-no-sight', ctx.sensesStage >= 1)
    document.body.classList.toggle('hatsu-no-hearing', ctx.sensesStage >= 2)
    document.body.classList.toggle('hatsu-no-speech', ctx.sensesStage >= 3)
    // Sealed hearing drowns the voyage theme rather than stopping it: the
    // visitor keeps their own audio setting, they just cannot hear through it.
    setAmbientMuffled(ctx.sensesStage >= 2)
    if (ctx.sensesStage >= 2) {
      document.querySelectorAll<HTMLMediaElement>('audio,video').forEach((media) => media.pause())
    }
    ctx.status = ctx.m['senses'].stage(ctx.sensesStage)
    ctx.addPoint({ x, y }, ['解', '見', '聞', '言'][ctx.sensesStage])
    return true
  },
  vacuum: (ctx, { target, x, y, label }) => {
    // Blinky refuses anything alive and anything made of Nen — which is exactly
    // how Shizuku spots a trap — but it will draw a foreign substance back out
    // of a living body, and Shizuku has to name aloud what she is taking.
    if (target.closest('[data-hatsu-character]')) {
      const foreign = Array.from(target.classList).filter((name) => name.startsWith('hatsu-'))
      for (const substance of foreign) target.classList.remove(substance)
      if (foreign.length) target.style.pointerEvents = 'auto'
      ctx.status = ctx.m['vacuum'].alive(foreign.length, label)
      ctx.addPoint({ x, y }, foreign.length ? ctx.m.tokens.cleaned : ctx.m.tokens.alive, {
        alert: !foreign.length,
      })
      return true
    }
    if (isNenMade(target) || target.dataset.hatsuFake) {
      ctx.status = ctx.m['vacuum'].nenTrap(label)
      ctx.addPoint({ x, y }, ctx.m.tokens.nenTrap, { alert: true })
      return true
    }
    ctx.storeElement(target, label, 'vacuum')
    ctx.status = ctx.m['vacuum'].swallowed(label, ctx.storedItems.length)
    ctx.addPoint({ x, y }, label)
    return true
  },
  snakes: (ctx, { target, x, y, label }) => {
    // The marionette hides the user among ten, and only one of the ten can be
    // taken. Dropping it without taking anyone turns the curse back around.
    const field = ctx.selectedElements.filter((element) => element.isConnected)
    if (!field.includes(target)) {
      if (field.length >= 10) {
        ctx.status = ctx.m['snakes'].outOfRange(label)
        ctx.addPoint({ x, y }, ctx.m.tokens.outOfRange, { alert: true })
        return true
      }
      ctx.selectedElements = [...field, target]
      ctx.remember(target).classList.add('hatsu-suspect')
      ctx.status = ctx.m['snakes'].building(field.length + 1)
      ctx.addPoint({ x, y }, `${field.length + 1}`)
      return true
    }
    if (field.length < 10) {
      ctx.status = ctx.m['snakes'].alreadySuspect(label, field.length)
      return true
    }
    if (field.some((suspect) => suspect.classList.contains('hatsu-snake-victim'))) {
      ctx.status = ctx.m['snakes'].spent()
      ctx.addPoint({ x, y }, ctx.m.tokens.spent, { alert: true })
      return true
    }
    ctx.remember(target).classList.add('hatsu-snake-victim')
    target.style.pointerEvents = 'none'
    ctx.status = ctx.m['snakes'].drained(label)
    ctx.addPoint({ x, y }, label, { alert: true })
    return true
  },
  'training-shot': (ctx, { target, x, y, label }) => {
    ctx.trainingTarget = target
    ctx.trainingOrigin = { x: ctx.cursor.x, y: ctx.cursor.y }
    const trainee = ctx.remember(target)
    trainee.classList.add('hatsu-zetsu-test')
    trainee.style.pointerEvents = 'none'
    ctx.status = ctx.m['training-shot'].sealed()
    ctx.addPoint({ x, y }, label)
    ctx.schedule(() => {
      if (!ctx.trainingTarget) return
      ctx.trainingTarget.classList.add('hatsu-training-hit')
      ctx.trainingTarget.style.pointerEvents = 'auto'
      ctx.status = ctx.m['training-shot'].held(label)
      ctx.trainingTarget = null
    }, 3000)
    return true
  },
  serpent: (ctx, { target, x, y, label }) => {
    // A coil tightens; it does not toggle. Three turns and the arm lets go in
    // one motion, which is the only way anything gets out of it.
    const element = ctx.remember(target)
    const coils = counterOn(element)
    if (coils > 3) {
      element.dataset.hatsuLevel = '0'
      element.classList.remove('hatsu-serpent-bound')
      element.removeAttribute('aria-disabled')
      element.style.removeProperty('max-width')
      for (const control of controlsOf(element)) control.style.pointerEvents = 'auto'
      ctx.status = ctx.m['serpent'].released(label)
      ctx.addPoint({ x, y }, ctx.m.tokens.freed(label))
      return true
    }
    element.classList.add('hatsu-serpent-bound')
    element.style.transition = 'max-width .4s ease'
    element.style.maxWidth = `${100 - coils * 18}%`
    if (coils >= 2) {
      element.setAttribute('aria-disabled', 'true')
      for (const control of controlsOf(element)) {
        ctx.remember(control)
        control.style.pointerEvents = 'none'
      }
    }
    ctx.status = ctx.m['serpent'].coiling(coils >= 3, coils >= 2, coils, label)
    ctx.addPoint({ x, y }, ctx.m.tokens.coil(coils))
    return true
  },
  flock: (ctx, { target, x, y, label }) => {
    const link = target.closest<HTMLAnchorElement>('a')
    ctx.birdDispatches = [
      ...ctx.birdDispatches.slice(-7),
      { id: ++ctx.sequence, label, href: link?.href || null },
    ]
    ctx.remember(target).classList.add('hatsu-bird-dispatched')
    ctx.status = ctx.m['flock'].dispatched(ctx.birdDispatches.length, label)
    ctx.addPoint({ x, y }, label)
    return true
  },
  relay: (ctx, { target, x, y, label }) => {
    const element = ctx.remember(target)
    const stage = Math.min(3, Number(element.dataset.hatsuLevel || 0) + 1)
    element.dataset.hatsuLevel = String(stage)
    element.classList.add('hatsu-relay-cargo')
    element.style.transition = 'transform .65s ease, opacity .4s'
    ctx.applyTransform(
      element,
      `translateX(${stage * (innerWidth < 700 ? 28 : 75)}px) scale(${1 - stage * 0.08})`,
    )
    element.style.opacity = String(1 - stage * 0.15)
    if (stage === 3) ctx.storeElement(element, label, 'relay')
    ctx.status = ctx.m['relay'].staged(label, stage === 3, stage)
    ctx.addPoint({ x, y }, ctx.m.tokens.relay(stage))
    return true
  },
  healing: (ctx, { target, x, y, label }) => {
    // Enhancement drawn through the cross closes wounds. It has nothing to say
    // to something that is not wounded, and it takes two passes to finish one.
    const wounded = isRestricted(target)
      ? target
      : target.querySelector<HTMLElement>(RESTRICTED_SELECTOR)
    if (!wounded) {
      ctx.status = ctx.m['healing'].unhurt(label)
      ctx.addPoint({ x, y }, ctx.m.tokens.unhurt, { alert: true })
      return true
    }
    const stage = counterOn(ctx.remember(wounded))
    wounded.classList.add('hatsu-holy-healed')
    wounded.style.transition = 'opacity .4s ease'
    wounded.style.opacity = String(Math.min(1, 0.3 + stage * 0.35))
    if (stage >= 2) liftRestriction(wounded)
    ctx.status = ctx.m['healing'].mending(stage >= 2, ctx.targetLabel(wounded))
    ctx.addPoint({ x, y }, stage >= 2 ? ctx.m.tokens.healed(label) : ctx.m.tokens.mending(stage))
    return true
  },
  'heart-vow': (ctx, { target, x, y, label }) => {
    // The chain goes into one heart and the rules are declared onto that same
    // subject — two per stake at most. Touching anything else is the violation.
    const subject = ctx.selectedElements[0]
    if (!subject?.isConnected) {
      ctx.selectedElements = [target]
      ctx.remember(target).classList.add('hatsu-vow-subject')
      target.dataset.hatsuLevel = '0'
      ctx.status = ctx.m['heart-vow'].staked(label)
      ctx.addPoint({ x, y }, ctx.m.tokens.heart(label))
      return true
    }
    if (target === subject) {
      const clauses = counterOn(subject)
      if (clauses > 2) {
        subject.dataset.hatsuLevel = '2'
        ctx.status = ctx.m['heart-vow'].twoRules(label)
        return true
      }
      subject.classList.add('hatsu-vow-clause')
      ctx.status = ctx.m['heart-vow'].declared(clauses, label)
      ctx.addPoint({ x, y }, ctx.m.tokens.rule(clauses))
      return true
    }
    ctx.remember(subject)
    subject.style.pointerEvents = 'none'
    subject.setAttribute('aria-disabled', 'true')
    subject.classList.add('hatsu-vow-enforced')
    ctx.remember(target).classList.add('hatsu-vow-violation')
    ctx.status = ctx.m['heart-vow'].broken(ctx.targetLabel(subject), label)
    ctx.addPoint({ x, y }, ctx.m.tokens.stake, { alert: true })
    return true
  },
  'ability-loan': (ctx, { target, x, y, label }) => {
    // The dolphin cannot steal anything. It reads what Steal Chain already took,
    // hands it to one recipient — a non-user has their nodes forced open by it —
    // and the loan is spent after a single use.
    if (!ctx.capturedTechniques.length) {
      ctx.status = ctx.m['ability-loan'].empty()
      ctx.addPoint({ x, y }, ctx.m.tokens.empty, { alert: true })
      return true
    }
    const [loaned] = ctx.capturedTechniques
    if (!ctx.selectedElements.length) {
      ctx.selectedElements = [target]
      ctx.remember(target).classList.add('hatsu-dolphin-analyzed')
      ctx.status = ctx.m['ability-loan'].readOut(loaned.name, loaned.rule)
      ctx.addPoint({ x, y }, loaned.name, { details: [loaned.rule, loaned.cost] })
      return true
    }
    const recipient = ctx.remember(target)
    recipient.classList.add('hatsu-dolphin-recipient')
    const awakened = !ctx.profilesFromTarget(target).length
    if (awakened) recipient.classList.add('hatsu-nodes-opened')
    ctx.executeSiteTarget(recipient)
    ctx.capturedTechniques = []
    ctx.selectedElements = []
    ctx.status = ctx.m['ability-loan'].spent(loaned.name, label, awakened)
    ctx.addPoint({ x, y }, ctx.m.tokens.spentAbility(loaned.name))
    return true
  },
  contract: (ctx, { target, x, y, label }) => {
    // Moonlight Act cuts both ways: honoured terms are rewarded, a breach costs
    // a week of Zetsu, and both parties have to have read the terms first.
    const signed = ctx.selectedElements.filter((party) => party.isConnected)
    if (signed.length < 2 && !signed.includes(target)) {
      ctx.selectedElements = [...signed, target]
      ctx.remember(target).classList.add('hatsu-contract-signatory')
      ctx.status = ctx.m['contract'].signed(signed.length === 0, label)
      ctx.addPoint({ x, y }, ctx.m.tokens.sign(signed.length + 1))
      return true
    }
    if (signed.includes(target)) {
      for (const party of signed) {
        const rewarded = ctx.remember(party)
        rewarded.classList.add('hatsu-contract-rewarded')
        liftRestriction(rewarded)
        for (const control of controlsOf(rewarded)) {
          ctx.remember(control)
          liftRestriction(control)
        }
      }
      ctx.status = ctx.m['contract'].honoured()
      ctx.addPoint({ x, y }, ctx.m.tokens.reward)
      return true
    }
    const breacher = ctx.remember(signed[1])
    breacher.classList.add('hatsu-contract-zetsu')
    breacher.style.pointerEvents = 'none'
    breacher.style.filter = 'grayscale(1)'
    ctx.status = ctx.m['contract'].breached(ctx.targetLabel(breacher), label)
    ctx.addPoint({ x, y }, ctx.m.tokens.zetsu, { alert: true })
    ctx.schedule(() => {
      breacher.classList.remove('hatsu-contract-zetsu')
      breacher.style.pointerEvents = 'auto'
      breacher.style.removeProperty('filter')
      ctx.status = ctx.m['contract'].served(ctx.targetLabel(breacher))
    }, 7000)
    return true
  },
  'truth-punch': (ctx, { target, x, y, label }) => {
    // Ask, then hit. Keep the question the same and every further blow makes the
    // body expand on what it already said; change target and it starts over.
    if (ctx.studyTarget !== label) {
      ctx.studyTarget = label
      ctx.studyCount = 0
    }
    ctx.studyCount += 1
    const element = ctx.remember(target)
    element.classList.remove('hatsu-truth-punched')
    void element.offsetWidth
    element.classList.add('hatsu-truth-punched')
    const routes = target.querySelectorAll('a[href]').length
    const answer = [`${routes} routes`]
    if (ctx.studyCount >= 2) answer.push(`${controlsOf(target).length} controls`)
    if (ctx.studyCount >= 3)
      answer.push(
        `hidden=${target.hidden}`,
        `${(target.textContent || '').trim().length} characters it did not volunteer`,
      )
    ctx.addPoint({ x, y }, label, { details: answer })
    ctx.status = ctx.m['truth-punch'].answered(ctx.studyCount === 1, ctx.studyCount, label)
    return true
  },
  'blood-search': (ctx, { target, x, y, label }) => {
    // The drops search on their own once they are out, they have their own eyes,
    // and their aura runs out after half an hour or so — findings included.
    ctx.remember(target).classList.add('hatsu-blood-searched')
    const drop = ++ctx.sequence
    const traces = Array.from(
      target.querySelectorAll<HTMLElement>('a[href],[data-hatsu-character]'),
    ).slice(0, 4)
    ctx.guideTitle = ctx.m['blood-search'].guideTitle()
    ctx.status = ctx.m['blood-search'].released(label)
    ctx.addPoint({ x, y }, ctx.m.tokens.drop(drop))
    traces.forEach((trace, index) =>
      ctx.schedule(
        () => {
          if (!trace.isConnected) return
          ctx.remember(trace).classList.add('hatsu-blood-trace')
          ctx.guideItems = [...ctx.guideItems, ctx.guideItemFor(trace, ctx.targetLabel(trace))]
          ctx.status = ctx.m['blood-search'].found(ctx.targetLabel(trace), drop)
        },
        600 + index * 700,
      ),
    )
    ctx.schedule(() => {
      ctx.guideItems = ctx.guideItems.slice(traces.length)
      ctx.status = ctx.m['blood-search'].dried(drop)
    }, 12000)
    return true
  },
  'legal-defense': (ctx, { target, x, y, label }) => {
    // The guards cannot hurt the intruder and the intruder's attacks do nothing
    // back. Nobody is thrown out of anywhere; everyone is simply stuck.
    const hideout = ctx.selectedElements[0]
    if (!hideout?.isConnected) {
      ctx.selectedElements = [target]
      ctx.remember(target).classList.add('hatsu-lsdf-hideout')
      ctx.status = ctx.m['legal-defense'].declared(label)
      ctx.addPoint({ x, y }, ctx.m.tokens.hideout(label))
      return true
    }
    if (!hideout.contains(target)) {
      ctx.status = ctx.m['legal-defense'].outside(label)
      ctx.addPoint({ x, y }, ctx.m.tokens.noJurisdiction, { alert: true })
      return true
    }
    const guarded = ctx.remember(target)
    const level = counterOn(guarded)
    guarded.classList.add('hatsu-lsdf-defendant')
    guarded.dataset.hatsuForgery = ctx.m.tokens.level(level)
    guarded.dataset.hatsuConjured = 'lsdf'
    guarded.style.pointerEvents = 'none'
    guarded.setAttribute('aria-disabled', 'true')
    ctx.status = ctx.m['legal-defense'].guarded(level, label)
    ctx.addPoint({ x, y }, ctx.m.tokens.guardLevel(level))
    return true
  },
  'damage-transfer': (ctx, { target, x, y, label }) => {
    // The left hand has to already be resting on something when the blow lands.
    // If it is not, the left hand is what breaks. There is no trigger to pull.
    const sink = ctx.selectedElements[0]
    if (!sink?.isConnected) {
      ctx.selectedElements = [target]
      ctx.remember(target).classList.add('hatsu-damage-recipient')
      ctx.status = ctx.m['damage-transfer'].resting(label)
      ctx.addPoint({ x, y }, ctx.m.tokens.sink(label))
      return true
    }
    if (target === sink) {
      ctx.remember(sink)
      sink.style.maxHeight = '0'
      sink.style.opacity = '.08'
      sink.style.overflow = 'hidden'
      sink.style.pointerEvents = 'none'
      ctx.selectedElements = []
      ctx.status = ctx.m['damage-transfer'].noSink(label)
      ctx.addPoint({ x, y }, ctx.m.tokens.leftHand, { alert: true })
      return true
    }
    const load = counterOn(ctx.remember(sink))
    ctx.remember(target).classList.add('hatsu-damage-source')
    sink.style.transition = 'transform .3s ease, opacity .3s ease'
    sink.style.opacity = String(Math.max(0.1, 1 - load * 0.22))
    ctx.applyTransform(sink, `translateY(${load * 4}px) scale(${Math.max(0.6, 1 - load * 0.07)})`)
    if (load >= 4) {
      sink.style.pointerEvents = 'none'
      sink.setAttribute('aria-disabled', 'true')
    }
    ctx.status = ctx.m['damage-transfer'].transferred(ctx.targetLabel(sink), load >= 4, label, load)
    ctx.addPoint({ x, y }, `→ ${load}`)
    return true
  },
  'door-network': (ctx, { target, x, y, label }) => {
    // A land mine, not a corridor. Stepping into the armed frame moves you,
    // stepping back out of it does nothing, and it only ever moves people.
    if (isNenMade(target) || target.dataset.hatsuFake) {
      ctx.status = ctx.m['door-network'].nenConstruct(label)
      ctx.addPoint({ x, y }, ctx.m.tokens.notMoved, { alert: true })
      return true
    }
    const trap = ctx.selectedElements[0]
    if (!trap?.isConnected) {
      ctx.selectedElements = [target]
      ctx.remember(target).classList.add('hatsu-hideout-door')
      ctx.status = ctx.m['door-network'].trapArmed(label)
      ctx.addPoint({ x, y }, ctx.m.tokens.trapDoor)
      return true
    }
    const back = ctx.selectedElements[1]
    if (!back?.isConnected) {
      ctx.selectedElements = [trap, target]
      ctx.remember(target).classList.add('hatsu-hideout-return')
      ctx.status = ctx.m['door-network'].returnArmed(label)
      ctx.addPoint({ x, y }, ctx.m.tokens.returnDoor)
      return true
    }
    const inTrap = trap === target || trap.contains(target)
    const inReturn = back === target || back.contains(target)
    if (!inTrap && !inReturn) {
      ctx.status = ctx.m['door-network'].notADoor(label)
      return true
    }
    const destination = inTrap ? back : trap
    ctx.followGuide(ctx.guideItemFor(destination, ctx.targetLabel(destination)))
    ctx.status = ctx.m['door-network'].crossed(ctx.targetLabel(destination), label)
    ctx.addPoint({ x, y }, inTrap ? ctx.m.tokens.intoHideout : ctx.m.tokens.backToRoom)
    return true
  },
  'weapon-body': (ctx, { target, x, y, label }) => {
    // A demolition worker's right hand: a hammer flattens, a drill opens what
    // was shut, an axe takes the thing off. Each touch is the next tool.
    const element = ctx.remember(target)
    const tool = counterOn(element) % 3
    element.classList.add('hatsu-body-weapon')
    if (tool === 1) {
      element.style.transition = 'transform .3s ease'
      ctx.applyTransform(element, 'scaleY(.55)')
      ctx.status = ctx.m['weapon-body'].hammer(label)
      ctx.addPoint({ x, y }, `槌 ${label}`)
      return true
    }
    if (tool === 2) {
      const shut = element.querySelector<HTMLElement>(RESTRICTED_SELECTOR)
      if (shut) {
        ctx.remember(shut)
        liftRestriction(shut)
      }
      ctx.status = ctx.m['weapon-body'].drill(shut, label)
      ctx.addPoint({ x, y }, `錐 ${label}`, { alert: !shut })
      return true
    }
    const limb = element.lastElementChild
    if (limb instanceof HTMLElement) {
      ctx.remember(limb).classList.add('hatsu-body-weapon-severed')
      limb.style.opacity = '0'
      limb.style.pointerEvents = 'none'
    }
    ctx.status = ctx.m['weapon-body'].axe(
      limb instanceof HTMLElement,
      limb instanceof HTMLElement ? ctx.targetLabel(limb) : '',
      label,
    )
    ctx.addPoint({ x, y }, `斧 ${label}`)
    return true
  },
  'coercive-beast': (ctx, { target, x, y, label }) => {
    // Nobody has ever been told what Camilla's beast requires. The condition is
    // real and it is checked — it is simply never named, not even here.
    if (ctx.puppetTarget?.isConnected && target !== ctx.puppetTarget) {
      ctx.executeSiteTarget(ctx.puppetTarget)
      ctx.status = ctx.m['coercive-beast'].obeyed(ctx.targetLabel(ctx.puppetTarget))
      ctx.addPoint({ x, y }, ctx.m.tokens.obeyed)
      return true
    }
    const conditions = [
      (element: HTMLElement) => element.querySelectorAll('a[href]').length >= 2,
      (element: HTMLElement) => /^h[1-6]$/i.test(element.tagName),
      (element: HTMLElement) => (element.textContent || '').trim().length > 120,
      (element: HTMLElement) => Boolean(element.closest('[data-hatsu-character]')),
    ]
    const controlled = ctx.remember(target)
    const met = conditions[(label.length + target.tagName.length) % conditions.length](target)
    const contacts = counterOn(controlled, met ? 1 : 0)
    controlled.classList.add('hatsu-coercion-probe')
    if (met && contacts >= 3) {
      ctx.puppetTarget = controlled
      controlled.classList.add('hatsu-coercion-total')
      ctx.status = ctx.m['coercive-beast'].taken(label)
      ctx.addPoint({ x, y }, ctx.m.tokens.taken)
      return true
    }
    ctx.status = ctx.m['coercive-beast'].probed(met, label, contacts)
    ctx.addPoint({ x, y }, met ? ctx.m.tokens.met(contacts) : ctx.m.tokens.unmet, { alert: !met })
    return true
  },
  'coin-growth': (ctx, { target, x, y, label }) => {
    // The value multiplies by ten for every ten days it stays put and drops back
    // to one the instant it changes hands. Holding it long enough awakens you.
    const holder = ctx.selectedElements[0]
    if (holder === target) {
      const days = counterOn(target)
      const value = 10 ** Math.min(3, days - 1)
      target.dataset.hatsuForgery = `₵ ${value}`
      if (days >= 4) {
        const dormant = target.querySelector<HTMLElement>(RESTRICTED_SELECTOR) || target
        ctx.remember(dormant)
        liftRestriction(dormant)
        target.classList.add('hatsu-coin-awakened')
        ctx.status = ctx.m['coin-growth'].awakened(label)
      } else ctx.status = ctx.m['coin-growth'].kept(label, value)
      ctx.addPoint({ x, y }, `₵ ${value}`)
      return true
    }
    if (holder?.isConnected) {
      ctx.remember(holder)
      holder.classList.remove('hatsu-guardian-coin', 'hatsu-coin-awakened')
      holder.dataset.hatsuLevel = '0'
      delete holder.dataset.hatsuForgery
    }
    ctx.selectedElements = [target]
    ctx.remember(target).classList.add('hatsu-guardian-coin')
    target.dataset.hatsuLevel = '1'
    target.dataset.hatsuForgery = '₵ 1'
    ctx.status = ctx.m['coin-growth'].transferred(
      holder?.isConnected,
      ctx.targetLabel(holder),
      label,
    )
    ctx.addPoint({ x, y }, '₵ 1')
    return true
  },
  'lie-marks': (ctx, { target, x, y, label }) => {
    // The beast only cuts what it judges to be a lie. Answer straight and it
    // pulls its face back without leaving a mark on you.
    const link = target.closest<HTMLAnchorElement>('a[href]')
    const claimed = (target.getAttribute('aria-label') || target.textContent || '')
      .trim()
      .toLowerCase()
    const lying =
      /unknown|unconfirmed|alleged|probable|suspect|rumou?r|presumed/i.test(claimed) ||
      Boolean(link && claimed.length > 3 && !link.href.toLowerCase().includes(claimed.slice(0, 4)))
    if (!lying) {
      ctx.remember(target).classList.add('hatsu-lie-honest')
      ctx.status = ctx.m['lie-marks'].truthful(label)
      ctx.addPoint({ x, y }, ctx.m.tokens.trueAnswer)
      return true
    }
    const liar = ctx.remember(target)
    const lies = Math.min(3, counterOn(liar))
    liar.dataset.hatsuLevel = String(lies)
    liar.classList.add('hatsu-lie-mark')
    if (lies === 3) {
      liar.style.pointerEvents = 'none'
      liar.setAttribute('aria-disabled', 'true')
      liar.style.filter = 'grayscale(1) blur(2px)'
    }
    ctx.status = ctx.m['lie-marks'].marked(lies - 1, label)
    ctx.addPoint({ x, y }, ctx.m.tokens.lie(lies), { alert: lies === 3 })
    return true
  },
  'drug-synthesis': (ctx, { target, x, y, label }) => {
    // The beast concocts whatever the collaboration allows. Two partners of the
    // same nature give a usable compound; mismatched ones give an inert batch.
    const first = ctx.selectedElements[0]
    if (!first?.isConnected) {
      ctx.selectedElements = [target]
      ctx.remember(target).classList.add('hatsu-research-partner')
      ctx.status = ctx.m['drug-synthesis'].partner(label)
      ctx.addPoint({ x, y }, ctx.m.tokens.partner(label))
      return true
    }
    if (first === target) {
      ctx.status = ctx.m['drug-synthesis'].selfPartner(label)
      return true
    }
    ctx.remember(target).classList.add('hatsu-research-partner')
    const pair = [first, target]
    const routes = pair.every((party) => party.querySelector('a[href]') || party.closest('a[href]'))
    const material = pair.every((party) => (party.textContent || '').trim().length > 80)
    if (routes) {
      ctx.guideTitle = ctx.m['drug-synthesis'].guideTitle()
      ctx.guideItems = pair.map((party) => ctx.guideItemFor(party, ctx.targetLabel(party)))
      ctx.status = ctx.m['drug-synthesis'].routes(ctx.targetLabel(first), label)
    } else if (material) {
      for (const party of pair) {
        const withheld = party.querySelector<HTMLElement>(RESTRICTED_SELECTOR)
        if (!withheld) continue
        ctx.remember(withheld)
        liftRestriction(withheld)
      }
      ctx.status = ctx.m['drug-synthesis'].material()
    } else {
      ctx.remember(target).classList.add('hatsu-synthesis-failed')
      ctx.status = ctx.m['drug-synthesis'].inert(ctx.targetLabel(first), label)
    }
    ctx.selectedElements = []
    ctx.addPoint(
      { x, y },
      routes ? ctx.m.tokens.route : material ? ctx.m.tokens.reveal : ctx.m.tokens.inert,
      {
        alert: !routes && !material,
      },
    )
    return true
  },
  'aura-levy': (ctx, { target, x, y, label }) => {
    // The wog takes aura and pays in happiness, and the amount depends on how
    // much of the Book was actually read. Asking twice breaks the only taboo.
    const reader = ctx.remember(target)
    if (reader.classList.contains('hatsu-eye-wog-reader')) {
      reader.classList.add('hatsu-tyson-punished')
      reader.style.pointerEvents = 'none'
      reader.style.filter = 'grayscale(1) contrast(.4)'
      ctx.guideItems = ctx.guideItems.filter((item) => item.element !== target)
      ctx.status = ctx.m['aura-levy'].taboo(label)
      ctx.addPoint({ x, y }, ctx.m.tokens.taboo, { alert: true })
      return true
    }
    const read = (target.textContent || '').trim().length
    const happiness = Math.min(100, Math.round(read / 12))
    reader.classList.add('hatsu-eye-wog-reader')
    const levied = reader.querySelector<HTMLElement>('button,input,textarea,select')
    if (levied) {
      ctx.remember(levied)
      levied.style.pointerEvents = 'none'
      levied.setAttribute('aria-disabled', 'true')
    }
    ctx.guideTitle = ctx.m['aura-levy'].guideTitle()
    ctx.guideItems = [
      ...ctx.guideItems,
      ctx.guideItemFor(target, `${label} · ${happiness}%`),
    ].slice(-10)
    ctx.status = ctx.m['aura-levy'].read(label, read, happiness)
    ctx.addPoint({ x, y }, `${happiness}%`)
    return true
  },
  'desire-trap': (ctx, { target, x, y, label }) => {
    // The beast reads the desire and materialises the bait itself. The victim
    // never picks it — they only decide whether to take it.
    const desire = ctx.selectedElements[0]
    if (!desire?.isConnected) {
      const wanted =
        target.querySelector<HTMLAnchorElement>('a[href]') ||
        target.closest<HTMLAnchorElement>('a[href]') ||
        target
      ctx.selectedElements = [wanted]
      ctx.remember(target).classList.add('hatsu-desire')
      ctx.floatingCards = [
        {
          id: ++ctx.sequence,
          x: Math.max(16, Math.min(innerWidth - 320, x + 30)),
          y: Math.max(80, Math.min(innerHeight - 220, y + 24)),
          label: `${ctx.targetLabel(wanted)} — exactly what you wanted`,
          kind: 'projection',
          href: wanted instanceof HTMLAnchorElement ? wanted.href : null,
        },
      ]
      ctx.status = ctx.m['desire-trap'].bait(label)
      ctx.addPoint({ x, y }, ctx.m.tokens.bait(label))
      return true
    }
    ctx.floatingCards = []
    ctx.remember(target).classList.add('hatsu-desire-bait')
    ctx.executeSiteTarget(desire)
    ctx.selectedElements = []
    ctx.status = ctx.m['desire-trap'].sprung(ctx.targetLabel(desire))
    ctx.addPoint({ x, y }, ctx.m.tokens.trapSprung, { alert: true })
    return true
  },
  'diffusive-smoke': (ctx, { target, x, y }) => {
    // Seven metres of smoke from the source and two more from every clone it
    // makes, so it keeps going outward on its own once it is out.
    const SOURCE_RADIUS = 240
    const CLONE_RADIUS = 70
    const breathe = (origin: HTMLElement, radius: number, depth: number) => {
      ctx.remember(origin).classList.add('hatsu-smoke-converted')
      const nearby = Array.from(
        document.querySelectorAll<HTMLElement>('main p, main li, main a, main h2, main h3'),
      ).filter(
        (candidate) =>
          candidate !== origin &&
          !candidate.classList.contains('hatsu-smoke-converted') &&
          distanceBetween(origin, candidate) < radius,
      )
      for (const inhaler of nearby.slice(0, 6)) {
        ctx.remember(inhaler).classList.add('hatsu-smoke-converted')
        // Enough of it and a clone forms above them, emitting in its own radius.
        if (depth < 2)
          ctx.schedule(() => breathe(inhaler, CLONE_RADIUS, depth + 1), 700 * (depth + 1))
      }
      return nearby.length
    }
    const swayed = breathe(target, SOURCE_RADIUS, 0)
    ctx.status = ctx.m['diffusive-smoke'].released(swayed)
    ctx.addPoint({ x, y }, ctx.m.tokens.inhaling(swayed))
    return true
  },
  solicitation: (ctx, { target, x, y, label }) => {
    // A refusal does not end it: a small copy sits on their shoulder and keeps
    // asking. Only one body can be held, and it feeds on that body's own aura.
    if (ctx.puppetTarget?.isConnected && ctx.puppetTarget !== target) {
      ctx.status = ctx.m['solicitation'].alreadyHeld(ctx.targetLabel(ctx.puppetTarget))
      ctx.addPoint({ x, y }, ctx.m.tokens.tooTired, { alert: true })
      return true
    }
    const asked = ctx.selectedElements.filter((element) => element.isConnected)
    if (!asked.includes(target)) {
      ctx.selectedElements = [...asked, target]
      ctx.remember(target).classList.add('hatsu-solicited')
      ctx.status = ctx.m['solicitation'].asked(label)
      ctx.addPoint({ x, y }, label)
      return true
    }
    for (const refuser of asked) {
      if (refuser === target) continue
      ctx.remember(refuser).classList.add('hatsu-solicitation-pestered')
      refuser.dataset.hatsuForgery = '¿'
    }
    const possessed = ctx.remember(target)
    possessed.classList.add('hatsu-possessed')
    possessed.setAttribute('aria-disabled', 'true')
    for (const control of controlsOf(possessed)) {
      ctx.remember(control)
      control.style.pointerEvents = 'none'
    }
    ctx.puppetTarget = possessed
    ctx.status = ctx.m['solicitation'].saidYes(asked.length - 1, label)
    ctx.addPoint({ x, y }, ctx.m.tokens.yes, { alert: true })
    ctx.schedule(() => {
      possessed.classList.remove('hatsu-possessed')
      possessed.removeAttribute('aria-disabled')
      for (const control of controlsOf(possessed)) control.style.pointerEvents = 'auto'
      if (ctx.puppetTarget === possessed) ctx.puppetTarget = null
      ctx.status = ctx.m['solicitation'].exhausted(label)
    }, 8000)
    return true
  },
  'room-isolation': (ctx, { target, x, y, label }) => {
    // Nobody outside is dimmed or stopped. They walk in and find themselves in
    // an empty copy of the room, which is the part that makes it work.
    const room = ctx.selectedElements[0]
    if (!room?.isConnected) {
      ctx.selectedElements = [target]
      const real = ctx.remember(target)
      real.classList.add('hatsu-isolated-room')
      real.style.position = 'relative'
      real.style.zIndex = '25'
      ctx.status = ctx.m['room-isolation'].realRoom(label)
      ctx.addPoint({ x, y }, ctx.m.tokens.protectedRoom)
      return true
    }
    if (room.contains(target) || room === target) {
      ctx.status = ctx.m['room-isolation'].inside(label)
      return true
    }
    const duplicate = ctx.remember(target)
    duplicate.classList.add('hatsu-empty-duplicate')
    duplicate.dataset.hatsuConjured = 'room-1013'
    let emptied = 0
    for (const furniture of Array.from(duplicate.children)) {
      if (!(furniture instanceof HTMLElement)) continue
      ctx.remember(furniture)
      furniture.style.transition = 'opacity .4s ease'
      furniture.style.opacity = '0'
      emptied += 1
    }
    ctx.status = ctx.m['room-isolation'].emptyCopy(label, emptied)
    ctx.addPoint({ x, y }, ctx.m.tokens.emptyCopy)
    return true
  },
  'pain-armour': (ctx, { target, x, y, label }) => {
    // The wrapping neither heals nor deflects: what the click costs the page is
    // sealed inside it and kept. Nothing is handed back until Rising Sun opens
    // it, so the packed elements stay on the page, marked and inert, and are
    // the charge that technique reads.
    const wrapped = ctx.remember(target)
    if (wrapped.classList.contains(PAIN_PACKER_CLASS)) {
      ctx.status = ctx.m['pain-armour'].alreadyPacked(label)
      return true
    }
    const sealed = controlsOf(wrapped).filter((control) => !isRestricted(control))
    for (const control of sealed) {
      ctx.remember(control).setAttribute('aria-disabled', 'true')
      if ('disabled' in control) (control as HTMLButtonElement).disabled = true
      control.style.pointerEvents = 'none'
    }
    wrapped.classList.add(PAIN_PACKER_CLASS)
    const packed = packedHits().length
    ctx.status = ctx.m['pain-armour'].packed(label, sealed.length, packed)
    ctx.addPoint({ x, y }, ctx.m.tokens.packedHits(packed))
    return true
  },
  'sun-flare': (ctx, { x, y, label }) => {
    // The sphere rises on damage already taken, so with nothing packed there is
    // nothing to spend. What it does spend, it spends at once.
    const packed = packedHits()
    if (packed.length === 0) {
      ctx.status = ctx.m['sun-flare'].nothingPacked(label)
      ctx.addPoint({ x, y }, ctx.m.tokens.nothingPacked, { alert: true })
      return true
    }
    const radius = SUN_FLARE_BASE_RADIUS + packed.length * SUN_FLARE_RADIUS_PER_HIT
    const caught = Array.from(
      document.querySelectorAll<HTMLElement>('main p, main li, main a, main h2, main h3, main img'),
    ).filter((candidate) => {
      const rect = candidate.getBoundingClientRect()
      if (!rect.width || !rect.height) return false
      return Math.hypot(rect.left + rect.width / 2 - x, rect.top + rect.height / 2 - y) < radius
    })
    let opened = 0
    for (const burnt of caught) {
      ctx.remember(burnt).classList.add('hatsu-carbonised')
      if (!isRestricted(burnt)) continue
      liftRestriction(burnt)
      opened += 1
    }
    // The armour is opened wherever it hangs: it is Feitan's own damage, not the
    // page's, so distance from the click has nothing to say about it.
    for (const hit of packed) {
      ctx.remember(hit).classList.remove(PAIN_PACKER_CLASS)
      for (const control of controlsOf(hit)) liftRestriction(ctx.remember(control))
      opened += 1
    }
    ctx.status = ctx.m['sun-flare'].risen(label, packed.length, caught.length, opened)
    ctx.addPoint({ x, y }, ctx.m.tokens.carbonised(caught.length), {
      alert: caught.length > packed.length,
      details: [ctx.m.tokens.noDiscrimination],
    })
    return true
  },
  'postmortem-curse': (ctx, { target, x, y, label }) => {
    // A photograph of the target, a dagger, years of thinking about them, and
    // then the user's own death. How close the ashes are decides whether the
    // target has hours or months — and the technique dies with its user.
    const [victim, relic] = ctx.selectedElements
    if (!victim?.isConnected) {
      ctx.selectedElements = [target]
      ctx.remember(target).classList.add('hatsu-curse-target')
      ctx.status = ctx.m['postmortem-curse'].target(label)
      ctx.addPoint({ x, y }, ctx.m.tokens.target(label))
      return true
    }
    if (!relic?.isConnected) {
      const connected =
        target !== victim &&
        (victim.contains(target) ||
          (Boolean(target.dataset.hatsuCharacter) &&
            target.dataset.hatsuCharacter === victim.dataset.hatsuCharacter) ||
          ctx.targetLabel(target).slice(0, 6) === ctx.targetLabel(victim).slice(0, 6))
      if (!connected) {
        ctx.status = ctx.m['postmortem-curse'].notConnected(ctx.targetLabel(victim), label)
        ctx.addPoint({ x, y }, ctx.m.tokens.notConnected, { alert: true })
        return true
      }
      ctx.selectedElements = [victim, target]
      ctx.remember(target).classList.add('hatsu-curse-relic')
      ctx.studyCount = 0
      ctx.status = ctx.m['postmortem-curse'].relic(label)
      ctx.addPoint({ x, y }, ctx.m.tokens.relic(label))
      return true
    }
    if (target !== relic) {
      ctx.status = ctx.m['postmortem-curse'].wrongObject(label)
      return true
    }
    ctx.studyCount += 1
    ctx.remember(relic).classList.add('hatsu-curse-prepared')
    relic.dataset.hatsuLevel = String(ctx.studyCount)
    const gap = Math.round(distanceBetween(relic, victim))
    if (ctx.studyCount < 5) {
      ctx.status = ctx.m['postmortem-curse'].rite(ctx.targetLabel(victim), ctx.studyCount, gap)
      ctx.addPoint({ x, y }, ctx.m.tokens.rite(ctx.studyCount))
      return true
    }
    const close = gap < 220
    relic.classList.add('hatsu-postmortem-drain')
    relic.style.pointerEvents = 'none'
    relic.style.opacity = '.15'
    ctx.status = ctx.m['postmortem-curse'].completed(ctx.targetLabel(victim), gap, close)
    ctx.addPoint({ x, y }, 'POST-MORTEM', { alert: true })
    ctx.schedule(
      () => {
        ctx.remember(victim).classList.add('hatsu-postmortem-drain')
        victim.style.pointerEvents = 'none'
        ctx.status = ctx.m['postmortem-curse'].noAura(ctx.targetLabel(victim))
        // The last step of the rite is the user's own death, so this goes too.
        deactivateHatsu()
      },
      close ? 1200 : 3400,
    )
    return true
  },
}

/** Runs the technique bound to `kind`, or reports that none is bound. */
export function runHatsuInteraction(
  ctx: HatsuInteractionContext,
  args: HatsuInteractionArgs,
): boolean {
  const handler = HATSU_INTERACTION_BY_KIND[ctx.profile.kind]
  if (!handler) return false
  return handler(ctx, args)
}
