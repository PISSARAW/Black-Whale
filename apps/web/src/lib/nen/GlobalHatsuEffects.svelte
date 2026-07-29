<script lang="ts">
  import { locale, t } from '$lib/i18n'
  import { localizeHatsu, localizeHatsuList, manifestationFor } from '$lib/i18n/hatsu'
  import { hatsuStatusFor } from '$lib/i18n/hatsuStatus'
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { mapState, type ZoomLevel } from '$lib/state/mapState.svelte'
  import {
    activeHatsu,
    activateHatsu,
    consumeEmperorTimeHour,
    emperorTimeLifeHours,
    parallelFutureVisible,
  } from './hatsuState.js'
  import { setAmbientMuffled } from '$lib/audio/ambient.js'
  import {
    hatsuById,
    siteImpactFor,
    visualSignatureFor,
    type HatsuProfile,
  } from './hatsuRegistry.js'
  import {
    runHatsuInteraction,
    GALLERY_FAKE_CLASS,
    type BirdDispatch,
    type FloatingCard,
    type GuideItem,
    type HatsuInteractionContext,
    type Point,
    type StoredItem,
  } from './hatsuInteractions.js'

  type CaptureZone = { left: number; top: number; width: number; height: number }
  type RecordedEvent = { x: number; y: number; label: string }
  type PortalAnchor = {
    x: number
    y: number
    label: string
    url: string
    zoom: ZoomLevel
    tier: string | null
    location: string | null
  }
  type ElementSnapshot = {
    /** Inline declarations present before the Hatsu touched the element. */
    style: Map<string, string>
    /** The element's own transform, which Hatsu transforms compose with. */
    transform: string
    /** Classes the page already carried, which a Hatsu must never strip. */
    classNames: string[]
    hidden: boolean
    disabled?: boolean
    open?: boolean
    ariaLabel: string | null
    ariaDisabled: string | null
    ariaHidden: string | null
  }
  type MediaSnapshot = {
    element: HTMLMediaElement
    paused: boolean
    currentTime: number
    controls: boolean
  }
  type SiteSnapshot = {
    url: string
    scrollX: number
    scrollY: number
    activeElement: HTMLElement | null
    media: MediaSnapshot[]
    map: {
      currentZoomLevel: typeof mapState.currentZoomLevel
      selectedTier: typeof mapState.selectedTier
      selectedLocationId: typeof mapState.selectedLocationId
      selectedPerspectiveId: typeof mapState.selectedPerspectiveId
      selectedPerspectiveKind: typeof mapState.selectedPerspectiveKind
      selectedPerspectiveName: typeof mapState.selectedPerspectiveName
      followMode: typeof mapState.followMode
      compareWithReader: boolean
      explainPanelOpen: boolean
      explainTarget: typeof mapState.explainTarget
      currentEventIndex: number
      factions: string[]
      spoilersEnabled: boolean
      showUnknownPositions: boolean
    }
  }
  let points: Point[] = []
  let cursor = { x: -100, y: -100 }
  let sequence = 0
  let seconds = 0
  let cardIndex = 0
  let status = ''
  let previousId: string | null = null
  let bungeeTimer: ReturnType<typeof setTimeout> | null = null
  let bungeeFilterActive = false
  let bungeeOrigin: { x: number; y: number } | null = null
  let futureTimer: ReturnType<typeof setTimeout> | null = null
  let captureTimer: ReturnType<typeof setTimeout> | null = null
  let captureZone: CaptureZone | null = null
  let guardianReplayTimer: ReturnType<typeof setInterval> | null = null
  let guardianReplayPoint: RecordedEvent | null = null
  let recordedEvents: RecordedEvent[] = []
  let portalAnchors: PortalAnchor[] = []
  let selectedElements: HTMLElement[] = []
  let storedItems: StoredItem[] = []
  let floatingCards: FloatingCard[] = []
  let prophecyLines: string[] = []
  let stolenTarget: HTMLElement | null = null
  let puppetTarget: HTMLElement | null = null
  let puppetExecuting = false
  let sensesStage = 0
  let windupPower = 0
  let infectionLevel = 0
  let studyTarget = ''
  let studyCount = 0
  let trainingTarget: HTMLElement | null = null
  let trainingOrigin = { x: 0, y: 0 }
  let observerReports: { label: string; count: number }[] = []
  let birdDispatches: BirdDispatch[] = []
  let capturedTechniques: HatsuProfile[] = []
  let dowsingSignal = 0
  let portalCrossings = 0
  let guardianShield = 1
  let crossGameTarget: HTMLElement | null = null
  let guideTitle = ''
  let guideItems: GuideItem[] = []
  let dialBest: { score: number; item: GuideItem } | null = null
  let siteSnapshot: SiteSnapshot | null = null
  // Cleanup bookkeeping, not view state.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const snapshots = new Map<HTMLElement, ElementSnapshot>()
  // Which inline properties a Hatsu actually wrote, so restoring gives back
  // only those and leaves the ones the page owns alone.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const styleWrites = new Map<HTMLElement, Set<string>>()
  const observers: MutationObserver[] = []
  // Cleanup bookkeeping, not view state.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const effectTimers = new Set<ReturnType<typeof setTimeout>>()
  // Cleanup bookkeeping, not view state.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const bungeeSelected = new Set<string>()
  // Cleanup bookkeeping, not view state.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const inheritedCharacters = new Set<string>()
  const tribunalCards = [
    'BLEU · ADMISSION',
    'JAUNE · AVERTISSEMENT',
    'JAUNE · RESTRAINT',
    'ROUGE · EXPULSION',
  ]

  // The technique is read in the visitor's language; the id, kind and colour
  // the branches below dispatch on are untouched by the overlay.
  $: profile = $activeHatsu ? localizeHatsu($activeHatsu, $locale) : null
  $: visualSignature = profile
    ? { ...visualSignatureFor(profile), manifestation: manifestationFor(profile, $locale) }
    : null
  $: if (profile?.id !== previousId) {
    const hadActiveHatsu = previousId !== null
    const releasingHatsu = hadActiveHatsu && !profile
    cleanupTechniqueState(releasingHatsu)
    if (profile && !hadActiveHatsu) siteSnapshot = captureSiteState()
    previousId = profile?.id ?? null
    points = []
    seconds = 0
    cardIndex = 0
    status = profile ? profile.action : ''
  }

  // The vision expires ten seconds after it becomes visible, not ten seconds
  // after the technique id changes: re-selecting Parallel Future while it is
  // already active makes it visible again without changing the id, and used to
  // leave the future overlay on forever.
  $: if (profile?.kind === 'future' && $parallelFutureVisible) armFutureVision()

  function armFutureVision() {
    if (futureTimer) clearTimeout(futureTimer)
    seconds = 0
    status = 'Present positions: cyan · next chapter: violet'
    // `parallelFutureVisible` is only ever cleared here, and the guard above
    // requires it to be true, so this cannot re-enter. cleanupTechniqueState
    // clears the timer when the technique changes.
    futureTimer = setTimeout(() => {
      parallelFutureVisible.set(false)
      status = 'Ten-second vision complete'
      futureTimer = null
    }, 10000)
  }

  function captureSiteState(): SiteSnapshot | null {
    if (typeof window === 'undefined' || typeof document === 'undefined') return null
    return {
      url: `${window.location.pathname}${window.location.search}${window.location.hash}`,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      activeElement: document.activeElement instanceof HTMLElement ? document.activeElement : null,
      media: Array.from(document.querySelectorAll<HTMLMediaElement>('audio, video')).map(
        (element) => ({
          element,
          paused: element.paused,
          currentTime: element.currentTime,
          controls: element.controls,
        }),
      ),
      map: {
        currentZoomLevel: mapState.currentZoomLevel,
        selectedTier: mapState.selectedTier,
        selectedLocationId: mapState.selectedLocationId,
        selectedPerspectiveId: mapState.selectedPerspectiveId,
        selectedPerspectiveKind: mapState.selectedPerspectiveKind,
        selectedPerspectiveName: mapState.selectedPerspectiveName,
        followMode: mapState.followMode,
        compareWithReader: mapState.compareWithReader,
        explainPanelOpen: mapState.explainPanelOpen,
        explainTarget: mapState.explainTarget ? { ...mapState.explainTarget } : null,
        currentEventIndex: mapState.currentEventIndex,
        factions: [...mapState.filters.factions],
        spoilersEnabled: mapState.filters.spoilersEnabled,
        showUnknownPositions: mapState.filters.showUnknownPositions,
      },
    }
  }

  function applyMapSnapshot(snapshot: SiteSnapshot['map']) {
    mapState.currentZoomLevel = snapshot.currentZoomLevel
    mapState.selectedTier = snapshot.selectedTier
    mapState.selectedLocationId = snapshot.selectedLocationId
    mapState.selectedPerspectiveId = snapshot.selectedPerspectiveId
    mapState.selectedPerspectiveKind = snapshot.selectedPerspectiveKind
    mapState.selectedPerspectiveName = snapshot.selectedPerspectiveName
    mapState.followMode = snapshot.followMode
    mapState.compareWithReader = snapshot.compareWithReader
    mapState.explainPanelOpen = snapshot.explainPanelOpen
    mapState.explainTarget = snapshot.explainTarget ? { ...snapshot.explainTarget } : null
    mapState.currentEventIndex = snapshot.currentEventIndex
    mapState.filters.factions = [...snapshot.factions]
    mapState.filters.spoilersEnabled = snapshot.spoilersEnabled
    mapState.filters.showUnknownPositions = snapshot.showUnknownPositions
  }

  function restoreSiteState() {
    const snapshot = siteSnapshot
    siteSnapshot = null
    if (!snapshot || typeof window === 'undefined' || typeof document === 'undefined') return

    const finishRestoration = () => {
      applyMapSnapshot(snapshot.map)
      for (const media of snapshot.media) {
        if (!media.element.isConnected) continue
        media.element.controls = media.controls
        if (Number.isFinite(media.currentTime)) media.element.currentTime = media.currentTime
        if (media.paused) media.element.pause()
        else void media.element.play().catch(() => undefined)
      }
      window.requestAnimationFrame(() => {
        window.scrollTo({ left: snapshot.scrollX, top: snapshot.scrollY, behavior: 'auto' })
        if (snapshot.activeElement?.isConnected)
          snapshot.activeElement.focus({ preventScroll: true })
      })
    }

    applyMapSnapshot(snapshot.map)
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`
    if (currentUrl !== snapshot.url) {
      void goto(snapshot.url, { replaceState: true, keepFocus: true, noScroll: true })
        .then(finishRestoration)
        .catch(finishRestoration)
    } else finishRestoration()
  }

  function cleanupTechniqueState(restoreSite = false) {
    cleanupBungeeSelection()
    if (futureTimer) clearTimeout(futureTimer)
    if (captureTimer) clearTimeout(captureTimer)
    futureTimer = null
    captureTimer = null
    captureZone = null
    inheritedCharacters.clear()
    if (guardianReplayTimer) clearInterval(guardianReplayTimer)
    guardianReplayTimer = null
    guardianReplayPoint = null
    recordedEvents = []
    portalAnchors = []
    selectedElements = []
    storedItems = []
    floatingCards = []
    prophecyLines = []
    stolenTarget = null
    puppetTarget = null
    puppetExecuting = false
    sensesStage = 0
    setAmbientMuffled(false)
    windupPower = 0
    infectionLevel = 0
    studyTarget = ''
    studyCount = 0
    trainingTarget = null
    observerReports = []
    birdDispatches = []
    capturedTechniques = []
    dowsingSignal = 0
    portalCrossings = 0
    guardianShield = 1
    crossGameTarget = null
    guideTitle = ''
    guideItems = []
    dialBest = null
    for (const observer of observers) observer.disconnect()
    observers.length = 0
    for (const timer of effectTimers) clearTimeout(timer)
    effectTimers.clear()
    for (const [element, snapshot] of snapshots) {
      if (!element.isConnected) continue
      restoreStyle(element, snapshot)
      restoreClasses(element, snapshot)
      element.hidden = snapshot.hidden
      if ('disabled' in element && snapshot.disabled !== undefined)
        (element as HTMLButtonElement).disabled = snapshot.disabled
      if (element instanceof HTMLDetailsElement && snapshot.open !== undefined)
        element.open = snapshot.open
      if (snapshot.ariaLabel === null) element.removeAttribute('aria-label')
      else element.setAttribute('aria-label', snapshot.ariaLabel)
      if (snapshot.ariaDisabled === null) element.removeAttribute('aria-disabled')
      else element.setAttribute('aria-disabled', snapshot.ariaDisabled)
      if (snapshot.ariaHidden === null) element.removeAttribute('aria-hidden')
      else element.setAttribute('aria-hidden', snapshot.ariaHidden)
      delete element.dataset.hatsuLevel
      delete element.dataset.hatsuStored
      delete element.dataset.hatsuForgery
    }
    snapshots.clear()
    styleWrites.clear()
    if (typeof document !== 'undefined') {
      for (const replica of document.querySelectorAll(`.${GALLERY_FAKE_CLASS}`)) replica.remove()
      document.body.classList.remove(
        'hatsu-haiku-weather',
        'hatsu-rhythm',
        'hatsu-melody',
        'hatsu-no-sight',
        'hatsu-no-hearing',
        'hatsu-no-speech',
        'hatsu-portal-exhausted',
      )
    }
    if (restoreSite) restoreSiteState()
  }

  function schedule(callback: () => void, delay: number) {
    const timer = setTimeout(() => {
      effectTimers.delete(timer)
      callback()
      captureStyleWrites()
    }, delay)
    effectTimers.add(timer)
    return timer
  }

  function inlineStyleOf(element: HTMLElement) {
    // Cleanup bookkeeping, not view state.
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const declarations = new Map<string, string>()
    for (const property of Array.from(element.style))
      declarations.set(property, element.style.getPropertyValue(property))
    return declarations
  }

  /**
   * Record every inline property whose value no longer matches the snapshot as
   * Hatsu-owned. Called synchronously after each batch of effects, before the
   * page can re-render, so a difference can only come from us.
   */
  function captureStyleWrites() {
    for (const [element, snapshot] of snapshots) {
      if (!element.isConnected) continue
      for (const property of Array.from(element.style)) {
        if (snapshot.style.get(property) === element.style.getPropertyValue(property)) continue
        // Cleanup bookkeeping, not view state.
        // eslint-disable-next-line svelte/prefer-svelte-reactivity
        const written = styleWrites.get(element) ?? new Set<string>()
        written.add(property)
        styleWrites.set(element, written)
      }
    }
  }

  /**
   * Compose with the element's own transform instead of replacing it. Map
   * markers centre themselves with `translate(-50%, -50%)`, which a bare
   * assignment would drop, shifting every marker by half its size.
   */
  function applyTransform(element: HTMLElement, transform: string) {
    const base = snapshots.get(element)?.transform ?? ''
    element.style.transform = base ? `${base} ${transform}` : transform
  }

  function restoreStyle(element: HTMLElement, snapshot: ElementSnapshot) {
    for (const property of styleWrites.get(element) ?? []) {
      const original = snapshot.style.get(property)
      if (original === undefined) element.style.removeProperty(property)
      else element.style.setProperty(property, original)
    }
    styleWrites.delete(element)
  }

  /**
   * Drop only the classes a Hatsu added. Restoring `className` wholesale used
   * to revert classes the page had toggled meanwhile, and the framework — which
   * diffs against its own last value — never put them back.
   */
  function restoreClasses(element: HTMLElement, snapshot: ElementSnapshot) {
    for (const name of Array.from(element.classList))
      if (name.startsWith('hatsu-') && !snapshot.classNames.includes(name))
        element.classList.remove(name)
  }

  function remember(element: HTMLElement) {
    if (!snapshots.has(element))
      snapshots.set(element, {
        style: inlineStyleOf(element),
        transform: element.style.transform,
        classNames: Array.from(element.classList),
        hidden: element.hidden,
        disabled: 'disabled' in element ? (element as HTMLButtonElement).disabled : undefined,
        open: element instanceof HTMLDetailsElement ? element.open : undefined,
        ariaLabel: element.getAttribute('aria-label'),
        ariaDisabled: element.getAttribute('aria-disabled'),
        ariaHidden: element.getAttribute('aria-hidden'),
      })
    return element
  }

  function restoreElement(element: HTMLElement) {
    const snapshot = snapshots.get(element)
    if (!snapshot || !element.isConnected) return
    restoreStyle(element, snapshot)
    restoreClasses(element, snapshot)
    element.hidden = snapshot.hidden
    if ('disabled' in element && snapshot.disabled !== undefined)
      (element as HTMLButtonElement).disabled = snapshot.disabled
    if (element instanceof HTMLDetailsElement && snapshot.open !== undefined)
      element.open = snapshot.open
    if (snapshot.ariaLabel === null) element.removeAttribute('aria-label')
    else element.setAttribute('aria-label', snapshot.ariaLabel)
    if (snapshot.ariaDisabled === null) element.removeAttribute('aria-disabled')
    else element.setAttribute('aria-disabled', snapshot.ariaDisabled)
    if (snapshot.ariaHidden === null) element.removeAttribute('aria-hidden')
    else element.setAttribute('aria-hidden', snapshot.ariaHidden)
    delete element.dataset.hatsuStored
    delete element.dataset.hatsuForgery
    snapshots.delete(element)
  }

  function restoreStored(item: StoredItem) {
    restoreElement(item.element)
    storedItems = storedItems.filter((candidate) => candidate.id !== item.id)
    status = `${item.label} restored from ${item.mode}`
  }

  function useStolenControl() {
    if (!stolenTarget || puppetExecuting) return
    puppetExecuting = true
    stolenTarget.click()
    schedule(() => {
      puppetExecuting = false
    }, 0)
  }

  function executeSiteTarget(element: HTMLElement) {
    const control = element.matches('a,button,[role="button"],summary')
      ? element
      : element.querySelector<HTMLElement>('a,button,[role="button"],summary')
    if (control) {
      puppetExecuting = true
      control.click()
      schedule(() => {
        puppetExecuting = false
      }, 0)
      return
    }
    const details = element.closest('details') || element.querySelector('details')
    if (details instanceof HTMLDetailsElement) {
      remember(details)
      details.open = !details.open
    }
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function guideItemFor(target: HTMLElement, label = targetLabel(target)): GuideItem {
    const link =
      target.closest<HTMLAnchorElement>('a') || target.querySelector<HTMLAnchorElement>('a')
    return { id: ++sequence, label, element: target, href: link?.href || null }
  }

  function followGuide(item: GuideItem) {
    if (!item.element.isConnected) return
    item.element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    item.element.focus({ preventScroll: true })
    status = `${guideTitle} guided the site to ${item.label}`
  }

  function storeElement(element: HTMLElement, label: string, mode: StoredItem['mode']) {
    remember(element)
    element.dataset.hatsuStored = mode
    element.style.transition = 'transform .45s ease, opacity .35s ease'
    applyTransform(element, 'scale(.04) rotate(-8deg)')
    element.style.opacity = '0'
    element.style.pointerEvents = 'none'
    storedItems = [...storedItems, { id: ++sequence, element, label, mode }]
  }

  function moveByRects(first: HTMLElement, second: HTMLElement) {
    remember(first)
    remember(second)
    const a = first.getBoundingClientRect()
    const b = second.getBoundingClientRect()
    first.style.transition = second.style.transition = 'transform .55s cubic-bezier(.2,.8,.2,1)'
    applyTransform(first, `translate(${b.left - a.left}px, ${b.top - a.top}px)`)
    applyTransform(second, `translate(${a.left - b.left}px, ${a.top - b.top}px)`)
    first.style.zIndex = second.style.zIndex = '30'
  }

  /**
   * `data-hatsu-list` carries catalogue ids, which are the same keys the
   * registry is built on. Matching on display names instead used to resolve
   * "Spatial Teleportation" to Chrollo's "Teleport" and to miss Kurton
   * entirely, because catalogue and registry wording diverge.
   */
  function profilesFromTarget(target: HTMLElement) {
    const ids = (target.dataset.hatsuList || '').split('|').filter(Boolean)
    return ids.flatMap((id) => {
      const match = hatsuById(id)
      return match ? [match] : []
    })
  }

  function cleanupBungeeSelection() {
    if (bungeeTimer) clearTimeout(bungeeTimer)
    bungeeTimer = null
    bungeeFilterActive = false
    bungeeOrigin = null
    bungeeSelected.clear()
    if (typeof document === 'undefined') return
    document.body.classList.remove('bungee-gum-filtered')
    document
      .querySelectorAll('[data-bungee-selected]')
      .forEach((element) => element.removeAttribute('data-bungee-selected'))
  }

  function selectBungeeCharacter(target: HTMLElement, x: number, y: number, label: string) {
    const characterId = target.dataset.hatsuCharacter
    if (!characterId) return
    if (bungeeSelected.has(characterId)) {
      const anchorElement = selectedElements[0]
      if (!anchorElement) return
      const anchorRect = anchorElement.getBoundingClientRect()
      for (const linked of selectedElements.slice(1)) {
        const rect = linked.getBoundingClientRect()
        remember(linked)
        linked.style.transition = 'transform .6s cubic-bezier(.2,.9,.2,1)'
        applyTransform(
          linked,
          `translate(${anchorRect.left - rect.left}px, ${anchorRect.top - rect.top}px)`,
        )
      }
      status = `Bungee Gum retracted · ${selectedElements.length} targets pulled to ${targetLabel(anchorElement)}`
      return
    }

    // Measured from where the gum was emitted, which `points` cannot stand in
    // for: it only keeps the last eight impacts, so past eight selections the
    // origin drifted forward and the range limit stopped triggering.
    if (
      bungeeOrigin &&
      Math.hypot(x - bungeeOrigin.x, y - bungeeOrigin.y) > Math.min(innerWidth, innerHeight) * 0.8
    ) {
      status = 'Emitted Bungee Gum exceeded its ten-meter limit and snapped'
      return
    }

    bungeeOrigin ??= { x, y }
    bungeeSelected.add(characterId)
    selectedElements = [...selectedElements, target]
    target.dataset.bungeeSelected = 'true'
    addPoint(x, y, label)
    if (bungeeTimer) clearTimeout(bungeeTimer)

    if (bungeeSelected.size < 2) {
      status = '1 character selected · choose at least one more'
      return
    }

    status = `${bungeeSelected.size} characters linked · filter in 5 seconds`
    bungeeTimer = setTimeout(() => {
      document.body.classList.add('bungee-gum-filtered')
      bungeeFilterActive = true
      status = `${bungeeSelected.size} linked characters · map filtered`
      bungeeTimer = null
    }, 5000)
  }

  function targetLabel(target: HTMLElement) {
    return (target.getAttribute('aria-label') || target.textContent || target.tagName)
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 34)
  }

  function addPoint(
    x: number,
    y: number,
    label: string,
    extras: Pick<Point, 'alert' | 'details'> = {},
  ) {
    points = [...points.slice(-7), { x, y, label, id: ++sequence, ...extras }]
  }

  function interactWithCuldcept(event: MouseEvent, eventElement: Element) {
    const target = eventElement.closest<HTMLElement>('[data-hatsu-character]')
    if (!target) {
      status = 'Culdcept requires a visible Nen user on the map'
      return true
    }
    event.preventDefault()
    event.stopPropagation()

    const label = target.dataset.hatsuCharacterName || targetLabel(target)
    if (/halkenburg/i.test(label)) {
      addPoint(event.clientX, event.clientY, `${label} · FAILED`, { alert: true })
      status = 'Acquisition failed · Grimmel pierced the aura rectangle and every defence'
      return true
    }

    if (captureTimer) {
      status = 'Hands remain joined · acquisition is still charging'
      return true
    }

    const rect = target.getBoundingClientRect()
    captureZone = {
      left: rect.left - 18,
      top: rect.top - 28,
      width: Math.max(64, rect.width + 36),
      height: Math.max(82, rect.height + 56),
    }
    status = `Hands joined · acquiring ${label}'s ability`
    addPoint(event.clientX, event.clientY, label)
    captureTimer = setTimeout(() => {
      const acquired = profilesFromTarget(target)[0]
      if (acquired) {
        capturedTechniques = [acquired]
        remember(target).classList.add('hatsu-culdcept-drained')
        status = `${acquired.name} acquired as a Culdcept card`
      } else status = `${label} has no registered ability Culdcept can acquire`
      captureZone = null
      captureTimer = null
    }, 1600)
    return true
  }

  function recordGuardianEvent(event: MouseEvent, eventElement: Element) {
    if (profile?.kind !== 'guardian' || eventElement.closest('[data-hatsu-ui]')) return
    const target = eventElement.closest<HTMLElement>(
      'a, button, article, section, li, [role="button"], h1, h2, h3, p',
    )
    const threatening =
      target &&
      (target.dataset.hatsuNextChange === 'dead' ||
        /death|dead|kill|danger|curse|assassin/i.test(
          `${target.className} ${target.textContent || ''}`,
        ))
    if (target && threatening && guardianShield > 0) {
      event.preventDefault()
      event.stopPropagation()
      guardianShield -= 1
      const rect = target.getBoundingClientRect()
      addPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        `Protected · ${targetLabel(target)}`,
      )
      status = `Without You intercepted a lethal event and remained beside the survivor`
      return
    }
    recordedEvents = [
      ...recordedEvents.slice(-4),
      {
        x: event.clientX,
        y: event.clientY,
        label: target ? targetLabel(target) : 'Map interaction',
      },
    ]
    status = `${recordedEvents.length}/5 recent events memorized`
  }

  function replayGuardianEvents() {
    if (!recordedEvents.length) {
      status = 'No event to replay yet'
      return
    }
    if (guardianReplayTimer) clearInterval(guardianReplayTimer)
    let index = 0
    const replay = () => {
      const remembered = recordedEvents[index]
      guardianReplayPoint = remembered
      status = `Replay ${index + 1}/${recordedEvents.length} · ${remembered.label}`
      index += 1
      if (index >= recordedEvents.length && guardianReplayTimer) {
        clearInterval(guardianReplayTimer)
        guardianReplayTimer = null
        // Tracked, so releasing the Hatsu mid-replay cannot write the marker
        // back after the technique is gone.
        schedule(() => {
          guardianReplayPoint = null
        }, 700)
      }
    }
    guardianReplayTimer = setInterval(replay, 750)
    replay()
  }

  function currentPortalAnchor(event: MouseEvent): PortalAnchor {
    return {
      x: event.clientX,
      y: event.clientY,
      label: portalAnchors.length ? 'Return Door' : 'Start Door',
      url: `${$page.url.pathname}${$page.url.search}`,
      zoom: mapState.currentZoomLevel,
      tier: mapState.selectedTier,
      location: mapState.selectedLocationId,
    }
  }

  function placePortal(event: MouseEvent) {
    if (profile?.kind !== 'portal' || !(event.target as Element).closest('.map-canvas')) return
    event.preventDefault()
    event.stopPropagation()
    if (portalAnchors.length >= 2) portalAnchors = []
    portalAnchors = [...portalAnchors, currentPortalAnchor(event)]
    status =
      portalAnchors.length === 1
        ? 'Entrance placed · right-click the exit location'
        : 'Tunnel complete · both doors are now linked'
  }

  function portalIsVisible(anchor: PortalAnchor) {
    return (
      anchor.url === `${$page.url.pathname}${$page.url.search}` &&
      anchor.zoom === mapState.currentZoomLevel &&
      anchor.tier === mapState.selectedTier &&
      anchor.location === mapState.selectedLocationId
    )
  }

  async function crossPortal(index: number) {
    const destination = portalAnchors[index === 0 ? 1 : 0]
    if (!destination) {
      status = 'The second door has not been placed yet'
      return
    }
    const currentUrl = `${$page.url.pathname}${$page.url.search}`
    if (destination.url !== currentUrl) await goto(destination.url, { keepFocus: true })
    mapState.currentZoomLevel = destination.zoom
    mapState.selectedTier = destination.tier
    mapState.selectedLocationId = destination.location
    portalCrossings += 1
    if (portalCrossings >= 3) {
      document.body.classList.add('hatsu-portal-exhausted')
      status = `Crossing ${portalCrossings} complete · Fugetsu's aura is dangerously exhausted`
    } else status = `Crossed to ${destination.label} · ${portalCrossings}/3 safe uses this night`
  }

  async function forceTargetPerspective(target: HTMLElement) {
    const perspectiveId = target.dataset.hatsuPerspectiveId
    if (!perspectiveId) return
    const url = new URL($page.url)
    url.searchParams.set('perspective', perspectiveId)
    url.searchParams.set('follow', 'consciousness')
    await goto(url.toString(), { keepFocus: true })
  }

  function interactWithArrow(event: MouseEvent, eventElement: Element) {
    if (points.length >= 2) points = []
    if (points.length === 0) {
      if (!eventElement.closest('.map-canvas')) return true
      event.preventDefault()
      event.stopPropagation()
      addPoint(event.clientX, event.clientY, 'Materialized bow')
      status = 'Bow materialized · select a character'
      return true
    }

    const target = eventElement.closest<HTMLElement>('[data-hatsu-character]')
    if (!target) {
      status = 'The arrow requires a character target'
      return true
    }
    event.preventDefault()
    event.stopPropagation()
    const allies = Array.from(
      document.querySelectorAll<HTMLElement>('[data-hatsu-character]'),
    ).filter((candidate) => candidate !== target)
    const bearer = allies.length ? allies[sequence % allies.length] : null
    addPoint(event.clientX, event.clientY, targetLabel(target), {
      details: bearer ? [`Soul exchanged with ${targetLabel(bearer)}`] : [],
    })
    if (bearer) {
      moveByRects(bearer, target)
      remember(bearer).classList.add('hatsu-soul-transferred')
      remember(target).classList.add('hatsu-soul-transferred')
    }
    status = bearer
      ? `Invincible arrow · ${targetLabel(bearer)} and ${target.dataset.hatsuCharacterName || targetLabel(target)} exchanged souls`
      : `Arrow released · forced perspective: ${target.dataset.hatsuCharacterName || targetLabel(target)}`
    void forceTargetPerspective(target)
    return true
  }

  /**
   * What a technique may touch. The accessors matter: their setters assign to
   * this component's own bindings, so the mutation still happens here and
   * Svelte keeps seeing it. Handing the registry plain values instead would
   * leave the status line and the point trail frozen.
   */
  const interactionContext: HatsuInteractionContext = {
    get profile() {
      return profile as HatsuProfile
    },
    get page() {
      return $page
    },
    get m() {
      return hatsuStatusFor($locale)
    },
    get parallelFutureVisible() {
      return $parallelFutureVisible
    },

    get status() {
      return status
    },
    set status(value) {
      status = value
    },
    get points() {
      return points
    },
    set points(value) {
      points = value
    },
    get sequence() {
      return sequence
    },
    set sequence(value) {
      sequence = value
    },
    get cardIndex() {
      return cardIndex
    },
    set cardIndex(value) {
      cardIndex = value
    },
    get selectedElements() {
      return selectedElements
    },
    set selectedElements(value) {
      selectedElements = value
    },
    get floatingCards() {
      return floatingCards
    },
    set floatingCards(value) {
      floatingCards = value
    },
    get prophecyLines() {
      return prophecyLines
    },
    set prophecyLines(value) {
      prophecyLines = value
    },
    get stolenTarget() {
      return stolenTarget
    },
    set stolenTarget(value) {
      stolenTarget = value
    },
    get puppetTarget() {
      return puppetTarget
    },
    set puppetTarget(value) {
      puppetTarget = value
    },
    get puppetExecuting() {
      return puppetExecuting
    },
    set puppetExecuting(value) {
      puppetExecuting = value
    },
    get sensesStage() {
      return sensesStage
    },
    set sensesStage(value) {
      sensesStage = value
    },
    get windupPower() {
      return windupPower
    },
    set windupPower(value) {
      windupPower = value
    },
    get infectionLevel() {
      return infectionLevel
    },
    set infectionLevel(value) {
      infectionLevel = value
    },
    get studyTarget() {
      return studyTarget
    },
    set studyTarget(value) {
      studyTarget = value
    },
    get studyCount() {
      return studyCount
    },
    set studyCount(value) {
      studyCount = value
    },
    get trainingTarget() {
      return trainingTarget
    },
    set trainingTarget(value) {
      trainingTarget = value
    },
    get trainingOrigin() {
      return trainingOrigin
    },
    set trainingOrigin(value) {
      trainingOrigin = value
    },
    get observerReports() {
      return observerReports
    },
    set observerReports(value) {
      observerReports = value
    },
    get birdDispatches() {
      return birdDispatches
    },
    set birdDispatches(value) {
      birdDispatches = value
    },
    get capturedTechniques() {
      return capturedTechniques
    },
    set capturedTechniques(value) {
      capturedTechniques = value
    },
    get dowsingSignal() {
      return dowsingSignal
    },
    set dowsingSignal(value) {
      dowsingSignal = value
    },
    get crossGameTarget() {
      return crossGameTarget
    },
    set crossGameTarget(value) {
      crossGameTarget = value
    },
    get guideTitle() {
      return guideTitle
    },
    set guideTitle(value) {
      guideTitle = value
    },
    get guideItems() {
      return guideItems
    },
    set guideItems(value) {
      guideItems = value
    },
    get dialBest() {
      return dialBest
    },
    set dialBest(value) {
      dialBest = value
    },

    get cursor() {
      return cursor
    },
    get storedItems() {
      return storedItems
    },
    get observers() {
      return observers
    },
    get tribunalCards() {
      return tribunalCards
    },

    remember,
    addPoint,
    targetLabel,
    applyTransform,
    guideItemFor,
    executeSiteTarget,
    schedule,
    storeElement,
    profilesFromTarget,
    moveByRects,
    followGuide,
  }

  /**
   * One entry per kind in `HATSU_INTERACTION_BY_KIND`, which replaced the
   * seventy-five branch `else if` chain this function used to be. Kinds absent
   * from the table are the ones handled by the dedicated functions above.
   */
  function extendedInteraction(
    event: MouseEvent,
    target: HTMLElement,
    x: number,
    y: number,
    label: string,
  ) {
    if (!profile) return false
    return runHatsuInteraction(interactionContext, { event, target, x, y, label })
  }

  function interact(event: MouseEvent) {
    const eventElement = event.target as Element
    if (puppetExecuting) return
    if (!profile || eventElement.closest('[data-hatsu-ui], [data-hatsu-pass]')) return
    if (profile.kind === 'elastic' && bungeeFilterActive) return
    if (profile.kind === 'guardian') {
      recordGuardianEvent(event, eventElement)
      return
    }
    if (profile.kind === 'capture' && interactWithCuldcept(event, eventElement)) return
    if (profile.kind === 'arrow' && interactWithArrow(event, eventElement)) return
    const requiresCharacter = [
      'elastic',
      'chain-rule',
      'chain-bind',
      'control',
      'surveillance',
      'curse',
      'inherit',
      'ability-loan',
    ].includes(profile.kind)
    const target = requiresCharacter
      ? eventElement.closest<HTMLElement>('[data-hatsu-character]')
      : eventElement.closest<HTMLElement>(
          'a, button, article, section, li, [role="button"], h1, h2, h3, p',
        )
    if (!target) {
      // Character-bound techniques only have targets on the ship map. Saying so
      // beats swallowing the click with no explanation.
      if (requiresCharacter)
        status = `${profile.name} needs a Nen user · open the ship map and click a character marker`
      return
    }
    // Navigation remains usable while a Hatsu is active. Ordinary page
    // targets are captured by the technique instead of firing their action.
    if (!target.closest('nav')) {
      event.preventDefault()
      event.stopPropagation()
    }
    const rect = target.getBoundingClientRect()
    const x = Math.max(rect.left, Math.min(event.clientX, rect.right))
    const y = Math.max(rect.top, Math.min(event.clientY, rect.bottom))
    const label = targetLabel(target)

    if (extendedInteraction(event, target, x, y, label)) return

    // Only the kinds `extendedInteraction` does not claim reach this point.
    if (profile.kind === 'elastic') {
      selectBungeeCharacter(target, x, y, label)
      return
    } else if (profile.kind === 'inherit') {
      const characterId = target.dataset.hatsuCharacter
      if (!characterId || inheritedCharacters.has(characterId) || inheritedCharacters.size >= 4)
        return
      const name = target.dataset.hatsuCharacterName || label
      const eligible =
        /vincent|musse|shikaku|balsamilco|benjamin.*soldier/i.test(`${characterId} ${name}`) ||
        target.dataset.hatsuNextChange === 'dead'
      if (!eligible) {
        status = `${name} rejected · Benjamin Baton requires a deceased loyal Military Academy graduate`
        addPoint(x, y, 'INELIGIBLE', { alert: true })
        return
      }
      inheritedCharacters.add(characterId)
      const inherited = profilesFromTarget(target)
      for (const technique of inherited) {
        if (!capturedTechniques.some((candidate) => candidate.id === technique.id))
          capturedTechniques = [...capturedTechniques, technique]
      }
      addPoint(x, y, label, { details: inherited.map((technique) => technique.name) })
      remember(target).classList.add('hatsu-baton-inherited')
      status = `${inheritedCharacters.size}/4 loyal abilities inherited · palm star awakened`
      return
    }

    status = `${profile.action} · ${label || 'target acquired'}`
    addPoint(x, y, label)
  }

  onMount(() => {
    const move = (event: PointerEvent) => {
      cursor = { x: event.clientX, y: event.clientY }
      if (profile?.kind === 'dowsing' && points.length === 0) {
        const nearby = document
          .elementFromPoint(event.clientX, event.clientY)
          ?.closest<HTMLElement>('a,button,article,section,[role="button"]')
        if (nearby && !nearby.closest('[data-hatsu-ui]')) {
          const rect = nearby.getBoundingClientRect()
          const distance = Math.hypot(
            event.clientX - (rect.left + rect.width / 2),
            event.clientY - (rect.top + rect.height / 2),
          )
          dowsingSignal = Math.max(0, Math.round(100 - distance / 3))
          status = `Pendulum tracking ${targetLabel(nearby)} · signal ${dowsingSignal}%`
        }
      }
      if (profile?.kind === 'scout' && points.length === 0) {
        const auras = document
          .elementsFromPoint(event.clientX, event.clientY)
          .filter((element) => element.closest('[data-hatsu-character]')).length
        status = `Little Eye remote feed · ${auras} aura signature${auras === 1 ? '' : 's'} under cursor`
      }
      if (profile?.kind === 'needle' || profile?.kind === 'animate') {
        selectedElements.forEach((element, index) => {
          if (!element.isConnected) return
          const rect = element.getBoundingClientRect()
          const strength = profile.kind === 'needle' ? 0.22 : 0.08
          applyTransform(
            element,
            `translate(${(event.clientX - rect.left) * strength}px, ${(event.clientY - rect.top) * strength + index * 3}px)`,
          )
        })
      }
      if (profile?.kind === 'training-shot' && trainingTarget) {
        const distance = Math.hypot(
          event.clientX - trainingOrigin.x,
          event.clientY - trainingOrigin.y,
        )
        if (distance > 12) {
          trainingTarget.classList.add('hatsu-zetsu-broken')
          trainingTarget.style.pointerEvents = 'auto'
          trainingTarget = null
          status = 'Aura leaked · Zetsu broken before impact, so the sealed site action escaped'
        }
      }
      captureStyleWrites()
    }
    const click = (event: MouseEvent) => {
      interact(event)
      captureStyleWrites()
    }
    const timer = window.setInterval(() => {
      if (!profile) return
      seconds += 1
      if (profile.kind === 'scarlet') consumeEmperorTimeHour()
    }, 1000)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('click', click, true)
    window.addEventListener('contextmenu', placePortal, true)
    return () => {
      clearInterval(timer)
      cleanupTechniqueState()
      siteSnapshot = null
      window.removeEventListener('pointermove', move)
      window.removeEventListener('click', click, true)
      window.removeEventListener('contextmenu', placePortal, true)
    }
  })

  $: anchor = points.length ? points[points.length - 1] : null
  $: chainPairs = points.slice(1).map((point, index) => ({ from: points[index], to: point }))
</script>

{#if profile}
  <div
    class="world-effect kind-{profile.kind}"
    style:--hatsu={profile.color}
    data-hatsu-ui
    data-hatsu-impact={siteImpactFor(profile)}
    aria-hidden={[
      'guardian',
      'portal',
      'scout',
      'clone',
      'theft',
      'pocket',
      'spatial',
      'vacuum',
      'flock',
      'chain-rule',
      'capture',
      'inherit',
      'poetry',
      'rhythm',
      'melody',
      'divination',
      'prophecy',
      'projection',
      'relay',
      'ability-loan',
      'truth-punch',
      'blood-search',
      'door-network',
      'aura-levy',
      'diffusive-smoke',
    ].includes(profile.kind)
      ? undefined
      : 'true'}
  >
    <div class="atmosphere"></div>
    {#if visualSignature}
      <div class="visual-signature form-{visualSignature.form} motion-{visualSignature.motion}">
        <div class="signature-manifestation">
          {#if profile.kind === 'arrow'}
            <svg class="signature-arrow" viewBox="0 0 160 72" aria-hidden="true">
              <path class="bow" d="M36 8 Q72 36 36 64 M36 8 L36 64"></path>
              <path class="shaft" d="M27 36 H139 M139 36 L126 28 M139 36 L126 44"></path>
              <path class="fletching" d="M46 36 L33 28 M46 36 L33 44"></path>
            </svg>
          {:else if profile.kind === 'ability-loan'}
            <svg class="signature-dolphin" viewBox="0 0 160 72" aria-hidden="true">
              <path
                d="M23 43 C39 16 82 10 113 27 C126 20 139 20 148 25 C139 31 136 38 144 46 C133 47 123 43 116 38 C96 57 59 62 30 49 C24 54 17 56 10 54 C17 49 20 46 23 43 Z"
              ></path>
              <path d="M71 20 C76 9 87 6 98 8 C91 14 87 20 86 25 Z"></path>
              <path d="M72 55 C80 65 91 68 101 64 C94 57 91 53 90 48 Z"></path>
              <circle cx="111" cy="28" r="2.5"></circle>
            </svg>
          {:else}
            <b>{visualSignature.glyph}</b>
          {/if}
        </div>
        <span>{visualSignature.manifestation}</span>
        <i>{visualSignature.form}</i>
      </div>
    {/if}
    {#if profile.kind === 'future'}
      <div class="future-frame">
        <span>{$t.nen.parallelFuture}</span><strong
          >{$parallelFutureVisible ? `${Math.max(0, 10 - seconds)} s` : $t.nen.ended}</strong
        >
      </div>
    {/if}
    {#if profile.kind === 'guardian'}
      <button
        class="guardian"
        type="button"
        onclick={replayGuardianEvents}
        aria-label={$t.nen.replayLastEvents}
        ><span>♙</span><small>{$t.nen.guardianLabel}</small></button
      >
      {#if guardianReplayPoint}<div
          class="guardian-replay"
          style:left={`${guardianReplayPoint.x}px`}
          style:top={`${guardianReplayPoint.y}px`}
        >
          <span>↻</span><small>{guardianReplayPoint.label}</small>
        </div>{/if}
    {/if}
    {#if profile.kind === 'portal'}
      {#each portalAnchors as portal, index (index)}
        {#if portalIsVisible(portal)}
          <button
            class="portal-door"
            type="button"
            style:left={`${portal.x}px`}
            style:top={`${portal.y}px`}
            onclick={() => crossPortal(index)}
            ><span>{index === 0 ? $t.nen.portalStart : $t.nen.portalReturn}</span><small
              >{index === 0 ? $t.nen.enterTunnel : $t.nen.crossBack}</small
            ></button
          >
        {/if}
      {/each}
    {/if}
    {#if profile.kind === 'scout' || profile.kind === 'dowsing'}
      <div class="scout" style:left={`${cursor.x}px`} style:top={`${cursor.y}px`}>
        <span>{profile.kind === 'scout' ? '◉' : '◇'}</span><i></i>
      </div>
    {/if}
    {#if anchor && ['elastic', 'chain-rule', 'chain-bind', 'control', 'arrow', 'stitch'].includes(profile.kind)}
      <svg class="connections">
        {#each chainPairs as pair (pair.to.id)}
          <line x1={pair.from.x} y1={pair.from.y} x2={pair.to.x} y2={pair.to.y}></line>
        {/each}
        {#if (profile.kind !== 'arrow' || points.length < 2) && (profile.kind !== 'elastic' || !bungeeFilterActive)}<line
            class="live"
            x1={anchor.x}
            y1={anchor.y}
            x2={cursor.x}
            y2={cursor.y}
          ></line>{/if}
      </svg>
    {/if}
    {#each points as point, i (point.id)}
      <div
        class="impact"
        class:paired={i % 2 === 1}
        class:alert={point.alert}
        style:left={`${point.x}px`}
        style:top={`${point.y}px`}
      >
        <span>{visualSignature?.glyph || '×'}</span>
        <small>{point.label}</small>
      </div>
    {/each}
    {#if captureZone}
      <div
        class="capture-zone"
        style:left={`${captureZone.left}px`}
        style:top={`${captureZone.top}px`}
        style:width={`${captureZone.width}px`}
        style:height={`${captureZone.height}px`}
      >
        <span>{$t.nen.culdceptAcquiring}</span>
      </div>
    {/if}
    {#if profile.kind === 'resurrection' && points.length}
      <div class="cat">CAT<br /><b>POST-MORTEM</b></div>
    {/if}
    {#if stolenTarget}
      <button class="stolen-control" type="button" onclick={useStolenControl}
        ><span>{$t.nen.skillHunter}</span><strong>{targetLabel(stolenTarget)}</strong><small
          >{$t.nen.useStolenControl}</small
        ></button
      >
    {/if}
    {#if storedItems.length}
      <div class="storage-tray">
        <span
          >{profile.kind === 'pocket'
            ? $t.nen.trays.pocket
            : profile.kind === 'vacuum'
              ? $t.nen.trays.vacuum
              : profile.kind === 'relay'
                ? $t.nen.trays.relay
                : $t.nen.trays.hidden}</span
        >
        {#each storedItems as item (item.id)}<button
            type="button"
            onclick={() => restoreStored(item)}>{item.label}</button
          >{/each}
      </div>
    {/if}
    {#each floatingCards as card (card.id)}
      <div class="floating-card {card.kind}" style:left={`${card.x}px`} style:top={`${card.y}px`}>
        <span>{$t.nen.astralDouble}</span><strong>{card.label}</strong><small
          >{$t.nen.bodyRemains}</small
        >{#if card.href}<a href={card.href}>{$t.nen.followAsDouble}</a>{/if}
      </div>
    {/each}
    {#if prophecyLines.length}
      <div class="prophecy">
        <span>LOVELY GHOSTWRITER</span>{#each prophecyLines as line, lineIndex (lineIndex)}<p>
            {line}
          </p>{/each}
      </div>
    {/if}
    {#if observerReports.length}
      <div class="observer-reports">
        <span>PAPER SURVEILLANCE</span>{#each observerReports as report (report.label)}<p>
            <b>{report.count}</b>{report.label}
          </p>{/each}
      </div>
    {/if}
    {#if birdDispatches.length}
      <div class="bird-dispatches">
        <span>CLUCK · DELIVERY FLOCK</span
        >{#each birdDispatches as dispatch, dispatchIndex (dispatchIndex)}{#if dispatch.href}<a
              href={dispatch.href}>◁ {dispatch.label}</a
            >{:else}<p>◁ {dispatch.label}</p>{/if}{/each}
      </div>
    {/if}
    {#if guideTitle && guideItems.length}
      <div class="site-guide">
        <span>{guideTitle}</span>{#each guideItems as item (item.id)}{#if item.href}<a
              href={item.href}>{item.label} →</a
            >{:else}<button type="button" onclick={() => followGuide(item)}>{item.label} →</button
            >{/if}{/each}
      </div>
    {/if}
    {#if capturedTechniques.length}
      <div class="captured-techniques">
        <span
          >{profile.kind === 'inherit'
            ? $t.nen.captured.inherit
            : profile.kind === 'capture'
              ? $t.nen.captured.capture
              : profile.kind === 'ability-loan'
                ? $t.nen.captured.abilityLoan
                : $t.nen.captured.steal}</span
        >{#each localizeHatsuList(capturedTechniques, $locale) as technique (technique.id)}<button
            type="button"
            onclick={() => activateHatsu(technique)}
            style:--captured={technique.color}
            ><b>{technique.name}</b><small>{$t.nen.activateCaptured}</small></button
          >{/each}
      </div>
    {/if}
    <div class="readout">
      <span>{profile.name}</span>
      <strong>{status}</strong>
      <small>{profile.rule}</small>
      {#if profile.kind === 'scarlet'}<em>{$t.nen.lifeConsumed($emperorTimeLifeHours)}</em>{/if}
      {#if profile.kind === 'inherit' && points.length}
        <div class="inherit-results">
          {#each points as point, pointIndex (pointIndex)}
            <div>
              <b>★ {point.label}</b><span
                >{point.details?.length ? point.details.join(' · ') : $t.nen.noKnownHatsu}</span
              >
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .world-effect {
    position: fixed;
    z-index: 80;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }
  .atmosphere {
    position: absolute;
    inset: 0;
    border: 1px solid color-mix(in srgb, var(--hatsu) 38%, transparent);
    background: radial-gradient(
      500px circle at var(--mx, 50%) var(--my, 50%),
      color-mix(in srgb, var(--hatsu) 5%, transparent),
      transparent 70%
    );
    box-shadow: inset 0 0 80px color-mix(in srgb, var(--hatsu) 4%, transparent);
  }
  .visual-signature {
    position: absolute;
    bottom: 1rem;
    left: 1rem;
    display: grid;
    width: 11rem;
    grid-template-columns: 3.5rem 1fr;
    grid-template-rows: auto auto;
    align-items: center;
    border: 1px solid color-mix(in srgb, var(--hatsu) 42%, transparent);
    border-radius: 0.45rem;
    background: linear-gradient(115deg, color-mix(in srgb, var(--hatsu) 11%, #071019e8), #071019a8);
    padding: 0.55rem 0.7rem;
    color: var(--hatsu);
    box-shadow:
      0 12px 32px #0008,
      inset 0 0 22px color-mix(in srgb, var(--hatsu) 7%, transparent);
    transform-origin: 1.75rem 50%;
    backdrop-filter: blur(8px);
  }
  .signature-manifestation {
    position: relative;
    display: grid;
    width: 3rem;
    height: 3rem;
    grid-row: 1/3;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--hatsu) 58%, transparent);
    border-radius: 50%;
    background: radial-gradient(circle, color-mix(in srgb, var(--hatsu) 18%, #071019), #071019 70%);
    box-shadow: 0 0 18px color-mix(in srgb, var(--hatsu) 24%, transparent);
  }
  .signature-manifestation::before,
  .signature-manifestation::after {
    content: '';
    position: absolute;
    inset: -0.28rem;
    border: 1px dashed color-mix(in srgb, var(--hatsu) 35%, transparent);
    border-radius: inherit;
  }
  .signature-manifestation::after {
    inset: 0.25rem;
    border-style: solid;
    opacity: 0.35;
  }
  .signature-manifestation b {
    position: relative;
    z-index: 1;
    font: 700 1.15rem/1 var(--font-mono, monospace);
    text-shadow: 0 0 12px var(--hatsu);
  }
  .visual-signature > span {
    overflow: hidden;
    color: #eef3ef;
    font:
      600 0.58rem/1.2 'IBM Plex Sans Condensed',
      sans-serif;
    letter-spacing: 0.04em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .visual-signature > i {
    margin-top: 0.25rem;
    color: color-mix(in srgb, var(--hatsu) 75%, #849096);
    font: normal 700 0.42rem/1 monospace;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .form-chain .signature-manifestation {
    border-radius: 45% 45% 50% 50%;
    box-shadow:
      inset 0 0 0 4px #071019,
      0 0 18px var(--hatsu);
  }
  .form-beast .signature-manifestation {
    border-radius: 55% 45% 62% 38%;
  }
  .form-weapon .signature-manifestation {
    border-radius: 0.2rem;
    transform: rotate(-4deg);
  }
  .form-field .signature-manifestation {
    border-style: double;
    border-radius: 0.15rem;
  }
  .form-mark .signature-manifestation {
    border-width: 2px;
    background: transparent;
  }
  .form-construct .signature-manifestation {
    border-radius: 0.25rem;
  }
  .form-organic .signature-manifestation {
    border-radius: 60% 30% 55% 40%;
  }
  .signature-arrow,
  .signature-dolphin {
    position: relative;
    z-index: 1;
    width: 4.8rem;
    overflow: visible;
    filter: drop-shadow(0 0 5px var(--hatsu));
  }
  .signature-arrow path {
    fill: none;
    stroke: var(--hatsu);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .signature-arrow .shaft {
    animation: signature-arrow-flight 1.25s ease-in-out infinite;
  }
  .signature-arrow .fletching {
    animation: signature-arrow-flight 1.25s ease-in-out infinite;
  }
  .signature-dolphin path {
    fill: color-mix(in srgb, var(--hatsu) 18%, #071019);
    stroke: var(--hatsu);
    stroke-width: 1.6;
    stroke-linejoin: round;
  }
  .signature-dolphin circle {
    fill: #f3ffff;
    filter: drop-shadow(0 0 4px #fff);
  }
  .motion-pulse {
    animation: signature-pulse 1.6s ease-in-out infinite;
  }
  .motion-orbit .signature-manifestation::before {
    animation: signature-orbit 4s linear infinite;
  }
  .motion-strike {
    animation: signature-strike 1.5s ease-in-out infinite;
  }
  .motion-drift {
    animation: signature-drift 3s ease-in-out infinite;
  }
  .motion-coil .signature-manifestation::before {
    animation: signature-coil 1.8s ease-in-out infinite;
  }
  .motion-bloom .signature-manifestation {
    animation: signature-bloom 2.2s ease-in-out infinite;
  }
  .motion-scan .signature-manifestation::after {
    animation: signature-scan 1.7s ease-out infinite;
  }
  .motion-flicker {
    animation: signature-flicker 2.4s steps(1, end) infinite;
  }
  .kind-scarlet .atmosphere {
    background: radial-gradient(circle at 50% 10%, #e6193030, transparent 45%);
    box-shadow: inset 0 0 120px #e6193020;
    animation: scarlet 2.2s ease-in-out infinite;
  }
  .kind-disguise .atmosphere {
    backdrop-filter: contrast(0.88) sepia(0.12);
    background: repeating-linear-gradient(
      115deg,
      transparent 0 9px,
      color-mix(in srgb, var(--hatsu) 2%, transparent) 10px 11px
    );
  }
  .kind-enhance .atmosphere,
  .kind-blast .atmosphere {
    animation: power 1.1s ease-in-out infinite;
  }
  .kind-guardian .atmosphere {
    background: linear-gradient(
      90deg,
      transparent 0 48%,
      color-mix(in srgb, var(--hatsu) 5%, transparent) 50%,
      transparent 52%
    );
  }
  .connections {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .connections line {
    stroke: var(--hatsu);
    stroke-width: 2;
    filter: drop-shadow(0 0 5px var(--hatsu));
    stroke-dasharray: 4 3;
  }
  .kind-elastic .connections line {
    stroke-width: 3;
    stroke-dasharray: none;
    animation: elastic 0.7s ease-in-out infinite alternate;
  }
  :global(body.bungee-gum-filtered [data-hatsu-character]:not([data-bungee-selected='true'])) {
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }
  :global([data-hatsu-character][data-bungee-selected='true']) {
    z-index: 21 !important;
    filter: drop-shadow(0 0 8px var(--hatsu, #f06bb5)) !important;
  }
  .connections .live {
    opacity: 0.65;
    stroke-dasharray: 2 5;
  }
  .impact {
    position: absolute;
    display: grid;
    width: 2.3rem;
    height: 2.3rem;
    place-items: center;
    transform: translate(-50%, -50%);
    border: 1px solid var(--hatsu);
    border-radius: 50%;
    background: color-mix(in srgb, var(--hatsu) 14%, #071019);
    color: var(--hatsu);
    box-shadow:
      0 0 0 5px color-mix(in srgb, var(--hatsu) 7%, transparent),
      0 0 22px color-mix(in srgb, var(--hatsu) 38%, transparent);
    animation: arrive 0.35s ease-out;
  }
  .impact small {
    position: absolute;
    top: 2.6rem;
    width: 8rem;
    overflow: hidden;
    color: #d9dfdc;
    font: 500 0.52rem/1.2 'IBM Plex Sans Condensed';
    text-align: center;
    text-overflow: ellipsis;
    text-shadow: 0 1px 4px #000;
    white-space: nowrap;
  }
  .kind-growth .impact {
    border-radius: 45% 0 45% 0;
    font-size: 1.4rem;
    animation: grow 1.6s ease-out both;
  }
  .kind-portal .impact {
    width: 4rem;
    height: 6rem;
    border-width: 2px;
    border-radius: 50%;
    font: 700 0.5rem/1 monospace;
    animation: portal 2s linear infinite;
  }
  .kind-surveillance .impact {
    animation: owl 2s ease-in-out infinite;
  }
  .kind-surveillance .impact.alert {
    border-width: 3px;
    background: #fff2b8;
    color: #1b1400;
    box-shadow:
      0 0 10px #fff,
      0 0 35px #ffd45c,
      0 0 70px #ff9f43;
    animation: owl-alert 0.65s ease-in-out infinite alternate;
  }
  .kind-curse .impact {
    border-style: dashed;
    animation: curse 5s linear infinite;
  }
  .kind-capture .impact {
    width: 3.3rem;
    height: 4.6rem;
    border-radius: 0.3rem;
  }
  .capture-zone {
    position: absolute;
    border: 2px solid var(--hatsu);
    background: repeating-linear-gradient(
      135deg,
      color-mix(in srgb, var(--hatsu) 18%, transparent) 0 8px,
      #08071388 8px 16px
    );
    box-shadow:
      inset 0 0 35px color-mix(in srgb, var(--hatsu) 30%, transparent),
      0 0 20px color-mix(in srgb, var(--hatsu) 35%, transparent);
  }
  .capture-zone span {
    position: absolute;
    top: 0.3rem;
    left: 0.4rem;
    color: #e7ddff;
    font: 700 0.5rem/1 monospace;
    letter-spacing: 0.08em;
  }
  .kind-blast .impact {
    animation: blast 0.8s ease-out both;
  }
  .kind-arrow .impact:last-of-type {
    animation: blast 1.1s ease-out both;
  }
  .readout {
    position: absolute;
    top: 4.2rem;
    left: 1rem;
    display: flex;
    width: min(23rem, calc(100vw - 2rem));
    flex-direction: column;
    border-left: 2px solid var(--hatsu);
    background: linear-gradient(90deg, #071019e8, #07101955, transparent);
    padding: 0.55rem 0.75rem;
    text-shadow: 0 1px 3px #000;
  }
  .readout > span {
    color: var(--hatsu);
    font: 600 0.56rem/1 'IBM Plex Sans Condensed';
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .readout strong {
    margin-top: 0.25rem;
    color: #f3f4ee;
    font-size: 0.75rem;
  }
  .readout small {
    margin-top: 0.18rem;
    color: #8f9b9c;
    font-size: 0.58rem;
    line-height: 1.25;
  }
  .readout em {
    margin-top: 0.4rem;
    color: #ff6672;
    font: normal 700 0.62rem/1 monospace;
  }
  .inherit-results {
    display: grid;
    margin-top: 0.55rem;
    gap: 0.3rem;
  }
  .inherit-results div {
    display: flex;
    flex-direction: column;
    border-left: 1px solid var(--hatsu);
    padding-left: 0.45rem;
  }
  .inherit-results b {
    color: #f5e8ac;
    font-size: 0.6rem;
  }
  .inherit-results span {
    margin-top: 0.08rem;
    color: #a9b2ad;
    font-size: 0.55rem;
    line-height: 1.3;
  }
  .future-frame {
    position: absolute;
    top: 4rem;
    right: 1rem;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    color: var(--hatsu);
    font: 0.6rem monospace;
  }
  .future-frame strong {
    font-size: 1.6rem;
    text-shadow: 0 0 15px var(--hatsu);
  }
  .future-ghost {
    position: absolute;
    width: 1rem;
    height: 1rem;
    transform: translate(-50%, -50%);
    border: 1px solid var(--hatsu);
    border-radius: 50%;
    opacity: 0.45;
  }
  .scout {
    position: absolute;
    width: 1.8rem;
    height: 1.8rem;
    transform: translate(-50%, -50%);
    border: 1px solid var(--hatsu);
    border-radius: 50%;
    color: var(--hatsu);
    text-align: center;
    line-height: 1.65rem;
    box-shadow: 0 0 15px var(--hatsu);
  }
  .scout i {
    position: absolute;
    inset: -3rem;
    border: 1px dashed color-mix(in srgb, var(--hatsu) 40%, transparent);
    border-radius: 50%;
  }
  .guardian {
    position: absolute;
    right: 4%;
    bottom: 6rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border: 0;
    background: transparent;
    color: var(--hatsu);
    opacity: 0.55;
    cursor: pointer;
    pointer-events: auto;
    transition:
      opacity 0.2s,
      transform 0.2s;
  }
  .guardian:hover,
  .guardian:focus-visible {
    opacity: 1;
    transform: translateY(-4px);
  }
  .guardian span {
    font-size: 5rem;
    filter: drop-shadow(0 0 15px var(--hatsu));
  }
  .guardian small {
    writing-mode: vertical-rl;
    font: 0.5rem monospace;
    letter-spacing: 0.1em;
  }
  .guardian-replay {
    position: absolute;
    display: grid;
    width: 3rem;
    height: 3rem;
    place-items: center;
    transform: translate(-50%, -50%);
    border: 2px solid var(--hatsu);
    border-radius: 50%;
    background: color-mix(in srgb, var(--hatsu) 18%, #071019);
    color: var(--hatsu);
    box-shadow: 0 0 28px var(--hatsu);
    animation: replay-event 0.7s ease-out;
  }
  .guardian-replay span {
    font-size: 1.25rem;
  }
  .guardian-replay small {
    position: absolute;
    top: 3.3rem;
    width: 10rem;
    color: #f1e7ec;
    font: 0.55rem/1.2 monospace;
    text-align: center;
  }
  .portal-door {
    position: absolute;
    display: flex;
    width: 4.4rem;
    height: 6.5rem;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transform: translate(-50%, -50%);
    border: 2px solid var(--hatsu);
    border-radius: 50%;
    background: radial-gradient(circle, color-mix(in srgb, var(--hatsu) 28%, #06110e), #06110edd);
    color: var(--hatsu);
    box-shadow:
      0 0 22px color-mix(in srgb, var(--hatsu) 65%, transparent),
      inset 0 0 22px color-mix(in srgb, var(--hatsu) 30%, transparent);
    cursor: pointer;
    pointer-events: auto;
    animation: portal 2s linear infinite;
  }
  .portal-door span {
    font: 700 0.55rem/1 monospace;
    letter-spacing: 0.08em;
  }
  .portal-door small {
    margin-top: 0.35rem;
    color: #d5f7e9;
    font: 0.48rem/1.1 monospace;
  }
  .cat {
    position: absolute;
    top: 50%;
    left: 50%;
    display: grid;
    width: 14rem;
    height: 14rem;
    place-items: center;
    transform: translate(-50%, -50%);
    border: 2px solid var(--hatsu);
    border-radius: 50% 50% 44% 44%;
    background: radial-gradient(
      circle,
      color-mix(in srgb, var(--hatsu) 20%, #071019),
      transparent 70%
    );
    color: var(--hatsu);
    font: 700 1rem/1.1 monospace;
    text-align: center;
    filter: drop-shadow(0 0 35px var(--hatsu));
    animation: cat 0.7s ease-out;
  }
  .cat b {
    font-size: 0.55rem;
  }
  .stolen-control,
  .storage-tray,
  .floating-card,
  .prophecy,
  .observer-reports,
  .bird-dispatches,
  .captured-techniques,
  .site-guide {
    position: fixed;
    pointer-events: auto;
    border: 1px solid color-mix(in srgb, var(--hatsu) 55%, #243443);
    background: #08131bec;
    color: #eef1ec;
    box-shadow:
      0 18px 50px #000b,
      0 0 25px color-mix(in srgb, var(--hatsu) 12%, transparent);
    backdrop-filter: blur(12px);
  }
  .stolen-control {
    right: 1rem;
    bottom: 6.5rem;
    display: grid;
    width: 13rem;
    gap: 0.25rem;
    padding: 0.8rem;
    border-radius: 0.5rem;
    text-align: left;
    cursor: pointer;
  }
  .stolen-control span,
  .storage-tray > span,
  .floating-card span,
  .prophecy > span,
  .observer-reports > span {
    color: var(--hatsu);
    font: 700 0.48rem/1 monospace;
    letter-spacing: 0.1em;
  }
  .stolen-control strong {
    font-size: 0.72rem;
  }
  .stolen-control small,
  .floating-card small {
    color: #829094;
    font-size: 0.52rem;
  }
  .storage-tray {
    right: 1rem;
    bottom: 6.5rem;
    display: grid;
    width: min(17rem, calc(100vw - 2rem));
    gap: 0.35rem;
    padding: 0.7rem;
    border-radius: 0.55rem;
  }
  .storage-tray button {
    overflow: hidden;
    border: 1px solid #2c3b45;
    border-radius: 0.3rem;
    background: #101d25;
    padding: 0.45rem;
    color: #d9dfdc;
    font-size: 0.58rem;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
  }
  .storage-tray button:hover {
    border-color: var(--hatsu);
  }
  .floating-card {
    display: grid;
    width: 15rem;
    gap: 0.3rem;
    padding: 1rem;
    border-radius: 0.5rem;
    transform: rotate(-1deg);
    animation: arrive 0.4s ease-out;
  }
  .floating-card.projection {
    border-style: dashed;
    background: #08131bc7;
  }
  .floating-card strong {
    overflow: hidden;
    font-size: 0.75rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .floating-card a {
    margin-top: 0.35rem;
    color: var(--hatsu);
    font-size: 0.58rem;
    text-decoration: none;
  }
  .prophecy {
    right: 1rem;
    top: 7rem;
    width: min(23rem, calc(100vw - 2rem));
    padding: 1rem;
    border-radius: 0.3rem;
    background: linear-gradient(145deg, #171020ed, #080d13f2);
  }
  .prophecy p {
    margin: 0.55rem 0 0;
    color: #d5c9df;
    font:
      italic 0.67rem/1.45 Georgia,
      serif;
  }
  .observer-reports {
    right: 1rem;
    top: 7rem;
    display: grid;
    width: 16rem;
    gap: 0.35rem;
    padding: 0.8rem;
  }
  .observer-reports p {
    display: grid;
    grid-template-columns: 2rem 1fr;
    margin: 0;
    color: #aeb8b8;
    font-size: 0.58rem;
  }
  .observer-reports b {
    color: var(--hatsu);
    font-size: 0.8rem;
  }
  .bird-dispatches {
    right: 1rem;
    top: 7rem;
    display: grid;
    width: min(18rem, calc(100vw - 2rem));
    gap: 0.3rem;
    padding: 0.8rem;
    border-radius: 0.6rem;
  }
  .bird-dispatches > span {
    color: var(--hatsu);
    font: 700 0.48rem/1 monospace;
    letter-spacing: 0.1em;
  }
  .bird-dispatches :is(a, p) {
    margin: 0;
    padding: 0.4rem;
    border-top: 1px solid #273744;
    color: #dce7ec;
    font-size: 0.58rem;
    text-decoration: none;
  }
  .bird-dispatches a:hover {
    color: var(--hatsu);
  }
  .site-guide {
    right: 1rem;
    top: 7rem;
    display: grid;
    width: min(19rem, calc(100vw - 2rem));
    max-height: 42vh;
    overflow: auto;
    gap: 0.3rem;
    padding: 0.8rem;
    border-radius: 0.55rem;
  }
  .site-guide > span {
    color: var(--hatsu);
    font: 700 0.48rem/1.3 monospace;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .site-guide :is(a, button) {
    border: 1px solid #293a45;
    border-radius: 0.3rem;
    background: #101d25;
    padding: 0.48rem;
    color: #dce7ec;
    font-size: 0.58rem;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
  }
  .site-guide :is(a, button):hover {
    border-color: var(--hatsu);
    color: var(--hatsu);
  }
  .captured-techniques {
    right: 1rem;
    bottom: 6.5rem;
    display: grid;
    width: min(18rem, calc(100vw - 2rem));
    gap: 0.4rem;
    padding: 0.8rem;
    border-radius: 0.55rem;
  }
  .captured-techniques > span {
    color: var(--hatsu);
    font: 700 0.48rem/1 monospace;
    letter-spacing: 0.1em;
  }
  .captured-techniques button {
    display: grid;
    gap: 0.2rem;
    border: 1px solid color-mix(in srgb, var(--captured) 45%, #2b3945);
    border-radius: 0.35rem;
    background: color-mix(in srgb, var(--captured) 7%, #0d1922);
    padding: 0.55rem;
    color: #e9eee9;
    text-align: left;
    cursor: pointer;
  }
  .captured-techniques button:hover {
    border-color: var(--captured);
  }
  .captured-techniques b {
    font-size: 0.68rem;
  }
  .captured-techniques small {
    color: #899698;
    font-size: 0.5rem;
  }
  :global(.hatsu-texture-surprise) {
    position: relative !important;
    background: repeating-linear-gradient(
      calc(35deg + var(--texture-index) * 18deg),
      color-mix(in srgb, var(--hatsu, #d98fc4) 18%, #18222b) 0 8px,
      #25323a 9px 14px
    ) !important;
    color: transparent !important;
    text-shadow: none !important;
    box-shadow: inset 0 0 0 1px #d98fc488 !important;
  }
  :global(.hatsu-texture-surprise > *) {
    visibility: hidden !important;
  }
  :global(.hatsu-texture-surprise)::after {
    content: attr(data-hatsu-forgery);
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: #f2e9ef;
    font: 700 0.62rem/1.2 monospace;
    letter-spacing: 0.08em;
    pointer-events: none;
  }
  :global(.hatsu-full-efficiency) {
    outline: 1px solid #ef334088 !important;
    box-shadow: 0 0 24px #ef334022 !important;
  }
  :global(.hatsu-aura-drained) {
    filter: grayscale(1) brightness(0.38) !important;
    box-shadow: inset 0 0 20px #d7dce244 !important;
  }
  :global(.hatsu-chain-jailed) {
    filter: grayscale(1) !important;
    box-shadow:
      0 0 0 3px #c9ced6,
      inset 0 0 25px #c9ced666 !important;
  }
  :global(.hatsu-invalid-chain-target) {
    animation: fatal-vow 0.8s ease-out !important;
  }
  :global(.hatsu-dowsing-found) {
    outline: 1px solid #8ecae6 !important;
  }
  :global(.hatsu-dowsing-alert) {
    outline: 2px dashed #ff9d7a !important;
    filter: contrast(1.2) !important;
  }
  :global(.hatsu-reinforced) {
    position: relative !important;
    box-shadow:
      inset 0 0 calc(8px * var(--reinforcement)) color-mix(in srgb, #f0b429 10%, transparent),
      0 0 0 calc(1px * var(--reinforcement)) #f0b42955 !important;
    transform: scale(calc(1 + var(--reinforcement) * 0.012)) !important;
  }
  :global(.hatsu-royal-controlled) {
    outline: 1px solid #70d6b288 !important;
  }
  :global(.hatsu-erigeron-grown) {
    transform-origin: center !important;
    transition:
      transform 0.45s,
      filter 0.45s !important;
  }
  :global(.hatsu-passenger) {
    box-shadow: inset 0 -2px #f2a65a !important;
  }
  :global(.hatsu-little-eye-host) {
    outline: 1px dashed #55c2ff !important;
    filter: saturate(1.2) !important;
  }
  :global(.hatsu-cross-blue) {
    outline: 2px solid #5ba8ff !important;
  }
  :global(.hatsu-cross-warning) {
    box-shadow: inset 0 0 0 3px #f0c94d !important;
  }
  :global(.hatsu-cross-restrained) {
    clip-path: inset(0 round 0.2rem) !important;
    filter: grayscale(0.65) !important;
  }
  :global(.hatsu-cross-expelled) {
    transition:
      transform 0.6s,
      opacity 0.5s !important;
  }
  :global(.hatsu-beyond-cursed) {
    box-shadow: inset 0 0 20px #9d65d033 !important;
  }
  :global(.hatsu-sacrifice-carrier) {
    outline: 1px dashed #9d65d0 !important;
  }
  :global(.hatsu-sacrifice-dead) {
    animation: sacrifice-death 0.8s forwards !important;
  }
  :global(.hatsu-curse-triggered) {
    animation: curse-trigger 1.4s forwards !important;
  }
  :global(.hatsu-air-blown) {
    filter: blur(0.3px) !important;
  }
  :global(.hatsu-secret-window) {
    box-shadow:
      0 0 0 2px #a8b7d8,
      0 0 25px #a8b7d844 !important;
  }
  :global(.hatsu-future-afterimage) {
    box-shadow:
      8px 0 #7dd3fc33,
      -8px 0 #b36bff33 !important;
  }
  :global(.hatsu-camilla-killer) {
    outline: 1px solid #ff8fab !important;
  }
  :global(.hatsu-cat-crushed) {
    animation: cat-crush 1s forwards !important;
  }
  :global(.hatsu-culdcept-drained) {
    filter: grayscale(0.8) brightness(0.55) !important;
  }
  :global(.hatsu-baton-inherited) {
    box-shadow:
      0 0 0 2px #ffd166,
      0 0 20px #ffd16655 !important;
  }
  :global(.hatsu-soul-transferred) {
    filter: hue-rotate(120deg) !important;
  }
  :global(body.hatsu-portal-exhausted main) {
    filter: brightness(0.55) saturate(0.55);
    transform: scale(0.985);
    transition:
      filter 0.6s,
      transform 0.6s;
  }
  :global(body.hatsu-haiku-weather main) {
    filter: sepia(0.18) saturate(1.15);
    animation: haiku-weather 5s ease-in-out infinite;
  }
  :global(body.hatsu-haiku-weather main::before) {
    content: '俳';
    position: fixed;
    z-index: 70;
    right: 8vw;
    top: 18vh;
    color: #e7c87325;
    font: 12rem/1 serif;
    pointer-events: none;
  }
  :global(.hatsu-restored) {
    filter: saturate(1.2) brightness(1.08) !important;
    box-shadow:
      0 0 0 1px #f3b6d288,
      0 0 35px #f3b6d222 !important;
    animation: restore-pulse 1.2s ease-out;
  }
  :global(.hatsu-transformed-body) {
    transform: scale(0.72) !important;
    transform-origin: center !important;
    border-radius: 45% !important;
    filter: saturate(0.65) !important;
  }
  :global(body.hatsu-rhythm main) {
    animation: site-rhythm 1.2s ease-in-out infinite;
  }
  :global(.hatsu-rhythm-hit) {
    animation: rhythm-hit 0.6s ease-in-out infinite alternate !important;
  }
  :global(.hatsu-jupiter-impact) {
    position: relative !important;
    transition:
      max-height 0.7s,
      opacity 0.5s,
      transform 0.65s !important;
    transform: scaleY(0.12) translateY(5rem) !important;
    filter: brightness(0.35) !important;
  }
  :global(.hatsu-model) {
    outline: 1px dashed #a889c8 !important;
  }
  :global(.hatsu-metamorphosen) {
    box-shadow: 0 0 30px #a889c844 !important;
  }
  :global(.hatsu-stolen) {
    filter: grayscale(1) !important;
  }
  :global(.hatsu-bookmarked) {
    outline: 2px solid #9c7ac4 !important;
    background: #0c1420f2 !important;
  }
  :global(.hatsu-devoured) {
    color: transparent !important;
    text-shadow: 0 0 9px #78b6c9 !important;
    background: repeating-radial-gradient(
      circle at 30% 50%,
      transparent 0 5px,
      #061018 6px 10px
    ) !important;
  }
  :global(.hatsu-devoured *) {
    opacity: 0.12 !important;
  }
  :global(.hatsu-teleport-source) {
    outline: 1px dashed #7dd4d0 !important;
  }
  :global(.hatsu-sun-mark) {
    box-shadow: inset 0 0 35px #ffb34755 !important;
  }
  :global(.hatsu-moon-mark) {
    box-shadow: inset 0 0 35px #8590df55 !important;
  }
  :global(.hatsu-polarity-detonate) {
    animation: polarity-detonate 0.7s ease-out forwards !important;
  }
  :global(.hatsu-stamped)::after {
    content: '人';
    position: absolute;
    color: #cf6d62;
    font: 1rem/1 monospace;
  }
  :global(.hatsu-left-hand) {
    outline: 2px solid #f0c0dc !important;
  }
  :global(.hatsu-right-hand) {
    outline: 2px solid #8aa9ce !important;
  }
  /*
   * The copy is a real duplicate of the clicked node, so nothing but its own
   * frozen inline styles applies to it. These few rules are what make it
   * findable: it peels off the original, keeps the pinned box, and carries the
   * faint aura ring that is the only way to tell a Gallery Fake from the thing
   * it copied.
   */
  :global(.hatsu-gallery-fake) {
    animation: gallery-fake-arrive 0.28s ease-out !important;
    outline: 1px solid #a7c8c5 !important;
    box-shadow:
      0 0 0 4px #a7c8c526,
      0 18px 40px #0412146b !important;
    overflow: hidden !important;
    user-select: none !important;
  }
  :global(.hatsu-gallery-fake.hatsu-gallery-corpse) {
    filter: grayscale(0.7) brightness(0.85) !important;
  }
  :global(.hatsu-gallery-original) {
    outline: 1px dashed #a7c8c580 !important;
  }
  :global(.hatsu-antenna) {
    box-shadow: 0 -8px 0 -6px #7f92b8 !important;
  }
  :global(.hatsu-bullet-hit) {
    box-shadow: inset 0 0 20px #e6ad5733 !important;
  }
  :global(.hatsu-sleeping-body) {
    filter: grayscale(0.8) brightness(0.55) !important;
  }
  :global(.hatsu-animated-object) {
    position: relative !important;
    animation: animated-object 1.5s ease-in-out infinite !important;
  }
  :global(.hatsu-needle-puppet) {
    filter: saturate(0.2) contrast(1.25) !important;
    transition: transform 0.25s ease-out !important;
  }
  :global(.hatsu-paper-observed) {
    outline: 1px dashed #efb9c8 !important;
  }
  :global(.hatsu-remote-punched) {
    animation: remote-punch 0.55s ease-out !important;
  }
  :global(.hatsu-stitch-edge) {
    border-bottom: 2px dashed #dd77b7 !important;
  }
  :global(.hatsu-stitched) {
    border-color: #dd77b7 !important;
    box-shadow: inset 0 -2px #dd77b766 !important;
  }
  :global(body.hatsu-melody main) {
    animation: melody-breathe 3s ease-in-out infinite;
  }
  :global(.hatsu-note) {
    outline: 1px solid #70c6d766 !important;
  }
  :global(.hatsu-infected) {
    position: relative !important;
    box-shadow: inset 0 0 0 1px #d94f6866 !important;
  }
  :global(.hatsu-infected)::after {
    content: 'LV ' attr(data-hatsu-level);
    position: absolute;
    z-index: 4;
    right: 0.25rem;
    top: 0.25rem;
    color: #ff8a9b;
    font: 700 0.45rem/1 monospace;
  }
  :global(.hatsu-cyclotron-release) {
    animation: cyclotron-release 0.65s ease-out !important;
  }
  :global(.hatsu-studied) {
    outline: 1px dotted #7bb66c !important;
  }
  :global(.hatsu-predated) {
    opacity: 0.1 !important;
    filter: grayscale(1) !important;
    transform: scale(0.85) !important;
  }
  :global(.hatsu-staff-pinned) {
    box-shadow: inset 4px 0 #d5a94f !important;
  }
  :global(body.hatsu-no-sight main) {
    filter: blur(12px) brightness(0.2) !important;
  }
  :global(body.hatsu-no-hearing main) {
    animation: none !important;
    filter: grayscale(1) contrast(0.8);
  }
  :global(body.hatsu-no-speech main :is(input, textarea, button):not([data-hatsu-pass])) {
    pointer-events: none !important;
    opacity: 0.35 !important;
  }
  :global(.hatsu-suspect) {
    outline: 1px dashed #8765aa !important;
  }
  :global(.hatsu-snake-victim) {
    animation: snake-drain 1.2s ease-out forwards !important;
  }
  :global(.hatsu-zetsu-test) {
    box-shadow: inset 0 0 0 2px #8fe3f0 !important;
  }
  :global(.hatsu-training-hit) {
    animation: training-hit 0.7s ease-out !important;
  }
  :global(.hatsu-zetsu-broken) {
    box-shadow: inset 0 0 25px #ef5b5b66 !important;
  }
  :global(.hatsu-serpent-bound) {
    transform: scaleX(0.72) !important;
    filter: hue-rotate(35deg) !important;
    box-shadow:
      inset 14px 0 #86c98a44,
      inset -14px 0 #86c98a44 !important;
  }
  :global(.hatsu-bird-dispatched) {
    outline: 1px dotted #b9d8e8 !important;
  }
  :global(.hatsu-relay-cargo)::after {
    content: 'RELAY ' attr(data-hatsu-level);
    position: absolute;
    color: #e2b86e;
    font: 700 0.45rem monospace;
  }
  :global(.hatsu-curse-prepared) {
    box-shadow: inset 0 0 0 2px #a04f6855 !important;
  }
  :global(.hatsu-postmortem-drain) {
    animation: postmortem-drain 3s ease-in forwards !important;
  }
  :global(.hatsu-holy-healed) {
    outline: 2px solid #d9f1df !important;
  }
  :global(.hatsu-vow-subject),
  :global(.hatsu-contract-signatory) {
    box-shadow: inset 0 0 0 2px #d7dce266 !important;
  }
  :global(.hatsu-vow-clause),
  :global(.hatsu-contract-clause) {
    outline: 2px dashed #d7dce2 !important;
  }
  :global(.hatsu-vow-enforced) {
    filter: grayscale(1) brightness(0.45) !important;
  }
  :global(.hatsu-dolphin-analyzed) {
    outline: 2px solid #63d5e6 !important;
  }
  :global(.hatsu-dolphin-recipient) {
    box-shadow: 0 0 24px #63d5e666 !important;
  }
  :global(.hatsu-truth-punched) {
    outline: 2px solid #f1a06d !important;
  }
  :global(.hatsu-blood-searched) {
    box-shadow: inset 0 0 24px #b51f3c55 !important;
  }
  :global(.hatsu-lsdf-hideout) {
    outline: 2px double #d4c58b !important;
  }
  :global(.hatsu-lsdf-defendant) {
    box-shadow: inset 0 0 0 2px #d4c58b !important;
  }
  :global(.hatsu-damage-source) {
    outline: 1px solid #db8b78 !important;
  }
  :global(.hatsu-damage-recipient) {
    outline: 2px dashed #db8b78 !important;
  }
  :global(.hatsu-hideout-door) {
    border-left: 4px solid #7ec8b6 !important;
  }
  :global(.hatsu-body-weapon) {
    box-shadow: inset 0 -5px #c6925e !important;
  }
  :global(.hatsu-coercion-probe)::after {
    content: '? ' attr(data-hatsu-level) '/3';
    color: #d98cae;
    font: 700 0.5rem monospace;
  }
  :global(.hatsu-guardian-coin)::after {
    content: 'COIN AGE ' attr(data-hatsu-level);
    color: #d7b34f;
    font: 700 0.45rem monospace;
  }
  :global(.hatsu-lie-mark) {
    box-shadow: inset 0 0 0 calc(1px * var(--hatsu-level, 1)) #9e6d89 !important;
  }
  :global(.hatsu-research-partner) {
    outline: 1px dashed #91bd72 !important;
  }
  :global(.hatsu-eye-wog-reader) {
    box-shadow: inset 0 0 18px #ef91c444 !important;
  }
  :global(.hatsu-desire) {
    outline: 2px solid #98b65c !important;
  }
  :global(.hatsu-desire-bait) {
    box-shadow: 0 0 25px #98b65c77 !important;
  }
  :global(.hatsu-smoke-converted) {
    filter: saturate(0.8) hue-rotate(18deg) !important;
  }
  :global(.hatsu-solicited) {
    outline: 1px dashed #e8a9a1 !important;
  }
  :global(.hatsu-possessed) {
    filter: grayscale(0.75) !important;
  }
  :global(.hatsu-solicitation-refusal) {
    box-shadow: inset 0 0 16px #e8a9a155 !important;
  }
  :global(.hatsu-isolated-room) {
    box-shadow:
      0 0 0 3px #7095d6,
      0 0 40px #7095d655 !important;
  }

  /*
   * The states the techniques gained when each was rewritten against its own
   * canon mechanics: the refusals, the halfway steps and the side effects that
   * used to be indistinguishable from one another.
   */
  :global(.hatsu-reinforced-spill) {
    box-shadow: inset 0 0 22px #f0b42933 !important;
  }
  :global(.hatsu-royal-commander) {
    box-shadow: 0 0 0 2px #70d6b2 !important;
  }
  :global(.hatsu-royal-answered) {
    box-shadow: 0 0 22px #70d6b288 !important;
  }
  :global(.hatsu-gyo-empty) {
    outline: 1px dotted #6d7482 !important;
  }
  :global(.hatsu-curse-target) {
    outline: 1px solid #8e6ea8 !important;
  }
  :global(.hatsu-curse-relic)::after {
    content: 'RITE ' attr(data-hatsu-level) '/5';
    color: #8e6ea8;
    font: 700 0.45rem monospace;
  }
  :global(.hatsu-haiku-line) {
    box-shadow: inset 3px 0 #c9b06e !important;
  }
  :global(.hatsu-haiku-burnt) {
    filter: sepia(0.7) contrast(1.3) !important;
  }
  :global(.hatsu-haiku-weak) {
    outline: 1px dotted #8a8577 !important;
  }
  :global(.hatsu-prologue-armed) {
    box-shadow:
      0 0 0 2px #c8a24e,
      inset 0 0 20px #c8a24e33 !important;
  }
  :global(.hatsu-spear-reach) {
    box-shadow: inset -3px 0 #c8a24e !important;
  }
  :global(.hatsu-enchanted-listener) {
    filter: blur(1.5px) saturate(0.5) !important;
  }
  :global(.hatsu-fun-fun-wrapped) {
    outline: 1px dashed #9fc3d4 !important;
  }
  :global(.hatsu-stamped-head)::after {
    content: attr(data-hatsu-forgery);
    color: #b0704f;
    font: 700 0.6rem monospace;
  }
  :global(.hatsu-antenna-feint) {
    box-shadow: 0 -8px 0 -6px #4c5568 !important;
  }
  :global(.hatsu-needle-crippled) {
    box-shadow: inset 0 0 0 1px #6f6a7d !important;
  }
  :global(.hatsu-confetti-stuck) {
    outline: 1px dotted #b58fa8 !important;
  }
  :global(.hatsu-serpent-cut) {
    filter: contrast(1.15) !important;
  }
  :global(.hatsu-room-unsealed) {
    outline: 2px dashed #7a6f5e !important;
    filter: grayscale(0.6) !important;
  }
  :global(.hatsu-cyclotron-arm) {
    box-shadow: 0 0 0 2px #d2793f !important;
  }
  :global(.hatsu-cyclotron-splash) {
    filter: grayscale(0.5) !important;
  }
  :global(.hatsu-contagion-victim) {
    filter: grayscale(1) !important;
  }
  :global(.hatsu-contagion-awakened)::after {
    content: 'LV ' attr(data-hatsu-level);
    color: #a6577f;
    font: 700 0.5rem monospace;
  }
  :global(.hatsu-coin-awakened) {
    box-shadow: 0 0 24px #d7b34f77 !important;
  }
  :global(.hatsu-coercion-total) {
    box-shadow: 0 0 0 2px #d98cae !important;
  }
  :global(.hatsu-lie-honest) {
    outline: 1px solid #7fa88a !important;
  }
  :global(.hatsu-synthesis-failed) {
    filter: grayscale(0.85) !important;
  }
  :global(.hatsu-tyson-punished) {
    outline: 2px solid #ef91c4 !important;
  }
  :global(.hatsu-solicitation-pestered)::after {
    content: attr(data-hatsu-forgery);
    color: #e8a9a1;
    font: 700 0.7rem monospace;
  }
  :global(.hatsu-empty-duplicate) {
    outline: 1px dashed #7095d6 !important;
  }
  :global(.hatsu-vow-violation) {
    outline: 2px solid #c2495c !important;
  }
  :global(.hatsu-contract-rewarded) {
    box-shadow: 0 0 22px #b3c46e66 !important;
  }
  :global(.hatsu-contract-zetsu) {
    outline: 1px solid #6d7482 !important;
  }
  :global(.hatsu-nodes-opened) {
    box-shadow: 0 0 0 2px #7fc4d6 !important;
  }
  :global(.hatsu-blood-trace) {
    outline: 1px dotted #a8434f !important;
  }
  :global(.hatsu-body-weapon-severed) {
    outline: 1px dashed #c6925e !important;
  }
  :global(.hatsu-hideout-return) {
    border-right: 4px solid #7ec8b6 !important;
  }
  @keyframes arrive {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) scale(2);
    }
  }
  @keyframes elastic {
    to {
      stroke-width: 5;
    }
  }
  @keyframes scarlet {
    50% {
      opacity: 0.72;
    }
  }
  @keyframes power {
    50% {
      box-shadow: inset 0 0 140px color-mix(in srgb, var(--hatsu) 10%, transparent);
    }
  }
  @keyframes grow {
    from {
      transform: translate(-50%, -50%) scale(0.15) rotate(-50deg);
    }
    to {
      transform: translate(-50%, -50%) scale(1.4) rotate(0);
    }
  }
  @keyframes portal {
    to {
      box-shadow:
        0 0 25px var(--hatsu),
        inset 0 0 30px var(--hatsu);
    }
  }
  @keyframes owl {
    50% {
      transform: translate(-50%, -60%);
    }
  }
  @keyframes owl-alert {
    to {
      transform: translate(-50%, -55%) scale(1.18);
    }
  }
  @keyframes curse {
    to {
      transform: translate(-50%, -50%) rotate(360deg);
    }
  }
  @keyframes blast {
    from {
      box-shadow: 0 0 0 0 var(--hatsu);
    }
    to {
      box-shadow: 0 0 0 14rem transparent;
      opacity: 0;
    }
  }
  @keyframes cat {
    from {
      transform: translate(-50%, -50%) scale(3);
      opacity: 0;
    }
  }
  @keyframes replay-event {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) scale(2.2);
    }
  }
  @keyframes haiku-weather {
    50% {
      filter: sepia(0.3) saturate(1.3) brightness(0.92);
    }
  }
  @keyframes restore-pulse {
    from {
      transform: scale(0.96);
      opacity: 0.55;
    }
  }
  @keyframes site-rhythm {
    50% {
      transform: translateY(-2px);
    }
  }
  @keyframes rhythm-hit {
    to {
      transform: translateY(-5px) rotate(0.4deg);
    }
  }
  @keyframes polarity-detonate {
    to {
      transform: scale(1.8);
      opacity: 0;
      filter: brightness(4);
    }
  }
  @keyframes gallery-fake-arrive {
    from {
      transform: translate(var(--gallery-fake-dx, 0px), var(--gallery-fake-dy, 0px)) scale(1.03);
      opacity: 0.15;
    }
  }
  @keyframes animated-object {
    50% {
      transform: translateY(-6px) rotate(2deg);
    }
  }
  @keyframes remote-punch {
    0% {
      transform: translateX(0);
    }
    35% {
      transform: translateX(-45px) scale(0.94);
    }
    100% {
      transform: translateX(0);
    }
  }
  @keyframes melody-breathe {
    50% {
      filter: saturate(1.12);
      transform: translateY(-1px);
    }
  }
  @keyframes cyclotron-release {
    50% {
      transform: rotate(360deg) scale(1.35);
      filter: brightness(2);
    }
  }
  @keyframes snake-drain {
    to {
      filter: grayscale(1);
      opacity: 0.06;
      transform: scale(0.8);
    }
  }
  @keyframes training-hit {
    50% {
      box-shadow: 0 0 0 4rem #8fe3f000;
      filter: brightness(2);
    }
  }
  @keyframes postmortem-drain {
    to {
      filter: grayscale(1) brightness(0.18);
      opacity: 0.12;
      transform: scale(0.94);
    }
  }
  @keyframes fatal-vow {
    50% {
      filter: brightness(3) saturate(0);
      transform: scale(0.92);
    }
    to {
      opacity: 0.2;
    }
  }
  @keyframes sacrifice-death {
    to {
      filter: grayscale(1);
      opacity: 0.08;
      transform: scale(0.8);
    }
  }
  @keyframes curse-trigger {
    50% {
      box-shadow: 0 0 0 5rem #9d65d000;
      filter: brightness(2);
    }
    to {
      filter: grayscale(1) brightness(0.2);
      opacity: 0.15;
    }
  }
  @keyframes cat-crush {
    50% {
      transform: scale(0.55);
      filter: brightness(3);
    }
    to {
      opacity: 0.06;
      transform: scale(0.1);
    }
  }
  @keyframes signature-pulse {
    50% {
      box-shadow:
        0 12px 32px #0008,
        0 0 22px color-mix(in srgb, var(--hatsu) 28%, transparent);
      transform: scale(1.025);
    }
  }
  @keyframes signature-orbit {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes signature-strike {
    0%,
    72%,
    100% {
      transform: translateX(0);
    }
    78% {
      transform: translateX(7px);
    }
    84% {
      transform: translateX(-2px);
    }
  }
  @keyframes signature-drift {
    50% {
      transform: translateY(-5px);
    }
  }
  @keyframes signature-coil {
    50% {
      inset: -0.65rem;
      transform: rotate(18deg);
    }
  }
  @keyframes signature-bloom {
    50% {
      border-radius: 35% 65% 42% 58%;
      transform: scale(1.08);
    }
  }
  @keyframes signature-scan {
    0% {
      clip-path: inset(0 100% 0 0);
    }
    60%,
    100% {
      clip-path: inset(0);
    }
  }
  @keyframes signature-flicker {
    0%,
    91%,
    100% {
      opacity: 1;
    }
    92% {
      opacity: 0.25;
    }
    94% {
      opacity: 0.8;
    }
    96% {
      opacity: 0.35;
    }
  }
  @keyframes signature-arrow-flight {
    0%,
    25% {
      transform: translateX(-12px);
      opacity: 0.2;
    }
    55%,
    100% {
      transform: translateX(5px);
      opacity: 1;
    }
  }
  @media (max-width: 700px) {
    .visual-signature {
      bottom: 5.8rem;
      width: min(11rem, calc(100vw - 2rem));
    }
    .visual-signature > span {
      white-space: normal;
    }
    .readout {
      top: 4rem;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .world-effect * {
      animation: none !important;
    }
  }
</style>
