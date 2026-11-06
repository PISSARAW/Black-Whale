<script lang="ts">
  import { onDestroy, type Snippet } from 'svelte'
  import ReconstructionTransport from './ReconstructionTransport.svelte'
  import { t } from '$lib/i18n'
  import { Fullscreen } from '$lib/tour/fullscreen.svelte'
  import { reconstructionWords } from '$lib/reconstruction/workspaceWords'
  import ReconstructionDrawer from './ReconstructionDrawer.svelte'
  let {
    viewMode = $bindable('overview'),
    observer = $bindable('canon'),
    selectedId = $bindable(null),
    observers,
    event,
    index,
    count,
    isPlaying,
    filtered,
    loading,
    error,
    activeTechnique,
    follow,
    onEnter,
    onChoose,
    onPlay,
    children,
    timeline,
    inspector,
    filters,
  }: {
    viewMode?: 'overview' | 'scene'
    observer?: string
    selectedId?: string | null
    observers: { id: string; name: string }[]
    event: { chapter: number; title: string; time: string | null }
    index: number
    count: number
    isPlaying: boolean
    filtered: boolean
    loading: boolean
    error: boolean
    activeTechnique: string | null
    follow: {
      name: string
      count: number
      onPrevious: () => void
      onNext: () => void
      onStop: () => void
    } | null
    onEnter: () => void
    onChoose: (index: number) => void
    onPlay: () => void
    children: Snippet<[boolean, (id: string) => void, (tier: string) => void]>
    timeline: Snippet<[() => void]>
    inspector: Snippet<['event' | 'person', () => void, string | null]>
    filters: Snippet<[boolean, (value: boolean) => void, () => void]>
  } = $props()
  let panel = $state<'timeline' | 'event' | 'person' | 'filters' | null>(null)
  let showNames = $state(false)
  let selectedDeck = $state<string | null>(null)
  let opener = $state<HTMLElement | null>(null)
  const screen = new Fullscreen()
  $effect(() => screen.watch())
  onDestroy(() => screen.leave())
  const title = $derived(
    panel === 'timeline'
      ? $reconstructionWords.timeline
      : panel === 'filters'
        ? $reconstructionWords.filters
        : panel === 'person'
          ? $reconstructionWords.people
          : $reconstructionWords.event,
  )
  function openPanel(kind: typeof panel, trigger?: HTMLElement | null) {
    selectedDeck = null
    opener =
      trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null)
    panel = kind
  }
  function close() {
    panel = null
  }
  function inspect(id: string) {
    selectedId = id
    openPanel('person')
  }
  function inspectDeck(tier: string) {
    selectedId = null
    openPanel('person')
    selectedDeck = tier
  }
  function editing(target: EventTarget | null) {
    return (
      target instanceof HTMLElement &&
      Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
    )
  }
  function keyboard(event: KeyboardEvent) {
    if (event.metaKey || event.ctrlKey || event.altKey || panel) return
    if (editing(event.target)) return
    if (event.key.toLowerCase() === 'v') {
      event.preventDefault()
      void screen.toggle()
    }
    if (event.key === 'Escape' && screen.immersive && !screen.native) {
      event.preventDefault()
      void screen.toggle()
    }
  }
</script>

<svelte:window onkeydown={keyboard} />
<div class="reconstruction-workspace" class:immersive={screen.immersive}>
  <div class="workspace-toolbar" data-hatsu-pass>
    <nav class="view-switch" aria-label={$t.reconstruction.viewLabel}>
      <button
        type="button"
        aria-pressed={viewMode === 'overview'}
        onclick={() => (viewMode = 'overview')}>{$reconstructionWords.ship}</button
      >
      <button type="button" aria-pressed={viewMode === 'scene'} onclick={onEnter}
        >{$reconstructionWords.scene}</button
      >
    </nav>
    <label class="observer"
      ><span class="sr-only">{$t.reconstruction.perspective}</span><select
        aria-busy={loading}
        bind:value={observer}
        ><option value="canon">{$t.reconstruction.canonicalPerspective}</option
        >{#each observers as character (character.id)}<option value={character.id}
            >{character.name}</option
          >{/each}</select
      ></label
    >
    <div class="workspace-actions">
      <button
        type="button"
        onclick={(event) => openPanel('timeline', event.currentTarget)}
        aria-haspopup="dialog">{$reconstructionWords.timeline}</button
      >
      <button
        type="button"
        class:filtered
        onclick={(event) => openPanel('filters', event.currentTarget)}
        aria-haspopup="dialog"
        >{$reconstructionWords.filters}{#if filtered || showNames}<span aria-hidden="true">
            ·</span
          >{/if}</button
      >
      <button
        type="button"
        class="fullscreen"
        onclick={() => screen.toggle()}
        aria-pressed={screen.immersive}
        aria-label={screen.immersive ? $t.tour.fullscreen.exit : $t.tour.fullscreen.enter}
        title={screen.immersive ? $t.tour.fullscreen.exit : $t.tour.fullscreen.enter}
        ><svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5" /></svg
        ></button
      >
    </div>
  </div>
  <button
    class="event-strip"
    type="button"
    onclick={(event) => openPanel('event', event.currentTarget)}
    aria-label={$reconstructionWords.details}
    aria-haspopup="dialog"
    data-hatsu-pass
  >
    <span class="event-heading"
      ><small
        >{$t.common.chapterShort(event.chapter)}{#if event.time}
          · {event.time}{/if}</small
      ><strong>{event.title}</strong></span
    ><span class="details-label">{$reconstructionWords.details} →</span>
  </button>
  {#if loading}<p class="perspective-status" role="status">
      {$t.reconstruction.loadingPerspective}
    </p>{:else if error}<p class="perspective-status" role="alert">
      {$t.reconstruction.perspectiveUnavailable}
    </p>{/if}
  <section class="reconstruction-stage" aria-label={$t.reconstruction.currentState}>
    {@render children(showNames, inspect, inspectDeck)}
    {#if activeTechnique}<button
        class="nen-active"
        type="button"
        onclick={(event) => openPanel('filters', event.currentTarget)}
        data-hatsu-pass>Nen · {activeTechnique}</button
      >{/if}
  </section>
  {#if follow}<div class="follow-bar" data-hatsu-pass>
      <span
        >{$t.reconstruction.following} · <strong>{follow.name}</strong><small
          >{$t.reconstruction.followCount(follow.count)}</small
        ></span
      >
      <div>
        <button
          type="button"
          aria-label={$t.reconstruction.previousTrace}
          onclick={follow.onPrevious}>←</button
        ><button type="button" aria-label={$t.reconstruction.nextTrace} onclick={follow.onNext}
          >→</button
        ><button type="button" aria-label={$reconstructionWords.unfollow} onclick={follow.onStop}
          >×</button
        >
      </div>
    </div>{/if}
  <ReconstructionTransport
    {index}
    {count}
    {isPlaying}
    {onChoose}
    {onPlay}
    immersive={screen.immersive}
    onTimeline={(event) => openPanel('timeline', event.currentTarget as HTMLElement)}
  />
</div>
<ReconstructionDrawer open={panel !== null} {title} {opener} onClose={close}>
  {#if panel === 'timeline'}{@render timeline(close)}{:else if panel === 'filters'}{@render filters(
      showNames,
      (value) => (showNames = value),
      close,
    )}{:else if panel}{@render inspector(panel, close, selectedDeck)}{/if}
</ReconstructionDrawer>

<style>
  .reconstruction-workspace {
    max-width: 1800px;
    margin: auto;
    padding: 0 var(--page-gutter) 3rem;
  }
  .workspace-toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem 0.8rem;
    margin-bottom: 0.6rem;
  }
  .view-switch {
    display: flex;
    gap: 0.15rem;
    padding: 0.2rem;
    border: 1px solid #303d44;
    border-radius: 5px;
  }
  button {
    min-height: 44px;
    padding: 0.5rem 0.8rem;
    border: 1px solid #303d44;
    border-radius: 4px;
    background: #0b1419;
    color: #b9c7cc;
    font-size: 0.8rem;
  }
  button:hover {
    color: #f1dfb9;
    border-color: #a78d51;
  }
  .view-switch button {
    min-height: 38px;
    border: 0;
    background: transparent;
    padding: 0.4rem 0.75rem;
  }
  .view-switch button[aria-pressed='true'] {
    background: #29291d;
    color: #e5c57a;
  }
  .observer {
    flex: 0 1 250px;
    min-width: 0;
  }
  select {
    width: 100%;
    min-height: 44px;
    padding: 0.5rem 0.75rem;
    border: 1px solid #303d44;
    border-radius: 4px;
    background: #0b1419;
    color: #c7d1d5;
    font-size: 0.8rem;
  }
  .workspace-actions {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-left: auto;
  }
  .filtered {
    border-color: #a78d51;
    color: #e5c57a;
  }
  .fullscreen {
    display: inline-flex;
    width: 44px;
    padding: 0.6rem;
    align-items: center;
    justify-content: center;
  }
  svg {
    width: 18px;
    height: 18px;
  }
  .event-strip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    width: 100%;
    border-radius: 5px 5px 0 0;
    padding: 0.65rem 0.85rem;
    text-align: left;
  }
  .event-heading {
    display: grid;
    min-width: 0;
    gap: 0.25rem;
  }
  .event-heading small {
    color: #bca56a;
    font-size: 0.65rem;
  }
  .event-heading strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.85rem;
    font-weight: 500;
    color: #e1e7e6;
  }
  .details-label {
    flex-shrink: 0;
    font-size: 0.7rem;
    color: #b7b49d;
  }
  .reconstruction-stage {
    position: relative;
    min-width: 0;
    height: clamp(280px, calc(100svh - 373px), 820px);
    overflow: hidden;
    border-inline: 1px solid #303d44;
    background: #03080b;
  }
  .perspective-status {
    padding: 0.5rem;
    font-size: 0.75rem;
    color: #b5c8d0;
    background: #16242b;
  }
  .nen-active {
    position: absolute;
    top: 0.7rem;
    right: 0.7rem;
    font-size: 0.7rem;
    background: #0e171df5;
  }
  .follow-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.5rem 0.8rem;
    border: 1px solid #33515a;
    color: #a6c5cb;
    background: #0b1b22;
    font-size: 0.75rem;
  }
  .follow-bar small {
    display: block;
    margin-top: 0.2rem;
    color: #829da6;
    font-size: 0.65rem;
  }
  .follow-bar > div {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 0;
  }
  .follow-bar button {
    min-width: 44px;
    padding: 0.4rem;
  }
  .immersive {
    position: fixed;
    inset: 0;
    z-index: 90;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100dvh;
    max-width: none;
    padding: 0;
    background: #03080b;
  }
  .immersive .workspace-toolbar {
    padding: 0.4rem 0.7rem;
    margin: 0;
    flex-shrink: 0;
  }
  .immersive .event-strip {
    border-radius: 0;
    flex-shrink: 0;
  }
  .immersive .reconstruction-stage {
    flex: 1;
    height: auto;
    min-height: 0;
  }

  @media (max-width: 700px) {
    .reconstruction-workspace {
      padding: 0 0.6rem 1rem;
    }
    .workspace-toolbar {
      gap: 0.5rem;
    }
    .observer {
      flex-basis: 100%;
      order: 3;
    }
    .view-switch {
      flex: 1;
    }
    .view-switch button {
      flex: 1;
      padding: 0.4rem;
      font-size: 0.75rem;
    }
    .workspace-actions {
      gap: 0.3rem;
    }
    .workspace-actions button {
      font-size: 0.7rem;
      padding: 0.5rem 0.55rem;
    }
    .event-strip {
      gap: 0.5rem;
    }
    .details-label {
      font-size: 0;
    }
    .details-label::after {
      content: '→';
      font-size: 1rem;
    }
    .reconstruction-stage {
      height: max(280px, calc(100svh - 400px));
    }

    .immersive {
      padding: 0;
    }
  }
</style>
