<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { mapState, type ZoomLevel } from '$lib/state/mapState.svelte'
  import { activeHatsu, consumeEmperorTimeHour, emperorTimeLifeHours, parallelFutureVisible } from './hatsuState.js'

  type Point = { x: number; y: number; label: string; id: number; alert?: boolean; details?: string[] }
  type CaptureZone = { left: number; top: number; width: number; height: number }
  type RecordedEvent = { x: number; y: number; label: string }
  type PortalAnchor = { x: number; y: number; label: string; url: string; zoom: ZoomLevel; tier: string | null; location: string | null }
  type ElementSnapshot = { style: string; className: string }
  type StoredItem = { id: number; element: HTMLElement; label: string; mode: 'cloth' | 'space' | 'vacuum' }
  type FloatingCard = { id: number; x: number; y: number; label: string; kind: 'clone' | 'projection' }
  type BirdDispatch = { id: number; label: string; href: string | null }
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
  let captureStart: { x: number; y: number } | null = null
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
  const snapshots = new Map<HTMLElement, ElementSnapshot>()
  const observers: MutationObserver[] = []
  const effectTimers = new Set<ReturnType<typeof setTimeout>>()
  const bungeeSelected = new Set<string>()
  const inheritedCharacters = new Set<string>()
  const tribunalCards = ['BLEU · ADMISSION', 'JAUNE · AVERTISSEMENT', 'JAUNE · RESTRAINT', 'ROUGE · EXPULSION']

  $: profile = $activeHatsu
  $: if (profile?.id !== previousId) {
    cleanupTechniqueState()
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

  function cleanupTechniqueState() {
    cleanupBungeeSelection()
    if (futureTimer) clearTimeout(futureTimer)
    if (captureTimer) clearTimeout(captureTimer)
    futureTimer = null
    captureTimer = null
    captureStart = null
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
    for (const observer of observers) observer.disconnect()
    observers.length = 0
    for (const timer of effectTimers) clearTimeout(timer)
    effectTimers.clear()
    for (const [element, snapshot] of snapshots) {
      if (!element.isConnected) continue
      element.style.cssText = snapshot.style
      element.className = snapshot.className
      delete element.dataset.hatsuLevel
      delete element.dataset.hatsuStored
    }
    snapshots.clear()
    if (typeof document !== 'undefined') {
      document.body.classList.remove(
        'hatsu-haiku-weather', 'hatsu-rhythm', 'hatsu-melody',
        'hatsu-no-sight', 'hatsu-no-hearing', 'hatsu-no-speech'
      )
    }
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
    if (!snapshots.has(element)) snapshots.set(element, { style: element.style.cssText, className: element.className })
    return element
  }

  function restoreStored(item: StoredItem) {
    const snapshot = snapshots.get(item.element)
    if (snapshot && item.element.isConnected) {
      item.element.style.cssText = snapshot.style
      item.element.className = snapshot.className
      delete item.element.dataset.hatsuStored
      snapshots.delete(item.element)
    }
    storedItems = storedItems.filter((candidate) => candidate.id !== item.id)
    status = `${item.label} restored from ${item.mode}`
  }

  function useStolenControl() {
    if (!stolenTarget || puppetExecuting) return
    puppetExecuting = true
    stolenTarget.click()
    schedule(() => { puppetExecuting = false }, 0)
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
    if (!characterId || bungeeSelected.has(characterId)) return

    bungeeSelected.add(characterId)
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

  function isInsideZone(x: number, y: number, zone: CaptureZone) {
    return x >= zone.left && x <= zone.left + zone.width && y >= zone.top && y <= zone.top + zone.height
  }

  function interactWithCuldcept(event: MouseEvent, eventElement: Element) {
    if (captureZone) {
      if (isInsideZone(event.clientX, event.clientY, captureZone)) {
        event.preventDefault()
        event.stopPropagation()
        status = 'Sealed zone · interaction blocked'
      }
      return true
    }

    if (!eventElement.closest('.map-canvas')) return true
    event.preventDefault()
    event.stopPropagation()

    if (!captureStart) {
      captureStart = { x: event.clientX, y: event.clientY }
      points = []
      addPoint(event.clientX, event.clientY, 'First corner')
      status = 'Choose the opposite corner of the sealed zone'
      return true
    }

    const left = Math.min(captureStart.x, event.clientX)
    const top = Math.min(captureStart.y, event.clientY)
    captureZone = {
      left,
      top,
      width: Math.max(24, Math.abs(event.clientX - captureStart.x)),
      height: Math.max(24, Math.abs(event.clientY - captureStart.y))
    }
    addPoint(event.clientX, event.clientY, 'Opposite corner')
    captureStart = null
    status = 'Zone sealed for 10 seconds'
    captureTimer = setTimeout(() => {
      captureZone = null
      points = []
      status = 'Seal released · choose a new zone'
      captureTimer = null
    }, 10000)
    return true
  }

  function recordGuardianEvent(event: MouseEvent, eventElement: Element) {
    if (profile?.kind !== 'guardian' || eventElement.closest('[data-hatsu-ui]')) return
    const target = eventElement.closest<HTMLElement>('a, button, article, section, li, [role="button"], h1, h2, h3, p')
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
    status = `Crossed to ${destination.label}`
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
    addPoint(event.clientX, event.clientY, targetLabel(target))
    status = `Arrow released · forced perspective: ${target.dataset.hatsuCharacterName || targetLabel(target)}`
    void forceTargetPerspective(target)
    return true
  }

  function extendedInteraction(event: MouseEvent, target: HTMLElement, x: number, y: number, label: string) {
    if (!profile) return false

    if (profile.kind === 'poetry') {
      addPoint(x, y, label)
      if (points.length >= 3) {
        document.body.classList.add('hatsu-haiku-weather')
        status = points.slice(-3).map((point) => point.label).join(' / ')
      } else status = `${points.length}/3 lines selected · continue the haiku`
    } else if (profile.kind === 'restoration') {
      remember(target).classList.add('hatsu-restored')
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      status = `${label} · fatigue cleared, equivalent to eight hours of rest`
      addPoint(x, y, label)
    } else if (profile.kind === 'transformation') {
      remember(target).classList.toggle('hatsu-transformed-body')
      status = target.classList.contains('hatsu-transformed-body') ? `${label} · compact form` : `${label} · true form restored`
      addPoint(x, y, label)
    } else if (profile.kind === 'rhythm') {
      remember(target).classList.add('hatsu-rhythm-hit')
      document.body.classList.add('hatsu-rhythm')
      status = `Beat ${points.length + 1} · ${label}`
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
        status = `${label} transformed into ${targetLabel(model)}`
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
      const best = [...points, { x, y, label, id: sequence + 1 }].sort((a, b) => (b.details?.[0] || '').localeCompare(a.details?.[0] || ''))[0]
      status = `Dial ${affinity}% · strongest signal: ${best?.label || label}`
    } else if (profile.kind === 'prophecy') {
      const links = target.querySelectorAll('a').length
      const words = (target.textContent || '').trim().split(/\s+/).length
      prophecyLines = [
        `The ${label.slice(0, 18)} waits beneath a black tide.`,
        `${links || 'No'} paths open; only one returns unchanged.`,
        `When ${words % 12 || 12} bells are counted, an ally becomes a door.`,
        `Guard the final link, or the Whale will erase its name.`
      ]
      status = `Four-line fortune written for ${label}`
      addPoint(x, y, label)
    } else if (profile.kind === 'clone') {
      floatingCards = [...floatingCards, { id: ++sequence, x: Math.min(innerWidth - 180, x + 35), y: Math.min(innerHeight - 100, y + 25), label, kind: 'clone' }]
      status = `${label} copied · replica has no original function`
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
      floatingCards = [{ id: ++sequence, x: Math.max(16, Math.min(innerWidth - 320, x)), y: Math.max(80, Math.min(innerHeight - 220, y)), label, kind: 'projection' }]
      remember(target).classList.add('hatsu-sleeping-body')
      status = `Astral double inspecting ${label} · body must remain undisturbed`
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
      if (existing >= 5) element.style.opacity = '0'
      status = `${label} · paper cut ${existing}/5`
      addPoint(x, y, label)
    } else if (profile.kind === 'remote-strike') {
      const element = remember(target)
      element.classList.remove('hatsu-remote-punched')
      void element.offsetWidth
      element.classList.add('hatsu-remote-punched')
      status = `Aura crossed the page and struck ${label}`
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
      } else {
        const first = selectedElements[0]
        remember(first); remember(target)
        first.classList.add('hatsu-stitched')
        target.classList.add('hatsu-stitched')
        first.style.marginBottom = '0'
        target.style.marginTop = '0'
        addPoint(x, y, label)
        status = `${targetLabel(first)} and ${label} sewn into one body`
      }
    } else if (profile.kind === 'melody') {
      document.body.classList.add('hatsu-melody')
      remember(target).classList.add('hatsu-note')
      status = `Note ${points.length + 1} · ${label} resonates calmly`
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
      status = `Contagion level ${next} · ${current ? 'infection spread to neighboring members' : 'new member initiated'}`
      addPoint(x, y, `LV ${next}`)
    } else if (profile.kind === 'windup') {
      if (selectedElements[0] !== target) { selectedElements = [target]; windupPower = 0 }
      windupPower += 1
      const element = remember(target)
      element.style.transform = `rotate(${windupPower * 18}deg) scale(${1 + windupPower * .025})`
      element.style.transition = 'transform .2s ease'
      if (windupPower >= 6) {
        element.classList.add('hatsu-cyclotron-release')
        status = `Ripper Cyclotron released at ×${windupPower} power`
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
      remember(target).classList.add('hatsu-staff-pinned')
      for (const sibling of Array.from(target.parentElement?.children || [])) {
        if (!(sibling instanceof HTMLElement) || sibling === target) continue
        remember(sibling)
        const direction = sibling.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
        sibling.style.transform = `translateX(${direction * 28}px)`
        sibling.style.transition = 'transform .35s ease'
      }
      status = `Priest Staff extended through ${label} · neighbors repelled`
      addPoint(x, y, label)
    } else if (profile.kind === 'senses') {
      sensesStage = (sensesStage + 1) % 4
      document.body.classList.toggle('hatsu-no-sight', sensesStage >= 1)
      document.body.classList.toggle('hatsu-no-hearing', sensesStage >= 2)
      document.body.classList.toggle('hatsu-no-speech', sensesStage >= 3)
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
      remember(target).classList.add('hatsu-zetsu-test')
      status = `Maintain perfect focus for 3 seconds · do not move`
      addPoint(x, y, label)
      schedule(() => {
        if (!trainingTarget) return
        trainingTarget.classList.add('hatsu-training-hit')
        status = `${label} maintained Zetsu · controlled shot survived`
        trainingTarget = null
      }, 3000)
    } else if (profile.kind === 'serpent') {
      const element = remember(target)
      const restrained = element.classList.toggle('hatsu-serpent-bound')
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
      status = `Cargo ${label} · relay stage ${stage}/3${stage === 3 ? ' · delivered without teleportation' : ''}`
      addPoint(x, y, `RELAY ${stage}`)
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
    const requiresCharacter = ['elastic', 'surveillance', 'inherit'].includes(profile.kind)
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
      inheritedCharacters.add(characterId)
      const details = (target.dataset.hatsuList || '').split('|').filter(Boolean)
      addPoint(x, y, label, { details })
      status = `${inheritedCharacters.size}/4 selected abilities`
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
          trainingTarget = null
          status = 'Aura leaked · Zetsu broken before impact'
        }
      }
    }
    const blockCapturePointer = (event: PointerEvent) => {
      if (profile?.kind !== 'capture' || !captureZone || !isInsideZone(event.clientX, event.clientY, captureZone)) return
      event.preventDefault()
      event.stopPropagation()
    }
    const click = (event: MouseEvent) => interact(event)
    const timer = window.setInterval(() => {
      if (!profile) return
      seconds += 1
      if (profile.kind === 'scarlet') consumeEmperorTimeHour()
    }, 1000)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', blockCapturePointer, true)
    window.addEventListener('click', click, true)
    window.addEventListener('contextmenu', placePortal, true)
    return () => {
      clearInterval(timer)
      cleanupTechniqueState()
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', blockCapturePointer, true)
      window.removeEventListener('click', click, true)
      window.removeEventListener('contextmenu', placePortal, true)
    }
  })

  $: anchor = points.length ? points[points.length - 1] : null
  $: chainPairs = points.slice(1).map((point, index) => ({ from: points[index], to: point }))
</script>

{#if profile}
  <div class="world-effect kind-{profile.kind}" style:--hatsu={profile.color} data-hatsu-ui aria-hidden={['guardian', 'portal', 'theft', 'pocket', 'spatial', 'vacuum', 'flock'].includes(profile.kind) ? undefined : 'true'}>
    <div class="atmosphere"></div>
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
        <span>
          {#if profile.kind === 'growth'}✦
          {:else if profile.kind === 'surveillance'}◉
          {:else if profile.kind === 'portal'}{i % 2 ? 'RETURN' : 'DOOR'}
          {:else if profile.kind === 'inherit'}★
          {:else if profile.kind === 'curse'}⌁
          {:else if profile.kind === 'capture'}▣
          {:else if profile.kind === 'tribunal'}{cardIndex === 3 ? '■' : cardIndex === 0 ? '●' : '◆'}
          {:else if profile.kind === 'vehicle'}{i + 1}
          {:else if profile.kind === 'poetry'}句
          {:else if profile.kind === 'polarity'}{i % 2 ? '☾' : '☀'}
          {:else if profile.kind === 'melody'}♫
          {:else if profile.kind === 'infection'}{point.label}
          {:else if profile.kind === 'snakes'}{i + 1}
          {:else if profile.kind === 'training-shot'}◎
          {:else}×{/if}
        </span>
        <small>{point.label}</small>
      </div>
    {/each}
    {#if captureZone}
      <div class="capture-zone" style:left={`${captureZone.left}px`} style:top={`${captureZone.top}px`} style:width={`${captureZone.width}px`} style:height={`${captureZone.height}px`}><span>CULDCEPT · SEALED</span></div>
    {/if}
    {#if profile.kind === 'resurrection' && points.length}
      <div class="cat">CAT<br/><b>POST-MORTEM</b></div>
    {/if}
    {#if stolenTarget}
      <button class="stolen-control" type="button" onclick={useStolenControl}><span>SKILL HUNTER</span><strong>{targetLabel(stolenTarget)}</strong><small>Use stolen control</small></button>
    {/if}
    {#if storedItems.length}
      <div class="storage-tray">
        <span>{profile.kind === 'pocket' ? 'FUN FUN CLOTH' : profile.kind === 'vacuum' ? 'BLINKY STORAGE' : 'HIDDEN SPACE'}</span>
        {#each storedItems as item (item.id)}<button type="button" onclick={() => restoreStored(item)}>{item.label}</button>{/each}
      </div>
    {/if}
    {#each floatingCards as card (card.id)}
      <div class="floating-card {card.kind}" style:left={`${card.x}px`} style:top={`${card.y}px`}><span>{card.kind === 'clone' ? 'GALLERY FAKE' : 'ASTRAL DOUBLE'}</span><strong>{card.label}</strong><small>{card.kind === 'clone' ? 'Visual copy · no function' : 'Body remains behind'}</small></div>
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
  .stolen-control,.storage-tray,.floating-card,.prophecy,.observer-reports,.bird-dispatches{position:fixed;pointer-events:auto;border:1px solid color-mix(in srgb,var(--hatsu) 55%,#243443);background:#08131bec;color:#eef1ec;box-shadow:0 18px 50px #000b,0 0 25px color-mix(in srgb,var(--hatsu) 12%,transparent);backdrop-filter:blur(12px)}
  .stolen-control{right:1rem;bottom:6.5rem;display:grid;width:13rem;gap:.25rem;padding:.8rem;border-radius:.5rem;text-align:left;cursor:pointer}.stolen-control span,.storage-tray>span,.floating-card span,.prophecy>span,.observer-reports>span{color:var(--hatsu);font:700 .48rem/1 monospace;letter-spacing:.1em}.stolen-control strong{font-size:.72rem}.stolen-control small,.floating-card small{color:#829094;font-size:.52rem}
  .storage-tray{right:1rem;bottom:6.5rem;display:grid;width:min(17rem,calc(100vw - 2rem));gap:.35rem;padding:.7rem;border-radius:.55rem}.storage-tray button{overflow:hidden;border:1px solid #2c3b45;border-radius:.3rem;background:#101d25;padding:.45rem;color:#d9dfdc;font-size:.58rem;text-align:left;text-overflow:ellipsis;white-space:nowrap;cursor:pointer}.storage-tray button:hover{border-color:var(--hatsu)}
  .floating-card{display:grid;width:15rem;gap:.3rem;padding:1rem;border-radius:.5rem;transform:rotate(-1deg);animation:arrive .4s ease-out}.floating-card.clone{opacity:.82;filter:grayscale(.25)}.floating-card.projection{border-style:dashed;background:#08131bc7}.floating-card strong{overflow:hidden;font-size:.75rem;text-overflow:ellipsis;white-space:nowrap}
  .prophecy{right:1rem;top:7rem;width:min(23rem,calc(100vw - 2rem));padding:1rem;border-radius:.3rem;background:linear-gradient(145deg,#171020ed,#080d13f2)}.prophecy p{margin:.55rem 0 0;color:#d5c9df;font:italic .67rem/1.45 Georgia,serif}
  .observer-reports{right:1rem;top:7rem;display:grid;width:16rem;gap:.35rem;padding:.8rem}.observer-reports p{display:grid;grid-template-columns:2rem 1fr;margin:0;color:#aeb8b8;font-size:.58rem}.observer-reports b{color:var(--hatsu);font-size:.8rem}
  .bird-dispatches{right:1rem;top:7rem;display:grid;width:min(18rem,calc(100vw - 2rem));gap:.3rem;padding:.8rem;border-radius:.6rem}.bird-dispatches>span{color:var(--hatsu);font:700 .48rem/1 monospace;letter-spacing:.1em}.bird-dispatches :is(a,p){margin:0;padding:.4rem;border-top:1px solid #273744;color:#dce7ec;font-size:.58rem;text-decoration:none}.bird-dispatches a:hover{color:var(--hatsu)}
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
  @media (prefers-reduced-motion: reduce) { .world-effect * { animation: none !important; } }
</style>
