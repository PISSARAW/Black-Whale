import { goto } from '$app/navigation'
import type { Page } from '@sveltejs/kit'

import { playHatsuNote, setAmbientMuffled } from '$lib/audio/ambient.js'
import { mapState } from '$lib/state/mapState.svelte'
import { deactivateHatsu } from './hatsuState.js'
import type { HatsuInteractionKind, HatsuProfile } from './hatsuRegistry.js'

export type Point = {
  x: number
  y: number
  label: string
  id: number
  alert?: boolean
  details?: string[]
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
  addPoint: (
    x: number,
    y: number,
    label: string,
    extra?: { alert?: boolean; details?: string[] },
  ) => void
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
    const forgery = ['OFFICIAL ACCESS', 'CLEARED RECORD', 'AUTHORIZED IDENTITY', 'EMPTY SURFACE'][
      texture
    ]
    element.dataset.hatsuLevel = String(texture)
    element.dataset.hatsuForgery = forgery
    element.classList.add('hatsu-texture-surprise')
    element.style.setProperty('--texture-index', String(texture))
    element.setAttribute('aria-label', `${forgery} — Texture Surprise forgery`)
    ctx.status = `${label}'s real information concealed beneath “${forgery}” · its original function remains underneath`
    ctx.addPoint(x, y, label)
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
    ctx.status = freed
      ? `${ctx.targetLabel(scope)} at 100% in every category · ${freed} sealed element${freed > 1 ? 's' : ''} answered · ${life} hours of life spent`
      : `${ctx.targetLabel(scope)} was already running at full efficiency · ${life} hours of life spent for nothing`
    ctx.addPoint(x, y, `100% · −${life}h`, { alert: !freed })
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
      ctx.status = `${label}'s aura is draining out of the syringe, but there was no ability in it to take`
      ctx.addPoint(x, y, label, { alert: true })
      return true
    }
    ctx.capturedTechniques = techniques.slice(0, 1)
    drained.setAttribute('aria-disabled', 'true')
    for (const control of controlsOf(drained)) {
      ctx.remember(control)
      control.style.pointerEvents = 'none'
    }
    ctx.status = `${ctx.capturedTechniques[0].name} pulled out of ${label} · it is held in Zetsu and does not get it back until the chain returns it`
    ctx.addPoint(x, y, label, { details: techniques.map((technique) => technique.name) })
    return true
  },
  'chain-bind': (ctx, { target, x, y, label }) => {
    const name = target.dataset.hatsuCharacterName || label
    const spiders =
      /chrollo|nobunaga|feitan|phinks|franklin|machi|shizuku|bonolenov|kalluto|illumi/i
    if (!spiders.test(name)) {
      ctx.remember(target).classList.add('hatsu-invalid-chain-target')
      ctx.status = `Vow violated on ${name} · Chain Jail rejects non-Spider target`
      ctx.addPoint(x, y, 'FATAL VOW', { alert: true })
      ctx.schedule(() => deactivateHatsu(), 1400)
    } else {
      ctx.remember(target).classList.add('hatsu-chain-jailed')
      target.style.pointerEvents = 'none'
      ctx.status = `${name} bound in forced Zetsu · all actions sealed`
      ctx.addPoint(x, y, name)
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
    ctx.status = uncertainty
      ? `${label} · pendulum detects uncertainty or deception (${ctx.dowsingSignal}%)`
      : `${label} located · signal ${ctx.dowsingSignal}%`
    ctx.addPoint(x, y, label, { alert: uncertainty, details: [`Signal ${ctx.dowsingSignal}%`] })
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
    ctx.status =
      level === 5
        ? `${label} at full Ren · there is more aura in it than it can hold and the mantle spills onto everything beside it`
        : `${label} reinforced · aura output ${level}/5`
    ctx.addPoint(x, y, `REN ${level}`)
    return true
  },
  control: (ctx, { target, x, y, label }) => {
    // Oito has nothing of her own: what she has is guards, and their aura is
    // pooled. So the network answers as one body rather than marching anywhere.
    const network = ctx.selectedElements.filter((element) => element.isConnected)
    if (!network.length) {
      ctx.selectedElements = [target]
      ctx.remember(target).classList.add('hatsu-royal-commander')
      ctx.status = `${label} is the one being guarded · every link from here is drawn back to it`
      ctx.addPoint(x, y, `CHARGE · ${label}`)
      return true
    }
    const commander = network[0]
    if (network.includes(target)) {
      for (const guard of network) ctx.remember(guard).classList.add('hatsu-royal-answered')
      ctx.status = `${label} was touched and all ${network.length} answered at once · that is the whole of the network`
      ctx.addPoint(x, y, `ANSWERED ×${network.length}`)
      return true
    }
    ctx.selectedElements = [...network, target]
    ctx.remember(target).classList.add('hatsu-royal-controlled')
    const origin = commander.getBoundingClientRect()
    const rect = target.getBoundingClientRect()
    target.style.transition = 'transform .45s ease'
    ctx.applyTransform(
      target,
      `translate(${(origin.left - rect.left) * 0.18}px, ${(origin.top - rect.top) * 0.18}px)`,
    )
    ctx.status = `${network.length} guard${network.length > 1 ? 's' : ''} around ${ctx.targetLabel(commander)} · they pool what little they each have`
    ctx.addPoint(x, y, label)
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
    ctx.status = living
      ? `${label} Nen growth ${level}/10 · progress is slow on an untrained person`
      : `${label} germinated to growth stage ${level}/10`
    ctx.addPoint(x, y, `GROW ${level}`)
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
      ctx.status = `Vehicle launched · ${ctx.selectedElements.length} passengers burning ${fuel}% of their own aura to move the hull`
    } else if (ctx.selectedElements.length < 5 && !ctx.selectedElements.includes(target)) {
      ctx.selectedElements = [...ctx.selectedElements, target]
      ctx.remember(target).classList.add('hatsu-passenger')
      ctx.status = `${ctx.selectedElements.length}/5 passengers aboard · click a passenger to depart`
      ctx.addPoint(x, y, label)
    } else if (ctx.selectedElements.includes(target)) {
      ctx.status = `${label} is already aboard · the vehicle needs a second passenger before it departs`
    } else {
      ctx.status = `${label} refused · the transformed hull is full at 5 passengers`
    }
    return true
  },
  scout: (ctx, { target, x, y, label }) => {
    // The aura ball can only take hold of a small living thing — a hamster is
    // the ceiling — and it slides off anything that was made out of aura.
    if (isNenMade(target)) {
      ctx.status = `${label} is made of aura · Little Eye cannot take hold of a conjured creature`
      ctx.addPoint(x, y, 'CONJURED', { alert: true })
      return true
    }
    const rect = target.getBoundingClientRect()
    const size = Math.round(rect.width * rect.height)
    if (size > SMALL_HOST_AREA) {
      ctx.status = `${label} is ${Math.round(size / SMALL_HOST_AREA)}× bigger than a hamster · the ball has nothing it can hold`
      ctx.addPoint(x, y, 'TOO BIG', { alert: true })
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
    ctx.status = `A host of ${size}px² taken · what it sees and hears comes back, and it keeps seeing aura while it lasts`
    ctx.addPoint(x, y, label)
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
      ctx.status = `BLUE · ${label} is admitted and answers to the court from now on`
      ctx.cardIndex = 1
    } else if (ctx.cardIndex === 1) {
      element.classList.add('hatsu-cross-warning')
      ctx.executeSiteTarget(element)
      ctx.status = `YELLOW · ${label} is under the court's control and did as it was told · flip the card if it stops`
      ctx.cardIndex = 2
    } else if (ctx.cardIndex === 2) {
      element.classList.add('hatsu-cross-restrained')
      element.setAttribute('aria-disabled', 'true')
      for (const control of controlsOf(element)) {
        ctx.remember(control)
        control.style.pointerEvents = 'none'
      }
      ctx.status = `YELLOW REVERSED · ${label} is boxed in and can still speak · the box does not hold long`
      ctx.cardIndex = 3
      // Restraint wears off quickly and can simply be issued again.
      ctx.schedule(() => {
        element.classList.remove('hatsu-cross-restrained')
        element.removeAttribute('aria-disabled')
        for (const control of controlsOf(element)) control.style.pointerEvents = 'auto'
        if (ctx.crossGameTarget === element) ctx.cardIndex = 1
        ctx.status = `${label} is out of the box · the court can restrain it as many times as it needs to`
      }, 3200)
    } else {
      element.classList.add('hatsu-cross-expelled')
      element.style.opacity = '.3'
      element.style.pointerEvents = 'none'
      ctx.crossGameTarget = null
      ctx.cardIndex = 0
      ctx.status = `RED · ${label} is dismissed and no longer answers to this court`
    }
    ctx.addPoint(x, y, ctx.tribunalCards[Math.min(3, ctx.cardIndex)])
    return true
  },
  curse: (ctx, { target, x, y, label }) => {
    // Beyond chose the victim decades ago and chose the sacrifice himself, in
    // the same moment. Nobody picks the carrier, the mark cannot be seen without
    // Gyo, and he left no signature on it that points back at him.
    if (!ctx.selectedElements.length) {
      const born = Array.from(target.querySelectorAll<HTMLElement>('[data-hatsu-character], li, p'))
      const sacrifice = born[born.length - 1] || target
      ctx.selectedElements = [target, sacrifice]
      ctx.remember(sacrifice).dataset.hatsuLevel = 'cursed'
      ctx.status = `${label} was named the victim · a sacrifice among its own was chosen at the same moment and marked where nothing shows`
      ctx.addPoint(x, y, `VICTIM · ${label}`)
      return true
    }
    const [victim, sacrifice] = ctx.selectedElements
    if (target !== sacrifice) {
      // Gyo: looking hard at the right place is the only way to find the mark.
      const found = target.contains(sacrifice)
      ctx.remember(target).classList.add(found ? 'hatsu-beyond-cursed' : 'hatsu-gyo-empty')
      ctx.status = found
        ? `Gyo found the birthmark somewhere inside ${label} · touch the sacrifice itself to spend it`
        : `Gyo found nothing on ${label} · whoever cast this masked their own aura in it`
      ctx.addPoint(x, y, found ? 'MARK FOUND' : 'NO TRACE', { alert: !found })
      return true
    }
    ctx.remember(sacrifice).classList.add('hatsu-sacrifice-dead')
    ctx.remember(victim).classList.add('hatsu-curse-triggered')
    victim.style.pointerEvents = 'none'
    ctx.status = `The sacrifice died · the curse crossed the whole page and took ${ctx.targetLabel(victim)}, and nothing on it says who cast it`
    ctx.addPoint(x, y, 'POST-MORTEM', { alert: true })
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
    ctx.status = broken
      ? `The palm blast broke ${broken} guard${broken > 1 ? 's' : ''} off ${label} from across the page, without touching it`
      : `${label} had no guard up · the blast went straight through and did nothing`
    ctx.addPoint(x, y, broken ? `GUARD ×${broken}` : 'NO GUARD', { alert: !broken })
    return true
  },
  surveillance: (ctx, { target, x, y, label }) => {
    ctx.selectedElements.forEach((element) => element.classList.remove('hatsu-secret-window'))
    ctx.selectedElements = [target]
    ctx.remember(target).classList.add('hatsu-secret-window')
    const change = target.dataset.hatsuNextChange || 'stable'
    const alert = change === 'dead' || change === 'moved'
    ctx.points = [{ x, y, label, id: ++ctx.sequence, alert, details: [`Next chapter: ${change}`] }]
    ctx.status =
      change === 'dead'
        ? `${label} · owl recorded impending death`
        : change === 'moved'
          ? `${label} · owl recorded a location change`
          : `${label} · live feed stable, earlier footage retained`
    return true
  },
  future: (ctx, { target, x, y, label }) => {
    ctx.addPoint(x, y, `PREDICTED · ${label}`)
    ctx.remember(target).classList.add('hatsu-future-afterimage')
    ctx.status = ctx.parallelFutureVisible
      ? `${label} added to the immutable ten-second prediction · choose a different real action`
      : `Prediction ended · ${ctx.points.length} actions remain as afterimages`
    return true
  },
  resurrection: (ctx, { target, x, y, label }) => {
    const killer = target
    ctx.remember(killer).classList.add('hatsu-camilla-killer')
    ctx.status = `${label} killed Camilla · post-mortem counterattack materializing`
    ctx.addPoint(x, y, label)
    ctx.schedule(() => {
      ctx.remember(killer).classList.add('hatsu-cat-crushed')
      killer.style.pointerEvents = 'none'
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' })
      ctx.status = `${label}'s life force absorbed · Camilla fully resurrected`
    }, 900)
    return true
  },
  poetry: (ctx, { target, x, y, label }) => {
    // Whatever Basho writes becomes real, and *which* real thing depends on the
    // word of invocation in it: "light" purifies, fire burns. A seasonal word
    // makes it stronger, and a poem with neither stays a piece of paper.
    ctx.addPoint(x, y, label)
    ctx.cardIndex += 1
    if (ctx.cardIndex < 3) {
      ctx.remember(target).classList.add('hatsu-haiku-line')
      ctx.status = `Line ${ctx.cardIndex}/3 written · the words chosen are what decides the effect`
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
      ctx.status = `“${poem}” · the word for light purified ${ctx.targetLabel(purified)} and lifted ${cleared} thing${cleared === 1 ? '' : 's'} off it${seasonal ? ', and the season carried it further' : ''}`
      ctx.addPoint(x, y, seasonal ? 'LIGHT ++' : 'LIGHT')
      return true
    }
    if (/fire|burn|flame|ash|blood|death|kill|break/i.test(poem)) {
      const burnt = ctx.remember(target)
      burnt.classList.add('hatsu-haiku-burnt')
      burnt.style.pointerEvents = 'none'
      burnt.style.opacity = seasonal ? '.1' : '.3'
      ctx.status = `“${poem}” · whatever the fist strikes burns, and ${label} was what it struck${seasonal ? ' · the season made it burn through' : ''}`
      ctx.addPoint(x, y, seasonal ? 'FIRE ++' : 'FIRE', { alert: true })
      return true
    }
    ctx.remember(target).classList.add('hatsu-haiku-weak')
    ctx.status = `“${poem}” · there is no word of invocation anywhere in it · the strip stays a strip of paper`
    ctx.addPoint(x, y, 'NO INVOCATION', { alert: true })
    return true
  },
  restoration: (ctx, { target, x, y, label }) => {
    ctx.remember(target).classList.add('hatsu-restored')
    mapState.currentZoomLevel = 'OVERVIEW'
    mapState.selectedTier = null
    mapState.selectedLocationId = null
    mapState.currentEventIndex = 0
    const cleanUrl = ctx.page.url.pathname
    if (ctx.page.url.search)
      void goto(cleanUrl, { replaceState: true, noScroll: true, keepFocus: true })
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    ctx.status = `${label} restored · chapter filters, map depth and event position returned to their rested baseline`
    ctx.addPoint(x, y, label)
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
    ctx.status = small
      ? `${label} in the harmless form · ${Math.max(0, controls.length - 1)} of its ${controls.length} controls are past what that body can do`
      : `${label} back to its true form · everything within reach again`
    ctx.addPoint(x, y, small ? `SMALL · ${label}` : `TRUE · ${label}`)
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
    ctx.status = `${label} wears the conjured attire and holds the spear · its reach covers ${reach.length} neighbour${reach.length === 1 ? '' : 's'}, and the attire covers it`
    ctx.addPoint(x, y, `ARMED · ${label}`)
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
        ctx.status = `${label} got out of earshot before the sphere closed on it`
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
        ctx.status = `Jupiter caught ${label} and closed`
        return
      }
      ctx.status = `Jupiter is still chasing ${label} · pass ${pass}/4`
      ctx.schedule(pursue, 700)
    }
    ctx.status = `Jupiter conjured over ${label} · the dance is done, so it will not stop now`
    ctx.addPoint(x, y, label)
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
      ctx.status = `${spoken * 2} seconds spent with ${label} · that is exactly how long its form will hold`
      ctx.addPoint(x, y, `${spoken * 2}s`)
      return true
    }
    const budget = Number(model.dataset.hatsuLevel || 1) * 2000
    const source = getComputedStyle(model)
    const transformed = ctx.remember(target)
    transformed.style.background = source.background
    transformed.style.color = source.color
    transformed.style.border = source.border
    transformed.style.borderRadius = source.borderRadius
    transformed.style.fontFamily = source.fontFamily
    transformed.classList.add('hatsu-metamorphosen')
    ctx.selectedElements = [model, transformed]
    ctx.status = `${label} took ${ctx.targetLabel(model)}'s form · ${budget / 1000} seconds of it, whatever the difference in size`
    ctx.addPoint(x, y, label)
    ctx.schedule(() => {
      transformed.classList.remove('hatsu-metamorphosen')
      for (const property of ['background', 'color', 'border', 'border-radius', 'font-family'])
        transformed.style.removeProperty(property)
      ctx.status = `The time bought with ${ctx.targetLabel(model)} ran out and ${label} is itself again`
    }, budget)
    return true
  },
  theft: (ctx, { target, x, y }) => {
    const control = target.closest<HTMLElement>('a, button')
    if (!control) {
      ctx.status = 'Skill Hunter requires an exposed button or link'
      return true
    }
    ctx.stolenTarget = control
    ctx.remember(control)
    control.style.opacity = '.22'
    control.style.pointerEvents = 'none'
    control.classList.add('hatsu-stolen')
    ctx.status = `${ctx.targetLabel(control)} sealed in Skill Hunter`
    ctx.addPoint(x, y, ctx.targetLabel(control))
    return true
  },
  bookmark: (ctx, { target, x, y, label }) => {
    // The bookmark is the loophole in Skill Hunter: it keeps one page usable
    // while the book is open on another, which is what gets him two at once.
    const held = ctx.selectedElements.filter((element) => element.isConnected)
    if (held.includes(target)) {
      ctx.status = `${label} is already the held page · the other hand holds the book`
      return true
    }
    if (held.length >= 2) {
      ctx.status = `Two open pages is the whole of it · ${label} would need a third hand`
      ctx.addPoint(x, y, 'TWO ONLY', { alert: true })
      return true
    }
    ctx.selectedElements = [...held, target]
    ctx.remember(target)
    target.style.position = 'sticky'
    target.style.top = `${5 + held.length * 5}rem`
    target.style.zIndex = String(35 - held.length)
    target.classList.add('hatsu-bookmarked')
    ctx.status =
      held.length === 0
        ? `${label} held open by the bookmark · the book is free to open somewhere else`
        : `Both pages are open at once · ${ctx.targetLabel(held[0])} and ${label} can be used together`
    ctx.addPoint(x, y, label)
    return true
  },
  devour: (ctx, { target, x, y, label }) => {
    // The fish only lives behind closed doors, and its victim keeps standing:
    // no pain, no bleeding, nothing visibly wrong, right up until it is gone.
    const room = target.closest<HTMLElement>('section, article, li') || target
    if (room.querySelector('a[href]')) {
      ctx.status = `${label} is not a sealed room · the fish suffocates among all those open doors`
      ctx.addPoint(x, y, 'NOT SEALED', { alert: true })
      return true
    }
    const element = ctx.remember(target)
    const bites = counterOn(element)
    element.classList.add('hatsu-devoured')
    element.style.setProperty('--devoured', String(Math.min(1, bites / 4)))
    if (bites >= 4) {
      element.style.color = 'transparent'
      element.style.textShadow = 'none'
      ctx.status = `${label} has been eaten through · it still stands, still answers, and still does not know`
    } else ctx.status = `${label} being eaten · bite ${bites}/4 · no pain, no blood, no mark on it`
    ctx.addPoint(x, y, `BITE ${bites}`)
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
    ctx.status = wrapped
      ? `${label} wrapped up · it fits in a palm now, and nothing about it is damaged`
      : `${label} let back out of the cloth at its original size`
    ctx.addPoint(x, y, wrapped ? `WRAPPED · ${label}` : `RELEASED · ${label}`)
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
      ctx.status = `${label} stayed where it was · there is nowhere else on this page to put it`
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
    ctx.status = `${label} is no longer where it stood · it is beside ${ctx.targetLabel(landing)}, and it was not asked`
    ctx.addPoint(x, y, label)
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
      ctx.status = sun
        ? `Sun and plus pressed onto ${label} · touch it again to hold the contact, or place the Moon`
        : `Moon and minus pressed onto ${label} · the pair is placed but nothing has touched yet`
      ctx.addPoint(x, y, sun ? `☀ ${label}` : `☾ ${label}`)
      return true
    }
    if (marked && ctx.selectedElements.length < 2) {
      const charge = counterOn(target)
      ctx.applyTransform(target, `scale(${1 + charge * 0.02})`)
      ctx.status = `Contact held on ${label} for ${charge} second${charge > 1 ? 's' : ''} · ${charge >= 4 ? 'fully charged' : 'three to five is full power'}`
      ctx.addPoint(x, y, `CHARGE ${charge}`)
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
      ctx.status = `${Math.round(gap)}px between the two marks · they were carried together and have still not met`
      ctx.addPoint(x, y, 'CLOSING')
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
    ctx.status =
      charge >= 4
        ? `Fully charged marks met · ${killed} bodies went up, not just the two bearing them`
        : `The marks touched at charge ${charge} · only the two bearers went up`
    ctx.addPoint(x, y, 'DETONATION', { alert: true })
    return true
  },
  command: (ctx, { target, x, y, label }) => {
    // A puppet has to have a head and has to be lifeless. Corpses are refused
    // outright; Nen copies of them are not. And the orders stay simple.
    const head = target.querySelector<HTMLElement>('h1,h2,h3,h4,h5,h6,summary,legend,dt')
    const stamped = ctx.selectedElements.filter((puppet) => puppet.isConnected)
    if (stamped.length < 3) {
      if (!head) {
        ctx.status = `${label} has no head · there is nothing on it to stamp`
        ctx.addPoint(x, y, 'NO HEAD', { alert: true })
        return true
      }
      const conjured = isNenMade(target) || Boolean(target.dataset.hatsuFake)
      const living =
        target.matches('a,button,[role="button"],[data-hatsu-character]') ||
        Boolean(target.querySelector('[data-hatsu-character]'))
      if (living && !conjured) {
        ctx.status = `${label} is not an object · the stamp refuses it, though a Nen copy of it would do`
        ctx.addPoint(x, y, 'ALIVE', { alert: true })
        return true
      }
      ctx.selectedElements = [...stamped, target]
      ctx.remember(head).classList.add('hatsu-stamped-head')
      head.dataset.hatsuForgery = '人'
      ctx.remember(target).classList.add('hatsu-stamped')
      ctx.status = `人 on ${label}'s head · ${stamped.length + 1} puppet${stamped.length ? 's' : ''} · take a head off and that one stops`
      ctx.addPoint(x, y, label)
      return true
    }
    const destination = target.getBoundingClientRect()
    for (const puppet of stamped) {
      const rect = puppet.getBoundingClientRect()
      ctx.remember(puppet)
      puppet.style.transition = 'transform .7s ease'
      ctx.applyTransform(
        puppet,
        `translate(${destination.left - rect.left}px, ${destination.top - rect.top}px) scale(.72)`,
      )
    }
    ctx.status = `“Go to ${label}” · simple enough for all ${stamped.length} of them to follow it`
    ctx.addPoint(x, y, `ORDER · ${label}`)
    return true
  },
  'identity-swap': (ctx, { target, x, y, label }) => {
    // The left hand takes a likeness, the right hand gives one, both hands
    // exchange them. Only appearances move — nothing about what they do.
    if (!ctx.selectedElements.length) {
      ctx.selectedElements = [target]
      ctx.remember(target).classList.add('hatsu-left-hand')
      ctx.status = `Left hand on ${label} · its likeness is taken, its destination is not · now choose who wears it`
      ctx.addPoint(x, y, `↓ ${label}`)
      return true
    }
    const model = ctx.selectedElements[0]
    if (model === target) {
      ctx.status = `${label} cannot wear its own face · touch a second identity`
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
    ctx.status = `${modelLabel} and ${label} are wearing each other's faces · both still lead exactly where they always led`
    ctx.addPoint(x, y, `↕ ${label}`)
    return true
  },
  divination: (ctx, { target, x, y, label }) => {
    // The dial never points at anyone. It says whether they are in range, and
    // then refuses to be called again until you have moved somewhere else.
    const area = ctx.targetLabel(target.closest<HTMLElement>('section, article, main') || target)
    if (ctx.studyTarget === area) {
      ctx.status = 'The dial will not take another call from this area · move somewhere else first'
      ctx.addPoint(x, y, 'REFUSED', { alert: true })
      return true
    }
    ctx.studyCount += 1
    if (ctx.studyCount > 6) {
      ctx.status = 'No calls left today · the handset has its allowance and that was it'
      ctx.addPoint(x, y, 'NO CALLS', { alert: true })
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
    ctx.guideTitle = `Love Dial 6700 · call ${ctx.studyCount}/6`
    ctx.guideItems = ctx.dialBest ? [ctx.dialBest.item] : []
    ctx.status = `Dialled ${digits} · the ideal partner is ${band} (${affinity}%) · that is all the handset will say`
    ctx.addPoint(x, y, `${affinity}%`, { details: [digits, band] })
    return true
  },
  prophecy: (ctx, { target, x, y, label }) => {
    // Neon needed a full name, a date of birth and a blood type before the quill
    // would move, she could never write her own, and the first verse is always
    // about something that has already happened.
    if (target.closest('[data-hatsu-ui]')) {
      ctx.status = 'Lovely Ghostwriter cannot write the fortune of whoever is holding the pen'
      ctx.addPoint(x, y, 'NO OWN FUTURE', { alert: true })
      return true
    }
    const name = target.dataset.hatsuCharacterName || label
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
      ctx.status = `${name} did not write down ${missing} · the quill will not move on an incomplete slip`
      ctx.addPoint(x, y, 'INCOMPLETE', { alert: true })
      return true
    }
    const links = Array.from(target.querySelectorAll<HTMLAnchorElement>('a')).slice(0, 4)
    const already = ctx.points[0]?.label
    ctx.prophecyLines = [
      already
        ? `You have already been to ${already}; that much is behind you.`
        : `You came aboard and touched nothing; that much is behind you.`,
      `The ${name.slice(0, 18)} waits beneath a black tide.`,
      `${links.length || 'No'} paths open; only one returns unchanged.`,
      `Guard the final link, or the Whale will erase its name.`,
    ]
    ctx.guideTitle = 'Lovely Ghostwriter · foretold paths'
    ctx.guideItems = links.map((link) => ctx.guideItemFor(link, ctx.targetLabel(link)))
    ctx.status = `Four quatrains written for ${name} in a trance · the first one is the past, the ${ctx.guideItems.length} routes after it are not`
    ctx.addPoint(x, y, label)
    return true
  },
  clone: (ctx, { target, x, y, label }) => {
    if (target.closest(`.${GALLERY_FAKE_CLASS}`)) {
      ctx.status = 'A copy has nothing left to copy · touch an original object'
      return true
    }
    const replica = buildGalleryFake(target)
    if (!replica) {
      ctx.status = `${label} has no visible body to copy`
      return true
    }
    document.body.append(replica)
    const living = Boolean(target.closest('[data-hatsu-character]'))
    if (living) replica.classList.add('hatsu-gallery-corpse')
    // En on the original for as long as the copy lasts, and it lasts a day.
    ctx.remember(target).classList.add('hatsu-gallery-original')
    ctx.status = living
      ? `${label} copied · what came out of the right hand is a body, and it does none of what the original does`
      : `${label} copied · the replica lies beside the original with none of its function`
    ctx.addPoint(x, y, label)
    ctx.schedule(() => {
      replica.remove()
      target.classList.remove('hatsu-gallery-original')
      ctx.status = `The copy of ${label} reached its twenty-four hours and went`
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
        ctx.status = 'Black Voice needs a button or link for its antenna'
        return true
      }
      ctx.selectedElements = [...planted, control]
      ctx.remember(control).classList.add('hatsu-antenna')
      if (planted.length) {
        ctx.puppetTarget = ctx.selectedElements[ctx.points.length % 2]
        ctx.status =
          'Both antennae are out · one of them answers the phone and the other is for you to look at'
      } else
        ctx.status = `${ctx.targetLabel(control)} has an antenna in it · plant the second before giving any order`
      ctx.addPoint(x, y, ctx.targetLabel(control))
      return true
    }
    if (!ctx.puppetTarget || ctx.puppetExecuting) return true
    ctx.puppetExecuting = true
    const feint = planted.find((element) => element !== ctx.puppetTarget)
    if (feint) ctx.remember(feint).classList.add('hatsu-antenna-feint')
    ctx.status = `The order went into ${ctx.targetLabel(ctx.puppetTarget)}${feint ? `, not into ${ctx.targetLabel(feint)}` : ''}`
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
      const element = ctx.remember(hit)
      element.style.transition = 'transform .18s ease-out'
      ctx.applyTransform(element, `translate(${direction * force}px, ${((index % 3) - 1) * 10}px)`)
      element.classList.add('hatsu-bullet-hit')
      if (!isNenMade(hit) && !hit.dataset.hatsuFake) continue
      pierced += 1
      element.style.opacity = '.2'
      element.style.pointerEvents = 'none'
    }
    // Conjured cards are no protection either.
    ctx.floatingCards = []
    ctx.status = `${line.length * 2} bullets across ${label} and what stood beside it${pierced ? ` · ${pierced} Nen construct${pierced > 1 ? 's' : ''} torn straight through` : ''}`
    ctx.addPoint(x, y, label)
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
      ctx.status = `${ctx.targetLabel(body)} was touched · the double is gone and he is back inside it`
      ctx.addPoint(x, y, 'RECALLED', { alert: true })
      return true
    }
    if (body?.isConnected) {
      ctx.status = `The double passed straight through ${label} without opening anything on the way`
      ctx.addPoint(x, y, label)
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
    ctx.status = `The double left ${label} behind · the body does nothing while he is out, and touching it ends this`
    ctx.addPoint(x, y, label)
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
      ctx.status = `${label} refused · there is no aura left today for ${large ? 'a third large body' : 'an eleventh small one'}`
      ctx.addPoint(x, y, 'NO AURA', { alert: true })
      return true
    }
    ctx.selectedElements = [...live, target]
    ctx.status = `${label} touched · the change takes a few seconds to come through`
    ctx.addPoint(x, y, label)
    ctx.schedule(() => {
      ctx.remember(target).classList.add('hatsu-animated-object')
      target.dataset.hatsuConjured = 'biohazard'
      ctx.status = `${label} is alive and still doing its job · ${large ? 'a large body, so' : 'small, so'} its aura will not last long`
    }, 2200)
    ctx.schedule(
      () => {
        target.classList.remove('hatsu-animated-object')
        delete target.dataset.hatsuConjured
        ctx.status = `${label} used up its aura and is an object again`
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
      ctx.status = `${label} already survived an order · it is crippled and takes no more`
      return true
    }
    element.classList.add('hatsu-needle-puppet')
    ctx.selectedElements = [...ctx.selectedElements.filter((puppet) => puppet.isConnected), element]
    ctx.status = `A needle into ${label} and one order given · there is nothing left in it that could stop`
    ctx.addPoint(x, y, label)
    let strain = 0
    const obey = () => {
      if (!element.isConnected) return
      strain += 1
      ctx.applyTransform(element, `translateX(${strain * 8}px) rotate(${strain}deg)`)
      element.style.transition = 'transform .3s ease'
      if (strain < 3) {
        ctx.status = `${label} is still carrying out its order · ${strain}/3 before the body gives`
        ctx.schedule(obey, 1300)
        return
      }
      ctx.executeSiteTarget(element)
      element.classList.remove('hatsu-needle-puppet')
      element.classList.add('hatsu-needle-crippled')
      element.style.pointerEvents = 'none'
      element.style.filter = 'grayscale(1)'
      ctx.status = `${label} carried the order out and burnt itself doing it · crippled from here on`
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
      ctx.status = `${label} · ${report.count} changes reported by paper doll`
    })
    observer.observe(target, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true,
    })
    ctx.observers.push(observer)
    ctx.status = `Paper doll deployed inside ${label}`
    ctx.addPoint(x, y, label)
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
      ctx.status = `One piece stuck in ${label} at ${px}%, ${py}% · every stream from here finds it again`
      ctx.addPoint(x, y, 'STUCK')
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
    ctx.status = `The stream came back into the same wound in ${ctx.targetLabel(anchor)} · pass ${cuts}${target === anchor ? '' : ` · you aimed at ${label} and it went there anyway`}`
    ctx.addPoint(x, y, `PASS ${cuts}`)
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
      ctx.status = `${label} is alone on its surface · the aura has nowhere along it to travel`
      ctx.addPoint(x, y, 'NO SURFACE', { alert: true })
      return true
    }
    const punches = counterOn(surface)
    const emerging = along[(punches + label.length) % along.length]
    const fist = ctx.remember(emerging)
    fist.classList.remove('hatsu-remote-punched')
    void fist.offsetWidth
    fist.classList.add('hatsu-remote-punched')
    ctx.executeSiteTarget(fist)
    ctx.status = `Struck at ${label}, ran along ${ctx.targetLabel(surface)}, and came up under ${ctx.targetLabel(emerging)} · ${punches} fist${punches > 1 ? 's' : ''} out of this surface`
    ctx.addPoint(event.clientX, y, ctx.targetLabel(emerging))
    return true
  },
  spatial: (ctx, { target, x, y, label }) => {
    // Luini could only open the passage from a room with one closed door and
    // solid walls. Open that door once and the room never works again.
    const room = target.closest<HTMLElement>('section, article, details, li') || target
    if (room.dataset.hatsuLevel === 'burnt') {
      ctx.status = `${ctx.targetLabel(room)} was unsealed once · the passage will never open there again`
      ctx.addPoint(x, y, 'RESET', { alert: true })
      return true
    }
    const doors = room.querySelectorAll('a[href], details[open], [aria-expanded="true"]').length
    if (doors > 1) {
      room.dataset.hatsuLevel = 'burnt'
      ctx.remember(room).classList.add('hatsu-room-unsealed')
      ctx.status = `${ctx.targetLabel(room)} has ${doors} ways out · that is not a sealed room, and now it is a burnt one`
      ctx.addPoint(x, y, `${doors} DOORS`, { alert: true })
      return true
    }
    ctx.storeElement(target, label, 'space')
    ctx.status = `${label} carried through the sealed room into the space behind it · it comes back out anywhere, as long as this room stays shut`
    ctx.addPoint(x, y, label)
    return true
  },
  stitch: (ctx, { target, x, y, label }) => {
    // A short thread lifts a ton and a long one is cotton, so the distance is
    // the whole ability. The same thread also puts severed things back on.
    if (!ctx.selectedElements.length) {
      ctx.selectedElements = [target]
      ctx.remember(target).classList.add('hatsu-stitch-edge')
      ctx.status = `Thread out of ${label} · the closer the second edge, the stronger the seam`
      ctx.addPoint(x, y, label)
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
      ctx.status = severed.length
        ? `${severed.length} severed part${severed.length > 1 ? 's' : ''} sewn back onto ${label}, moving again straight away`
        : `${label} has nothing torn off it to sew back`
      ctx.addPoint(x, y, severed.length ? 'REATTACHED' : 'NOTHING TORN', { alert: !severed.length })
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
      ctx.status = `${length}px of thread · short enough to hold ${ctx.targetLabel(first)} and ${label} together as one body`
    } else {
      first.style.transition = target.style.transition = 'transform .5s ease'
      ctx.applyTransform(target, 'translateY(-6px)')
      ctx.selectedElements = []
      ctx.status = `${length}px of thread · at that length it is cotton, and the seam does not hold`
    }
    ctx.addPoint(x, y, strong ? `SEWN ${length}px` : `SLACK ${length}px`, { alert: !strong })
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
    ctx.addPoint(x, y, ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI'][note % 7])
    if (note + 1 < 3) {
      ctx.status = `Note ${note + 1} of the piece · so far it is only calming whoever can hear it`
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
    ctx.status = `The piece landed · ${listeners.length} section${listeners.length === 1 ? '' : 's'} are oblivious to everything but ${label} for the next three minutes`
    ctx.schedule(() => {
      for (const listener of listeners) {
        listener.classList.remove('hatsu-enchanted-listener')
        listener.style.pointerEvents = 'auto'
        listener.style.opacity = '1'
      }
      ctx.status = 'The piece ended · they notice the room again'
    }, 9000)
    return true
  },
  infection: (ctx, { target, x, y, label }) => {
    // Levels are paid for in kills, not in clicks: a non-user is worth 1, a Nen
    // user 10, a prince 50. An ability manifests at 20 and Member Zero at 100.
    const members = ctx.selectedElements.filter((element) => element.isConnected)
    if (members.includes(target)) {
      ctx.selectedElements = [...members.filter((member) => member !== target), target]
      ctx.status = `${label} is the one holding the knife now · level ${target.dataset.hatsuLevel || 0}`
      ctx.addPoint(x, y, `LV ${target.dataset.hatsuLevel || 0}`)
      return true
    }
    const killer = members[members.length - 1]
    if (!killer) {
      ctx.selectedElements = [target]
      ctx.remember(target).classList.add('hatsu-infected')
      target.dataset.hatsuLevel = '0'
      ctx.infectionLevel = 0
      ctx.status = `${label} kissed into the group · level 0, and it stays there until it kills something`
      ctx.addPoint(x, y, 'LV 0')
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
    ctx.status = `${ctx.targetLabel(killer)} killed ${label} for ${worth} · level ${level}${note}`
    ctx.addPoint(x, y, `+${worth} → LV ${level}`, { alert: level >= 20 })
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
      ctx.status = `Rotation ${ctx.windupPower} · ×${ctx.windupPower} in the fist · hit something else to let it go`
      ctx.addPoint(x, y, `×${ctx.windupPower}`)
      return true
    }
    const power = ctx.windupPower
    const struck = ctx.remember(target)
    struck.classList.add('hatsu-cyclotron-release')
    if (power < 4) {
      ctx.applyTransform(struck, 'translateX(24px)')
      ctx.status = `×${power} into ${label} and it is still standing · not enough rotations, and now the arm is empty`
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
      ctx.status =
        power > 7
          ? `×${power} was far more than ${label} needed · ${splash.length} bystander${splash.length === 1 ? '' : 's'} went with it`
          : `×${power} · ${label} destroyed, and nothing else was`
    }
    ctx.addPoint(x, y, `HIT ×${power}`, { alert: power > 7 || power < 4 })
    ctx.windupPower = 0
    ctx.selectedElements = []
    return true
  },
  predator: (ctx, { target, x, y, label }) => {
    // It grows on how well Rihan understands one ability, gathered by himself.
    // Several abilities on the same target and it is born too weak to bother.
    const techniques = ctx.profilesFromTarget(target)
    if (!techniques.length) {
      ctx.status = `${label} has no ability to read · there is nothing for a Predator to grow against`
      ctx.addPoint(x, y, 'NOTHING TO READ', { alert: true })
      return true
    }
    if (techniques.length > 1) {
      ctx.status = `${label} carries ${techniques.length} abilities · Predator is at a disadvantage there and will not form`
      ctx.addPoint(x, y, `${techniques.length} ABILITIES`, { alert: true })
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
      ctx.status = `Working ${studied.name} out alone · ${ctx.studyCount}/3 · being told the answer would only make it weaker`
      ctx.addPoint(x, y, `READ ${ctx.studyCount}/3`, { details: [studied.rule] })
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
    ctx.status = `Predator swallowed ${studied.name} wherever it was carried (${prey.length}) · and now there is no Nen at all for forty-eight hours`
    ctx.addPoint(x, y, 'COUNTERED', { details: [studied.name] })
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
    ctx.status = `The staff is out to ${reach} · from ${label} it reached ${struck.length} bod${struck.length === 1 ? 'y' : 'ies'} on either side`
    ctx.addPoint(x, y, `REACH ${reach}`)
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
    ctx.status = [
      'All senses restored',
      'Sight sealed',
      'Sight + hearing sealed',
      'Sight + hearing + speech sealed',
    ][ctx.sensesStage]
    ctx.addPoint(x, y, ['解', '見', '聞', '言'][ctx.sensesStage])
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
      ctx.status = foreign.length
        ? `${label} is alive, so it is not swallowed · ${foreign.length} foreign substance${foreign.length > 1 ? 's were' : ' was'} drawn out of it instead`
        : `${label} refused · Blinky considers the target alive`
      ctx.addPoint(x, y, foreign.length ? 'CLEANED' : 'ALIVE', { alert: !foreign.length })
      return true
    }
    if (isNenMade(target) || target.dataset.hatsuFake) {
      ctx.status = `${label} will not go in · it is made of Nen, and that is how you know it is a trap`
      ctx.addPoint(x, y, 'NEN TRAP', { alert: true })
      return true
    }
    ctx.storeElement(target, label, 'vacuum')
    ctx.status = `“${label}” named aloud and swallowed · ${ctx.storedItems.length} in the tank, and only the last one ever comes back`
    ctx.addPoint(x, y, label)
    return true
  },
  snakes: (ctx, { target, x, y, label }) => {
    // The marionette hides the user among ten, and only one of the ten can be
    // taken. Dropping it without taking anyone turns the curse back around.
    const field = ctx.selectedElements.filter((element) => element.isConnected)
    if (!field.includes(target)) {
      if (field.length >= 10) {
        ctx.status = `${label} is outside the ten · the snakes only go to someone already in range`
        ctx.addPoint(x, y, 'OUT OF RANGE', { alert: true })
        return true
      }
      ctx.selectedElements = [...field, target]
      ctx.remember(target).classList.add('hatsu-suspect')
      ctx.status = `${field.length + 1}/10 in range · the user is one of them and cannot be picked out`
      ctx.addPoint(x, y, `${field.length + 1}`)
      return true
    }
    if (field.length < 10) {
      ctx.status = `${label} is already one of the suspects · the field is only at ${field.length}/10`
      return true
    }
    if (field.some((suspect) => suspect.classList.contains('hatsu-snake-victim'))) {
      ctx.status = 'One of the ten has already been drained · the marionette only ever points once'
      ctx.addPoint(x, y, 'SPENT', { alert: true })
      return true
    }
    ctx.remember(target).classList.add('hatsu-snake-victim')
    target.style.pointerEvents = 'none'
    ctx.status = `Four snakes on ${label} · eleven seconds and it is empty · the curse is spent and has nothing to rebound onto`
    ctx.addPoint(x, y, label, { alert: true })
    return true
  },
  'training-shot': (ctx, { target, x, y, label }) => {
    ctx.trainingTarget = target
    ctx.trainingOrigin = { x: ctx.cursor.x, y: ctx.cursor.y }
    const trainee = ctx.remember(target)
    trainee.classList.add('hatsu-zetsu-test')
    trainee.style.pointerEvents = 'none'
    ctx.status = `Maintain perfect focus for 3 seconds · the trainee's site action is sealed in Zetsu`
    ctx.addPoint(x, y, label)
    ctx.schedule(() => {
      if (!ctx.trainingTarget) return
      ctx.trainingTarget.classList.add('hatsu-training-hit')
      ctx.trainingTarget.style.pointerEvents = 'auto'
      ctx.status = `${label} maintained Zetsu · controlled shot survived and its action was restored`
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
      ctx.status = `${label} released · the arm uncoils all at once`
      ctx.addPoint(x, y, `FREED · ${label}`)
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
    ctx.status =
      coils >= 3
        ? `${label} fully constricted · nothing gets through the coils now`
        : `Coil ${coils}/3 around ${label} · ${coils >= 2 ? 'its controls are pinned' : 'it can still move'}`
    ctx.addPoint(x, y, `COIL ${coils}`)
    return true
  },
  flock: (ctx, { target, x, y, label }) => {
    const link = target.closest<HTMLAnchorElement>('a')
    ctx.birdDispatches = [
      ...ctx.birdDispatches.slice(-7),
      { id: ++ctx.sequence, label, href: link?.href || null },
    ]
    ctx.remember(target).classList.add('hatsu-bird-dispatched')
    ctx.status = `Pigeon ${ctx.birdDispatches.length} dispatched with ${label}`
    ctx.addPoint(x, y, label)
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
    ctx.status = `Cargo ${label} · relay stage ${stage}/3${stage === 3 ? ' · delivered into relay storage without teleportation' : ''}`
    ctx.addPoint(x, y, `RELAY ${stage}`)
    return true
  },
  healing: (ctx, { target, x, y, label }) => {
    // Enhancement drawn through the cross closes wounds. It has nothing to say
    // to something that is not wounded, and it takes two passes to finish one.
    const wounded = isRestricted(target)
      ? target
      : target.querySelector<HTMLElement>(RESTRICTED_SELECTOR)
    if (!wounded) {
      ctx.status = `${label} carries no wound · the cross finds nothing on it to close`
      ctx.addPoint(x, y, 'UNHURT', { alert: true })
      return true
    }
    const stage = counterOn(ctx.remember(wounded))
    wounded.classList.add('hatsu-holy-healed')
    wounded.style.transition = 'opacity .4s ease'
    wounded.style.opacity = String(Math.min(1, 0.3 + stage * 0.35))
    if (stage >= 2) liftRestriction(wounded)
    ctx.status =
      stage >= 2
        ? `Holy Chain closed ${ctx.targetLabel(wounded)} · it answers again`
        : `Enhancement drawn into ${ctx.targetLabel(wounded)} · the wound is half shut, and one more pass finishes it`
    ctx.addPoint(x, y, stage >= 2 ? `HEALED · ${label}` : `MENDING ${stage}/2`)
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
      ctx.status = `The stake is around ${label}'s heart · touch it again to declare a rule, touch anything else and the rule is broken`
      ctx.addPoint(x, y, `HEART · ${label}`)
      return true
    }
    if (target === subject) {
      const clauses = counterOn(subject)
      if (clauses > 2) {
        subject.dataset.hatsuLevel = '2'
        ctx.status = `${label} already carries two rules · one stake will not hold a third`
        return true
      }
      subject.classList.add('hatsu-vow-clause')
      ctx.status = `Rule ${clauses}/2 declared onto ${label} · it stays alive as long as it obeys them`
      ctx.addPoint(x, y, `RULE ${clauses}`)
      return true
    }
    ctx.remember(subject)
    subject.style.pointerEvents = 'none'
    subject.setAttribute('aria-disabled', 'true')
    subject.classList.add('hatsu-vow-enforced')
    ctx.remember(target).classList.add('hatsu-vow-violation')
    ctx.status = `${label} was touched instead · the rule was broken and the stake went through ${ctx.targetLabel(subject)}'s heart`
    ctx.addPoint(x, y, 'STAKE', { alert: true })
    return true
  },
  'ability-loan': (ctx, { target, x, y, label }) => {
    // The dolphin cannot steal anything. It reads what Steal Chain already took,
    // hands it to one recipient — a non-user has their nodes forced open by it —
    // and the loan is spent after a single use.
    if (!ctx.capturedTechniques.length) {
      ctx.status =
        'The dolphin is empty · Steal Chain has to take something before there is anything to loan'
      ctx.addPoint(x, y, 'EMPTY', { alert: true })
      return true
    }
    const [loaned] = ctx.capturedTechniques
    if (!ctx.selectedElements.length) {
      ctx.selectedElements = [target]
      ctx.remember(target).classList.add('hatsu-dolphin-analyzed')
      ctx.status = `${loaned.name} read out in full: ${loaned.rule}`
      ctx.addPoint(x, y, loaned.name, { details: [loaned.rule, loaned.cost] })
      return true
    }
    const recipient = ctx.remember(target)
    recipient.classList.add('hatsu-dolphin-recipient')
    const awakened = !ctx.profilesFromTarget(target).length
    if (awakened) recipient.classList.add('hatsu-nodes-opened')
    ctx.executeSiteTarget(recipient)
    ctx.capturedTechniques = []
    ctx.selectedElements = []
    ctx.status = `${loaned.name} used once by ${label}${awakened ? ', whose nodes were forced open by using it' : ''} · it has already gone back to its owner`
    ctx.addPoint(x, y, `SPENT · ${loaned.name}`)
    return true
  },
  contract: (ctx, { target, x, y, label }) => {
    // Moonlight Act cuts both ways: honoured terms are rewarded, a breach costs
    // a week of Zetsu, and both parties have to have read the terms first.
    const signed = ctx.selectedElements.filter((party) => party.isConnected)
    if (signed.length < 2 && !signed.includes(target)) {
      ctx.selectedElements = [...signed, target]
      ctx.remember(target).classList.add('hatsu-contract-signatory')
      ctx.status =
        signed.length === 0
          ? `${label} read the terms and signed · one more voluntary signature and it stands`
          : `Both parties have signed · touch either of them to honour it, touch anyone else and it is a breach`
      ctx.addPoint(x, y, `SIGN ${signed.length + 1}/2`)
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
      ctx.status = `Terms honoured · both signatories collected the agreed reward, and everything they promised each other is open`
      ctx.addPoint(x, y, 'REWARD')
      return true
    }
    const breacher = ctx.remember(signed[1])
    breacher.classList.add('hatsu-contract-zetsu')
    breacher.style.pointerEvents = 'none'
    breacher.style.filter = 'grayscale(1)'
    ctx.status = `${label} was never party to this · ${ctx.targetLabel(breacher)} breached, and the penalty is a week of Zetsu`
    ctx.addPoint(x, y, 'ZETSU', { alert: true })
    ctx.schedule(() => {
      breacher.classList.remove('hatsu-contract-zetsu')
      breacher.style.pointerEvents = 'auto'
      breacher.style.removeProperty('filter')
      ctx.status = `${ctx.targetLabel(breacher)} served its week and is out of Zetsu`
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
    ctx.addPoint(x, y, label, { details: answer })
    ctx.status =
      ctx.studyCount === 1
        ? `${label}'s own voice answered, and it kept it short · ask again with another blow`
        : `Blow ${ctx.studyCount} · same question, and ${label} expanded on what it had already said`
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
    ctx.guideTitle = 'Bloody Mary · drops still wet'
    ctx.status = `A drop released into ${label} · it goes looking by itself and reports back as it finds things`
    ctx.addPoint(x, y, `DROP ${drop}`)
    traces.forEach((trace, index) =>
      ctx.schedule(
        () => {
          if (!trace.isConnected) return
          ctx.remember(trace).classList.add('hatsu-blood-trace')
          ctx.guideItems = [...ctx.guideItems, ctx.guideItemFor(trace, ctx.targetLabel(trace))]
          ctx.status = `Drop ${drop} found ${ctx.targetLabel(trace)}`
        },
        600 + index * 700,
      ),
    )
    ctx.schedule(() => {
      ctx.guideItems = ctx.guideItems.slice(traces.length)
      ctx.status = `Drop ${drop} dried out · about forty minutes was all its aura had, and what it found went with it`
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
      ctx.status = `${label} declared the hideout · LSDF answers nowhere else, and only while Morena is here`
      ctx.addPoint(x, y, `HIDEOUT · ${label}`)
      return true
    }
    if (!hideout.contains(target)) {
      ctx.status = `${label} is outside the hideout · Yokotani has no standing there and nothing happens`
      ctx.addPoint(x, y, 'NO JURISDICTION', { alert: true })
      return true
    }
    const guarded = ctx.remember(target)
    const level = counterOn(guarded)
    guarded.classList.add('hatsu-lsdf-defendant')
    guarded.dataset.hatsuForgery = `LV ${level}`
    guarded.dataset.hatsuConjured = 'lsdf'
    guarded.style.pointerEvents = 'none'
    guarded.setAttribute('aria-disabled', 'true')
    ctx.status = `A level ${level} guard is standing on ${label} · it cannot act, and nothing can reach it either`
    ctx.addPoint(x, y, `GUARD ${level}`)
    return true
  },
  'damage-transfer': (ctx, { target, x, y, label }) => {
    // The left hand has to already be resting on something when the blow lands.
    // If it is not, the left hand is what breaks. There is no trigger to pull.
    const sink = ctx.selectedElements[0]
    if (!sink?.isConnected) {
      ctx.selectedElements = [target]
      ctx.remember(target).classList.add('hatsu-damage-recipient')
      ctx.status = `Left hand resting on ${label} · every blow taken from now on arrives here instead`
      ctx.addPoint(x, y, `SINK · ${label}`)
      return true
    }
    if (target === sink) {
      ctx.remember(sink)
      sink.style.maxHeight = '0'
      sink.style.opacity = '.08'
      sink.style.overflow = 'hidden'
      sink.style.pointerEvents = 'none'
      ctx.selectedElements = []
      ctx.status = `The left hand was struck with nothing to pass it on to · ${label} took all of it itself`
      ctx.addPoint(x, y, 'LEFT HAND', { alert: true })
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
    ctx.status = `${label} was struck and did not feel it · blow ${load} landed on ${ctx.targetLabel(sink)}${load >= 4 ? ', which has taken all it can' : ''}`
    ctx.addPoint(x, y, `→ ${load}`)
    return true
  },
  'door-network': (ctx, { target, x, y, label }) => {
    // A land mine, not a corridor. Stepping into the armed frame moves you,
    // stepping back out of it does nothing, and it only ever moves people.
    if (isNenMade(target) || target.dataset.hatsuFake) {
      ctx.status = `${label} is a Nen construct · it walks through Voconte's frame without being moved at all`
      ctx.addPoint(x, y, 'NOT MOVED', { alert: true })
      return true
    }
    const trap = ctx.selectedElements[0]
    if (!trap?.isConnected) {
      ctx.selectedElements = [target]
      ctx.remember(target).classList.add('hatsu-hideout-door')
      ctx.status = `${label} armed as the trapped frame · whoever steps into it comes out in the hideout`
      ctx.addPoint(x, y, 'TRAP DOOR')
      return true
    }
    const back = ctx.selectedElements[1]
    if (!back?.isConnected) {
      ctx.selectedElements = [trap, target]
      ctx.remember(target).classList.add('hatsu-hideout-return')
      ctx.status = `${label} is the return frame · the pair only works one way through each of them`
      ctx.addPoint(x, y, 'RETURN DOOR')
      return true
    }
    const inTrap = trap === target || trap.contains(target)
    const inReturn = back === target || back.contains(target)
    if (!inTrap && !inReturn) {
      ctx.status = `${label} is not a doorframe · walking past one of them does nothing at all`
      return true
    }
    const destination = inTrap ? back : trap
    ctx.followGuide(ctx.guideItemFor(destination, ctx.targetLabel(destination)))
    ctx.status = `${label} was stepped into and came out at ${ctx.targetLabel(destination)}`
    ctx.addPoint(x, y, inTrap ? 'INTO THE HIDEOUT' : 'BACK TO 3101')
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
      ctx.status = `Hammer · ${label} flattened where it stood`
      ctx.addPoint(x, y, `槌 ${label}`)
      return true
    }
    if (tool === 2) {
      const shut = element.querySelector<HTMLElement>(RESTRICTED_SELECTOR)
      if (shut) {
        ctx.remember(shut)
        liftRestriction(shut)
      }
      ctx.status = shut
        ? `Drill · ${label} bored through, and what it was keeping shut is open`
        : `Drill · there was nothing shut inside ${label} to get at`
      ctx.addPoint(x, y, `錐 ${label}`, { alert: !shut })
      return true
    }
    const limb = element.lastElementChild
    if (limb instanceof HTMLElement) {
      ctx.remember(limb).classList.add('hatsu-body-weapon-severed')
      limb.style.opacity = '0'
      limb.style.pointerEvents = 'none'
    }
    ctx.status =
      limb instanceof HTMLElement
        ? `Axe · ${ctx.targetLabel(limb)} taken off ${label}`
        : `Axe · ${label} has nothing left on it to cut off`
    ctx.addPoint(x, y, `斧 ${label}`)
    return true
  },
  'coercive-beast': (ctx, { target, x, y, label }) => {
    // Nobody has ever been told what Camilla's beast requires. The condition is
    // real and it is checked — it is simply never named, not even here.
    if (ctx.puppetTarget?.isConnected && target !== ctx.puppetTarget) {
      ctx.executeSiteTarget(ctx.puppetTarget)
      ctx.status = `${ctx.targetLabel(ctx.puppetTarget)} did it without being asked`
      ctx.addPoint(x, y, 'OBEYED')
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
      ctx.status = `${label} satisfied it three times and is completely the Beast's · nobody is going to say what it satisfied`
      ctx.addPoint(x, y, 'TAKEN')
      return true
    }
    ctx.status = met
      ? `${label} satisfies the condition · ${contacts}/3`
      : `${label} does not satisfy the condition, and that is all anyone will tell you`
    ctx.addPoint(x, y, met ? `MET ${contacts}/3` : 'UNMET', { alert: !met })
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
        ctx.status = `${label} has held the same coin long enough to be awakened by it · what was dormant in it is open`
      } else
        ctx.status = `${label} kept the coin another ten days · value ${value}, and it keeps climbing while nobody moves it`
      ctx.addPoint(x, y, `₵ ${value}`)
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
    ctx.status = holder?.isConnected
      ? `The coin was given to ${label} · its back changed, its value fell to 1, and ${ctx.targetLabel(holder)} kept none of it`
      : `A coin minted into ${label} at value 1`
    ctx.addPoint(x, y, '₵ 1')
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
      ctx.status = `${label} answered straight · the beast brought its face back without marking it`
      ctx.addPoint(x, y, 'TRUE')
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
    ctx.status = [
      `A cut opened on ${label} for the first lie`,
      `The cut on ${label} went septic for the second · it was warned aloud not to try a third`,
      `Third lie · nobody knows what ${label} is now, only that it is not what it was`,
    ][lies - 1]
    ctx.addPoint(x, y, `LIE ${lies}`, { alert: lies === 3 })
    return true
  },
  'drug-synthesis': (ctx, { target, x, y, label }) => {
    // The beast concocts whatever the collaboration allows. Two partners of the
    // same nature give a usable compound; mismatched ones give an inert batch.
    const first = ctx.selectedElements[0]
    if (!first?.isConnected) {
      ctx.selectedElements = [target]
      ctx.remember(target).classList.add('hatsu-research-partner')
      ctx.status = `${label} entered the contract · the beast does not appear at all without a second party`
      ctx.addPoint(x, y, `PARTNER · ${label}`)
      return true
    }
    if (first === target) {
      ctx.status = `${label} cannot collaborate with itself`
      return true
    }
    ctx.remember(target).classList.add('hatsu-research-partner')
    const pair = [first, target]
    const routes = pair.every((party) => party.querySelector('a[href]') || party.closest('a[href]'))
    const material = pair.every((party) => (party.textContent || '').trim().length > 80)
    if (routes) {
      ctx.guideTitle = 'Tubeppa synthesis · route compound'
      ctx.guideItems = pair.map((party) => ctx.guideItemFor(party, ctx.targetLabel(party)))
      ctx.status = `Both partners brought routes · what came out of the beast is a shortcut between ${ctx.targetLabel(first)} and ${label}`
    } else if (material) {
      for (const party of pair) {
        const withheld = party.querySelector<HTMLElement>(RESTRICTED_SELECTOR)
        if (!withheld) continue
        ctx.remember(withheld)
        liftRestriction(withheld)
      }
      ctx.status = `Both partners brought material · the compound opened what each of them was holding back`
    } else {
      ctx.remember(target).classList.add('hatsu-synthesis-failed')
      ctx.status = `${ctx.targetLabel(first)} and ${label} have nothing in common to work with · the batch is inert`
    }
    ctx.selectedElements = []
    ctx.addPoint(x, y, routes ? 'ROUTE' : material ? 'REVEAL' : 'INERT', {
      alert: !routes && !material,
    })
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
      ctx.status = `${label} came back for a second helping · that is the doctrine's one taboo, and the punishment for it is not gentle`
      ctx.addPoint(x, y, 'TABOO', { alert: true })
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
    ctx.guideTitle = 'Tyson · happiness in return'
    ctx.guideItems = [
      ...ctx.guideItems,
      ctx.guideItemFor(target, `${label} · ${happiness}%`),
    ].slice(-10)
    ctx.status = `${label} read ${read} characters of the Book · ${happiness}% happiness back, and one control taken as the levy`
    ctx.addPoint(x, y, `${happiness}%`)
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
      ctx.status = `The centipede read ${label} and put out what it wants as bait · taking the bait is what springs this`
      ctx.addPoint(x, y, `BAIT · ${label}`)
      return true
    }
    ctx.floatingCards = []
    ctx.remember(target).classList.add('hatsu-desire-bait')
    ctx.executeSiteTarget(desire)
    ctx.selectedElements = []
    ctx.status = `The bait was taken · the coercion only started then, and it carried the site to ${ctx.targetLabel(desire)}`
    ctx.addPoint(x, y, 'TRAP SPRUNG', { alert: true })
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
    ctx.status = `Smoke out · ${swayed} within seven metres are breathing it, and each of them will be emitting inside two`
    ctx.addPoint(x, y, `${swayed} INHALING`)
    return true
  },
  solicitation: (ctx, { target, x, y, label }) => {
    // A refusal does not end it: a small copy sits on their shoulder and keeps
    // asking. Only one body can be held, and it feeds on that body's own aura.
    if (ctx.puppetTarget?.isConnected && ctx.puppetTarget !== target) {
      ctx.status = `${ctx.targetLabel(ctx.puppetTarget)} is already being held · one body at a time is all she can carry`
      ctx.addPoint(x, y, 'TOO TIRED', { alert: true })
      return true
    }
    const asked = ctx.selectedElements.filter((element) => element.isConnected)
    if (!asked.includes(target)) {
      ctx.selectedElements = [...asked, target]
      ctx.remember(target).classList.add('hatsu-solicited')
      ctx.status = `“${label}, are you free?” · touch it again for yes, or touch anything else to refuse for it`
      ctx.addPoint(x, y, label)
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
    ctx.status = `${label} said yes · the spider is in its ear and the body is not its own · ${asked.length - 1} others are still being asked`
    ctx.addPoint(x, y, 'YES', { alert: true })
    ctx.schedule(() => {
      possessed.classList.remove('hatsu-possessed')
      possessed.removeAttribute('aria-disabled')
      for (const control of controlsOf(possessed)) control.style.pointerEvents = 'auto'
      if (ctx.puppetTarget === possessed) ctx.puppetTarget = null
      ctx.status = `${label} had no aura left to feed it · the spider left at speed and it has itself back`
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
      ctx.status = `${label} is the real room · it stays exactly as it is, and everyone else gets sent somewhere that is not it`
      ctx.addPoint(x, y, 'ROOM 1013')
      return true
    }
    if (room.contains(target) || room === target) {
      ctx.status = `${label} is inside · the barrier only faces outward, so leaving is nothing`
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
    ctx.status = `${label} went for the room and walked into an empty copy of it · ${emptied} things that should be there are not`
    ctx.addPoint(x, y, 'EMPTY COPY')
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
      ctx.status = `${label} is the target · now find something of theirs to keep, and to burn`
      ctx.addPoint(x, y, `TARGET · ${label}`)
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
        ctx.status = `${label} has nothing to do with ${ctx.targetLabel(victim)} · a curse cannot be hung on a stranger's belongings`
        ctx.addPoint(x, y, 'NOT CONNECTED', { alert: true })
        return true
      }
      ctx.selectedElements = [victim, target]
      ctx.remember(target).classList.add('hatsu-curse-relic')
      ctx.studyCount = 0
      ctx.status = `${label} kept as the connected object · think of the target every day, and stay near them`
      ctx.addPoint(x, y, `RELIC · ${label}`)
      return true
    }
    if (target !== relic) {
      ctx.status = `The rite is performed over the relic, not over ${label}`
      return true
    }
    ctx.studyCount += 1
    ctx.remember(relic).classList.add('hatsu-curse-prepared')
    relic.dataset.hatsuLevel = String(ctx.studyCount)
    const gap = Math.round(distanceBetween(relic, victim))
    if (ctx.studyCount < 5) {
      ctx.status = `Rite ${ctx.studyCount}/5 · ${gap}px between the ashes and ${ctx.targetLabel(victim)}, and that distance is most of the curse`
      ctx.addPoint(x, y, `RITE ${ctx.studyCount}`)
      return true
    }
    const close = gap < 220
    relic.classList.add('hatsu-postmortem-drain')
    relic.style.pointerEvents = 'none'
    relic.style.opacity = '.15'
    ctx.status = `Ashes drunk and the dagger used · at ${gap}px this needs ${close ? 'hours' : 'months'} to finish ${ctx.targetLabel(victim)}`
    ctx.addPoint(x, y, 'POST-MORTEM', { alert: true })
    ctx.schedule(
      () => {
        ctx.remember(victim).classList.add('hatsu-postmortem-drain')
        victim.style.pointerEvents = 'none'
        ctx.status = `${ctx.targetLabel(victim)} has no aura left · whoever did this has been dead the whole time`
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
