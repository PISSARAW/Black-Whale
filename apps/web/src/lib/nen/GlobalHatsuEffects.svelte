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

  function interact(event: MouseEvent) {
    const eventElement = event.target as Element
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
    const move = (event: PointerEvent) => cursor = { x: event.clientX, y: event.clientY }
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
  <div class="world-effect kind-{profile.kind}" style:--hatsu={profile.color} data-hatsu-ui aria-hidden={['guardian', 'portal'].includes(profile.kind) ? undefined : 'true'}>
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
    {#if anchor && ['elastic', 'chain-rule', 'chain-bind', 'control', 'arrow'].includes(profile.kind)}
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
  @media (prefers-reduced-motion: reduce) { .world-effect * { animation: none !important; } }
</style>
