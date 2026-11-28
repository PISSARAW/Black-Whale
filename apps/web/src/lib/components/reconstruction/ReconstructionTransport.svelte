<script lang="ts">
  import MangaIcon from '$lib/components/icons/MangaIcon.svelte'
  import { t } from '$lib/i18n'
  import { reconstructionWords } from '$lib/reconstruction/workspaceWords'
  let {
    index,
    count,
    isPlaying,
    onChoose,
    onPlay,
    onTimeline,
    immersive,
    arrowShortcuts,
  }: {
    index: number
    count: number
    isPlaying: boolean
    immersive: boolean
    arrowShortcuts: boolean
    onChoose: (index: number) => void
    onPlay: () => void
    onTimeline: (event: MouseEvent) => void
  } = $props()
</script>

<footer
  class="reconstruction-transport mode-hud mode-hud-surface"
  class:immersive
  data-tone="gold"
  data-hatsu-pass
>
  <div class="playback">
    <button
      type="button"
      aria-label={$t.reconstruction.previous}
      aria-keyshortcuts={arrowShortcuts ? 'ArrowLeft' : undefined}
      disabled={index === 0}
      onclick={() => onChoose(index - 1)}>←</button
    ><button
      type="button"
      class="play mode-hud-button mode-command"
      aria-label={isPlaying ? $t.reconstruction.pause : $t.reconstruction.play}
      aria-keyshortcuts={arrowShortcuts ? 'P Space' : 'P'}
      title="P"
      aria-pressed={isPlaying}
      onclick={onPlay}><MangaIcon name={isPlaying ? 'pause' : 'play'} /></button
    ><button
      type="button"
      aria-label={$t.reconstruction.next}
      aria-keyshortcuts={arrowShortcuts ? 'ArrowRight' : undefined}
      disabled={index >= count - 1}
      onclick={() => onChoose(index + 1)}>→</button
    >
  </div>
  <input
    type="range"
    aria-label={$t.reconstruction.timeline}
    min="0"
    max={Math.max(0, count - 1)}
    value={index}
    oninput={(event) => onChoose(Number(event.currentTarget.value))}
  />
  <button
    type="button"
    class="event-count mode-hud-button mode-hud-value"
    onclick={onTimeline}
    aria-label={$reconstructionWords.timeline}
    aria-keyshortcuts="M">{index + 1} / {count}</button
  >
</footer>

<style>
  .reconstruction-transport {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.6rem 5rem 0.6rem 0.8rem;
    border: 1px solid #303d44;
    border-radius: 0 0 5px 5px;
    border-inline-start: 2px solid var(--mode-accent);
  }
  .playback {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 0;
  }
  .playback button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    padding: 0.5rem;
  }
  .play {
    color: #e5c57a;
    border-color: #8c7948;
  }
  button:disabled {
    opacity: 0.3;
  }
  input[type='range'] {
    flex: 1;
    min-width: 0;
    min-height: 44px;
    accent-color: #d5b86e;
  }
  .event-count {
    border: 0;
    padding: 0.5rem;
    min-width: 65px;
    color: var(--mode-accent);
    font-size: 0.78rem;
    font-variant-numeric: tabular-nums;
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
  button:focus-visible,
  input:focus-visible {
    outline: 2px solid var(--mode-accent);
    outline-offset: 2px;
  }
  button:hover {
    color: #f1dfb9;
    border-color: #a78d51;
  }
  .immersive {
    padding-right: 5rem;
    border-radius: 0;
    flex-shrink: 0;
  }
  @media (max-width: 700px) {
    .reconstruction-transport {
      gap: 0.5rem;
      padding: 0.5rem 4.5rem 0.5rem 0.5rem;
    }
    .playback button {
      width: 40px;
      min-width: 40px;
    }
    .event-count {
      min-width: 55px;
      font-size: 0.65rem;
    }
    .immersive {
      padding-right: 4.5rem;
    }
  }
</style>
