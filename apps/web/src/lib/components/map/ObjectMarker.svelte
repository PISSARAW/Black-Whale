<script lang="ts">
  import type { TrackedObjectSnapshot } from '$lib/importantObjects'
  import { mapState } from '$lib/state/mapState.svelte'
  import { t } from '$lib/i18n'

  let {
    object,
    x,
    y,
    follow = false,
  }: { object: TrackedObjectSnapshot; x: number; y: number; follow?: boolean } = $props()

  function explain() {
    const sighting = object.sighting
    mapState.openExplainPanel({
      subject: object.canonicalName,
      value: object.location?.name || $t.ship.objectTracking.unknownPosition,
      source: sighting?.note || object.description,
      observedAt: sighting ? $t.ship.objectTracking.sinceChapter(sighting.fromChapter) : '—',
      freshness: sighting?.certainty || 'unknown',
      knowledgeState: sighting?.certainty === 'CONFIRMED' ? 'confirmed' : 'reported',
    })
  }
</script>

<button
  type="button"
  class="object-marker"
  class:follow
  data-follow-target={follow ? 'true' : undefined}
  style={`left:${x}%;top:${y}%;transform:translate(-50%, -50%);`}
  aria-label={$t.ship.objectTracking.markerAria(
    object.canonicalName,
    object.location?.name || $t.ship.objectTracking.unknownPosition,
  )}
  onclick={explain}
>
  <span class="pulse" aria-hidden="true"></span>
  <span class="core" aria-hidden="true">◆</span>
  <span class="tooltip" role="tooltip">
    <strong>{object.canonicalName}</strong>
    <span>{object.location?.name || $t.ship.objectTracking.unknownPosition}</span>
    {#if object.sighting}<small>{object.sighting.note}</small>{/if}
  </span>
</button>

<style>
  .object-marker {
    position: absolute;
    z-index: 12;
    display: grid;
    width: 1.45rem;
    height: 1.45rem;
    place-items: center;
    border: 0;
    padding: 0;
    background: transparent;
    color: #ffd96a;
    cursor: pointer;
    pointer-events: auto;
    filter: drop-shadow(0 0 7px rgba(255, 196, 65, 0.7));
  }
  .core {
    position: relative;
    z-index: 1;
    display: grid;
    width: 1rem;
    height: 1rem;
    place-items: center;
    border: 1px solid #fff0ae;
    background: #72510f;
    font-size: 0.55rem;
    transform: rotate(45deg);
  }
  .core::first-letter {
    transform: rotate(-45deg);
  }
  .pulse {
    position: absolute;
    inset: -0.2rem;
    border: 1px solid #ffd96a;
    border-radius: 50%;
    animation: object-pulse 1.7s ease-out infinite;
  }
  .object-marker:focus-visible {
    outline: 2px solid #fff0ae;
    outline-offset: 4px;
  }
  .object-marker.follow .core {
    box-shadow:
      0 0 0 3px rgba(255, 240, 174, 0.28),
      0 0 14px rgba(255, 196, 65, 0.9);
  }
  .tooltip {
    position: absolute;
    bottom: calc(100% + 0.7rem);
    left: 50%;
    display: grid;
    width: 15rem;
    gap: 0.25rem;
    padding: 0.65rem;
    border: 1px solid rgba(255, 217, 106, 0.5);
    border-radius: 0.5rem;
    background: rgba(8, 15, 20, 0.97);
    color: #e8ece8;
    text-align: left;
    opacity: 0;
    visibility: hidden;
    transform: translate(-50%, 0.3rem);
    transition: 0.16s ease;
    pointer-events: none;
  }
  .tooltip strong {
    color: #ffd96a;
    font-size: 0.72rem;
  }
  .tooltip span,
  .tooltip small {
    color: #93a19e;
    font-size: 0.6rem;
  }
  .object-marker:hover .tooltip,
  .object-marker:focus-visible .tooltip {
    opacity: 1;
    visibility: visible;
    transform: translate(-50%, 0);
  }
  @keyframes object-pulse {
    from {
      opacity: 0.8;
      transform: scale(0.65);
    }
    to {
      opacity: 0;
      transform: scale(1.45);
    }
  }
  @media (hover: none) {
    .tooltip {
      display: none;
    }
  }
</style>
