<script lang="ts">
  import { t } from '$lib/i18n'
  import { mapState } from '$lib/state/mapState.svelte'
  import type { ShipController } from '../../../routes/ship/shipController.svelte'
  import type { PageData } from '../../../routes/ship/$types'

  let { data, ship }: { data: PageData; ship: ShipController } = $props()
  let expanded = $state(false)
  let playing = $state(false)
  let progress = $derived(
    data.events.length < 2 ? 100 : (data.selectedEventIndex / (data.events.length - 1)) * 100,
  )

  function stop() {
    playing = false
    mapState.playingTimeline = false
  }

  function step(index: number) {
    stop()
    void ship.selectEventIndex(index)
  }

  function editableTarget(target: EventTarget | null) {
    const element = target as HTMLElement | null
    return Boolean(
      element?.matches('input, select, textarea, [contenteditable="true"]') ||
      document.querySelector('[role="dialog"]'),
    )
  }

  function handleKeydown(event: KeyboardEvent) {
    if (editableTarget(event.target) || event.altKey || event.metaKey || event.ctrlKey) return
    if (event.key === 'ArrowLeft' && data.selectedEventIndex > 0) {
      event.preventDefault()
      step(data.selectedEventIndex - 1)
    } else if (event.key === 'ArrowRight' && data.selectedEventIndex < data.events.length - 1) {
      event.preventDefault()
      step(data.selectedEventIndex + 1)
    }
  }

  function visibilityChanged() {
    if (document.hidden) stop()
  }

  $effect(() => {
    mapState.playingTimeline = playing
    if (!playing) return
    if (data.selectedEventIndex >= data.events.length - 1) {
      stop()
      return
    }
    const timer = window.setTimeout(() => {
      void ship.selectEventIndex(data.selectedEventIndex + 1)
    }, 2500)
    return () => window.clearTimeout(timer)
  })
</script>

<svelte:window onkeydown={handleKeydown} onvisibilitychange={visibilityChanged} />

<footer class="timeline">
  <div class="timeline-bar">
    <button
      class="timeline-toggle"
      aria-expanded={expanded}
      aria-controls="ship-timeline-events"
      onclick={() => (expanded = !expanded)}
    >
      <span class="timeline-label"
        >{$t.ship.timeline} <span aria-hidden="true">{expanded ? '−' : '+'}</span></span
      >
      <span class="event-title">{ship.currentEvt?.title || $t.ship.currentState}</span>
    </button>
    <div class="event-navigation">
      <button
        class="step"
        aria-label={$t.ship.workspace.previous}
        disabled={data.selectedEventIndex <= 0 || !data.events.length}
        onclick={() => step(data.selectedEventIndex - 1)}>←</button
      >
      <span class="event-meta">
        {$t.ship.chapterBadge} <strong>{ship.currentEvt?.chapter.number ?? '—'}</strong>
        <span> · {$t.ship.eventBadge} {ship.currentEvt?.sequence ?? '—'}</span>
      </span>
      <button
        class="step"
        aria-label={$t.ship.workspace.next}
        disabled={data.selectedEventIndex >= data.events.length - 1 || !data.events.length}
        onclick={() => step(data.selectedEventIndex + 1)}>→</button
      >
      <button
        class="play"
        aria-label={playing ? $t.ship.workspace.pause : $t.ship.workspace.play}
        aria-pressed={playing}
        disabled={data.selectedEventIndex >= data.events.length - 1 || !data.events.length}
        onclick={() => (playing ? stop() : (playing = true))}>{playing ? 'Ⅱ' : '▶'}</button
      >
      <button
        class="changes"
        aria-label={$t.ship.workspace.showChanges}
        aria-pressed={mapState.showEventChanges}
        disabled={!data.nextEventDelta?.length}
        onclick={() => (mapState.showEventChanges = !mapState.showEventChanges)}>△</button
      >
    </div>
  </div>
  {#if expanded}
    <div id="ship-timeline-events" class="timeline-events">
      {#if data.events.length}
        <label for="ship-event">{$t.ship.workspace.selectEvent}</label>
        <select
          id="ship-event"
          value={data.selectedEventIndex}
          onchange={(event) => step(Number(event.currentTarget.value))}
        >
          {#each data.events as event, index (event.id)}
            <option value={index}
              >{$t.common.chapterShort(event.chapter.number)} · {event.sequence} — {event.title}</option
            >
          {/each}
        </select>
        <div class="range-row">
          <span>{$t.common.chapterShort(data.events[0].chapter.number)}</span>
          <input
            style={`--progress:${progress}%`}
            aria-label={$t.ship.timelineEvent}
            type="range"
            min="0"
            max={data.events.length - 1}
            value={data.selectedEventIndex}
            onchange={(event) => step(Number(event.currentTarget.value))}
          />
          <span>{$t.common.chapterShort(data.events[data.events.length - 1].chapter.number)}</span>
        </div>
        <p>
          {#if ship.currentEvt?.isFlashback}{$t.ship.flashbackBadge}
          {/if}{ship.currentEvt?.occurredAtLabel || ''}
        </p>
      {:else}
        <p>{$t.ship.noEvents}</p>
      {/if}
    </div>
  {/if}
</footer>

<style>
  .timeline {
    border-top: 1px solid var(--line);
    background: var(--surface-deep);
  }
  .timeline-bar {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    padding: 0.5rem 0.85rem;
  }
  button {
    min-height: 44px;
    border: 0;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
  }
  .timeline-toggle {
    display: grid;
    min-width: 0;
    gap: 0.25rem;
    padding: 0.25rem;
    text-align: left;
  }
  .timeline-label {
    color: var(--accent-gold);
    font: 0.6rem var(--font-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .timeline-label span {
    margin-left: 0.5rem;
  }
  .event-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.8rem;
  }
  .event-navigation {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    gap: 0.5rem;
  }
  .step {
    width: 44px;
    border: 1px solid var(--line);
    border-radius: 0.35rem;
    font-size: 1rem;
  }
  .play,
  .changes {
    width: 44px;
    border: 1px solid var(--line);
    border-radius: 0.35rem;
    font-size: 0.72rem;
  }
  .play[aria-pressed='true'],
  .changes[aria-pressed='true'] {
    border-color: var(--accent-gold);
    color: var(--accent-gold-bright);
    background: rgba(200, 169, 86, 0.08);
  }
  button:disabled {
    opacity: 0.25;
    cursor: default;
  }
  button:hover:not(:disabled) {
    color: var(--accent-gold-bright);
  }
  .event-meta {
    color: var(--text-muted);
    font: 0.65rem var(--font-mono);
    white-space: nowrap;
  }
  strong {
    color: var(--text-primary);
    font-weight: 500;
  }
  .timeline-events {
    padding: 0.75rem 1rem 1rem;
    border-top: 1px solid var(--line);
  }
  label {
    display: block;
    margin-bottom: 0.6rem;
    color: var(--text-secondary);
    font-size: 0.75rem;
  }
  select {
    width: 100%;
    min-height: 44px;
    padding: 0.5rem;
    border: 1px solid var(--line);
    border-radius: 0.35rem;
    background: var(--surface-raised);
    color: var(--text-primary);
    font-size: 0.8rem;
  }
  .range-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    margin-top: 0.8rem;
    color: var(--text-muted);
    font: 0.6rem var(--font-mono);
  }
  input {
    flex: 1;
    min-width: 0;
    min-height: 32px;
    accent-color: var(--accent-gold);
    cursor: pointer;
  }
  p {
    color: var(--text-muted);
    font-size: 0.7rem;
  }
  button:focus-visible,
  select:focus-visible,
  input:focus-visible {
    outline: 2px solid var(--accent-gold);
    outline-offset: 2px;
  }
  @media (max-width: 600px) {
    .timeline-bar {
      gap: 0.25rem;
      padding: 0.5rem;
    }
    .timeline-toggle {
      flex: 1;
    }
    .event-navigation {
      gap: 0.2rem;
    }
    .event-meta {
      display: none;
    }
  }
</style>
