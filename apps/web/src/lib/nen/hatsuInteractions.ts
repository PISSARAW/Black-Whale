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
  kind: 'clone' | 'projection'
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

/**
 * One entry per technique, replacing the `else if (profile.kind === …)` chain
 * that used to carry all of them in a single function. The kind is the key, so
 * a technique is added by adding a row rather than by editing a branch.
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
  scarlet: (ctx, { target, x, y, label }) => {
    const element = ctx.remember(target)
    element.classList.add('hatsu-full-efficiency')
    element.hidden = false
    if ('disabled' in element) (element as HTMLButtonElement).disabled = false
    element.removeAttribute('aria-disabled')
    element.style.opacity = '1'
    element.style.filter = 'none'
    element.style.maxHeight = 'none'
    element.style.pointerEvents = 'auto'
    const details = element.closest('details')
    if (details instanceof HTMLDetailsElement) {
      ctx.remember(details)
      details.open = true
    }
    ctx.status = `${label} operated at 100% efficiency · life continues to burn`
    ctx.addPoint(x, y, '100%')
    return true
  },
  'chain-rule': (ctx, { target, x, y, label }) => {
    const techniques = ctx.profilesFromTarget(target)
    ctx.remember(target).classList.add('hatsu-aura-drained')
    ctx.capturedTechniques = techniques.slice(0, 1)
    ctx.status = ctx.capturedTechniques.length
      ? `${ctx.capturedTechniques[0].name} drained from ${label} · use the captured dolphin card`
      : `${label}'s aura drained · no registered Hatsu found`
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
    const element = ctx.remember(target)
    const level = Math.min(5, Number(element.dataset.hatsuLevel || 0) + 1)
    element.dataset.hatsuLevel = String(level)
    element.classList.add('hatsu-reinforced')
    element.style.setProperty('--reinforcement', String(level))
    if (level === 5) {
      element.hidden = false
      element.style.pointerEvents = 'auto'
      if ('disabled' in element) (element as HTMLButtonElement).disabled = false
      element.removeAttribute('aria-disabled')
    }
    ctx.status = `${label} reinforced · aura output ${level}/5${level === 5 ? ' · disabled control forced back into service' : ''}`
    ctx.addPoint(x, y, `REN ${level}`)
    return true
  },
  control: (ctx, { target, x, y, label }) => {
    if (!ctx.selectedElements.includes(target))
      ctx.selectedElements = [...ctx.selectedElements, target]
    ctx.remember(target).classList.add('hatsu-royal-controlled')
    const commander = ctx.selectedElements[0]
    if (commander && target !== commander) {
      const origin = commander.getBoundingClientRect()
      const rect = target.getBoundingClientRect()
      target.style.transition = 'transform .45s ease'
      ctx.applyTransform(
        target,
        `translate(${(origin.left - rect.left) * 0.18}px, ${(origin.top - rect.top) * 0.18}px)`,
      )
    }
    ctx.status = `${ctx.selectedElements.length} royal guard${ctx.selectedElements.length > 1 ? 's' : ''} linked to one command network`
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
        passenger.style.transition = 'transform 1s cubic-bezier(.2,.8,.2,1)'
        ctx.applyTransform(
          passenger,
          `translateX(${Math.min(innerWidth * 0.45, 360)}px) translateY(${index * 4}px) scale(.82)`,
        )
      })
      ctx.status = `Vehicle launched · ${ctx.selectedElements.length} passengers · ${fuel}% shared aura fuel`
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
    if (target.closest('[data-hatsu-character]')) {
      ctx.status = `${label} rejected · Little Eye requires a real small animal, not a person or Nen construct`
      ctx.addPoint(x, y, 'INVALID', { alert: true })
    } else {
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
      ctx.status = `Vision and hearing shared through a small creature inside ${label}`
      ctx.addPoint(x, y, label)
    }
    return true
  },
  tribunal: (ctx, { target, x, y, label }) => {
    if (ctx.crossGameTarget !== target) {
      ctx.crossGameTarget = target
      ctx.cardIndex = 0
    }
    const element = ctx.remember(target)
    if (ctx.cardIndex === 0) {
      element.classList.add('hatsu-cross-blue')
      ctx.status = `BLUE · ${label} admitted into the court`
      ctx.cardIndex = 1
    } else if (ctx.cardIndex === 1) {
      element.classList.add('hatsu-cross-warning')
      ctx.status = `YELLOW · warning issued to ${label} · click again if ignored`
      ctx.cardIndex = 2
    } else if (ctx.cardIndex === 2) {
      element.classList.add('hatsu-cross-restrained')
      element.setAttribute('aria-disabled', 'true')
      for (const control of element.querySelectorAll<HTMLElement>(
        'a,button,input,select,textarea',
      )) {
        ctx.remember(control)
        control.style.pointerEvents = 'none'
      }
      ctx.status = `YELLOW REVERSED · ${label} immobilized but still visible`
      ctx.cardIndex = 3
    } else {
      element.classList.add('hatsu-cross-expelled')
      element.style.opacity = '0'
      ctx.applyTransform(element, 'translateX(110vw)')
      ctx.status = `RED · ${label} expelled from the page`
      ctx.cardIndex = 0
    }
    ctx.addPoint(x, y, ctx.tribunalCards[Math.min(3, ctx.cardIndex)])
    return true
  },
  curse: (ctx, { target, x, y, label }) => {
    if (!ctx.selectedElements.length) {
      ctx.selectedElements = [target]
      ctx.remember(target).classList.add('hatsu-beyond-cursed')
      ctx.status = `${label} chosen as the distant curse target · choose a sacrificial carrier`
      ctx.addPoint(x, y, `TARGET · ${label}`)
    } else if (ctx.selectedElements.length === 1 && target !== ctx.selectedElements[0]) {
      ctx.selectedElements = [...ctx.selectedElements, target]
      ctx.remember(target).classList.add('hatsu-sacrifice-carrier')
      ctx.status = `${label} awakened from birth as sacrifice · click the carrier to trigger death`
      ctx.addPoint(x, y, `SACRIFICE · ${label}`)
    } else if (ctx.selectedElements[1] === target) {
      const victim = ctx.selectedElements[0]
      ctx.remember(target).classList.add('hatsu-sacrifice-dead')
      ctx.remember(victim).classList.add('hatsu-curse-triggered')
      victim.style.pointerEvents = 'none'
      ctx.status = `Sacrifice died · post-mortem curse crossed the site and struck ${ctx.targetLabel(victim)}`
    }
    return true
  },
  blast: (ctx, { event, target, x, y, label }) => {
    const element = ctx.remember(target)
    const rect = target.getBoundingClientRect()
    const direction = event.clientX < rect.left + rect.width / 2 ? 1 : -1
    element.style.transition = 'transform .5s cubic-bezier(.1,.8,.2,1)'
    ctx.applyTransform(
      element,
      `translateX(${direction * Math.min(240, innerWidth * 0.25)}px) rotate(${direction * 3}deg)`,
    )
    element.classList.add('hatsu-air-blown')
    ctx.status = `Air Blow broke ${label}'s guard and pushed it across the page`
    ctx.addPoint(x, y, label)
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
    if (!ctx.guideItems.some((item) => item.element === target))
      ctx.guideItems = [...ctx.guideItems, ctx.guideItemFor(target, label)].slice(-3)
    ctx.addPoint(x, y, label)
    if (ctx.points.length >= 3) {
      document.body.classList.add('hatsu-haiku-weather')
      ctx.guideTitle = 'Great Haiku · materialized path'
      ctx.status = `${ctx.points
        .slice(-3)
        .map((point) => point.label)
        .join(' / ')} · the three verses are now a navigable path`
    } else ctx.status = `${ctx.points.length}/3 lines selected · continue the haiku`
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
    const element = ctx.remember(target)
    const compact = element.classList.toggle('hatsu-transformed-body')
    element.style.maxHeight = compact ? '4.5rem' : 'none'
    element.style.overflow = compact ? 'hidden' : 'visible'
    for (const control of element.querySelectorAll<HTMLElement>('a,button,input,select,textarea')) {
      ctx.remember(control)
      control.style.pointerEvents = compact ? 'none' : 'auto'
    }
    ctx.status = compact
      ? `${label} compressed · its nested site controls no longer fit inside the small body`
      : `${label} · true form and all nested controls restored`
    ctx.addPoint(x, y, label)
    return true
  },
  rhythm: (ctx, { target, x, y, label }) => {
    ctx.remember(target).classList.add('hatsu-rhythm-hit')
    document.body.classList.add('hatsu-rhythm')
    if (!ctx.guideItems.some((item) => item.element === target))
      ctx.guideItems = [...ctx.guideItems, ctx.guideItemFor(target, label)].slice(-7)
    ctx.guideTitle = 'Battle Prologue · combat sequence'
    ctx.status = `Beat ${ctx.points.length + 1} · ${label} added to an executable site sequence`
    ctx.addPoint(x, y, label)
    return true
  },
  impact: (ctx, { target, x, y, label }) => {
    const element = ctx.remember(target)
    element.classList.add('hatsu-jupiter-impact')
    ctx.schedule(() => {
      element.style.maxHeight = '0'
      element.style.minHeight = '0'
      element.style.overflow = 'hidden'
      element.style.opacity = '.08'
    }, 650)
    ctx.status = `Jupiter materialized above ${label}`
    ctx.addPoint(x, y, label)
    return true
  },
  mimicry: (ctx, { target, x, y, label }) => {
    if (!ctx.selectedElements.length) {
      ctx.selectedElements = [target]
      ctx.remember(target).classList.add('hatsu-model')
      ctx.status = `${label} memorized · choose the body to transform`
    } else if (ctx.selectedElements[1] === target) {
      ctx.executeSiteTarget(ctx.selectedElements[0])
      ctx.status = `${label} reproduced ${ctx.targetLabel(ctx.selectedElements[0])}'s site action`
    } else {
      const model = ctx.selectedElements[0]
      const source = getComputedStyle(model)
      const transformed = ctx.remember(target)
      transformed.style.background = source.background
      transformed.style.color = source.color
      transformed.style.border = source.border
      transformed.style.borderRadius = source.borderRadius
      transformed.style.fontFamily = source.fontFamily
      transformed.classList.add('hatsu-metamorphosen')
      ctx.selectedElements = [model, transformed]
      ctx.status = `${label} transformed into ${ctx.targetLabel(model)} · click the transformed body to reproduce the model's action`
      ctx.addPoint(x, y, label)
    }
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
    if (ctx.selectedElements.includes(target) || ctx.selectedElements.length >= 2) return true
    ctx.selectedElements = [...ctx.selectedElements, target]
    ctx.remember(target)
    target.style.position = 'sticky'
    target.style.top = `${5 + (ctx.selectedElements.length - 1) * 5}rem`
    target.style.zIndex = String(35 - ctx.selectedElements.length)
    target.classList.add('hatsu-bookmarked')
    ctx.status = `${ctx.selectedElements.length}/2 pages held open`
    ctx.addPoint(x, y, label)
    return true
  },
  devour: (ctx, { target, x, y, label }) => {
    ctx.remember(target).classList.add('hatsu-devoured')
    ctx.status = `${label} is being eaten · layout remains alive until Zetsu`
    ctx.addPoint(x, y, label)
    return true
  },
  pocket: (ctx, { target, x, y, label }) => {
    ctx.storeElement(target, label, 'cloth')
    ctx.status = `${label} wrapped and reduced`
    ctx.addPoint(x, y, label)
    return true
  },
  teleport: (ctx, { target, x, y, label }) => {
    if (!ctx.selectedElements.length) {
      ctx.selectedElements = [target]
      ctx.remember(target).classList.add('hatsu-teleport-source')
      ctx.status = `${label} fixed · choose its destination target`
    } else {
      const first = ctx.selectedElements[0]
      ctx.moveByRects(first, target)
      ctx.selectedElements = [first, target]
      ctx.status = `${ctx.targetLabel(first)} and ${label} exchanged positions`
      ctx.addPoint(x, y, label)
    }
    return true
  },
  polarity: (ctx, { target, x, y, label }) => {
    if (ctx.selectedElements.length < 2 && !ctx.selectedElements.includes(target)) {
      ctx.selectedElements = [...ctx.selectedElements, target]
      ctx
        .remember(target)
        .classList.add(ctx.selectedElements.length === 1 ? 'hatsu-sun-mark' : 'hatsu-moon-mark')
      ctx.status =
        ctx.selectedElements.length === 1
          ? 'Sun placed · choose the Moon target'
          : 'Opposite marks armed · touch either marked target'
      ctx.addPoint(x, y, ctx.selectedElements.length === 1 ? `☀ ${label}` : `☾ ${label}`)
    } else if (ctx.selectedElements.includes(target) && ctx.selectedElements.length === 2) {
      for (const marked of ctx.selectedElements) {
        ctx.remember(marked).classList.add('hatsu-polarity-detonate')
        marked.style.pointerEvents = 'none'
      }
      ctx.status = 'SUN + MOON · post-mortem detonation'
    }
    return true
  },
  command: (ctx, { target, x, y, label }) => {
    if (
      ctx.selectedElements.length < 3 &&
      (target.matches('a,button,[role="button"],[data-hatsu-character]') ||
        target.querySelector('[data-hatsu-character]'))
    ) {
      ctx.status = `${label} rejected · Order Stamp cannot command a living being or an already autonomous control`
      return true
    }
    if (ctx.selectedElements.length < 3) {
      ctx.selectedElements = [...ctx.selectedElements, target]
      ctx.remember(target).classList.add('hatsu-stamped')
      ctx.status = `${ctx.selectedElements.length} puppet${ctx.selectedElements.length > 1 ? 's' : ''} stamped · ${ctx.selectedElements.length < 3 ? 'stamp another or choose three' : 'choose a destination'}`
      ctx.addPoint(x, y, label)
    } else {
      const destination = target.getBoundingClientRect()
      for (const puppet of ctx.selectedElements) {
        const rect = puppet.getBoundingClientRect()
        ctx.remember(puppet)
        puppet.style.transition = 'transform .7s ease'
        ctx.applyTransform(
          puppet,
          `translate(${destination.left - rect.left}px, ${destination.top - rect.top}px) scale(.72)`,
        )
      }
      ctx.status = `Order executed · ${ctx.selectedElements.length} puppets marched to ${label}`
    }
    return true
  },
  'identity-swap': (ctx, { target, x, y, label }) => {
    if (!ctx.selectedElements.length) {
      ctx.selectedElements = [target]
      ctx.remember(target).classList.add('hatsu-left-hand')
      ctx.status = `${label} marked by the left hand · choose a second identity`
    } else {
      ctx.moveByRects(ctx.selectedElements[0], target)
      ctx.remember(target).classList.add('hatsu-right-hand')
      ctx.status = `Visible identities converted · functions remain attached`
      ctx.addPoint(x, y, label)
    }
    return true
  },
  divination: (ctx, { target, x, y, label }) => {
    const affinity = 50 + Math.abs(Math.round(Math.sin((x + y + label.length) * 0.01) * 50))
    ctx.addPoint(x, y, label, { details: [`Affinity ${affinity}%`] })
    const item = ctx.guideItemFor(target, label)
    if (!ctx.dialBest || affinity > ctx.dialBest.score) ctx.dialBest = { score: affinity, item }
    ctx.guideTitle = 'Love Dial 6700 · strongest signal'
    ctx.guideItems = ctx.dialBest ? [ctx.dialBest.item] : []
    ctx.status = `Dial ${affinity}% · strongest signal: ${ctx.dialBest?.item.label || label} (${ctx.dialBest?.score || affinity}%) · follow it from the guide`
    return true
  },
  prophecy: (ctx, { target, x, y, label }) => {
    const links = Array.from(target.querySelectorAll<HTMLAnchorElement>('a')).slice(0, 4)
    const words = (target.textContent || '').trim().split(/\s+/).length
    ctx.prophecyLines = [
      `The ${label.slice(0, 18)} waits beneath a black tide.`,
      `${links.length || 'No'} paths open; only one returns unchanged.`,
      `When ${words % 12 || 12} bells are counted, an ally becomes a door.`,
      `Guard the final link, or the Whale will erase its name.`,
    ]
    ctx.guideTitle = 'Lovely Ghostwriter · foretold paths'
    ctx.guideItems = links.map((link) => ctx.guideItemFor(link, ctx.targetLabel(link)))
    ctx.status = `Four-line fortune written for ${label} · ${ctx.guideItems.length} foretold routes can be followed`
    ctx.addPoint(x, y, label)
    return true
  },
  clone: (ctx, { target, x, y, label }) => {
    const rect = target.getBoundingClientRect()
    ctx.floatingCards = [
      ...ctx.floatingCards,
      {
        id: ++ctx.sequence,
        x: Math.max(8, Math.min(innerWidth - 180, rect.left)),
        y: Math.max(8, Math.min(innerHeight - 100, rect.top)),
        label,
        kind: 'clone',
      },
    ]
    ctx.status = `${label} copied · the inert replica now occupies and intercepts the original interaction space`
    ctx.addPoint(x, y, label)
    return true
  },
  puppet: (ctx, { target, x, y }) => {
    const control = target.closest<HTMLElement>('a, button')
    if (!ctx.puppetTarget) {
      if (!control) {
        ctx.status = 'Black Voice needs a button or link for its antenna'
        return true
      }
      ctx.puppetTarget = control
      ctx.remember(control).classList.add('hatsu-antenna')
      ctx.status = `${ctx.targetLabel(control)} captured · click elsewhere to issue the order`
      ctx.addPoint(x, y, ctx.targetLabel(control))
    } else if (!ctx.puppetExecuting) {
      ctx.puppetExecuting = true
      ctx.status = `Remote order sent to ${ctx.targetLabel(ctx.puppetTarget)}`
      ctx.puppetTarget.click()
      ctx.schedule(() => {
        ctx.puppetExecuting = false
      }, 0)
    }
    return true
  },
  barrage: (ctx, { event, target, x, y, label }) => {
    const element = ctx.remember(target)
    const force = Math.min(120, 18 + ctx.points.length * 12)
    element.style.transition = 'transform .18s ease-out'
    ctx.applyTransform(
      element,
      `translate(${event.clientX < innerWidth / 2 ? force : -force}px, ${((ctx.points.length % 3) - 1) * 12}px)`,
    )
    element.classList.add('hatsu-bullet-hit')
    ctx.status = `${ctx.points.length * 2 + 2} emitted bullets · ${label} knocked back`
    ctx.addPoint(x, y, label)
    return true
  },
  projection: (ctx, { target, x, y, label }) => {
    const link =
      target.closest<HTMLAnchorElement>('a') || target.querySelector<HTMLAnchorElement>('a')
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
    const body = ctx.remember(target)
    body.classList.add('hatsu-sleeping-body')
    body.style.pointerEvents = 'none'
    ctx.status = `Astral double detached into ${label} · the sleeping body is unusable while the projection can follow its extracted route`
    ctx.addPoint(x, y, label)
    return true
  },
  animate: (ctx, { target, x, y, label }) => {
    ctx.remember(target).classList.add('hatsu-animated-object')
    ctx.selectedElements = [
      ...ctx.selectedElements.filter((element) => element.isConnected),
      target,
    ]
    ctx.status = `${label} animated · original function preserved`
    ctx.addPoint(x, y, label)
    return true
  },
  needle: (ctx, { target, x, y, label }) => {
    const element = ctx.remember(target)
    element.classList.add('hatsu-needle-puppet')
    element.style.pointerEvents = 'none'
    ctx.selectedElements = [...ctx.selectedElements, element]
    ctx.status = `${ctx.selectedElements.length} needle puppet${ctx.selectedElements.length > 1 ? 's' : ''} under total control`
    ctx.addPoint(x, y, label)
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
  shred: (ctx, { target, x, y, label }) => {
    const element = ctx.remember(target)
    const existing = Number(element.dataset.hatsuLevel || 0) + 1
    element.dataset.hatsuLevel = String(existing)
    element.style.transition = 'clip-path .35s, opacity .35s, transform .35s'
    element.style.clipPath = `inset(${Math.min(48, existing * 10)}% ${existing % 2 ? 8 : 18}% ${Math.min(48, existing * 8)}% ${existing % 2 ? 18 : 8}%)`
    ctx.applyTransform(
      element,
      `rotate(${existing * 2}deg) scale(${Math.max(0.2, 1 - existing * 0.15)})`,
    )
    if (existing >= 5) {
      element.style.opacity = '0'
      element.style.pointerEvents = 'none'
    }
    ctx.status = `${label} · paper cut ${existing}/5`
    ctx.addPoint(x, y, label)
    return true
  },
  'remote-strike': (ctx, { target, x, y, label }) => {
    const element = ctx.remember(target)
    element.classList.remove('hatsu-remote-punched')
    void element.offsetWidth
    element.classList.add('hatsu-remote-punched')
    ctx.executeSiteTarget(element)
    ctx.status = `Aura crossed the page and remotely activated ${label}`
    ctx.addPoint(innerWidth - x, y, label)
    return true
  },
  spatial: (ctx, { target, x, y, label }) => {
    ctx.storeElement(target, label, 'space')
    ctx.status = `${label} transferred beyond the page boundary`
    ctx.addPoint(x, y, label)
    return true
  },
  stitch: (ctx, { target, x, y, label }) => {
    if (!ctx.selectedElements.length) {
      ctx.selectedElements = [target]
      ctx.remember(target).classList.add('hatsu-stitch-edge')
      ctx.status = `${label} threaded · choose the second torn edge`
    } else if (ctx.selectedElements.length === 1) {
      const first = ctx.selectedElements[0]
      ctx.remember(first)
      ctx.remember(target)
      first.classList.add('hatsu-stitched')
      target.classList.add('hatsu-stitched')
      first.style.marginBottom = '0'
      target.style.marginTop = '0'
      first.style.position = target.style.position = 'sticky'
      first.style.top = '5rem'
      target.style.top = `calc(5rem + ${Math.max(36, first.getBoundingClientRect().height)}px)`
      ctx.selectedElements = [first, target]
      ctx.addPoint(x, y, label)
      ctx.status = `${ctx.targetLabel(first)} and ${label} sewn into one sticky body · activating either edge activates its counterpart`
    } else if (ctx.selectedElements.includes(target)) {
      const counterpart = ctx.selectedElements.find((element) => element !== target)
      if (counterpart) {
        ctx.executeSiteTarget(target)
        ctx.executeSiteTarget(counterpart)
      }
      ctx.status = `${label} pulled its stitched counterpart into the same action`
    }
    return true
  },
  melody: (ctx, { target, x, y, label }) => {
    document.body.classList.add('hatsu-melody')
    ctx.remember(target).classList.add('hatsu-note')
    if (!ctx.guideItems.some((item) => item.element === target))
      ctx.guideItems = [...ctx.guideItems, ctx.guideItemFor(target, label)].slice(-7)
    ctx.guideTitle = 'Enchanting Music · guided score'
    // The score is written on screen as DO…SI, so it has to be heard as well:
    // the note just added sounds now, and the guided sweep replays its phrase.
    const note = ctx.points.length
    playHatsuNote(note)
    if (ctx.guideItems.length >= 3) {
      ctx.guideItems.slice(-3).forEach((item, index) =>
        ctx.schedule(() => {
          playHatsuNote(Math.max(0, note - 2 + index), { velocity: 0.6 })
          ctx.followGuide(item)
        }, index * 550),
      )
    }
    ctx.status = `Note ${ctx.points.length + 1} · ${label} joined a score that guides focus through the site`
    ctx.addPoint(x, y, ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI'][ctx.points.length % 7])
    return true
  },
  infection: (ctx, { target, x, y }) => {
    const element = ctx.remember(target)
    const current = Number(element.dataset.hatsuLevel || 0)
    const next = current ? Math.min(100, current + 10) : 1
    element.dataset.hatsuLevel = String(next)
    element.classList.add('hatsu-infected')
    ctx.infectionLevel = Math.max(ctx.infectionLevel, next)
    if (current) {
      for (const sibling of Array.from(target.parentElement?.children || []).slice(0, 3)) {
        if (!(sibling instanceof HTMLElement)) continue
        ctx.remember(sibling).classList.add('hatsu-infected')
        sibling.dataset.hatsuLevel = String(Math.max(1, next - 1))
      }
    }
    if (next >= 20) {
      const locked = target.matches('[disabled],[aria-disabled="true"],[hidden]')
        ? target
        : target.querySelector<HTMLElement>('[disabled],[aria-disabled="true"],[hidden]')
      if (locked) {
        ctx.remember(locked)
        locked.hidden = false
        locked.removeAttribute('aria-disabled')
        if ('disabled' in locked) (locked as HTMLButtonElement).disabled = false
        locked.style.pointerEvents = 'auto'
      }
    }
    ctx.status = `Contagion level ${next} · ${next >= 20 ? 'a locked site ability was unlocked at the Hatsu threshold' : current ? 'infection spread to neighboring members' : 'new member initiated'}`
    ctx.addPoint(x, y, `LV ${next}`)
    return true
  },
  windup: (ctx, { target, x, y, label }) => {
    if (ctx.selectedElements[0] !== target) {
      ctx.selectedElements = [target]
      ctx.windupPower = 0
    }
    ctx.windupPower += 1
    const element = ctx.remember(target)
    ctx.applyTransform(
      element,
      `rotate(${ctx.windupPower * 18}deg) scale(${1 + ctx.windupPower * 0.025})`,
    )
    element.style.transition = 'transform .2s ease'
    if (ctx.windupPower >= 6) {
      element.classList.add('hatsu-cyclotron-release')
      element.style.pointerEvents = 'none'
      element.style.maxHeight = '0'
      element.style.overflow = 'hidden'
      ctx.status = `Ripper Cyclotron released at ×${ctx.windupPower} power · ${label} destroyed and removed from interaction`
      ctx.windupPower = 0
    } else ctx.status = `Arm rotation ${ctx.windupPower} · aura multiplier ×${ctx.windupPower}`
    ctx.addPoint(x, y, label)
    return true
  },
  predator: (ctx, { target, x, y, label }) => {
    const species = `${target.tagName}.${target.classList[0] || 'plain'}`
    if (ctx.studyTarget !== species) {
      ctx.studyTarget = species
      ctx.studyCount = 0
    }
    ctx.studyCount += 1
    ctx.remember(target).classList.add('hatsu-studied')
    if (ctx.studyCount >= 3) {
      const matches = Array.from(
        document.querySelectorAll<HTMLElement>(target.tagName.toLowerCase()),
      ).filter((element) => !element.closest('[data-hatsu-ui], nav, header'))
      for (const match of matches.slice(0, 12)) {
        ctx.remember(match).classList.add('hatsu-predated')
        match.style.pointerEvents = 'none'
      }
      ctx.status = `Predator complete · ${matches.length} ${target.tagName.toLowerCase()} targets neutralized`
    } else ctx.status = `Hypothesis ${ctx.studyCount}/3 · studying ${species}`
    ctx.addPoint(x, y, label)
    return true
  },
  staff: (ctx, { target, x, y, label }) => {
    const pinned = ctx.remember(target)
    pinned.classList.add('hatsu-staff-pinned')
    pinned.style.position = 'sticky'
    pinned.style.top = '5rem'
    pinned.style.pointerEvents = 'none'
    for (const sibling of Array.from(target.parentElement?.children || [])) {
      if (!(sibling instanceof HTMLElement) || sibling === target) continue
      ctx.remember(sibling)
      const direction =
        sibling.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
      ctx.applyTransform(sibling, `translateX(${direction * 28}px)`)
      sibling.style.transition = 'transform .35s ease'
    }
    ctx.status = `Priest Staff extended through ${label} · target pinned and unusable, neighbors repelled`
    ctx.addPoint(x, y, label)
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
    if (target.closest('[data-hatsu-character]')) {
      ctx.status = `${label} rejected · Blinky considers the target alive`
      return true
    }
    ctx.storeElement(target, label, 'vacuum')
    ctx.status = `${label} vacuumed · ${ctx.storedItems.length} nonliving targets stored`
    ctx.addPoint(x, y, label)
    return true
  },
  snakes: (ctx, { target, x, y, label }) => {
    if (ctx.selectedElements.length < 10 && !ctx.selectedElements.includes(target)) {
      ctx.selectedElements = [...ctx.selectedElements, target]
      ctx.remember(target).classList.add('hatsu-suspect')
      ctx.status = `${ctx.selectedElements.length}/10 targets inside Silent Majority range`
      ctx.addPoint(x, y, `${ctx.selectedElements.length}`)
    } else if (ctx.selectedElements.length >= 10) {
      ctx.remember(target).classList.add('hatsu-snake-victim')
      target.style.pointerEvents = 'none'
      ctx.status = `${label} drained by four snakes · curse fulfilled`
      ctx.addPoint(x, y, label)
    }
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
    const element = ctx.remember(target)
    const restrained = element.classList.toggle('hatsu-serpent-bound')
    element.setAttribute('aria-disabled', restrained ? 'true' : 'false')
    for (const control of element.querySelectorAll<HTMLElement>('a,button,input,select,textarea')) {
      ctx.remember(control)
      control.style.pointerEvents = restrained ? 'none' : 'auto'
    }
    ctx.status = restrained
      ? `${label} constricted by Snake Arm`
      : `${label} released from the coils`
    ctx.addPoint(x, y, label)
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
    const wounded = ctx.remember(target)
    wounded.hidden = false
    wounded.style.opacity = '1'
    wounded.style.filter = 'none'
    wounded.style.maxHeight = 'none'
    wounded.style.pointerEvents = 'auto'
    wounded.removeAttribute('aria-disabled')
    wounded.removeAttribute('aria-hidden')
    if ('disabled' in wounded) (wounded as HTMLButtonElement).disabled = false
    const details = wounded.closest('details') || wounded.querySelector('details')
    if (details instanceof HTMLDetailsElement) {
      ctx.remember(details)
      details.open = true
    }
    wounded.classList.add('hatsu-holy-healed')
    ctx.status = `Holy Chain restored ${label}'s content and controls`
    ctx.addPoint(x, y, `HEALED · ${label}`)
    return true
  },
  'heart-vow': (ctx, { target, x, y, label }) => {
    if (!ctx.selectedElements.length) {
      ctx.selectedElements = [target]
      ctx.remember(target).classList.add('hatsu-vow-subject')
      ctx.status = `${label} bears the heart chain · choose the forbidden action`
    } else if (ctx.selectedElements.length === 1 && target !== ctx.selectedElements[0]) {
      ctx.selectedElements = [...ctx.selectedElements, target]
      ctx.remember(target).classList.add('hatsu-vow-clause')
      ctx.status = `${ctx.targetLabel(target)} declared forbidden · touch it again to violate the rule`
    } else if (ctx.selectedElements[1] === target) {
      const subject = ctx.remember(ctx.selectedElements[0])
      subject.style.pointerEvents = 'none'
      subject.setAttribute('aria-disabled', 'true')
      subject.classList.add('hatsu-vow-enforced')
      ctx.status = `Rule violated · Judgment Chain pierced ${ctx.targetLabel(subject)}'s heart and sealed its site action`
    }
    ctx.addPoint(x, y, label)
    return true
  },
  'ability-loan': (ctx, { target, x, y, label }) => {
    if (!ctx.selectedElements.length) {
      const techniques = ctx
        .profilesFromTarget(target)
        .filter((technique) => technique.id !== ctx.profile.id)
      ctx.selectedElements = [target]
      ctx.capturedTechniques = techniques.slice(0, 1)
      ctx.remember(target).classList.add('hatsu-dolphin-analyzed')
      ctx.status = techniques.length
        ? `${techniques[0].name} analyzed · choose a recipient`
        : `${label} has no registered ability to load`
    } else if (target !== ctx.selectedElements[0]) {
      ctx.selectedElements = [ctx.selectedElements[0], target]
      ctx.remember(target).classList.add('hatsu-dolphin-recipient')
      ctx.status = ctx.capturedTechniques.length
        ? `${ctx.capturedTechniques[0].name} loaned once to ${label} · activate it from Stealth Dolphin`
        : `${label} received no ability because the dolphin was empty`
    }
    ctx.addPoint(x, y, label)
    return true
  },
  contract: (ctx, { target, x, y, label }) => {
    if (ctx.selectedElements.length < 2 && !ctx.selectedElements.includes(target)) {
      ctx.selectedElements = [...ctx.selectedElements, target]
      ctx.remember(target).classList.add('hatsu-contract-signatory')
      ctx.status = `${ctx.selectedElements.length}/2 voluntary signatures recorded`
    } else if (ctx.selectedElements.length === 2 && !ctx.selectedElements.includes(target)) {
      ctx.selectedElements = [...ctx.selectedElements, target]
      ctx.remember(target).classList.add('hatsu-contract-clause')
      ctx.status = `${label} written as the binding clause · touch it again to record a breach`
    } else if (ctx.selectedElements[2] === target) {
      const breacher = ctx.remember(ctx.selectedElements[1])
      breacher.style.pointerEvents = 'none'
      breacher.setAttribute('aria-disabled', 'true')
      ctx.status = `Moonlight Act enforced the accepted penalty on ${ctx.targetLabel(breacher)}`
    }
    ctx.addPoint(x, y, label)
    return true
  },
  'truth-punch': (ctx, { target, x, y, label }) => {
    const controls = Array.from(
      target.querySelectorAll<HTMLElement>(
        'a,button,input,select,textarea,[hidden],[aria-hidden="true"]',
      ),
    ).slice(0, 8)
    ctx.guideTitle = 'Body and Soul · truthful answer'
    ctx.guideItems = controls.map((control) => ctx.guideItemFor(control, ctx.targetLabel(control)))
    ctx.remember(target).classList.add('hatsu-truth-punched')
    ctx.addPoint(x, y, label, {
      details: [
        `${target.querySelectorAll('a').length} routes`,
        `${controls.length} controls`,
        `hidden=${target.hidden}`,
      ],
    })
    ctx.status = `${label}'s body answered: ${ctx.guideItems.length} real controls and routes found`
    return true
  },
  'blood-search': (ctx, { target, x, y, label }) => {
    const found = Array.from(
      target.querySelectorAll<HTMLElement>('a,[data-hatsu-character],button'),
    ).slice(0, 12)
    ctx.guideTitle = 'Bloody Mary · autonomous search drops'
    ctx.guideItems = found.map((element) => ctx.guideItemFor(element, ctx.targetLabel(element)))
    ctx.remember(target).classList.add('hatsu-blood-searched')
    ctx.status = `${ctx.guideItems.length} blood drops found navigable traces inside ${label}`
    ctx.addPoint(x, y, `${ctx.guideItems.length} DROPS`)
    return true
  },
  'legal-defense': (ctx, { target, x, y, label }) => {
    if (!ctx.selectedElements.length) {
      ctx.selectedElements = [target]
      ctx.remember(target).classList.add('hatsu-lsdf-hideout')
      ctx.status = `${label} established as Morena's hideout jurisdiction · identify an intruder`
    } else if (ctx.selectedElements.length === 1 && target !== ctx.selectedElements[0]) {
      ctx.selectedElements = [...ctx.selectedElements, target]
      ctx.remember(target).classList.add('hatsu-lsdf-defendant')
      ctx.status = `${label} charged with trespass · click again to confirm expulsion`
    } else if (ctx.selectedElements[1] === target) {
      const intruder = ctx.remember(target)
      intruder.style.transition = 'transform .7s ease, opacity .5s'
      ctx.applyTransform(intruder, 'translateX(110vw)')
      intruder.style.pointerEvents = 'none'
      intruder.setAttribute('aria-disabled', 'true')
      ctx.status = `LSDF guards expelled ${label} without inflicting damage`
    }
    ctx.addPoint(x, y, label)
    return true
  },
  'damage-transfer': (ctx, { target, x, y, label }) => {
    if (!ctx.selectedElements.length) {
      ctx.selectedElements = [target]
      ctx.remember(target).classList.add('hatsu-damage-source')
      ctx.status = `${label} protected by touch · choose the damage recipient`
    } else if (ctx.selectedElements.length === 1 && target !== ctx.selectedElements[0]) {
      ctx.selectedElements = [...ctx.selectedElements, target]
      ctx.remember(target).classList.add('hatsu-damage-recipient')
      ctx.status = `${label} designated as recipient · strike ${ctx.targetLabel(ctx.selectedElements[0])} again`
    } else if (ctx.selectedElements[0] === target && ctx.selectedElements[1]) {
      const recipient = ctx.remember(ctx.selectedElements[1])
      recipient.style.maxHeight = '0'
      recipient.style.opacity = '.08'
      recipient.style.overflow = 'hidden'
      recipient.style.pointerEvents = 'none'
      ctx.status = `Damage to ${label} transferred intact into ${ctx.targetLabel(recipient)}`
    }
    ctx.addPoint(x, y, label)
    return true
  },
  'door-network': (ctx, { target, x, y, label }) => {
    if (!ctx.guideItems.some((item) => item.element === target))
      ctx.guideItems = [...ctx.guideItems, ctx.guideItemFor(target, label)].slice(-8)
    ctx.guideTitle = 'Voconte · prepared hideout doors'
    ctx.remember(target).classList.add('hatsu-hideout-door')
    ctx.status = `${ctx.guideItems.length} connected rooms · use the door panel to reroute site focus`
    ctx.addPoint(x, y, `DOOR ${ctx.guideItems.length}`)
    return true
  },
  'weapon-body': (ctx, { target, x, y }) => {
    const control = target.closest<HTMLElement>('a,button,[role="button"],summary')
    if (!control) {
      ctx.status = 'Padaille can only transform a body part into a known site weapon or tool'
      return true
    }
    if (ctx.selectedElements[0] === control) {
      ctx.executeSiteTarget(control)
      ctx.status = `${ctx.targetLabel(control)} struck with its transformed body function`
    } else {
      ctx.selectedElements = [control]
      ctx.remember(control).classList.add('hatsu-body-weapon')
      ctx.status = `${ctx.targetLabel(control)} transformed into a body weapon · click it again to strike`
    }
    ctx.addPoint(x, y, ctx.targetLabel(control))
    return true
  },
  'coercive-beast': (ctx, { target, x, y, label }) => {
    if (ctx.puppetTarget && target !== ctx.puppetTarget) {
      ctx.executeSiteTarget(ctx.puppetTarget)
      ctx.status = `${ctx.targetLabel(ctx.puppetTarget)} obeyed the Beast's remote command`
    } else {
      const controlled = ctx.remember(target)
      const level = Math.min(3, Number(controlled.dataset.hatsuLevel || 0) + 1)
      controlled.dataset.hatsuLevel = String(level)
      controlled.classList.add('hatsu-coercion-probe')
      if (level === 3) ctx.puppetTarget = controlled
      ctx.status =
        level === 3
          ? `Unknown conditions fulfilled · ${label} is under total control`
          : `Unknown condition contact ${level}/3 · canon trigger remains unrevealed`
    }
    ctx.addPoint(x, y, label)
    return true
  },
  'coin-growth': (ctx, { target, x, y }) => {
    const holder = ctx.remember(target)
    const age = Number(holder.dataset.hatsuLevel || 0) + 1
    holder.dataset.hatsuLevel = String(age)
    const value = 10 ** Math.min(3, age - 1)
    holder.classList.add('hatsu-guardian-coin')
    if (age >= 3) {
      const locked = holder.matches('[disabled],[hidden],[aria-hidden="true"]')
        ? holder
        : holder.querySelector<HTMLElement>('[disabled],[hidden],[aria-hidden="true"]')
      if (locked) {
        ctx.remember(locked)
        locked.hidden = false
        locked.removeAttribute('aria-hidden')
        locked.removeAttribute('aria-disabled')
        if ('disabled' in locked) (locked as HTMLButtonElement).disabled = false
        locked.style.pointerEvents = 'auto'
      }
    }
    ctx.status = `Guardian coin value ${value} · ${age >= 3 ? 'accumulated Nen opened a dormant site capability' : 'continue long-term accumulation'}`
    ctx.addPoint(x, y, `₵ ${value}`)
    return true
  },
  'lie-marks': (ctx, { target, x, y, label }) => {
    const liar = ctx.remember(target)
    const lies = Math.min(3, Number(liar.dataset.hatsuLevel || 0) + 1)
    liar.dataset.hatsuLevel = String(lies)
    liar.classList.add('hatsu-lie-mark')
    if (lies === 3) {
      liar.style.pointerEvents = 'none'
      liar.setAttribute('aria-disabled', 'true')
      liar.style.filter = 'grayscale(1) blur(2px)'
    }
    ctx.status = [
      'First lie cut into the target',
      'Second lie infected the mark · final warning issued',
      `Third lie · ${label} transformed and lost site autonomy`,
    ][lies - 1]
    ctx.addPoint(x, y, `LIE ${lies}`)
    return true
  },
  'drug-synthesis': (ctx, { target, x, y, label }) => {
    if (!ctx.selectedElements.includes(target) && ctx.selectedElements.length < 2)
      ctx.selectedElements = [...ctx.selectedElements, target]
    ctx.remember(target).classList.add('hatsu-research-partner')
    if (ctx.selectedElements.length === 2) {
      for (const partner of ctx.selectedElements) {
        const restored = ctx.remember(partner)
        restored.hidden = false
        restored.style.pointerEvents = 'auto'
        restored.style.opacity = '1'
        restored.removeAttribute('aria-disabled')
        restored.removeAttribute('aria-hidden')
        if ('disabled' in restored) (restored as HTMLButtonElement).disabled = false
      }
    }
    ctx.status =
      ctx.selectedElements.length < 2
        ? 'Collaborative synthesis requires a second research partner'
        : `Treatment synthesized · ${ctx.selectedElements.map(ctx.targetLabel).join(' + ')} restored together`
    ctx.addPoint(x, y, label)
    return true
  },
  'aura-levy': (ctx, { target, x, y, label }) => {
    if (!ctx.guideItems.some((item) => item.element === target))
      ctx.guideItems = [...ctx.guideItems, ctx.guideItemFor(target, label)].slice(-10)
    ctx.guideTitle = 'Tyson · happiness path'
    const reader = ctx.remember(target)
    reader.classList.add('hatsu-eye-wog-reader')
    const control = reader.querySelector<HTMLElement>('button,input,textarea,select')
    if (control) {
      ctx.remember(control)
      control.style.pointerEvents = 'none'
      control.setAttribute('aria-disabled', 'true')
    }
    ctx.status = `Eye-wog levy collected aura from ${label} · happiness route added, one local control drained`
    ctx.addPoint(x, y, `READER ${ctx.guideItems.length}`)
    return true
  },
  'desire-trap': (ctx, { target, x, y, label }) => {
    if (!ctx.selectedElements.length) {
      ctx.selectedElements = [target]
      ctx.remember(target).classList.add('hatsu-desire')
      ctx.status = `${label} identified as the desired destination · choose convincing bait`
    } else if (ctx.selectedElements.length === 1 && target !== ctx.selectedElements[0]) {
      ctx.selectedElements = [...ctx.selectedElements, target]
      ctx.remember(target).classList.add('hatsu-desire-bait')
      ctx.status = `${label} materialized as bait · touching it again accepts the trap`
    } else if (ctx.selectedElements[1] === target) {
      ctx.executeSiteTarget(ctx.selectedElements[0])
      ctx.status = `${label} accepted · pseudo-coercion forced the site toward ${ctx.targetLabel(ctx.selectedElements[0])}`
    }
    ctx.addPoint(x, y, label)
    return true
  },
  'diffusive-smoke': (ctx, { target, x, y }) => {
    const exposed = ctx.remember(target)
    const exposure = Number(exposed.dataset.hatsuLevel || 0) + 1
    exposed.dataset.hatsuLevel = String(exposure)
    exposed.classList.add('hatsu-smoke-converted')
    const spread = [
      target,
      ...Array.from(target.parentElement?.children || [])
        .filter((element): element is HTMLElement => element instanceof HTMLElement)
        .slice(0, 3),
    ]
    for (const emitter of spread) {
      ctx.remember(emitter).classList.add('hatsu-smoke-converted')
      if (!ctx.guideItems.some((item) => item.element === emitter))
        ctx.guideItems = [...ctx.guideItems, ctx.guideItemFor(emitter, ctx.targetLabel(emitter))]
    }
    ctx.guideTitle = 'Salé-salé · converted goodwill network'
    ctx.status = `Smoke exposure ${exposure} · ${ctx.guideItems.length} sections now diffuse routes toward the prince`
    ctx.addPoint(x, y, `SMOKE ${exposure}`)
    return true
  },
  solicitation: (ctx, { target, x, y, label }) => {
    if (!ctx.selectedElements.length) {
      ctx.selectedElements = [target]
      ctx.remember(target).classList.add('hatsu-solicited')
      ctx.status = `${label}, are you free? Click the same target for yes or another for refusal`
    } else if (ctx.selectedElements[0] === target) {
      const possessed = ctx.remember(target)
      possessed.classList.add('hatsu-possessed')
      possessed.setAttribute('aria-disabled', 'true')
      for (const control of possessed.querySelectorAll<HTMLElement>(
        'a,button,input,select,textarea',
      )) {
        ctx.remember(control)
        control.style.pointerEvents = 'none'
      }
      ctx.puppetTarget = possessed
      ctx.status = `${label} answered yes · spider entered and seized its site controls`
    } else {
      ctx.remember(target).classList.add('hatsu-solicitation-refusal')
      ctx.status = `${label} answered no · the small Beast remains and asks again`
    }
    ctx.addPoint(x, y, label)
    return true
  },
  'room-isolation': (ctx, { target, x, y, label }) => {
    const room = ctx.remember(target)
    room.classList.add('hatsu-isolated-room')
    room.style.position = 'relative'
    room.style.zIndex = '25'
    for (const outsider of Array.from(target.parentElement?.children || [])) {
      if (!(outsider instanceof HTMLElement) || outsider === target) continue
      ctx.remember(outsider)
      outsider.style.opacity = '.12'
      outsider.style.pointerEvents = 'none'
      outsider.setAttribute('aria-hidden', 'true')
    }
    ctx.status = `${label} isolated as the real room · surrounding visitors can access only an inert duplicate`
    ctx.addPoint(x, y, 'ROOM 1013')
    return true
  },
  'postmortem-curse': (ctx, { target, x, y, label }) => {
    if (ctx.selectedElements[0] !== target) {
      ctx.selectedElements = [target]
      ctx.studyCount = 0
    }
    ctx.studyCount += 1
    const element = ctx.remember(target)
    element.classList.add('hatsu-curse-prepared')
    element.dataset.hatsuLevel = String(ctx.studyCount)
    if (ctx.studyCount >= 5) {
      element.classList.add('hatsu-postmortem-drain')
      element.style.pointerEvents = 'none'
      ctx.status = `Sacrifice complete · ${label}'s aura is being drained by Yomotsu Hegui`
    } else ctx.status = `Preparation rite ${ctx.studyCount}/5 · fixation and resolve intensify`
    ctx.addPoint(x, y, ctx.studyCount >= 5 ? 'POST-MORTEM' : `RITE ${ctx.studyCount}`)
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
