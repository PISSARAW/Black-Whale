<script lang="ts">
  import { onDestroy, onMount, tick, untrack } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { locale } from '$lib/i18n'
  import { activeHatsu, activateHatsu } from '$lib/nen/hatsuState'
  import { HATSU_PROFILES } from '$lib/nen/hatsuRegistry'
  import type { Ship } from '$lib/tour/blueprint'
  import type { TourWorld } from '$lib/tour/hatsu'
  import type { TourNavigationState } from '$lib/tour/pageNavigationState.svelte'
  import { pointInPolygon, structureFootprint } from '$lib/tour/geometry'
  import { applyMangaView } from '$lib/tour/mangaRequest.svelte'
  import { mangaViewById } from '$lib/tour/mangaViews'
  import { startMelodyConcert } from '$lib/audio/ambient/melodyConcert'
  import {
    MELODY_CONCERT,
    CONCERT_ROOMS,
    concertPosition,
    beginPlayerConcert,
    endPlayerConcert,
    type ConcertPerformance,
    type PlayerConcertRestore,
  } from '$lib/tour/melodyConcert'

  interface Props {
    ship: Ship
    navigation: TourNavigationState
    world: TourWorld
    performance: ConcertPerformance
    allowed: boolean
    cap: number | null
  }
  let {
    ship,
    navigation,
    world = $bindable(),
    performance = $bindable(),
    allowed,
    cap,
  }: Props = $props()
  let remaining = $state(MELODY_CONCERT.durationSeconds)
  let message = $state('')
  let timer: ReturnType<typeof setInterval> | null = null
  let silence: (() => void) | null = null
  let restore: PlayerConcertRestore | null = null
  const french = $derived($locale === 'fr')
  const inHall = $derived(CONCERT_ROOMS.some((id) => id === navigation.currentSpace?.id))
  const stage = $derived(ship.structures.find(({ id }) => id === 'tier-1-banquet-hall-stage')!)
  const onStage = $derived(
    navigation.currentSpace?.id === stage.spaceId &&
      pointInPolygon(navigation.position, structureFootprint(stage)),
  )
  const locked = $derived(cap !== null && cap < MELODY_CONCERT.chapter)
  const unavailable = $derived(!inHall || (performance.mode === 'melody' && locked))
  const interrupted = $derived(
    performance.mode === 'self' &&
      (!onStage || !allowed || $activeHatsu?.kind !== 'melody' || world.body.playing !== 'bloom'),
  )
  const clock = $derived(`${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`)

  function stop(clearMode = false): void {
    if (timer) clearInterval(timer)
    timer = null
    silence?.()
    silence = null
    if (restore) world = endPlayerConcert(world, restore)
    restore = null
    performance = { mode: clearMode ? null : performance.mode, playing: false }
  }

  function play(mode: 'melody' | 'self'): void {
    if (mode === 'self' && (!onStage || !allowed || $activeHatsu?.kind !== 'melody')) return
    stop()
    message = ''
    if (mode === 'self') {
      const started = beginPlayerConcert(world, ship)
      restore = started.restore
      world = started.world
    }
    performance = { mode, playing: true }
    remaining = MELODY_CONCERT.durationSeconds
    silence = startMelodyConcert()
    const startedAt = Date.now()
    timer = setInterval(() => {
      remaining = Math.max(
        0,
        MELODY_CONCERT.durationSeconds - Math.floor((Date.now() - startedAt) / 1000),
      )
      if (remaining === 0) stop()
    }, 250)
  }

  function playFree(): void {
    if (locked) return
    if ($page.url.searchParams.has('mangaView')) {
      const url = new URL($page.url)
      url.searchParams.delete('mangaView')
      void goto(url, { noScroll: true, keepFocus: true })
    }
    play('melody')
  }

  function concertShortcut(event: KeyboardEvent): void {
    const target = event.target
    const editable =
      target instanceof HTMLElement &&
      (target.isContentEditable || target.closest('input, textarea, select') !== null)
    if (
      event.key.toLowerCase() !== 'j' ||
      event.repeat ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      editable ||
      !inHall ||
      (locked && !performance.playing)
    )
      return
    // J for "jouer" is deliberately outside movement, navigation and Nen keys.
    // Claim it before the scene records held movement keys.
    event.preventDefault()
    event.stopImmediatePropagation()
    if (performance.playing) stop()
    else playFree()
  }

  async function requestConcert(): Promise<void> {
    if (locked) return
    stop()
    document.exitPointerLock?.()
    const url = new URL($page.url)
    url.searchParams.set('mangaView', 'banquet-melody-concert')
    url.searchParams.set('space', stage.spaceId)
    try {
      await goto(url, { noScroll: true, keepFocus: true })
      applyMangaView(navigation, mangaViewById('banquet-melody-concert')!)
      await tick()
      play('melody')
    } catch {
      message = french ? 'Impossible de préparer le concert.' : 'Could not prepare the concert.'
    }
  }

  async function takeStage(): Promise<void> {
    stop()
    const profile = HATSU_PROFILES.find(({ kind }) => kind === 'melody')!
    if (!activateHatsu(profile)) {
      message = french
        ? 'Le hatsu de Melody est actuellement indisponible.'
        : 'Melody’s Hatsu is currently unavailable.'
      return
    }
    await tick()
    navigation.goToSpace(ship.spaces.get(stage.spaceId)!, concertPosition())
    navigation.jumpHeading = 0
    navigation.jumpPitch = 0
    performance = { mode: 'self', playing: false }
    message = ''
  }

  $effect(() => {
    if (performance.mode !== null && unavailable) {
      untrack(() => stop(true))
      return
    }
    if (!performance.playing) return
    if (!inHall || interrupted) untrack(() => stop(!inHall))
  })
  onMount(() => {
    window.addEventListener('keydown', concertShortcut, true)
    return () => window.removeEventListener('keydown', concertShortcut, true)
  })
  onDestroy(() => stop(true))
</script>

{#if inHall}
  <details class="concert" data-hatsu-pass open>
    <summary>{french ? 'Concert de Melody' : 'Melody’s concert'} <span>ch. 383</span></summary>
    <div class="concert-body">
      {#if performance.playing}
        <div class="playing">
          <span
            >{performance.mode === 'self'
              ? french
                ? 'Ton concert'
                : 'Your concert'
              : french
                ? 'Melody joue'
                : 'Melody is playing'}</span
          >
          <output role="timer" aria-label={french ? 'Temps restant' : 'Time remaining'}
            >{clock}</output
          >
        </div>
        <p>
          {french
            ? 'Promène-toi dans le paysage fleuri : la vision couvre toute la salle, jusqu’au bout de service.'
            : 'Walk through the flowered landscape: the vision fills the entire hall, including the service end.'}
        </p>
        <button type="button" class="stop" onclick={() => stop()} aria-keyshortcuts="J"
          >{french ? 'Arrêter le concert' : 'Stop the concert'} <kbd>J</kbd></button
        >
      {:else}
        <p>
          {french
            ? 'Écoute son solo ou prends sa flûte. Les deux escaliers donnent accès à la scène.'
            : 'Listen to her solo or take her flute. Both staircases lead onto the stage.'}
        </p>
        <div class="actions">
          <button
            type="button"
            class="play-melody"
            onclick={playFree}
            disabled={locked}
            aria-keyshortcuts="J"
            title={french
              ? 'Lancer la performance de Melody en visite libre'
              : 'Play Melody’s performance with free navigation'}
            >{french ? 'Faire jouer Melody · 3 min' : 'Play Melody · 3 min'} <kbd>J</kbd></button
          >
          <button type="button" onclick={requestConcert} disabled={locked}
            >{french ? 'Demander le concert' : 'Request the concert'}</button
          >
          <button type="button" onclick={takeStage}
            >{french ? 'Faire mon concert' : 'Perform my concert'}</button
          >
        </div>
        {#if onStage && $activeHatsu?.kind === 'melody'}
          <button type="button" class="play" onclick={() => play('self')} disabled={!allowed}
            >{french ? 'Jouer de la flûte · 3 min' : 'Play the flute · 3 min'}</button
          >
          {#if !allowed}<p>
              {french ? 'Passe en Ten pour utiliser le hatsu.' : 'Enter Ten to use the Hatsu.'}
            </p>{/if}
        {/if}
        {#if locked}<p>
            {french
              ? 'Le chapitre 383 dépasse ta limite de lecture.'
              : 'Chapter 383 is beyond your reading limit.'}
          </p>{/if}
      {/if}
      {#if message}<p role="status">{message}</p>{/if}
    </div>
  </details>
{/if}

<style>
  .concert {
    position: absolute;
    bottom: 1rem;
    left: 1rem;
    width: min(330px, calc(100% - 2rem));
    z-index: 15;
    border: 1px solid #877343;
    border-radius: 4px;
    background: rgb(9 12 13 / 94%);
    color: #eee9da;
    box-shadow: 0 8px 30px #0005;
    font-size: 12px;
  }
  summary {
    padding: 0.7rem 0.85rem;
    cursor: pointer;
    color: #e6ca87;
  }
  summary span {
    float: right;
    font-size: 10px;
    color: #a7a291;
  }
  .concert-body {
    padding: 0 0.85rem 0.85rem;
  }
  p {
    margin: 0 0 0.65rem;
    color: #bbb8aa;
    line-height: 1.45;
    font-size: 11px;
  }
  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.45rem;
  }
  .actions .play-melody {
    grid-column: 1 / -1;
    border-color: #877343;
    background: #2b2819;
    color: #f2d481;
    font-weight: 600;
  }
  .actions .play-melody:hover:not(:disabled) {
    border-color: #e4c36f;
    background: #3b3620;
    color: #fff2a8;
  }
  button {
    min-height: 38px;
    padding: 0.45rem 0.55rem;
    border: 1px solid #665c42;
    border-radius: 3px;
    background: #21231c;
    color: #eee9da;
    cursor: pointer;
  }
  button:hover {
    border-color: #d2b56d;
    background: #313326;
  }
  button:focus-visible {
    outline: 2px solid #e4c36f;
    outline-offset: 3px;
  }
  button:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .play,
  .stop {
    width: 100%;
    margin-top: 0.5rem;
    color: #ead18d;
  }
  .playing {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.4rem;
  }
  output {
    font-variant-numeric: tabular-nums;
    color: #f2d481;
  }
  kbd {
    margin-left: 0.35rem;
    padding: 0.08rem 0.3rem;
    border: 1px solid #877343;
    border-radius: 3px;
    background: #111413;
    color: #f8e6ae;
    font: inherit;
    font-size: 10px;
  }
</style>
