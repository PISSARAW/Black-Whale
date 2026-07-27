<script lang="ts">
  import type { MarkerIdentityState } from './types'

  let {
    marker,
    compact = false,
    onExplain,
    future = false,
    futureMode = false,
  }: {
    marker: MarkerIdentityState
    compact?: boolean
    onExplain?: (marker: MarkerIdentityState) => void
    future?: boolean
    futureMode?: boolean
  } = $props()

  let styleString = $derived(
    `left: ${marker.x}%; top: ${marker.y}%; --marker-color: ${marker.positionColor || '#8b9a98'};`,
  )
  let hasAnomaly = $derived(marker.body !== marker.consciousness || marker.transferFlag)
</script>

<button
  type="button"
  class="subjective-marker"
  class:compact
  class:anomaly={hasAnomaly}
  class:follow-target={marker.isFollowTarget}
  class:future
  class:future-current={futureMode && !future}
  data-follow-target={marker.isFollowTarget ? 'true' : undefined}
  data-hatsu-character={future ? undefined : marker.id}
  data-hatsu-future-character={future ? marker.id : undefined}
  data-hatsu-character-name={marker.perceivedIdentity}
  data-hatsu-perspective-id={marker.originalCharacterId}
  data-hatsu-next-change={marker.futureChange}
  data-hatsu-list={marker.hatsuNames?.join('|')}
  style={styleString}
  style:transform="translate(-50%, -50%)"
  aria-label={`${marker.perceivedIdentity}, ${marker.locationLabel || 'unknown position'}, ${marker.temporalLabel || 'unknown status'}`}
  onclick={() => onExplain?.(marker)}
>
  <span class="pulse" aria-hidden="true"></span>
  <span class="core" aria-hidden="true"></span>
  <span class="tooltip" role="tooltip">
    <span class="tooltip-topline">
      <strong>{marker.perceivedIdentity}</strong>
      <i>{marker.temporalLabel || 'Unknown status'}</i>
    </span>
    <span class="location"
      >{marker.locationLabel || 'Unspecified location'} · {marker.tierLabel || 'Outside tier'}</span
    >
    {#if marker.temporalDetail}<span class="temporal-detail">{marker.temporalDetail}</span>{/if}
    {#if hasAnomaly}<span class="anomaly-label">Transferred consciousness</span>{/if}
    {#if marker.suspicionLabel}<span class="suspicion">Assumed identity</span>{/if}
  </span>
</button>

<style>
  .subjective-marker {
    position: absolute;
    z-index: 6;
    width: 1.05rem;
    height: 1.05rem;
    border: 0;
    border-radius: 50%;
    padding: 0;
    background: transparent;
    cursor: pointer;
    pointer-events: auto;
    filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.8));
  }

  .subjective-marker.compact {
    width: 0.9rem;
    height: 0.9rem;
  }

  .core {
    position: absolute;
    inset: 2px;
    border: 2px solid #071015;
    border-radius: 50%;
    background: var(--marker-color);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--marker-color) 80%, white 20%);
  }

  .pulse {
    position: absolute;
    inset: -3px;
    border: 1px solid var(--marker-color);
    border-radius: 50%;
    opacity: 0.42;
  }

  .subjective-marker:hover {
    z-index: 20;
  }
  .subjective-marker:hover .pulse,
  .subjective-marker:focus-visible .pulse {
    animation: presence-pulse 1.5s ease-out infinite;
  }
  .subjective-marker.anomaly .pulse {
    border-style: dashed;
    border-color: var(--state-transferred);
  }
  .subjective-marker.follow-target .core {
    box-shadow:
      0 0 0 2px #f5e7b6,
      0 0 0 5px color-mix(in srgb, var(--marker-color) 35%, transparent);
  }
  .subjective-marker.follow-target .pulse {
    inset: -7px;
    opacity: 0.78;
  }
  .subjective-marker.future {
    z-index: 18;
    filter: drop-shadow(0 0 8px #b36bff);
    opacity: 0.82;
  }
  .subjective-marker.future .core {
    border-color: #30154c;
    background: #d598ff;
    box-shadow:
      0 0 0 2px #854db5,
      0 0 16px #bd74ff;
  }
  .subjective-marker.future .pulse {
    inset: -7px;
    border: 2px dashed #d598ff;
    opacity: 0.8;
    animation: presence-pulse 1.5s ease-out infinite;
  }
  .subjective-marker.future-current .core {
    background: #58e1ee;
    box-shadow:
      0 0 0 2px #126f79,
      0 0 13px #58e1ee;
  }
  .subjective-marker.future-current .pulse {
    border-color: #58e1ee;
  }
  .subjective-marker:focus-visible {
    outline: 2px solid #f5e7b6;
    outline-offset: 4px;
  }

  .tooltip {
    position: absolute;
    left: 50%;
    bottom: calc(100% + 0.65rem);
    width: max-content;
    min-width: 11rem;
    max-width: 15rem;
    padding: 0.65rem 0.7rem;
    border: 1px solid color-mix(in srgb, var(--marker-color) 45%, #40515a 55%);
    border-radius: 0.55rem;
    color: #dfe5df;
    background: rgba(8, 15, 20, 0.96);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);
    text-align: left;
    opacity: 0;
    visibility: hidden;
    transform: translate(-50%, 0.3rem);
    transition:
      opacity 0.16s ease,
      transform 0.16s ease,
      visibility 0.16s;
    pointer-events: none;
  }

  .tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    border: 0.35rem solid transparent;
    border-top-color: color-mix(in srgb, var(--marker-color) 45%, #40515a 55%);
    transform: translateX(-50%);
  }
  .subjective-marker:hover .tooltip,
  .subjective-marker:focus-visible .tooltip {
    opacity: 1;
    visibility: visible;
    transform: translate(-50%, 0);
  }
  .tooltip-topline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  .tooltip-topline strong {
    font-size: 0.72rem;
    font-weight: 650;
  }
  .tooltip-topline i {
    color: var(--marker-color);
    font-size: 0.56rem;
    font-style: normal;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .location {
    display: block;
    margin-top: 0.25rem;
    color: #7d8d8a;
    font-size: 0.62rem;
  }
  .temporal-detail {
    display: block;
    margin-top: 0.25rem;
    color: #a5b1ae;
    font-size: 0.58rem;
  }
  .anomaly-label,
  .suspicion {
    display: inline-block;
    margin-top: 0.45rem;
    padding: 0.15rem 0.3rem;
    border-radius: 0.2rem;
    color: #e6a06e;
    background: rgba(119, 60, 30, 0.25);
    font-size: 0.55rem;
    text-transform: uppercase;
  }
  .suspicion {
    color: #d4b96c;
    background: rgba(105, 88, 32, 0.25);
  }

  @keyframes presence-pulse {
    0% {
      opacity: 0.65;
      transform: scale(0.75);
    }
    100% {
      opacity: 0;
      transform: scale(1.75);
    }
  }
</style>
