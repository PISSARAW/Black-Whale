<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { mapState, type ZoomLevel } from '$lib/state/mapState.svelte'
  import { activeHatsu, activateHatsu, consumeEmperorTimeHour, deactivateHatsu, emperorTimeLifeHours, parallelFutureVisible } from './hatsuState.js'
  import { HATSU_PROFILES, siteImpactFor, visualSignatureFor, type HatsuProfile } from './hatsuRegistry.js'

  type Point = { x: number; y: number; label: string; id: number; alert?: boolean; details?: string[] }
  type CaptureZone = { left: number; top: number; width: number; height: number }
  type RecordedEvent = { x: number; y: number; label: string }
  type PortalAnchor = { x: number; y: number; label: string; url: string; zoom: ZoomLevel; tier: string | null; location: string | null }
  type ElementSnapshot = { style: string; className: string; hidden: boolean; disabled?: boolean; open?: boolean; ariaLabel: string | null; ariaDisabled: string | null; ariaHidden: string | null }
  type StoredItem = { id: number; element: HTMLElement; label: string; mode: 'cloth' | 'space' | 'vacuum' | 'relay' }
  type FloatingCard = { id: number; x: number; y: number; label: string; kind: 'clone' | 'projection'; href?: string | null }
  type BirdDispatch = { id: number; label: string; href: string | null }
  type GuideItem = { id: number; label: string; element: HTMLElement; href: string | null }
  type MediaSnapshot = { element: HTMLMediaElement; paused: boolean; currentTime: number; controls: boolean }
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
  const snapshots = new Map<HTMLElement, ElementSnapshot>()
  const observers: MutationObserver[] = []
  const effectTimers = new Set<ReturnType<typeof setTimeout>>()
  const bungeeSelected = new Set<string>()
  const inheritedCharacters = new Set<string>()
  const tribunalCards = ['BLEU · ADMISSION', 'JAUNE · AVERTISSEMENT', 'JAUNE · RESTRAINT', 'ROUGE · EXPULSION']

  $: profile = $activeHatsu
  $: visualSignature = profile ? visualSignatureFor(profile) : null
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
    if (profile?.kind === 'future') {
      status = 'Present positions: cyan · next chapter: violet'
      futureTimer = setTimeout(() => {
        parallelFutureVisible.set(false)
        status = 'Ten-second vision complete'
        futureTimer = null
      }, 10000)
    }
  }

  function captureSiteState(): SiteSnapshot | null {
    if (typeof window === 'undefined' || typeof document === 'undefined') return null
    return {
      url: `${window.location.pathname}${window.location.search}${window.location.hash}`,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      activeElement: document.activeElement instanceof HTMLElement ? document.activeElement : null,
      media: Array.from(document.querySelectorAll<HTMLMediaElement>('audio, video')).map((element) => ({
        element,
        paused: element.paused,
        currentTime: element.currentTime,
        controls: element.controls
      })),
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
        showUnknownPositions: mapState.filters.showUnknownPositions
      }
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
        if (snapshot.activeElement?.isConnected) snapshot.activeElement.focus({ preventScroll: true })
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
      element.style.cssText = snapshot.style
      element.className = snapshot.className
      element.hidden = snapshot.hidden
      if ('disabled' in element && snapshot.disabled !== undefined) (element as HTMLButtonElement).disabled = snapshot.disabled
      if (element instanceof HTMLDetailsElement && snapshot.open !== undefined) element.open = snapshot.open
      if (snapshot.ariaLabel === null) element.removeAttribute('aria-label'); else element.setAttribute('aria-label', snapshot.ariaLabel)
      if (snapshot.ariaDisabled === null) element.removeAttribute('aria-disabled'); else element.setAttribute('aria-disabled', snapshot.ariaDisabled)
      if (snapshot.ariaHidden === null) element.removeAttribute('aria-hidden'); else element.setAttribute('aria-hidden', snapshot.ariaHidden)
      delete element.dataset.hatsuLevel
      delete element.dataset.hatsuStored
      delete element.dataset.hatsuForgery
    }
    snapshots.clear()
    if (typeof document !== 'undefined') {
      document.body.classList.remove(
        'hatsu-haiku-weather', 'hatsu-rhythm', 'hatsu-melody',
        'hatsu-no-sight', 'hatsu-no-hearing', 'hatsu-no-speech', 'hatsu-portal-exhausted'
      )
    }
    if (restoreSite) restoreSiteState()
  }

  function schedule(callback: () => void, delay: number) {
    const timer = setTimeout(() => {
      effectTimers.delete(timer)
      callback()
    }, delay)
    effectTimers.add(timer)
    return timer
  }

  function remember(element: HTMLElement) {
    if (!snapshots.has(element)) snapshots.set(element, {
      style: element.style.cssText,
      className: element.className,
      hidden: element.hidden,
      disabled: 'disabled' in element ? (element as HTMLButtonElement).disabled : undefined,
      open: element instanceof HTMLDetailsElement ? element.open : undefined,
      ariaLabel: element.getAttribute('aria-label'),
      ariaDisabled: element.getAttribute('aria-disabled'),
      ariaHidden: element.getAttribute('aria-hidden')
    })
    return element
  }

  function restoreElement(element: HTMLElement) {
    const snapshot = snapshots.get(element)
    if (!snapshot || !element.isConnected) return
    element.style.cssText = snapshot.style
    element.className = snapshot.className
    element.hidden = snapshot.hidden
    if ('disabled' in element && snapshot.disabled !== undefined) (element as HTMLButtonElement).disabled = snapshot.disabled
    if (element instanceof HTMLDetailsElement && snapshot.open !== undefined) element.open = snapshot.open
    if (snapshot.ariaLabel === null) element.removeAttribute('aria-label'); else element.setAttribute('aria-label', snapshot.ariaLabel)
    if (snapshot.ariaDisabled === null) element.removeAttribute('aria-disabled'); else element.setAttribute('aria-disabled', snapshot.ariaDisabled)
    if (snapshot.ariaHidden === null) element.removeAttribute('aria-hidden'); else element.setAttribute('aria-hidden', snapshot.ariaHidden)
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
    schedule(() => { puppetExecuting = false }, 0)
  }

  function executeSiteTarget(element: HTMLElement) {
    const control = element.matches('a,button,[role="button"],summary')
      ? element
      : element.querySelector<HTMLElement>('a,button,[role="button"],summary')
    if (control) {
      puppetExecuting = true
      control.click()
      schedule(() => { puppetExecuting = false }, 0)
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
    const link = target.closest<HTMLAnchorElement>('a') || target.querySelector<HTMLAnchorElement>('a')
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
    element.style.transform = 'scale(.04) rotate(-8deg)'
    element.style.opacity = '0'
    element.style.pointerEvents = 'none'
    storedItems = [...storedItems, { id: ++sequence, element, label, mode }]
  }

  function moveByRects(first: HTMLElement, second: HTMLElement) {
    remember(first); remember(second)
    const a = first.getBoundingClientRect()
    const b = second.getBoundingClientRect()
    first.style.transition = second.style.transition = 'transform .55s cubic-bezier(.2,.8,.2,1)'
    first.style.transform = `translate(${b.left - a.left}px, ${b.top - a.top}px)`
    second.style.transform = `translate(${a.left - b.left}px, ${a.top - b.top}px)`
    first.style.zIndex = second.style.zIndex = '30'
  }

  const normalizedAbilityName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '')

  function profilesFromTarget(target: HTMLElement) {
    const names = (target.dataset.hatsuList || '').split('|').filter(Boolean)
    return names.flatMap((name) => {
      const normalized = normalizedAbilityName(name)
      const match = HATSU_PROFILES.find((candidate) =>
        normalizedAbilityName(candidate.name) === normalized ||
        normalized.includes(normalizedAbilityName(candidate.name)) ||
        normalizedAbilityName(candidate.name).includes(normalized)
      )
      return match ? [match] : []
    })
  }

  function cleanupBungeeSelection() {
    if (bungeeTimer) clearTimeout(bungeeTimer)
    bungeeTimer = null
    bungeeFilterActive = false
    bungeeSelected.clear()
    if (typeof document === 'undefined') return
    document.body.classList.remove('bungee-gum-filtered')
    document.querySelectorAll('[data-bungee-selected]').forEach((element) => element.removeAttribute('data-bungee-selected'))
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
        linked.style.transform = `translate(${anchorRect.left - rect.left}px, ${anchorRect.top - rect.top}px)`
      }
      status = `Bungee Gum retracted · ${selectedElements.length} targets pulled to ${targetLabel(anchorElement)}`
      return
    }

    const firstPoint = points[0]
    if (firstPoint && Math.hypot(x - firstPoint.x, y - firstPoint.y) > Math.min(innerWidth, innerHeight) * .8) {
      status = 'Emitted Bungee Gum exceeded its ten-meter limit and snapped'
      return
    }

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
    return (target.getAttribute('aria-label') || target.textContent || target.tagName).trim().replace(/\s+/g, ' ').slice(0, 34)
  }

  function addPoint(x: number, y: number, label: string, extras: Pick<Point, 'alert' | 'details'> = {}) {
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
      height: Math.max(82, rect.height + 56)
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
    const target = eventElement.closest<HTMLElement>('a, button, article, section, li, [role="button"], h1, h2, h3, p')
    const threatening = target && (
      target.dataset.hatsuNextChange === 'dead' ||
      /death|dead|kill|danger|curse|assassin/i.test(`${target.className} ${target.textContent || ''}`)
    )
    if (target && threatening && guardianShield > 0) {
      event.preventDefault()
      event.stopPropagation()
      guardianShield -= 1
      const rect = target.getBoundingClientRect()
      addPoint(rect.left + rect.width / 2, rect.top + rect.height / 2, `Protected · ${targetLabel(target)}`)
      status = `Without You intercepted a lethal event and remained beside the survivor`
      return
    }
    recordedEvents = [...recordedEvents.slice(-4), {
      x: event.clientX,
      y: event.clientY,
      label: target ? targetLabel(target) : 'Map interaction'
    }]
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
        setTimeout(() => { guardianReplayPoint = null }, 700)
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
      location: mapState.selectedLocationId
    }
  }

  function placePortal(event: MouseEvent) {
    if (profile?.kind !== 'portal' || !(event.target as Element).closest('.map-canvas')) return
    event.preventDefault()
    event.stopPropagation()
    if (portalAnchors.length >= 2) portalAnchors = []
    portalAnchors = [...portalAnchors, currentPortalAnchor(event)]
    status = portalAnchors.length === 1
      ? 'Entrance placed · right-click the exit location'
      : 'Tunnel complete · both doors are now linked'
  }

  function portalIsVisible(anchor: PortalAnchor) {
    return anchor.url === `${$page.url.pathname}${$page.url.search}`
      && anchor.zoom === mapState.currentZoomLevel
      && anchor.tier === mapState.selectedTier
      && anchor.location === mapState.selectedLocationId
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
    const allies = Array.from(document.querySelectorAll<HTMLElement>('[data-hatsu-character]')).filter((candidate) => candidate !== target)
    const bearer = allies.length ? allies[sequence % allies.length] : null
    addPoint(event.clientX, event.clientY, targetLabel(target), { details: bearer ? [`Soul exchanged with ${targetLabel(bearer)}`] : [] })
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

  function extendedInteraction(event: MouseEvent, target: HTMLElement, x: number, y: number, label: string) {
    if (!profile) return false

    if (profile.kind === 'disguise') {
      const element = remember(target)
      const texture = (Number(element.dataset.hatsuLevel || 0) + 1) % 4
      const forgery = ['OFFICIAL ACCESS', 'CLEARED RECORD', 'AUTHORIZED IDENTITY', 'EMPTY SURFACE'][texture]
      element.dataset.hatsuLevel = String(texture)
      element.dataset.hatsuForgery = forgery
      element.classList.add('hatsu-texture-surprise')
      element.style.setProperty('--texture-index', String(texture))
      element.setAttribute('aria-label', `${forgery} — Texture Surprise forgery`)
      status = `${label}'s real information concealed beneath “${forgery}” · its original function remains underneath`
      addPoint(x, y, label)
    } else if (profile.kind === 'scarlet') {
      const element = remember(target)
      element.classList.add('hatsu-full-efficiency')
      element.hidden = false
      if ('disabled' in element) (element as HTMLButtonElement).disabled = false
      element.removeAttribute('aria-disabled')
      element.style.opacity = '1'
      element.style.filter = 'none'
      element.style.maxHeight = 'none'
      element.style.pointerEvents = 'auto'
      const details = element.closest('details')
      if (details instanceof HTMLDetailsElement) { remember(details); details.open = true }
      status = `${label} operated at 100% efficiency · life continues to burn`
      addPoint(x, y, '100%')
    } else if (profile.kind === 'chain-rule') {
      const techniques = profilesFromTarget(target)
      remember(target).classList.add('hatsu-aura-drained')
      capturedTechniques = techniques.slice(0, 1)
      status = capturedTechniques.length
        ? `${capturedTechniques[0].name} drained from ${label} · use the captured dolphin card`
        : `${label}'s aura drained · no registered Hatsu found`
      addPoint(x, y, label, { details: techniques.map((technique) => technique.name) })
    } else if (profile.kind === 'chain-bind') {
      const name = target.dataset.hatsuCharacterName || label
      const spiders = /chrollo|nobunaga|feitan|phinks|franklin|machi|shizuku|bonolenov|kalluto|illumi/i
      if (!spiders.test(name)) {
        remember(target).classList.add('hatsu-invalid-chain-target')
        status = `Vow violated on ${name} · Chain Jail rejects non-Spider target`
        addPoint(x, y, 'FATAL VOW', { alert: true })
        schedule(() => deactivateHatsu(), 1400)
      } else {
        remember(target).classList.add('hatsu-chain-jailed')
        target.style.pointerEvents = 'none'
        status = `${name} bound in forced Zetsu · all actions sealed`
        addPoint(x, y, name)
      }
    } else if (profile.kind === 'dowsing') {
      const uncertainty = /unknown|suspect|probable|unconfirmed|possibly|alleged/i.test(`${label} ${target.textContent || ''}`)
      dowsingSignal = uncertainty ? 92 : Math.min(88, 35 + target.querySelectorAll('a,button').length * 12)
      remember(target).classList.add(uncertainty ? 'hatsu-dowsing-alert' : 'hatsu-dowsing-found')
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      target.focus({ preventScroll: true })
      status = uncertainty ? `${label} · pendulum detects uncertainty or deception (${dowsingSignal}%)` : `${label} located · signal ${dowsingSignal}%`
      addPoint(x, y, label, { alert: uncertainty, details: [`Signal ${dowsingSignal}%`] })
    } else if (profile.kind === 'enhance') {
      const element = remember(target)
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
      status = `${label} reinforced · aura output ${level}/5${level === 5 ? ' · disabled control forced back into service' : ''}`
      addPoint(x, y, `REN ${level}`)
    } else if (profile.kind === 'control') {
      if (!selectedElements.includes(target)) selectedElements = [...selectedElements, target]
      remember(target).classList.add('hatsu-royal-controlled')
      const commander = selectedElements[0]
      if (commander && target !== commander) {
        const origin = commander.getBoundingClientRect()
        const rect = target.getBoundingClientRect()
        target.style.transition = 'transform .45s ease'
        target.style.transform = `translate(${(origin.left - rect.left) * .18}px, ${(origin.top - rect.top) * .18}px)`
      }
      status = `${selectedElements.length} royal guard${selectedElements.length > 1 ? 's' : ''} linked to one command network`
      addPoint(x, y, label)
    } else if (profile.kind === 'growth') {
      const element = remember(target)
      const living = Boolean(target.closest('[data-hatsu-character]'))
      const increment = living ? 1 : 2
      const level = Math.min(10, Number(element.dataset.hatsuLevel || 0) + increment)
      element.dataset.hatsuLevel = String(level)
      element.classList.add('hatsu-erigeron-grown')
      element.style.transform = `scale(${1 + level * .035})`
      element.style.filter = `saturate(${1 + level * .08}) brightness(${1 + level * .025})`
      const details = target.closest('details') || target.querySelector('details')
      if (details instanceof HTMLDetailsElement) { remember(details); details.open = true }
      const dormant = target.querySelector<HTMLElement>('[hidden], [aria-hidden="true"]')
      if (dormant) { remember(dormant); dormant.hidden = false; dormant.removeAttribute('aria-hidden') }
      status = living ? `${label} Nen growth ${level}/10 · progress is slow on an untrained person` : `${label} germinated to growth stage ${level}/10`
      addPoint(x, y, `GROW ${level}`)
    } else if (profile.kind === 'vehicle') {
      if (selectedElements.includes(target) && selectedElements.length >= 2) {
        const fuel = selectedElements.length * 20
        selectedElements.forEach((passenger, index) => {
          remember(passenger)
          passenger.style.transition = 'transform 1s cubic-bezier(.2,.8,.2,1)'
          passenger.style.transform = `translateX(${Math.min(innerWidth * .45, 360)}px) translateY(${index * 4}px) scale(.82)`
        })
        status = `Vehicle launched · ${selectedElements.length} passengers · ${fuel}% shared aura fuel`
      } else if (selectedElements.length < 5 && !selectedElements.includes(target)) {
        selectedElements = [...selectedElements, target]
        remember(target).classList.add('hatsu-passenger')
        status = `${selectedElements.length}/5 passengers aboard · click a passenger to depart`
        addPoint(x, y, label)
      }
    } else if (profile.kind === 'scout') {
      if (target.closest('[data-hatsu-character]')) {
        status = `${label} rejected · Little Eye requires a real small animal, not a person or Nen construct`
        addPoint(x, y, 'INVALID', { alert: true })
      } else {
        floatingCards = [{ id: ++sequence, x: Math.min(innerWidth - 270, x + 25), y: Math.min(innerHeight - 160, y + 20), label: `${label} · ${target.querySelectorAll('a').length} paths · ${target.querySelectorAll('[data-hatsu-character]').length} auras`, kind: 'projection' }]
        remember(target).classList.add('hatsu-little-eye-host')
        status = `Vision and hearing shared through a small creature inside ${label}`
        addPoint(x, y, label)
      }
    } else if (profile.kind === 'tribunal') {
      if (crossGameTarget !== target) { crossGameTarget = target; cardIndex = 0 }
      const element = remember(target)
      if (cardIndex === 0) {
        element.classList.add('hatsu-cross-blue')
        status = `BLUE · ${label} admitted into the court`
        cardIndex = 1
      } else if (cardIndex === 1) {
        element.classList.add('hatsu-cross-warning')
        status = `YELLOW · warning issued to ${label} · click again if ignored`
        cardIndex = 2
      } else if (cardIndex === 2) {
        element.classList.add('hatsu-cross-restrained')
        element.setAttribute('aria-disabled', 'true')
        for (const control of element.querySelectorAll<HTMLElement>('a,button,input,select,textarea')) {
          remember(control)
          control.style.pointerEvents = 'none'
        }
        status = `YELLOW REVERSED · ${label} immobilized but still visible`
        cardIndex = 3
      } else {
        element.classList.add('hatsu-cross-expelled')
        element.style.opacity = '0'
        element.style.transform = 'translateX(110vw)'
        status = `RED · ${label} expelled from the page`
        cardIndex = 0
      }
      addPoint(x, y, tribunalCards[Math.min(3, cardIndex)])
    } else if (profile.kind === 'curse') {
      if (!selectedElements.length) {
        selectedElements = [target]
        remember(target).classList.add('hatsu-beyond-cursed')
        status = `${label} chosen as the distant curse target · choose a sacrificial carrier`
        addPoint(x, y, `TARGET · ${label}`)
      } else if (selectedElements.length === 1 && target !== selectedElements[0]) {
        selectedElements = [...selectedElements, target]
        remember(target).classList.add('hatsu-sacrifice-carrier')
        status = `${label} awakened from birth as sacrifice · click the carrier to trigger death`
        addPoint(x, y, `SACRIFICE · ${label}`)
      } else if (selectedElements[1] === target) {
        const victim = selectedElements[0]
        remember(target).classList.add('hatsu-sacrifice-dead')
        remember(victim).classList.add('hatsu-curse-triggered')
        victim.style.pointerEvents = 'none'
        status = `Sacrifice died · post-mortem curse crossed the site and struck ${targetLabel(victim)}`
      }
    } else if (profile.kind === 'blast') {
      const element = remember(target)
      const rect = target.getBoundingClientRect()
      const direction = event.clientX < rect.left + rect.width / 2 ? 1 : -1
      element.style.transition = 'transform .5s cubic-bezier(.1,.8,.2,1)'
      element.style.transform = `translateX(${direction * Math.min(240, innerWidth * .25)}px) rotate(${direction * 3}deg)`
      element.classList.add('hatsu-air-blown')
      status = `Air Blow broke ${label}'s guard and pushed it across the page`
      addPoint(x, y, label)
    } else if (profile.kind === 'surveillance') {
      selectedElements.forEach((element) => element.classList.remove('hatsu-secret-window'))
      selectedElements = [target]
      remember(target).classList.add('hatsu-secret-window')
      const change = target.dataset.hatsuNextChange || 'stable'
      const alert = change === 'dead' || change === 'moved'
      points = [{ x, y, label, id: ++sequence, alert, details: [`Next chapter: ${change}`] }]
      status = change === 'dead' ? `${label} · owl recorded impending death` : change === 'moved' ? `${label} · owl recorded a location change` : `${label} · live feed stable, earlier footage retained`
    } else if (profile.kind === 'future') {
      addPoint(x, y, `PREDICTED · ${label}`)
      remember(target).classList.add('hatsu-future-afterimage')
      status = $parallelFutureVisible ? `${label} added to the immutable ten-second prediction · choose a different real action` : `Prediction ended · ${points.length} actions remain as afterimages`
    } else if (profile.kind === 'resurrection') {
      const killer = target
      remember(killer).classList.add('hatsu-camilla-killer')
      status = `${label} killed Camilla · post-mortem counterattack materializing`
      addPoint(x, y, label)
      schedule(() => {
        remember(killer).classList.add('hatsu-cat-crushed')
        killer.style.pointerEvents = 'none'
        document.documentElement.scrollTo({ top: 0, behavior: 'smooth' })
        status = `${label}'s life force absorbed · Camilla fully resurrected`
      }, 900)
    } else if (profile.kind === 'poetry') {
      if (!guideItems.some((item) => item.element === target)) guideItems = [...guideItems, guideItemFor(target, label)].slice(-3)
      addPoint(x, y, label)
      if (points.length >= 3) {
        document.body.classList.add('hatsu-haiku-weather')
        guideTitle = 'Great Haiku · materialized path'
        status = `${points.slice(-3).map((point) => point.label).join(' / ')} · the three verses are now a navigable path`
      } else status = `${points.length}/3 lines selected · continue the haiku`
    } else if (profile.kind === 'restoration') {
      remember(target).classList.add('hatsu-restored')
      mapState.currentZoomLevel = 'OVERVIEW'
      mapState.selectedTier = null
      mapState.selectedLocationId = null
      mapState.currentEventIndex = 0
      const cleanUrl = $page.url.pathname
      if ($page.url.search) void goto(cleanUrl, { replaceState: true, noScroll: true, keepFocus: true })
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      status = `${label} restored · chapter filters, map depth and event position returned to their rested baseline`
      addPoint(x, y, label)
    } else if (profile.kind === 'transformation') {
      const element = remember(target)
      const compact = element.classList.toggle('hatsu-transformed-body')
      element.style.maxHeight = compact ? '4.5rem' : 'none'
      element.style.overflow = compact ? 'hidden' : 'visible'
      for (const control of element.querySelectorAll<HTMLElement>('a,button,input,select,textarea')) {
        remember(control)
        control.style.pointerEvents = compact ? 'none' : 'auto'
      }
      status = compact ? `${label} compressed · its nested site controls no longer fit inside the small body` : `${label} · true form and all nested controls restored`
      addPoint(x, y, label)
    } else if (profile.kind === 'rhythm') {
      remember(target).classList.add('hatsu-rhythm-hit')
      document.body.classList.add('hatsu-rhythm')
      if (!guideItems.some((item) => item.element === target)) guideItems = [...guideItems, guideItemFor(target, label)].slice(-7)
      guideTitle = 'Battle Prologue · combat sequence'
      status = `Beat ${points.length + 1} · ${label} added to an executable site sequence`
      addPoint(x, y, label)
    } else if (profile.kind === 'impact') {
      const element = remember(target)
      element.classList.add('hatsu-jupiter-impact')
      schedule(() => {
        element.style.maxHeight = '0'
        element.style.minHeight = '0'
        element.style.overflow = 'hidden'
        element.style.opacity = '.08'
      }, 650)
      status = `Jupiter materialized above ${label}`
      addPoint(x, y, label)
    } else if (profile.kind === 'mimicry') {
      if (!selectedElements.length) {
        selectedElements = [target]
        remember(target).classList.add('hatsu-model')
        status = `${label} memorized · choose the body to transform`
      } else if (selectedElements[1] === target) {
        executeSiteTarget(selectedElements[0])
        status = `${label} reproduced ${targetLabel(selectedElements[0])}'s site action`
      } else {
        const model = selectedElements[0]
        const source = getComputedStyle(model)
        const transformed = remember(target)
        transformed.style.background = source.background
        transformed.style.color = source.color
        transformed.style.border = source.border
        transformed.style.borderRadius = source.borderRadius
        transformed.style.fontFamily = source.fontFamily
        transformed.classList.add('hatsu-metamorphosen')
        selectedElements = [model, transformed]
        status = `${label} transformed into ${targetLabel(model)} · click the transformed body to reproduce the model's action`
        addPoint(x, y, label)
      }
    } else if (profile.kind === 'theft') {
      const control = target.closest<HTMLElement>('a, button')
      if (!control) { status = 'Skill Hunter requires an exposed button or link'; return true }
      stolenTarget = control
      remember(control)
      control.style.opacity = '.22'
      control.style.pointerEvents = 'none'
      control.classList.add('hatsu-stolen')
      status = `${targetLabel(control)} sealed in Skill Hunter`
      addPoint(x, y, targetLabel(control))
    } else if (profile.kind === 'bookmark') {
      if (selectedElements.includes(target) || selectedElements.length >= 2) return true
      selectedElements = [...selectedElements, target]
      remember(target)
      target.style.position = 'sticky'
      target.style.top = `${5 + (selectedElements.length - 1) * 5}rem`
      target.style.zIndex = String(35 - selectedElements.length)
      target.classList.add('hatsu-bookmarked')
      status = `${selectedElements.length}/2 pages held open`
      addPoint(x, y, label)
    } else if (profile.kind === 'devour') {
      remember(target).classList.add('hatsu-devoured')
      status = `${label} is being eaten · layout remains alive until Zetsu`
      addPoint(x, y, label)
    } else if (profile.kind === 'pocket') {
      storeElement(target, label, 'cloth')
      status = `${label} wrapped and reduced`
      addPoint(x, y, label)
    } else if (profile.kind === 'teleport') {
      if (!selectedElements.length) {
        selectedElements = [target]
        remember(target).classList.add('hatsu-teleport-source')
        status = `${label} fixed · choose its destination target`
      } else {
        const first = selectedElements[0]
        moveByRects(first, target)
        selectedElements = [first, target]
        status = `${targetLabel(first)} and ${label} exchanged positions`
        addPoint(x, y, label)
      }
    } else if (profile.kind === 'polarity') {
      if (selectedElements.length < 2 && !selectedElements.includes(target)) {
        selectedElements = [...selectedElements, target]
        remember(target).classList.add(selectedElements.length === 1 ? 'hatsu-sun-mark' : 'hatsu-moon-mark')
        status = selectedElements.length === 1 ? 'Sun placed · choose the Moon target' : 'Opposite marks armed · touch either marked target'
        addPoint(x, y, selectedElements.length === 1 ? `☀ ${label}` : `☾ ${label}`)
      } else if (selectedElements.includes(target) && selectedElements.length === 2) {
        for (const marked of selectedElements) {
          remember(marked).classList.add('hatsu-polarity-detonate')
          marked.style.pointerEvents = 'none'
        }
        status = 'SUN + MOON · post-mortem detonation'
      }
    } else if (profile.kind === 'command') {
      if (selectedElements.length < 3 && (target.matches('a,button,[role="button"],[data-hatsu-character]') || target.querySelector('[data-hatsu-character]'))) {
        status = `${label} rejected · Order Stamp cannot command a living being or an already autonomous control`
        return true
      }
      if (selectedElements.length < 3) {
        selectedElements = [...selectedElements, target]
        remember(target).classList.add('hatsu-stamped')
        status = `${selectedElements.length} puppet${selectedElements.length > 1 ? 's' : ''} stamped · ${selectedElements.length < 3 ? 'stamp another or choose three' : 'choose a destination'}`
        addPoint(x, y, label)
      } else {
        const destination = target.getBoundingClientRect()
        for (const puppet of selectedElements) {
          const rect = puppet.getBoundingClientRect()
          remember(puppet)
          puppet.style.transition = 'transform .7s ease'
          puppet.style.transform = `translate(${destination.left - rect.left}px, ${destination.top - rect.top}px) scale(.72)`
        }
        status = `Order executed · ${selectedElements.length} puppets marched to ${label}`
      }
    } else if (profile.kind === 'identity-swap') {
      if (!selectedElements.length) {
        selectedElements = [target]
        remember(target).classList.add('hatsu-left-hand')
        status = `${label} marked by the left hand · choose a second identity`
      } else {
        moveByRects(selectedElements[0], target)
        remember(target).classList.add('hatsu-right-hand')
        status = `Visible identities converted · functions remain attached`
        addPoint(x, y, label)
      }
    } else if (profile.kind === 'divination') {
      const affinity = 50 + Math.abs(Math.round(Math.sin((x + y + label.length) * .01) * 50))
      addPoint(x, y, label, { details: [`Affinity ${affinity}%`] })
      const item = guideItemFor(target, label)
      if (!dialBest || affinity > dialBest.score) dialBest = { score: affinity, item }
      guideTitle = 'Love Dial 6700 · strongest signal'
      guideItems = dialBest ? [dialBest.item] : []
      status = `Dial ${affinity}% · strongest signal: ${dialBest?.item.label || label} (${dialBest?.score || affinity}%) · follow it from the guide`
    } else if (profile.kind === 'prophecy') {
      const links = Array.from(target.querySelectorAll<HTMLAnchorElement>('a')).slice(0, 4)
      const words = (target.textContent || '').trim().split(/\s+/).length
      prophecyLines = [
        `The ${label.slice(0, 18)} waits beneath a black tide.`,
        `${links.length || 'No'} paths open; only one returns unchanged.`,
        `When ${words % 12 || 12} bells are counted, an ally becomes a door.`,
        `Guard the final link, or the Whale will erase its name.`
      ]
      guideTitle = 'Lovely Ghostwriter · foretold paths'
      guideItems = links.map((link) => guideItemFor(link, targetLabel(link)))
      status = `Four-line fortune written for ${label} · ${guideItems.length} foretold routes can be followed`
      addPoint(x, y, label)
    } else if (profile.kind === 'clone') {
      const rect = target.getBoundingClientRect()
      floatingCards = [...floatingCards, { id: ++sequence, x: Math.max(8, Math.min(innerWidth - 180, rect.left)), y: Math.max(8, Math.min(innerHeight - 100, rect.top)), label, kind: 'clone' }]
      status = `${label} copied · the inert replica now occupies and intercepts the original interaction space`
      addPoint(x, y, label)
    } else if (profile.kind === 'puppet') {
      const control = target.closest<HTMLElement>('a, button')
      if (!puppetTarget) {
        if (!control) { status = 'Black Voice needs a button or link for its antenna'; return true }
        puppetTarget = control
        remember(control).classList.add('hatsu-antenna')
        status = `${targetLabel(control)} captured · click elsewhere to issue the order`
        addPoint(x, y, targetLabel(control))
      } else if (!puppetExecuting) {
        puppetExecuting = true
        status = `Remote order sent to ${targetLabel(puppetTarget)}`
        puppetTarget.click()
        schedule(() => { puppetExecuting = false }, 0)
      }
    } else if (profile.kind === 'barrage') {
      const element = remember(target)
      const force = Math.min(120, 18 + points.length * 12)
      element.style.transition = 'transform .18s ease-out'
      element.style.transform = `translate(${event.clientX < innerWidth / 2 ? force : -force}px, ${((points.length % 3) - 1) * 12}px)`
      element.classList.add('hatsu-bullet-hit')
      status = `${points.length * 2 + 2} emitted bullets · ${label} knocked back`
      addPoint(x, y, label)
    } else if (profile.kind === 'projection') {
      const link = target.closest<HTMLAnchorElement>('a') || target.querySelector<HTMLAnchorElement>('a')
      floatingCards = [{ id: ++sequence, x: Math.max(16, Math.min(innerWidth - 320, x)), y: Math.max(80, Math.min(innerHeight - 220, y)), label, kind: 'projection', href: link?.href || null }]
      const body = remember(target)
      body.classList.add('hatsu-sleeping-body')
      body.style.pointerEvents = 'none'
      status = `Astral double detached into ${label} · the sleeping body is unusable while the projection can follow its extracted route`
      addPoint(x, y, label)
    } else if (profile.kind === 'animate') {
      remember(target).classList.add('hatsu-animated-object')
      selectedElements = [...selectedElements.filter((element) => element.isConnected), target]
      status = `${label} animated · original function preserved`
      addPoint(x, y, label)
    } else if (profile.kind === 'needle') {
      const element = remember(target)
      element.classList.add('hatsu-needle-puppet')
      element.style.pointerEvents = 'none'
      selectedElements = [...selectedElements, element]
      status = `${selectedElements.length} needle puppet${selectedElements.length > 1 ? 's' : ''} under total control`
      addPoint(x, y, label)
    } else if (profile.kind === 'paper-spy') {
      remember(target).classList.add('hatsu-paper-observed')
      const report = { label, count: 0 }
      observerReports = [...observerReports, report]
      const observer = new MutationObserver((mutations) => {
        report.count += mutations.length
        observerReports = [...observerReports]
        status = `${label} · ${report.count} changes reported by paper doll`
      })
      observer.observe(target, { subtree: true, childList: true, attributes: true, characterData: true })
      observers.push(observer)
      status = `Paper doll deployed inside ${label}`
      addPoint(x, y, label)
    } else if (profile.kind === 'shred') {
      const element = remember(target)
      const existing = Number(element.dataset.hatsuLevel || 0) + 1
      element.dataset.hatsuLevel = String(existing)
      element.style.transition = 'clip-path .35s, opacity .35s, transform .35s'
      element.style.clipPath = `inset(${Math.min(48, existing * 10)}% ${existing % 2 ? 8 : 18}% ${Math.min(48, existing * 8)}% ${existing % 2 ? 18 : 8}%)`
      element.style.transform = `rotate(${existing * 2}deg) scale(${Math.max(.2, 1 - existing * .15)})`
      if (existing >= 5) { element.style.opacity = '0'; element.style.pointerEvents = 'none' }
      status = `${label} · paper cut ${existing}/5`
      addPoint(x, y, label)
    } else if (profile.kind === 'remote-strike') {
      const element = remember(target)
      element.classList.remove('hatsu-remote-punched')
      void element.offsetWidth
      element.classList.add('hatsu-remote-punched')
      executeSiteTarget(element)
      status = `Aura crossed the page and remotely activated ${label}`
      addPoint(innerWidth - x, y, label)
    } else if (profile.kind === 'spatial') {
      storeElement(target, label, 'space')
      status = `${label} transferred beyond the page boundary`
      addPoint(x, y, label)
    } else if (profile.kind === 'stitch') {
      if (!selectedElements.length) {
        selectedElements = [target]
        remember(target).classList.add('hatsu-stitch-edge')
        status = `${label} threaded · choose the second torn edge`
      } else if (selectedElements.length === 1) {
        const first = selectedElements[0]
        remember(first); remember(target)
        first.classList.add('hatsu-stitched')
        target.classList.add('hatsu-stitched')
        first.style.marginBottom = '0'
        target.style.marginTop = '0'
        first.style.position = target.style.position = 'sticky'
        first.style.top = '5rem'
        target.style.top = `calc(5rem + ${Math.max(36, first.getBoundingClientRect().height)}px)`
        selectedElements = [first, target]
        addPoint(x, y, label)
        status = `${targetLabel(first)} and ${label} sewn into one sticky body · activating either edge activates its counterpart`
      } else if (selectedElements.includes(target)) {
        const counterpart = selectedElements.find((element) => element !== target)
        if (counterpart) {
          executeSiteTarget(target)
          executeSiteTarget(counterpart)
        }
        status = `${label} pulled its stitched counterpart into the same action`
      }
    } else if (profile.kind === 'melody') {
      document.body.classList.add('hatsu-melody')
      remember(target).classList.add('hatsu-note')
      if (!guideItems.some((item) => item.element === target)) guideItems = [...guideItems, guideItemFor(target, label)].slice(-7)
      guideTitle = 'Enchanting Music · guided score'
      if (guideItems.length >= 3) {
        guideItems.slice(-3).forEach((item, index) => schedule(() => followGuide(item), index * 550))
      }
      status = `Note ${points.length + 1} · ${label} joined a score that guides focus through the site`
      addPoint(x, y, ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI'][points.length % 7])
    } else if (profile.kind === 'infection') {
      const element = remember(target)
      const current = Number(element.dataset.hatsuLevel || 0)
      const next = current ? Math.min(100, current + 10) : 1
      element.dataset.hatsuLevel = String(next)
      element.classList.add('hatsu-infected')
      infectionLevel = Math.max(infectionLevel, next)
      if (current) {
        for (const sibling of Array.from(target.parentElement?.children || []).slice(0, 3)) {
          if (!(sibling instanceof HTMLElement)) continue
          remember(sibling).classList.add('hatsu-infected')
          sibling.dataset.hatsuLevel = String(Math.max(1, next - 1))
        }
      }
      if (next >= 20) {
        const locked = target.matches('[disabled],[aria-disabled="true"],[hidden]') ? target : target.querySelector<HTMLElement>('[disabled],[aria-disabled="true"],[hidden]')
        if (locked) {
          remember(locked)
          locked.hidden = false
          locked.removeAttribute('aria-disabled')
          if ('disabled' in locked) (locked as HTMLButtonElement).disabled = false
          locked.style.pointerEvents = 'auto'
        }
      }
      status = `Contagion level ${next} · ${next >= 20 ? 'a locked site ability was unlocked at the Hatsu threshold' : current ? 'infection spread to neighboring members' : 'new member initiated'}`
      addPoint(x, y, `LV ${next}`)
    } else if (profile.kind === 'windup') {
      if (selectedElements[0] !== target) { selectedElements = [target]; windupPower = 0 }
      windupPower += 1
      const element = remember(target)
      element.style.transform = `rotate(${windupPower * 18}deg) scale(${1 + windupPower * .025})`
      element.style.transition = 'transform .2s ease'
      if (windupPower >= 6) {
        element.classList.add('hatsu-cyclotron-release')
        element.style.pointerEvents = 'none'
        element.style.maxHeight = '0'
        element.style.overflow = 'hidden'
        status = `Ripper Cyclotron released at ×${windupPower} power · ${label} destroyed and removed from interaction`
        windupPower = 0
      } else status = `Arm rotation ${windupPower} · aura multiplier ×${windupPower}`
      addPoint(x, y, label)
    } else if (profile.kind === 'predator') {
      const species = `${target.tagName}.${target.classList[0] || 'plain'}`
      if (studyTarget !== species) { studyTarget = species; studyCount = 0 }
      studyCount += 1
      remember(target).classList.add('hatsu-studied')
      if (studyCount >= 3) {
        const matches = Array.from(document.querySelectorAll<HTMLElement>(target.tagName.toLowerCase()))
          .filter((element) => !element.closest('[data-hatsu-ui], nav, header'))
        for (const match of matches.slice(0, 12)) {
          remember(match).classList.add('hatsu-predated')
          match.style.pointerEvents = 'none'
        }
        status = `Predator complete · ${matches.length} ${target.tagName.toLowerCase()} targets neutralized`
      } else status = `Hypothesis ${studyCount}/3 · studying ${species}`
      addPoint(x, y, label)
    } else if (profile.kind === 'staff') {
      const pinned = remember(target)
      pinned.classList.add('hatsu-staff-pinned')
      pinned.style.position = 'sticky'
      pinned.style.top = '5rem'
      pinned.style.pointerEvents = 'none'
      for (const sibling of Array.from(target.parentElement?.children || [])) {
        if (!(sibling instanceof HTMLElement) || sibling === target) continue
        remember(sibling)
        const direction = sibling.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
        sibling.style.transform = `translateX(${direction * 28}px)`
        sibling.style.transition = 'transform .35s ease'
      }
      status = `Priest Staff extended through ${label} · target pinned and unusable, neighbors repelled`
      addPoint(x, y, label)
    } else if (profile.kind === 'senses') {
      sensesStage = (sensesStage + 1) % 4
      document.body.classList.toggle('hatsu-no-sight', sensesStage >= 1)
      document.body.classList.toggle('hatsu-no-hearing', sensesStage >= 2)
      document.body.classList.toggle('hatsu-no-speech', sensesStage >= 3)
      if (sensesStage >= 2) {
        document.querySelectorAll<HTMLMediaElement>('audio,video').forEach((media) => media.pause())
      }
      status = ['All senses restored', 'Sight sealed', 'Sight + hearing sealed', 'Sight + hearing + speech sealed'][sensesStage]
      addPoint(x, y, ['解', '見', '聞', '言'][sensesStage])
    } else if (profile.kind === 'vacuum') {
      if (target.closest('[data-hatsu-character]')) { status = `${label} rejected · Blinky considers the target alive`; return true }
      storeElement(target, label, 'vacuum')
      status = `${label} vacuumed · ${storedItems.length} nonliving targets stored`
      addPoint(x, y, label)
    } else if (profile.kind === 'snakes') {
      if (selectedElements.length < 10 && !selectedElements.includes(target)) {
        selectedElements = [...selectedElements, target]
        remember(target).classList.add('hatsu-suspect')
        status = `${selectedElements.length}/10 targets inside Silent Majority range`
        addPoint(x, y, `${selectedElements.length}`)
      } else if (selectedElements.length >= 10) {
        remember(target).classList.add('hatsu-snake-victim')
        target.style.pointerEvents = 'none'
        status = `${label} drained by four snakes · curse fulfilled`
        addPoint(x, y, label)
      }
    } else if (profile.kind === 'training-shot') {
      trainingTarget = target
      trainingOrigin = { x: cursor.x, y: cursor.y }
      const trainee = remember(target)
      trainee.classList.add('hatsu-zetsu-test')
      trainee.style.pointerEvents = 'none'
      status = `Maintain perfect focus for 3 seconds · the trainee's site action is sealed in Zetsu`
      addPoint(x, y, label)
      schedule(() => {
        if (!trainingTarget) return
        trainingTarget.classList.add('hatsu-training-hit')
        trainingTarget.style.pointerEvents = 'auto'
        status = `${label} maintained Zetsu · controlled shot survived and its action was restored`
        trainingTarget = null
      }, 3000)
    } else if (profile.kind === 'serpent') {
      const element = remember(target)
      const restrained = element.classList.toggle('hatsu-serpent-bound')
      element.setAttribute('aria-disabled', restrained ? 'true' : 'false')
      for (const control of element.querySelectorAll<HTMLElement>('a,button,input,select,textarea')) {
        remember(control)
        control.style.pointerEvents = restrained ? 'none' : 'auto'
      }
      status = restrained ? `${label} constricted by Snake Arm` : `${label} released from the coils`
      addPoint(x, y, label)
    } else if (profile.kind === 'flock') {
      const link = target.closest<HTMLAnchorElement>('a')
      birdDispatches = [...birdDispatches.slice(-7), { id: ++sequence, label, href: link?.href || null }]
      remember(target).classList.add('hatsu-bird-dispatched')
      status = `Pigeon ${birdDispatches.length} dispatched with ${label}`
      addPoint(x, y, label)
    } else if (profile.kind === 'relay') {
      const element = remember(target)
      const stage = Math.min(3, Number(element.dataset.hatsuLevel || 0) + 1)
      element.dataset.hatsuLevel = String(stage)
      element.classList.add('hatsu-relay-cargo')
      element.style.transition = 'transform .65s ease, opacity .4s'
      element.style.transform = `translateX(${stage * (innerWidth < 700 ? 28 : 75)}px) scale(${1 - stage * .08})`
      element.style.opacity = String(1 - stage * .15)
      if (stage === 3) storeElement(element, label, 'relay')
      status = `Cargo ${label} · relay stage ${stage}/3${stage === 3 ? ' · delivered into relay storage without teleportation' : ''}`
      addPoint(x, y, `RELAY ${stage}`)
    } else if (profile.kind === 'healing') {
      const wounded = remember(target)
      wounded.hidden = false
      wounded.style.opacity = '1'
      wounded.style.filter = 'none'
      wounded.style.maxHeight = 'none'
      wounded.style.pointerEvents = 'auto'
      wounded.removeAttribute('aria-disabled')
      wounded.removeAttribute('aria-hidden')
      if ('disabled' in wounded) (wounded as HTMLButtonElement).disabled = false
      const details = wounded.closest('details') || wounded.querySelector('details')
      if (details instanceof HTMLDetailsElement) { remember(details); details.open = true }
      wounded.classList.add('hatsu-holy-healed')
      status = `Holy Chain restored ${label}'s content and controls`
      addPoint(x, y, `HEALED · ${label}`)
    } else if (profile.kind === 'heart-vow') {
      if (!selectedElements.length) {
        selectedElements = [target]
        remember(target).classList.add('hatsu-vow-subject')
        status = `${label} bears the heart chain · choose the forbidden action`
      } else if (selectedElements.length === 1 && target !== selectedElements[0]) {
        selectedElements = [...selectedElements, target]
        remember(target).classList.add('hatsu-vow-clause')
        status = `${targetLabel(target)} declared forbidden · touch it again to violate the rule`
      } else if (selectedElements[1] === target) {
        const subject = remember(selectedElements[0])
        subject.style.pointerEvents = 'none'
        subject.setAttribute('aria-disabled', 'true')
        subject.classList.add('hatsu-vow-enforced')
        status = `Rule violated · Judgment Chain pierced ${targetLabel(subject)}'s heart and sealed its site action`
      }
      addPoint(x, y, label)
    } else if (profile.kind === 'ability-loan') {
      if (!selectedElements.length) {
        const techniques = profilesFromTarget(target).filter((technique) => technique.id !== profile.id)
        selectedElements = [target]
        capturedTechniques = techniques.slice(0, 1)
        remember(target).classList.add('hatsu-dolphin-analyzed')
        status = techniques.length ? `${techniques[0].name} analyzed · choose a recipient` : `${label} has no registered ability to load`
      } else if (target !== selectedElements[0]) {
        selectedElements = [selectedElements[0], target]
        remember(target).classList.add('hatsu-dolphin-recipient')
        status = capturedTechniques.length
          ? `${capturedTechniques[0].name} loaned once to ${label} · activate it from Stealth Dolphin`
          : `${label} received no ability because the dolphin was empty`
      }
      addPoint(x, y, label)
    } else if (profile.kind === 'contract') {
      if (selectedElements.length < 2 && !selectedElements.includes(target)) {
        selectedElements = [...selectedElements, target]
        remember(target).classList.add('hatsu-contract-signatory')
        status = `${selectedElements.length}/2 voluntary signatures recorded`
      } else if (selectedElements.length === 2 && !selectedElements.includes(target)) {
        selectedElements = [...selectedElements, target]
        remember(target).classList.add('hatsu-contract-clause')
        status = `${label} written as the binding clause · touch it again to record a breach`
      } else if (selectedElements[2] === target) {
        const breacher = remember(selectedElements[1])
        breacher.style.pointerEvents = 'none'
        breacher.setAttribute('aria-disabled', 'true')
        status = `Moonlight Act enforced the accepted penalty on ${targetLabel(breacher)}`
      }
      addPoint(x, y, label)
    } else if (profile.kind === 'truth-punch') {
      const controls = Array.from(target.querySelectorAll<HTMLElement>('a,button,input,select,textarea,[hidden],[aria-hidden="true"]')).slice(0, 8)
      guideTitle = 'Body and Soul · truthful answer'
      guideItems = controls.map((control) => guideItemFor(control, targetLabel(control)))
      remember(target).classList.add('hatsu-truth-punched')
      addPoint(x, y, label, { details: [`${target.querySelectorAll('a').length} routes`, `${controls.length} controls`, `hidden=${target.hidden}`] })
      status = `${label}'s body answered: ${guideItems.length} real controls and routes found`
    } else if (profile.kind === 'blood-search') {
      const found = Array.from(target.querySelectorAll<HTMLElement>('a,[data-hatsu-character],button')).slice(0, 12)
      guideTitle = 'Bloody Mary · autonomous search drops'
      guideItems = found.map((element) => guideItemFor(element, targetLabel(element)))
      remember(target).classList.add('hatsu-blood-searched')
      status = `${guideItems.length} blood drops found navigable traces inside ${label}`
      addPoint(x, y, `${guideItems.length} DROPS`)
    } else if (profile.kind === 'legal-defense') {
      if (!selectedElements.length) {
        selectedElements = [target]
        remember(target).classList.add('hatsu-lsdf-hideout')
        status = `${label} established as Morena's hideout jurisdiction · identify an intruder`
      } else if (selectedElements.length === 1 && target !== selectedElements[0]) {
        selectedElements = [...selectedElements, target]
        remember(target).classList.add('hatsu-lsdf-defendant')
        status = `${label} charged with trespass · click again to confirm expulsion`
      } else if (selectedElements[1] === target) {
        const intruder = remember(target)
        intruder.style.transition = 'transform .7s ease, opacity .5s'
        intruder.style.transform = 'translateX(110vw)'
        intruder.style.pointerEvents = 'none'
        intruder.setAttribute('aria-disabled', 'true')
        status = `LSDF guards expelled ${label} without inflicting damage`
      }
      addPoint(x, y, label)
    } else if (profile.kind === 'damage-transfer') {
      if (!selectedElements.length) {
        selectedElements = [target]
        remember(target).classList.add('hatsu-damage-source')
        status = `${label} protected by touch · choose the damage recipient`
      } else if (selectedElements.length === 1 && target !== selectedElements[0]) {
        selectedElements = [...selectedElements, target]
        remember(target).classList.add('hatsu-damage-recipient')
        status = `${label} designated as recipient · strike ${targetLabel(selectedElements[0])} again`
      } else if (selectedElements[0] === target && selectedElements[1]) {
        const recipient = remember(selectedElements[1])
        recipient.style.maxHeight = '0'
        recipient.style.opacity = '.08'
        recipient.style.overflow = 'hidden'
        recipient.style.pointerEvents = 'none'
        status = `Damage to ${label} transferred intact into ${targetLabel(recipient)}`
      }
      addPoint(x, y, label)
    } else if (profile.kind === 'door-network') {
      if (!guideItems.some((item) => item.element === target)) guideItems = [...guideItems, guideItemFor(target, label)].slice(-8)
      guideTitle = 'Voconte · prepared hideout doors'
      remember(target).classList.add('hatsu-hideout-door')
      status = `${guideItems.length} connected rooms · use the door panel to reroute site focus`
      addPoint(x, y, `DOOR ${guideItems.length}`)
    } else if (profile.kind === 'weapon-body') {
      const control = target.closest<HTMLElement>('a,button,[role="button"],summary')
      if (!control) { status = 'Padaille can only transform a body part into a known site weapon or tool'; return true }
      if (selectedElements[0] === control) {
        executeSiteTarget(control)
        status = `${targetLabel(control)} struck with its transformed body function`
      } else {
        selectedElements = [control]
        remember(control).classList.add('hatsu-body-weapon')
        status = `${targetLabel(control)} transformed into a body weapon · click it again to strike`
      }
      addPoint(x, y, targetLabel(control))
    } else if (profile.kind === 'coercive-beast') {
      if (puppetTarget && target !== puppetTarget) {
        executeSiteTarget(puppetTarget)
        status = `${targetLabel(puppetTarget)} obeyed the Beast's remote command`
      } else {
        const controlled = remember(target)
        const level = Math.min(3, Number(controlled.dataset.hatsuLevel || 0) + 1)
        controlled.dataset.hatsuLevel = String(level)
        controlled.classList.add('hatsu-coercion-probe')
        if (level === 3) puppetTarget = controlled
        status = level === 3 ? `Unknown conditions fulfilled · ${label} is under total control` : `Unknown condition contact ${level}/3 · canon trigger remains unrevealed`
      }
      addPoint(x, y, label)
    } else if (profile.kind === 'coin-growth') {
      const holder = remember(target)
      const age = Number(holder.dataset.hatsuLevel || 0) + 1
      holder.dataset.hatsuLevel = String(age)
      const value = 10 ** Math.min(3, age - 1)
      holder.classList.add('hatsu-guardian-coin')
      if (age >= 3) {
        const locked = holder.matches('[disabled],[hidden],[aria-hidden="true"]') ? holder : holder.querySelector<HTMLElement>('[disabled],[hidden],[aria-hidden="true"]')
        if (locked) {
          remember(locked); locked.hidden = false; locked.removeAttribute('aria-hidden'); locked.removeAttribute('aria-disabled')
          if ('disabled' in locked) (locked as HTMLButtonElement).disabled = false
          locked.style.pointerEvents = 'auto'
        }
      }
      status = `Guardian coin value ${value} · ${age >= 3 ? 'accumulated Nen opened a dormant site capability' : 'continue long-term accumulation'}`
      addPoint(x, y, `₵ ${value}`)
    } else if (profile.kind === 'lie-marks') {
      const liar = remember(target)
      const lies = Math.min(3, Number(liar.dataset.hatsuLevel || 0) + 1)
      liar.dataset.hatsuLevel = String(lies)
      liar.classList.add('hatsu-lie-mark')
      if (lies === 3) { liar.style.pointerEvents = 'none'; liar.setAttribute('aria-disabled', 'true'); liar.style.filter = 'grayscale(1) blur(2px)' }
      status = ['First lie cut into the target', 'Second lie infected the mark · final warning issued', `Third lie · ${label} transformed and lost site autonomy`][lies - 1]
      addPoint(x, y, `LIE ${lies}`)
    } else if (profile.kind === 'drug-synthesis') {
      if (!selectedElements.includes(target) && selectedElements.length < 2) selectedElements = [...selectedElements, target]
      remember(target).classList.add('hatsu-research-partner')
      if (selectedElements.length === 2) {
        for (const partner of selectedElements) {
          const restored = remember(partner)
          restored.hidden = false; restored.style.pointerEvents = 'auto'; restored.style.opacity = '1'; restored.removeAttribute('aria-disabled'); restored.removeAttribute('aria-hidden')
          if ('disabled' in restored) (restored as HTMLButtonElement).disabled = false
        }
      }
      status = selectedElements.length < 2 ? 'Collaborative synthesis requires a second research partner' : `Treatment synthesized · ${selectedElements.map(targetLabel).join(' + ')} restored together`
      addPoint(x, y, label)
    } else if (profile.kind === 'aura-levy') {
      if (!guideItems.some((item) => item.element === target)) guideItems = [...guideItems, guideItemFor(target, label)].slice(-10)
      guideTitle = 'Tyson · happiness path'
      const reader = remember(target)
      reader.classList.add('hatsu-eye-wog-reader')
      const control = reader.querySelector<HTMLElement>('button,input,textarea,select')
      if (control) { remember(control); control.style.pointerEvents = 'none'; control.setAttribute('aria-disabled', 'true') }
      status = `Eye-wog levy collected aura from ${label} · happiness route added, one local control drained`
      addPoint(x, y, `READER ${guideItems.length}`)
    } else if (profile.kind === 'desire-trap') {
      if (!selectedElements.length) {
        selectedElements = [target]
        remember(target).classList.add('hatsu-desire')
        status = `${label} identified as the desired destination · choose convincing bait`
      } else if (selectedElements.length === 1 && target !== selectedElements[0]) {
        selectedElements = [...selectedElements, target]
        remember(target).classList.add('hatsu-desire-bait')
        status = `${label} materialized as bait · touching it again accepts the trap`
      } else if (selectedElements[1] === target) {
        executeSiteTarget(selectedElements[0])
        status = `${label} accepted · pseudo-coercion forced the site toward ${targetLabel(selectedElements[0])}`
      }
      addPoint(x, y, label)
    } else if (profile.kind === 'diffusive-smoke') {
      const exposed = remember(target)
      const exposure = Number(exposed.dataset.hatsuLevel || 0) + 1
      exposed.dataset.hatsuLevel = String(exposure)
      exposed.classList.add('hatsu-smoke-converted')
      const spread = [target, ...Array.from(target.parentElement?.children || []).filter((element): element is HTMLElement => element instanceof HTMLElement).slice(0, 3)]
      for (const emitter of spread) {
        remember(emitter).classList.add('hatsu-smoke-converted')
        if (!guideItems.some((item) => item.element === emitter)) guideItems = [...guideItems, guideItemFor(emitter, targetLabel(emitter))]
      }
      guideTitle = 'Salé-salé · converted goodwill network'
      status = `Smoke exposure ${exposure} · ${guideItems.length} sections now diffuse routes toward the prince`
      addPoint(x, y, `SMOKE ${exposure}`)
    } else if (profile.kind === 'solicitation') {
      if (!selectedElements.length) {
        selectedElements = [target]
        remember(target).classList.add('hatsu-solicited')
        status = `${label}, are you free? Click the same target for yes or another for refusal`
      } else if (selectedElements[0] === target) {
        const possessed = remember(target)
        possessed.classList.add('hatsu-possessed')
        possessed.setAttribute('aria-disabled', 'true')
        for (const control of possessed.querySelectorAll<HTMLElement>('a,button,input,select,textarea')) { remember(control); control.style.pointerEvents = 'none' }
        puppetTarget = possessed
        status = `${label} answered yes · spider entered and seized its site controls`
      } else {
        remember(target).classList.add('hatsu-solicitation-refusal')
        status = `${label} answered no · the small Beast remains and asks again`
      }
      addPoint(x, y, label)
    } else if (profile.kind === 'room-isolation') {
      const room = remember(target)
      room.classList.add('hatsu-isolated-room')
      room.style.position = 'relative'
      room.style.zIndex = '25'
      for (const outsider of Array.from(target.parentElement?.children || [])) {
        if (!(outsider instanceof HTMLElement) || outsider === target) continue
        remember(outsider)
        outsider.style.opacity = '.12'
        outsider.style.pointerEvents = 'none'
        outsider.setAttribute('aria-hidden', 'true')
      }
      status = `${label} isolated as the real room · surrounding visitors can access only an inert duplicate`
      addPoint(x, y, 'ROOM 1013')
    } else if (profile.kind === 'postmortem-curse') {
      if (selectedElements[0] !== target) { selectedElements = [target]; studyCount = 0 }
      studyCount += 1
      const element = remember(target)
      element.classList.add('hatsu-curse-prepared')
      element.dataset.hatsuLevel = String(studyCount)
      if (studyCount >= 5) {
        element.classList.add('hatsu-postmortem-drain')
        element.style.pointerEvents = 'none'
        status = `Sacrifice complete · ${label}'s aura is being drained by Yomotsu Hegui`
      } else status = `Preparation rite ${studyCount}/5 · fixation and resolve intensify`
      addPoint(x, y, studyCount >= 5 ? 'POST-MORTEM' : `RITE ${studyCount}`)
    } else return false

    return true
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
    const requiresCharacter = ['elastic', 'chain-rule', 'chain-bind', 'control', 'surveillance', 'curse', 'inherit', 'ability-loan'].includes(profile.kind)
    const target = (requiresCharacter
      ? eventElement.closest<HTMLElement>('[data-hatsu-character]')
      : eventElement.closest<HTMLElement>('a, button, article, section, li, [role="button"], h1, h2, h3, p'))
    if (!target) return
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

    if (profile.kind === 'elastic') {
      selectBungeeCharacter(target, x, y, label)
      return
    } else if (profile.kind === 'surveillance') {
      const change = target.dataset.hatsuNextChange || 'stable'
      const alert = change === 'dead' || change === 'moved'
      points = [{ x, y, label, id: ++sequence, alert }]
      status = change === 'dead'
        ? `${label} · death detected next chapter`
        : change === 'moved'
          ? `${label} · movement detected next chapter`
          : `${label} · no change detected next chapter`
      return
    } else if (profile.kind === 'tribunal') {
      cardIndex = (cardIndex + 1) % tribunalCards.length
      status = tribunalCards[cardIndex]
    } else if (profile.kind === 'resurrection') {
      status = status.includes('RESURRECTION') ? 'Simulate death' : 'DEATH → COUNTERATTACK → RESURRECTION'
    } else if (profile.kind === 'inherit') {
      const characterId = target.dataset.hatsuCharacter
      if (!characterId || inheritedCharacters.has(characterId) || inheritedCharacters.size >= 4) return
      const name = target.dataset.hatsuCharacterName || label
      const eligible = /vincent|musse|shikaku|balsamilco|benjamin.*soldier/i.test(`${characterId} ${name}`) || target.dataset.hatsuNextChange === 'dead'
      if (!eligible) {
        status = `${name} rejected · Benjamin Baton requires a deceased loyal Military Academy graduate`
        addPoint(x, y, 'INELIGIBLE', { alert: true })
        return
      }
      inheritedCharacters.add(characterId)
      const details = (target.dataset.hatsuList || '').split('|').filter(Boolean)
      for (const technique of profilesFromTarget(target)) {
        if (!capturedTechniques.some((candidate) => candidate.id === technique.id)) capturedTechniques = [...capturedTechniques, technique]
      }
      addPoint(x, y, label, { details })
      remember(target).classList.add('hatsu-baton-inherited')
      status = `${inheritedCharacters.size}/4 loyal abilities inherited · palm star awakened`
      return
    } else if (profile.kind === 'vehicle') {
      status = `${Math.min(points.length + 1, 5)}/5 passengers · shared aura`
    } else if (profile.kind === 'future') {
      return
    } else {
      status = `${profile.action} · ${label || 'target acquired'}`
    }
    addPoint(x, y, label)
  }

  onMount(() => {
    const move = (event: PointerEvent) => {
      cursor = { x: event.clientX, y: event.clientY }
      if (profile?.kind === 'dowsing' && points.length === 0) {
        const nearby = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('a,button,article,section,[role="button"]')
        if (nearby && !nearby.closest('[data-hatsu-ui]')) {
          const rect = nearby.getBoundingClientRect()
          const distance = Math.hypot(event.clientX - (rect.left + rect.width / 2), event.clientY - (rect.top + rect.height / 2))
          dowsingSignal = Math.max(0, Math.round(100 - distance / 3))
          status = `Pendulum tracking ${targetLabel(nearby)} · signal ${dowsingSignal}%`
        }
      }
      if (profile?.kind === 'scout' && points.length === 0) {
        const auras = document.elementsFromPoint(event.clientX, event.clientY).filter((element) => element.closest('[data-hatsu-character]')).length
        status = `Little Eye remote feed · ${auras} aura signature${auras === 1 ? '' : 's'} under cursor`
      }
      if (profile?.kind === 'needle' || profile?.kind === 'animate') {
        selectedElements.forEach((element, index) => {
          if (!element.isConnected) return
          const rect = element.getBoundingClientRect()
          const strength = profile.kind === 'needle' ? .22 : .08
          element.style.transform = `translate(${(event.clientX - rect.left) * strength}px, ${(event.clientY - rect.top) * strength + index * 3}px)`
        })
      }
      if (profile?.kind === 'training-shot' && trainingTarget) {
        const distance = Math.hypot(event.clientX - trainingOrigin.x, event.clientY - trainingOrigin.y)
        if (distance > 12) {
          trainingTarget.classList.add('hatsu-zetsu-broken')
          trainingTarget.style.pointerEvents = 'auto'
          trainingTarget = null
          status = 'Aura leaked · Zetsu broken before impact, so the sealed site action escaped'
        }
      }
    }
    const click = (event: MouseEvent) => interact(event)
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
  <div class="world-effect kind-{profile.kind}" style:--hatsu={profile.color} data-hatsu-ui data-hatsu-impact={siteImpactFor(profile)} aria-hidden={['guardian', 'portal', 'theft', 'pocket', 'spatial', 'vacuum', 'flock', 'chain-rule', 'capture', 'inherit', 'poetry', 'rhythm', 'melody', 'divination', 'prophecy', 'projection', 'relay', 'ability-loan', 'truth-punch', 'blood-search', 'door-network', 'aura-levy', 'diffusive-smoke'].includes(profile.kind) ? undefined : 'true'}>
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
              <path d="M23 43 C39 16 82 10 113 27 C126 20 139 20 148 25 C139 31 136 38 144 46 C133 47 123 43 116 38 C96 57 59 62 30 49 C24 54 17 56 10 54 C17 49 20 46 23 43 Z"></path>
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
      <div class="future-frame"><span>PARALLEL FUTURE</span><strong>{$parallelFutureVisible ? `${Math.max(0, 10 - seconds)} s` : 'ENDED'}</strong></div>
    {/if}
    {#if profile.kind === 'guardian'}
      <button class="guardian" type="button" onclick={replayGuardianEvents} aria-label="Replay the last five events"><span>♙</span><small>KACHO · NEN POST-MORTEM</small></button>
      {#if guardianReplayPoint}<div class="guardian-replay" style:left={`${guardianReplayPoint.x}px`} style:top={`${guardianReplayPoint.y}px`}><span>↻</span><small>{guardianReplayPoint.label}</small></div>{/if}
    {/if}
    {#if profile.kind === 'portal'}
      {#each portalAnchors as portal, index}
        {#if portalIsVisible(portal)}
          <button class="portal-door" type="button" style:left={`${portal.x}px`} style:top={`${portal.y}px`} onclick={() => crossPortal(index)}><span>{index === 0 ? 'START' : 'RETURN'}</span><small>{index === 0 ? 'Enter tunnel' : 'Cross back'}</small></button>
        {/if}
      {/each}
    {/if}
    {#if profile.kind === 'scout' || profile.kind === 'dowsing'}
      <div class="scout" style:left={`${cursor.x}px`} style:top={`${cursor.y}px`}><span>{profile.kind === 'scout' ? '◉' : '◇'}</span><i></i></div>
    {/if}
    {#if anchor && ['elastic', 'chain-rule', 'chain-bind', 'control', 'arrow', 'stitch'].includes(profile.kind)}
      <svg class="connections">
        {#each chainPairs as pair (pair.to.id)}
          <line x1={pair.from.x} y1={pair.from.y} x2={pair.to.x} y2={pair.to.y}></line>
        {/each}
        {#if (profile.kind !== 'arrow' || points.length < 2) && (profile.kind !== 'elastic' || !bungeeFilterActive)}<line class="live" x1={anchor.x} y1={anchor.y} x2={cursor.x} y2={cursor.y}></line>{/if}
      </svg>
    {/if}
    {#each points as point, i (point.id)}
      <div class="impact" class:paired={i % 2 === 1} class:alert={point.alert} style:left={`${point.x}px`} style:top={`${point.y}px`}>
        <span>{visualSignature?.glyph || '×'}</span>
        <small>{point.label}</small>
      </div>
    {/each}
    {#if captureZone}
      <div class="capture-zone" style:left={`${captureZone.left}px`} style:top={`${captureZone.top}px`} style:width={`${captureZone.width}px`} style:height={`${captureZone.height}px`}><span>CULDCEPT · ACQUIRING</span></div>
    {/if}
    {#if profile.kind === 'resurrection' && points.length}
      <div class="cat">CAT<br/><b>POST-MORTEM</b></div>
    {/if}
    {#if stolenTarget}
      <button class="stolen-control" type="button" onclick={useStolenControl}><span>SKILL HUNTER</span><strong>{targetLabel(stolenTarget)}</strong><small>Use stolen control</small></button>
    {/if}
    {#if storedItems.length}
      <div class="storage-tray">
        <span>{profile.kind === 'pocket' ? 'FUN FUN CLOTH' : profile.kind === 'vacuum' ? 'BLINKY STORAGE' : profile.kind === 'relay' ? 'TRANSPORT RELAY' : 'HIDDEN SPACE'}</span>
        {#each storedItems as item (item.id)}<button type="button" onclick={() => restoreStored(item)}>{item.label}</button>{/each}
      </div>
    {/if}
    {#each floatingCards as card (card.id)}
      <div class="floating-card {card.kind}" style:left={`${card.x}px`} style:top={`${card.y}px`}><span>{card.kind === 'clone' ? 'GALLERY FAKE' : 'ASTRAL DOUBLE'}</span><strong>{card.label}</strong><small>{card.kind === 'clone' ? 'Inert decoy · original interaction obstructed' : 'Body remains behind'}</small>{#if card.href}<a href={card.href}>Follow route as the double →</a>{/if}</div>
    {/each}
    {#if prophecyLines.length}
      <div class="prophecy"><span>LOVELY GHOSTWRITER</span>{#each prophecyLines as line}<p>{line}</p>{/each}</div>
    {/if}
    {#if observerReports.length}
      <div class="observer-reports"><span>PAPER SURVEILLANCE</span>{#each observerReports as report}<p><b>{report.count}</b>{report.label}</p>{/each}</div>
    {/if}
    {#if birdDispatches.length}
      <div class="bird-dispatches"><span>CLUCK · DELIVERY FLOCK</span>{#each birdDispatches as dispatch}{#if dispatch.href}<a href={dispatch.href}>◁ {dispatch.label}</a>{:else}<p>◁ {dispatch.label}</p>{/if}{/each}</div>
    {/if}
    {#if guideTitle && guideItems.length}
      <div class="site-guide"><span>{guideTitle}</span>{#each guideItems as item (item.id)}{#if item.href}<a href={item.href}>{item.label} →</a>{:else}<button type="button" onclick={() => followGuide(item)}>{item.label} →</button>{/if}{/each}</div>
    {/if}
    {#if capturedTechniques.length}
      <div class="captured-techniques"><span>{profile.kind === 'inherit' ? 'BENJAMIN BATON' : profile.kind === 'capture' ? 'CULDCEPT CARD' : profile.kind === 'ability-loan' ? 'STEALTH DOLPHIN · SINGLE-USE LOAN' : 'STEAL CHAIN · INDEX DOLPHIN'}</span>{#each capturedTechniques as technique}<button type="button" onclick={() => activateHatsu(technique)} style:--captured={technique.color}><b>{technique.name}</b><small>Activate captured Hatsu</small></button>{/each}</div>
    {/if}
    <div class="readout">
      <span>{profile.name}</span>
      <strong>{status}</strong>
      <small>{profile.rule}</small>
      {#if profile.kind === 'scarlet'}<em>LIFE CONSUMED · {$emperorTimeLifeHours} / 8,760 H</em>{/if}
      {#if profile.kind === 'inherit' && points.length}
        <div class="inherit-results">
          {#each points as point}
            <div><b>★ {point.label}</b><span>{point.details?.length ? point.details.join(' · ') : 'No known Hatsu'}</span></div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .world-effect { position: fixed; z-index: 80; inset: 0; overflow: hidden; pointer-events: none; }
  .atmosphere { position: absolute; inset: 0; border: 1px solid color-mix(in srgb, var(--hatsu) 38%, transparent); background: radial-gradient(500px circle at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, var(--hatsu) 5%, transparent), transparent 70%); box-shadow: inset 0 0 80px color-mix(in srgb, var(--hatsu) 4%, transparent); }
  .visual-signature{position:absolute;bottom:1rem;left:1rem;display:grid;width:11rem;grid-template-columns:3.5rem 1fr;grid-template-rows:auto auto;align-items:center;border:1px solid color-mix(in srgb,var(--hatsu) 42%,transparent);border-radius:.45rem;background:linear-gradient(115deg,color-mix(in srgb,var(--hatsu) 11%,#071019e8),#071019a8);padding:.55rem .7rem;color:var(--hatsu);box-shadow:0 12px 32px #0008,inset 0 0 22px color-mix(in srgb,var(--hatsu) 7%,transparent);transform-origin:1.75rem 50%;backdrop-filter:blur(8px)}
  .signature-manifestation{position:relative;display:grid;width:3rem;height:3rem;grid-row:1/3;place-items:center;border:1px solid color-mix(in srgb,var(--hatsu) 58%,transparent);border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--hatsu) 18%,#071019),#071019 70%);box-shadow:0 0 18px color-mix(in srgb,var(--hatsu) 24%,transparent)}
  .signature-manifestation::before,.signature-manifestation::after{content:'';position:absolute;inset:-.28rem;border:1px dashed color-mix(in srgb,var(--hatsu) 35%,transparent);border-radius:inherit}.signature-manifestation::after{inset:.25rem;border-style:solid;opacity:.35}
  .signature-manifestation b{position:relative;z-index:1;font:700 1.15rem/1 var(--font-mono,monospace);text-shadow:0 0 12px var(--hatsu)}
  .visual-signature>span{overflow:hidden;color:#eef3ef;font:600 .58rem/1.2 'IBM Plex Sans Condensed',sans-serif;letter-spacing:.04em;text-overflow:ellipsis;white-space:nowrap}.visual-signature>i{margin-top:.25rem;color:color-mix(in srgb,var(--hatsu) 75%,#849096);font:normal 700 .42rem/1 monospace;letter-spacing:.14em;text-transform:uppercase}
  .form-chain .signature-manifestation{border-radius:45% 45% 50% 50%;box-shadow:inset 0 0 0 4px #071019,0 0 18px var(--hatsu)}.form-beast .signature-manifestation{border-radius:55% 45% 62% 38%}.form-weapon .signature-manifestation{border-radius:.2rem;transform:rotate(-4deg)}.form-field .signature-manifestation{border-style:double;border-radius:.15rem}.form-mark .signature-manifestation{border-width:2px;background:transparent}.form-construct .signature-manifestation{border-radius:.25rem}.form-organic .signature-manifestation{border-radius:60% 30% 55% 40%}
  .signature-arrow,.signature-dolphin{position:relative;z-index:1;width:4.8rem;overflow:visible;filter:drop-shadow(0 0 5px var(--hatsu))}.signature-arrow path{fill:none;stroke:var(--hatsu);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.signature-arrow .shaft{animation:signature-arrow-flight 1.25s ease-in-out infinite}.signature-arrow .fletching{animation:signature-arrow-flight 1.25s ease-in-out infinite}.signature-dolphin path{fill:color-mix(in srgb,var(--hatsu) 18%,#071019);stroke:var(--hatsu);stroke-width:1.6;stroke-linejoin:round}.signature-dolphin circle{fill:#f3ffff;filter:drop-shadow(0 0 4px #fff)}
  .motion-pulse{animation:signature-pulse 1.6s ease-in-out infinite}.motion-orbit .signature-manifestation::before{animation:signature-orbit 4s linear infinite}.motion-strike{animation:signature-strike 1.5s ease-in-out infinite}.motion-drift{animation:signature-drift 3s ease-in-out infinite}.motion-coil .signature-manifestation::before{animation:signature-coil 1.8s ease-in-out infinite}.motion-bloom .signature-manifestation{animation:signature-bloom 2.2s ease-in-out infinite}.motion-scan .signature-manifestation::after{animation:signature-scan 1.7s ease-out infinite}.motion-flicker{animation:signature-flicker 2.4s steps(1,end) infinite}
  .kind-scarlet .atmosphere { background: radial-gradient(circle at 50% 10%, #e6193030, transparent 45%); box-shadow: inset 0 0 120px #e6193020; animation: scarlet 2.2s ease-in-out infinite; }
  .kind-disguise .atmosphere { backdrop-filter: contrast(.88) sepia(.12); background: repeating-linear-gradient(115deg, transparent 0 9px, color-mix(in srgb, var(--hatsu) 2%, transparent) 10px 11px); }
  .kind-enhance .atmosphere, .kind-blast .atmosphere { animation: power 1.1s ease-in-out infinite; }
  .kind-guardian .atmosphere { background: linear-gradient(90deg, transparent 0 48%, color-mix(in srgb, var(--hatsu) 5%, transparent) 50%, transparent 52%); }
  .connections { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
  .connections line { stroke: var(--hatsu); stroke-width: 2; filter: drop-shadow(0 0 5px var(--hatsu)); stroke-dasharray: 4 3; }
  .kind-elastic .connections line { stroke-width: 3; stroke-dasharray: none; animation: elastic .7s ease-in-out infinite alternate; }
  :global(body.bungee-gum-filtered [data-hatsu-character]:not([data-bungee-selected='true'])) { opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; }
  :global([data-hatsu-character][data-bungee-selected='true']) { z-index: 21 !important; filter: drop-shadow(0 0 8px var(--hatsu, #f06bb5)) !important; }
  .connections .live { opacity: .65; stroke-dasharray: 2 5; }
  .impact { position: absolute; display: grid; width: 2.3rem; height: 2.3rem; place-items: center; transform: translate(-50%, -50%); border: 1px solid var(--hatsu); border-radius: 50%; background: color-mix(in srgb, var(--hatsu) 14%, #071019); color: var(--hatsu); box-shadow: 0 0 0 5px color-mix(in srgb, var(--hatsu) 7%, transparent), 0 0 22px color-mix(in srgb, var(--hatsu) 38%, transparent); animation: arrive .35s ease-out; }
  .impact small { position: absolute; top: 2.6rem; width: 8rem; overflow: hidden; color: #d9dfdc; font: 500 .52rem/1.2 'IBM Plex Sans Condensed'; text-align: center; text-overflow: ellipsis; text-shadow: 0 1px 4px #000; white-space: nowrap; }
  .kind-growth .impact { border-radius: 45% 0 45% 0; font-size: 1.4rem; animation: grow 1.6s ease-out both; }
  .kind-portal .impact { width: 4rem; height: 6rem; border-width: 2px; border-radius: 50%; font: 700 .5rem/1 monospace; animation: portal 2s linear infinite; }
  .kind-surveillance .impact { animation: owl 2s ease-in-out infinite; }
  .kind-surveillance .impact.alert { border-width: 3px; background: #fff2b8; color: #1b1400; box-shadow: 0 0 10px #fff, 0 0 35px #ffd45c, 0 0 70px #ff9f43; animation: owl-alert .65s ease-in-out infinite alternate; }
  .kind-curse .impact { border-style: dashed; animation: curse 5s linear infinite; }
  .kind-capture .impact { width: 3.3rem; height: 4.6rem; border-radius: .3rem; }
  .capture-zone { position: absolute; border: 2px solid var(--hatsu); background: repeating-linear-gradient(135deg, color-mix(in srgb, var(--hatsu) 18%, transparent) 0 8px, #08071388 8px 16px); box-shadow: inset 0 0 35px color-mix(in srgb, var(--hatsu) 30%, transparent), 0 0 20px color-mix(in srgb, var(--hatsu) 35%, transparent); }
  .capture-zone span { position: absolute; top: .3rem; left: .4rem; color: #e7ddff; font: 700 .5rem/1 monospace; letter-spacing: .08em; }
  .kind-blast .impact { animation: blast .8s ease-out both; }
  .kind-arrow .impact:last-of-type { animation: blast 1.1s ease-out both; }
  .readout { position: absolute; top: 4.2rem; left: 1rem; display: flex; width: min(23rem, calc(100vw - 2rem)); flex-direction: column; border-left: 2px solid var(--hatsu); background: linear-gradient(90deg, #071019e8, #07101955, transparent); padding: .55rem .75rem; text-shadow: 0 1px 3px #000; }
  .readout > span { color: var(--hatsu); font: 600 .56rem/1 'IBM Plex Sans Condensed'; letter-spacing: .14em; text-transform: uppercase; }
  .readout strong { margin-top: .25rem; color: #f3f4ee; font-size: .75rem; }
  .readout small { margin-top: .18rem; color: #8f9b9c; font-size: .58rem; line-height: 1.25; }
  .readout em { margin-top: .4rem; color: #ff6672; font: normal 700 .62rem/1 monospace; }
  .inherit-results { display: grid; margin-top: .55rem; gap: .3rem; }
  .inherit-results div { display: flex; flex-direction: column; border-left: 1px solid var(--hatsu); padding-left: .45rem; }
  .inherit-results b { color: #f5e8ac; font-size: .6rem; }
  .inherit-results span { margin-top: .08rem; color: #a9b2ad; font-size: .55rem; line-height: 1.3; }
  .future-frame { position: absolute; top: 4rem; right: 1rem; display: flex; flex-direction: column; align-items: flex-end; color: var(--hatsu); font: .6rem monospace; }
  .future-frame strong { font-size: 1.6rem; text-shadow: 0 0 15px var(--hatsu); }
  .future-ghost { position: absolute; width: 1rem; height: 1rem; transform: translate(-50%,-50%); border: 1px solid var(--hatsu); border-radius: 50%; opacity: .45; }
  .scout { position: absolute; width: 1.8rem; height: 1.8rem; transform: translate(-50%,-50%); border: 1px solid var(--hatsu); border-radius: 50%; color: var(--hatsu); text-align: center; line-height: 1.65rem; box-shadow: 0 0 15px var(--hatsu); }
  .scout i { position: absolute; inset: -3rem; border: 1px dashed color-mix(in srgb, var(--hatsu) 40%, transparent); border-radius: 50%; }
  .guardian { position: absolute; right: 4%; bottom: 6rem; display: flex; align-items: center; gap: .5rem; border: 0; background: transparent; color: var(--hatsu); opacity: .55; cursor: pointer; pointer-events: auto; transition: opacity .2s, transform .2s; }
  .guardian:hover, .guardian:focus-visible { opacity: 1; transform: translateY(-4px); }
  .guardian span { font-size: 5rem; filter: drop-shadow(0 0 15px var(--hatsu)); }
  .guardian small { writing-mode: vertical-rl; font: .5rem monospace; letter-spacing: .1em; }
  .guardian-replay { position: absolute; display: grid; width: 3rem; height: 3rem; place-items: center; transform: translate(-50%,-50%); border: 2px solid var(--hatsu); border-radius: 50%; background: color-mix(in srgb, var(--hatsu) 18%, #071019); color: var(--hatsu); box-shadow: 0 0 28px var(--hatsu); animation: replay-event .7s ease-out; }
  .guardian-replay span { font-size: 1.25rem; }
  .guardian-replay small { position: absolute; top: 3.3rem; width: 10rem; color: #f1e7ec; font: .55rem/1.2 monospace; text-align: center; }
  .portal-door { position: absolute; display: flex; width: 4.4rem; height: 6.5rem; flex-direction: column; align-items: center; justify-content: center; transform: translate(-50%,-50%); border: 2px solid var(--hatsu); border-radius: 50%; background: radial-gradient(circle, color-mix(in srgb, var(--hatsu) 28%, #06110e), #06110edd); color: var(--hatsu); box-shadow: 0 0 22px color-mix(in srgb, var(--hatsu) 65%, transparent), inset 0 0 22px color-mix(in srgb, var(--hatsu) 30%, transparent); cursor: pointer; pointer-events: auto; animation: portal 2s linear infinite; }
  .portal-door span { font: 700 .55rem/1 monospace; letter-spacing: .08em; }
  .portal-door small { margin-top: .35rem; color: #d5f7e9; font: .48rem/1.1 monospace; }
  .cat { position: absolute; top: 50%; left: 50%; display: grid; width: 14rem; height: 14rem; place-items: center; transform: translate(-50%,-50%); border: 2px solid var(--hatsu); border-radius: 50% 50% 44% 44%; background: radial-gradient(circle, color-mix(in srgb, var(--hatsu) 20%, #071019), transparent 70%); color: var(--hatsu); font: 700 1rem/1.1 monospace; text-align: center; filter: drop-shadow(0 0 35px var(--hatsu)); animation: cat .7s ease-out; }
  .cat b { font-size: .55rem; }
  .stolen-control,.storage-tray,.floating-card,.prophecy,.observer-reports,.bird-dispatches,.captured-techniques,.site-guide{position:fixed;pointer-events:auto;border:1px solid color-mix(in srgb,var(--hatsu) 55%,#243443);background:#08131bec;color:#eef1ec;box-shadow:0 18px 50px #000b,0 0 25px color-mix(in srgb,var(--hatsu) 12%,transparent);backdrop-filter:blur(12px)}
  .stolen-control{right:1rem;bottom:6.5rem;display:grid;width:13rem;gap:.25rem;padding:.8rem;border-radius:.5rem;text-align:left;cursor:pointer}.stolen-control span,.storage-tray>span,.floating-card span,.prophecy>span,.observer-reports>span{color:var(--hatsu);font:700 .48rem/1 monospace;letter-spacing:.1em}.stolen-control strong{font-size:.72rem}.stolen-control small,.floating-card small{color:#829094;font-size:.52rem}
  .storage-tray{right:1rem;bottom:6.5rem;display:grid;width:min(17rem,calc(100vw - 2rem));gap:.35rem;padding:.7rem;border-radius:.55rem}.storage-tray button{overflow:hidden;border:1px solid #2c3b45;border-radius:.3rem;background:#101d25;padding:.45rem;color:#d9dfdc;font-size:.58rem;text-align:left;text-overflow:ellipsis;white-space:nowrap;cursor:pointer}.storage-tray button:hover{border-color:var(--hatsu)}
  .floating-card{display:grid;width:15rem;gap:.3rem;padding:1rem;border-radius:.5rem;transform:rotate(-1deg);animation:arrive .4s ease-out}.floating-card.clone{opacity:.92;filter:grayscale(.25);cursor:not-allowed}.floating-card.projection{border-style:dashed;background:#08131bc7}.floating-card strong{overflow:hidden;font-size:.75rem;text-overflow:ellipsis;white-space:nowrap}.floating-card a{margin-top:.35rem;color:var(--hatsu);font-size:.58rem;text-decoration:none}
  .prophecy{right:1rem;top:7rem;width:min(23rem,calc(100vw - 2rem));padding:1rem;border-radius:.3rem;background:linear-gradient(145deg,#171020ed,#080d13f2)}.prophecy p{margin:.55rem 0 0;color:#d5c9df;font:italic .67rem/1.45 Georgia,serif}
  .observer-reports{right:1rem;top:7rem;display:grid;width:16rem;gap:.35rem;padding:.8rem}.observer-reports p{display:grid;grid-template-columns:2rem 1fr;margin:0;color:#aeb8b8;font-size:.58rem}.observer-reports b{color:var(--hatsu);font-size:.8rem}
  .bird-dispatches{right:1rem;top:7rem;display:grid;width:min(18rem,calc(100vw - 2rem));gap:.3rem;padding:.8rem;border-radius:.6rem}.bird-dispatches>span{color:var(--hatsu);font:700 .48rem/1 monospace;letter-spacing:.1em}.bird-dispatches :is(a,p){margin:0;padding:.4rem;border-top:1px solid #273744;color:#dce7ec;font-size:.58rem;text-decoration:none}.bird-dispatches a:hover{color:var(--hatsu)}
  .site-guide{right:1rem;top:7rem;display:grid;width:min(19rem,calc(100vw - 2rem));max-height:42vh;overflow:auto;gap:.3rem;padding:.8rem;border-radius:.55rem}.site-guide>span{color:var(--hatsu);font:700 .48rem/1.3 monospace;letter-spacing:.08em;text-transform:uppercase}.site-guide :is(a,button){border:1px solid #293a45;border-radius:.3rem;background:#101d25;padding:.48rem;color:#dce7ec;font-size:.58rem;text-align:left;text-decoration:none;cursor:pointer}.site-guide :is(a,button):hover{border-color:var(--hatsu);color:var(--hatsu)}
  .captured-techniques{right:1rem;bottom:6.5rem;display:grid;width:min(18rem,calc(100vw - 2rem));gap:.4rem;padding:.8rem;border-radius:.55rem}.captured-techniques>span{color:var(--hatsu);font:700 .48rem/1 monospace;letter-spacing:.1em}.captured-techniques button{display:grid;gap:.2rem;border:1px solid color-mix(in srgb,var(--captured) 45%,#2b3945);border-radius:.35rem;background:color-mix(in srgb,var(--captured) 7%,#0d1922);padding:.55rem;color:#e9eee9;text-align:left;cursor:pointer}.captured-techniques button:hover{border-color:var(--captured)}.captured-techniques b{font-size:.68rem}.captured-techniques small{color:#899698;font-size:.5rem}
  :global(.hatsu-texture-surprise){position:relative!important;background:repeating-linear-gradient(calc(35deg + var(--texture-index) * 18deg),color-mix(in srgb,var(--hatsu,#d98fc4) 18%,#18222b) 0 8px,#25323a 9px 14px)!important;color:transparent!important;text-shadow:none!important;box-shadow:inset 0 0 0 1px #d98fc488!important}:global(.hatsu-texture-surprise>*){visibility:hidden!important}:global(.hatsu-texture-surprise)::after{content:attr(data-hatsu-forgery);position:absolute;inset:0;display:grid;place-items:center;color:#f2e9ef;font:700 .62rem/1.2 monospace;letter-spacing:.08em;pointer-events:none}:global(.hatsu-full-efficiency){outline:1px solid #ef334088!important;box-shadow:0 0 24px #ef334022!important}
  :global(.hatsu-aura-drained){filter:grayscale(1) brightness(.38)!important;box-shadow:inset 0 0 20px #d7dce244!important}:global(.hatsu-chain-jailed){filter:grayscale(1)!important;box-shadow:0 0 0 3px #c9ced6,inset 0 0 25px #c9ced666!important}:global(.hatsu-invalid-chain-target){animation:fatal-vow .8s ease-out!important}:global(.hatsu-dowsing-found){outline:1px solid #8ecae6!important}:global(.hatsu-dowsing-alert){outline:2px dashed #ff9d7a!important;filter:contrast(1.2)!important}
  :global(.hatsu-reinforced){position:relative!important;box-shadow:inset 0 0 calc(8px * var(--reinforcement)) color-mix(in srgb,#f0b429 10%,transparent),0 0 0 calc(1px * var(--reinforcement)) #f0b42955!important;transform:scale(calc(1 + var(--reinforcement) * .012))!important}:global(.hatsu-royal-controlled){outline:1px solid #70d6b288!important}:global(.hatsu-erigeron-grown){transform-origin:center!important;transition:transform .45s,filter .45s!important}:global(.hatsu-passenger){box-shadow:inset 0 -2px #f2a65a!important}
  :global(.hatsu-little-eye-host){outline:1px dashed #55c2ff!important;filter:saturate(1.2)!important}:global(.hatsu-cross-blue){outline:2px solid #5ba8ff!important}:global(.hatsu-cross-warning){box-shadow:inset 0 0 0 3px #f0c94d!important}:global(.hatsu-cross-restrained){clip-path:inset(0 round .2rem)!important;filter:grayscale(.65)!important}:global(.hatsu-cross-expelled){transition:transform .6s,opacity .5s!important}
  :global(.hatsu-beyond-cursed){box-shadow:inset 0 0 20px #9d65d033!important}:global(.hatsu-sacrifice-carrier){outline:1px dashed #9d65d0!important}:global(.hatsu-sacrifice-dead){animation:sacrifice-death .8s forwards!important}:global(.hatsu-curse-triggered){animation:curse-trigger 1.4s forwards!important}:global(.hatsu-air-blown){filter:blur(.3px)!important}:global(.hatsu-secret-window){box-shadow:0 0 0 2px #a8b7d8,0 0 25px #a8b7d844!important}:global(.hatsu-future-afterimage){box-shadow:8px 0 #7dd3fc33,-8px 0 #b36bff33!important}
  :global(.hatsu-camilla-killer){outline:1px solid #ff8fab!important}:global(.hatsu-cat-crushed){animation:cat-crush 1s forwards!important}:global(.hatsu-culdcept-drained){filter:grayscale(.8) brightness(.55)!important}:global(.hatsu-baton-inherited){box-shadow:0 0 0 2px #ffd166,0 0 20px #ffd16655!important}:global(.hatsu-soul-transferred){filter:hue-rotate(120deg)!important}:global(body.hatsu-portal-exhausted main){filter:brightness(.55) saturate(.55);transform:scale(.985);transition:filter .6s,transform .6s}
  :global(body.hatsu-haiku-weather main){filter:sepia(.18) saturate(1.15);animation:haiku-weather 5s ease-in-out infinite}:global(body.hatsu-haiku-weather main::before){content:'俳';position:fixed;z-index:70;right:8vw;top:18vh;color:#e7c87325;font:12rem/1 serif;pointer-events:none}
  :global(.hatsu-restored){filter:saturate(1.2) brightness(1.08)!important;box-shadow:0 0 0 1px #f3b6d288,0 0 35px #f3b6d222!important;animation:restore-pulse 1.2s ease-out}
  :global(.hatsu-transformed-body){transform:scale(.72)!important;transform-origin:center!important;border-radius:45%!important;filter:saturate(.65)!important}
  :global(body.hatsu-rhythm main){animation:site-rhythm 1.2s ease-in-out infinite}:global(.hatsu-rhythm-hit){animation:rhythm-hit .6s ease-in-out infinite alternate!important}
  :global(.hatsu-jupiter-impact){position:relative!important;transition:max-height .7s,opacity .5s,transform .65s!important;transform:scaleY(.12) translateY(5rem)!important;filter:brightness(.35)!important}
  :global(.hatsu-model){outline:1px dashed #a889c8!important}:global(.hatsu-metamorphosen){box-shadow:0 0 30px #a889c844!important}
  :global(.hatsu-stolen){filter:grayscale(1)!important}:global(.hatsu-bookmarked){outline:2px solid #9c7ac4!important;background:#0c1420f2!important}
  :global(.hatsu-devoured){color:transparent!important;text-shadow:0 0 9px #78b6c9!important;background:repeating-radial-gradient(circle at 30% 50%,transparent 0 5px,#061018 6px 10px)!important}:global(.hatsu-devoured *){opacity:.12!important}
  :global(.hatsu-teleport-source){outline:1px dashed #7dd4d0!important}:global(.hatsu-sun-mark){box-shadow:inset 0 0 35px #ffb34755!important}:global(.hatsu-moon-mark){box-shadow:inset 0 0 35px #8590df55!important}:global(.hatsu-polarity-detonate){animation:polarity-detonate .7s ease-out forwards!important}
  :global(.hatsu-stamped)::after{content:'人';position:absolute;color:#cf6d62;font:1rem/1 monospace}:global(.hatsu-left-hand){outline:2px solid #f0c0dc!important}:global(.hatsu-right-hand){outline:2px solid #8aa9ce!important}
  :global(.hatsu-antenna){box-shadow:0 -8px 0 -6px #7f92b8!important}:global(.hatsu-bullet-hit){box-shadow:inset 0 0 20px #e6ad5733!important}:global(.hatsu-sleeping-body){filter:grayscale(.8) brightness(.55)!important}
  :global(.hatsu-animated-object){position:relative!important;animation:animated-object 1.5s ease-in-out infinite!important}:global(.hatsu-needle-puppet){filter:saturate(.2) contrast(1.25)!important;transition:transform .25s ease-out!important}:global(.hatsu-paper-observed){outline:1px dashed #efb9c8!important}
  :global(.hatsu-remote-punched){animation:remote-punch .55s ease-out!important}:global(.hatsu-stitch-edge){border-bottom:2px dashed #dd77b7!important}:global(.hatsu-stitched){border-color:#dd77b7!important;box-shadow:inset 0 -2px #dd77b766!important}
  :global(body.hatsu-melody main){animation:melody-breathe 3s ease-in-out infinite}:global(.hatsu-note){outline:1px solid #70c6d766!important}:global(.hatsu-infected){position:relative!important;box-shadow:inset 0 0 0 1px #d94f6866!important}:global(.hatsu-infected)::after{content:'LV ' attr(data-hatsu-level);position:absolute;z-index:4;right:.25rem;top:.25rem;color:#ff8a9b;font:700 .45rem/1 monospace}
  :global(.hatsu-cyclotron-release){animation:cyclotron-release .65s ease-out!important}:global(.hatsu-studied){outline:1px dotted #7bb66c!important}:global(.hatsu-predated){opacity:.1!important;filter:grayscale(1)!important;transform:scale(.85)!important}:global(.hatsu-staff-pinned){box-shadow:inset 4px 0 #d5a94f!important}
  :global(body.hatsu-no-sight main){filter:blur(12px) brightness(.2)!important}:global(body.hatsu-no-hearing main){animation:none!important;filter:grayscale(1) contrast(.8)}:global(body.hatsu-no-speech main :is(input,textarea,button):not([data-hatsu-pass])){pointer-events:none!important;opacity:.35!important}
  :global(.hatsu-suspect){outline:1px dashed #8765aa!important}:global(.hatsu-snake-victim){animation:snake-drain 1.2s ease-out forwards!important}:global(.hatsu-zetsu-test){box-shadow:inset 0 0 0 2px #8fe3f0!important}:global(.hatsu-training-hit){animation:training-hit .7s ease-out!important}:global(.hatsu-zetsu-broken){box-shadow:inset 0 0 25px #ef5b5b66!important}
  :global(.hatsu-serpent-bound){transform:scaleX(.72)!important;filter:hue-rotate(35deg)!important;box-shadow:inset 14px 0 #86c98a44,inset -14px 0 #86c98a44!important}:global(.hatsu-bird-dispatched){outline:1px dotted #b9d8e8!important}:global(.hatsu-relay-cargo)::after{content:'RELAY ' attr(data-hatsu-level);position:absolute;color:#e2b86e;font:700 .45rem monospace}:global(.hatsu-curse-prepared){box-shadow:inset 0 0 0 2px #a04f6855!important}:global(.hatsu-postmortem-drain){animation:postmortem-drain 3s ease-in forwards!important}
  :global(.hatsu-holy-healed){outline:2px solid #d9f1df!important}:global(.hatsu-vow-subject),:global(.hatsu-contract-signatory){box-shadow:inset 0 0 0 2px #d7dce266!important}:global(.hatsu-vow-clause),:global(.hatsu-contract-clause){outline:2px dashed #d7dce2!important}:global(.hatsu-vow-enforced){filter:grayscale(1) brightness(.45)!important}:global(.hatsu-dolphin-analyzed){outline:2px solid #63d5e6!important}:global(.hatsu-dolphin-recipient){box-shadow:0 0 24px #63d5e666!important}:global(.hatsu-truth-punched){outline:2px solid #f1a06d!important}:global(.hatsu-blood-searched){box-shadow:inset 0 0 24px #b51f3c55!important}
  :global(.hatsu-lsdf-hideout){outline:2px double #d4c58b!important}:global(.hatsu-lsdf-defendant){box-shadow:inset 0 0 0 2px #d4c58b!important}:global(.hatsu-damage-source){outline:1px solid #db8b78!important}:global(.hatsu-damage-recipient){outline:2px dashed #db8b78!important}:global(.hatsu-hideout-door){border-left:4px solid #7ec8b6!important}:global(.hatsu-body-weapon){box-shadow:inset 0 -5px #c6925e!important}:global(.hatsu-coercion-probe)::after{content:'? ' attr(data-hatsu-level) '/3';color:#d98cae;font:700 .5rem monospace}:global(.hatsu-guardian-coin)::after{content:'COIN AGE ' attr(data-hatsu-level);color:#d7b34f;font:700 .45rem monospace}
  :global(.hatsu-lie-mark){box-shadow:inset 0 0 0 calc(1px * var(--hatsu-level,1)) #9e6d89!important}:global(.hatsu-research-partner){outline:1px dashed #91bd72!important}:global(.hatsu-eye-wog-reader){box-shadow:inset 0 0 18px #ef91c444!important}:global(.hatsu-desire){outline:2px solid #98b65c!important}:global(.hatsu-desire-bait){box-shadow:0 0 25px #98b65c77!important}:global(.hatsu-smoke-converted){filter:saturate(.8) hue-rotate(18deg)!important}:global(.hatsu-solicited){outline:1px dashed #e8a9a1!important}:global(.hatsu-possessed){filter:grayscale(.75)!important}:global(.hatsu-solicitation-refusal){box-shadow:inset 0 0 16px #e8a9a155!important}:global(.hatsu-isolated-room){box-shadow:0 0 0 3px #7095d6,0 0 40px #7095d655!important}
  @keyframes arrive { from { opacity: 0; transform: translate(-50%,-50%) scale(2); } }
  @keyframes elastic { to { stroke-width: 5; } }
  @keyframes scarlet { 50% { opacity: .72; } }
  @keyframes power { 50% { box-shadow: inset 0 0 140px color-mix(in srgb, var(--hatsu) 10%, transparent); } }
  @keyframes grow { from { transform: translate(-50%,-50%) scale(.15) rotate(-50deg); } to { transform: translate(-50%,-50%) scale(1.4) rotate(0); } }
  @keyframes portal { to { box-shadow: 0 0 25px var(--hatsu), inset 0 0 30px var(--hatsu); } }
  @keyframes owl { 50% { transform: translate(-50%,-60%); } }
  @keyframes owl-alert { to { transform: translate(-50%,-55%) scale(1.18); } }
  @keyframes curse { to { transform: translate(-50%,-50%) rotate(360deg); } }
  @keyframes blast { from { box-shadow: 0 0 0 0 var(--hatsu); } to { box-shadow: 0 0 0 14rem transparent; opacity: 0; } }
  @keyframes cat { from { transform: translate(-50%,-50%) scale(3); opacity: 0; } }
  @keyframes replay-event { from { opacity: 0; transform: translate(-50%,-50%) scale(2.2); } }
  @keyframes haiku-weather{50%{filter:sepia(.3) saturate(1.3) brightness(.92)}}
  @keyframes restore-pulse{from{transform:scale(.96);opacity:.55}}
  @keyframes site-rhythm{50%{transform:translateY(-2px)}}
  @keyframes rhythm-hit{to{transform:translateY(-5px) rotate(.4deg)}}
  @keyframes polarity-detonate{to{transform:scale(1.8);opacity:0;filter:brightness(4)}}
  @keyframes animated-object{50%{transform:translateY(-6px) rotate(2deg)}}
  @keyframes remote-punch{0%{transform:translateX(0)}35%{transform:translateX(-45px) scale(.94)}100%{transform:translateX(0)}}
  @keyframes melody-breathe{50%{filter:saturate(1.12);transform:translateY(-1px)}}
  @keyframes cyclotron-release{50%{transform:rotate(360deg) scale(1.35);filter:brightness(2)}}
  @keyframes snake-drain{to{filter:grayscale(1);opacity:.06;transform:scale(.8)}}
  @keyframes training-hit{50%{box-shadow:0 0 0 4rem #8fe3f000;filter:brightness(2)}}
  @keyframes postmortem-drain{to{filter:grayscale(1) brightness(.18);opacity:.12;transform:scale(.94)}}
  @keyframes fatal-vow{50%{filter:brightness(3) saturate(0);transform:scale(.92)}to{opacity:.2}}
  @keyframes sacrifice-death{to{filter:grayscale(1);opacity:.08;transform:scale(.8)}}
  @keyframes curse-trigger{50%{box-shadow:0 0 0 5rem #9d65d000;filter:brightness(2)}to{filter:grayscale(1) brightness(.2);opacity:.15}}
  @keyframes cat-crush{50%{transform:scale(.55);filter:brightness(3)}to{opacity:.06;transform:scale(.1)}}
  @keyframes signature-pulse{50%{box-shadow:0 12px 32px #0008,0 0 22px color-mix(in srgb,var(--hatsu) 28%,transparent);transform:scale(1.025)}}
  @keyframes signature-orbit{to{transform:rotate(360deg)}}
  @keyframes signature-strike{0%,72%,100%{transform:translateX(0)}78%{transform:translateX(7px)}84%{transform:translateX(-2px)}}
  @keyframes signature-drift{50%{transform:translateY(-5px)}}
  @keyframes signature-coil{50%{inset:-.65rem;transform:rotate(18deg)}}
  @keyframes signature-bloom{50%{border-radius:35% 65% 42% 58%;transform:scale(1.08)}}
  @keyframes signature-scan{0%{clip-path:inset(0 100% 0 0)}60%,100%{clip-path:inset(0)}}
  @keyframes signature-flicker{0%,91%,100%{opacity:1}92%{opacity:.25}94%{opacity:.8}96%{opacity:.35}}
  @keyframes signature-arrow-flight{0%,25%{transform:translateX(-12px);opacity:.2}55%,100%{transform:translateX(5px);opacity:1}}
  @media (max-width:700px){.visual-signature{bottom:5.8rem;width:min(11rem,calc(100vw - 2rem))}.visual-signature>span{white-space:normal}.readout{top:4rem}}
  @media (prefers-reduced-motion: reduce) { .world-effect * { animation: none !important; } }
</style>
