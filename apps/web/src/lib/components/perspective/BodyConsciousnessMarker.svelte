<script lang="ts">
  import type { MarkerIdentityState } from './types';

  let {
    marker,
    compact = false,
    onExplain
  }: {
    marker: MarkerIdentityState;
    compact?: boolean;
    onExplain?: (marker: MarkerIdentityState) => void;
  } = $props();

  let styleString = $derived(`left: ${marker.x}%; top: ${marker.y}%; --marker-color: ${marker.positionColor || '#8b9a98'};`);
  let hasAnomaly = $derived(marker.body !== marker.consciousness || marker.transferFlag);
</script>

<button
  type="button"
  class="subjective-marker"
  class:compact
  class:anomaly={hasAnomaly}
  style={styleString}
  style:transform="translate(-50%, -50%)"
  aria-label={`${marker.perceivedIdentity}, ${marker.locationLabel || 'position inconnue'}, ${marker.temporalLabel || 'statut inconnu'}`}
  onclick={() => onExplain?.(marker)}
>
  <span class="pulse" aria-hidden="true"></span>
  <span class="core" aria-hidden="true"></span>
  <span class="tooltip" role="tooltip">
    <span class="tooltip-topline">
      <strong>{marker.perceivedIdentity}</strong>
      <i>{marker.temporalLabel || 'Statut inconnu'}</i>
    </span>
    <span class="location">{marker.locationLabel || 'Localisation non précisée'} · {marker.tierLabel || 'Hors tier'}</span>
    {#if marker.temporalDetail}<span class="temporal-detail">{marker.temporalDetail}</span>{/if}
    {#if hasAnomaly}<span class="anomaly-label">Conscience transférée</span>{/if}
    {#if marker.suspicionLabel}<span class="suspicion">Identité supposée</span>{/if}
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
    filter: drop-shadow(0 2px 5px rgba(0,0,0,.8));
  }

  .subjective-marker.compact {
    width: .9rem;
    height: .9rem;
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
    opacity: .42;
  }

  .subjective-marker:hover { z-index: 20; }
  .subjective-marker:hover .pulse, .subjective-marker:focus-visible .pulse { animation: presence-pulse 1.5s ease-out infinite; }
  .subjective-marker.anomaly .pulse { border-style: dashed; border-color: var(--state-transferred); }
  .subjective-marker:focus-visible { outline: 2px solid #f5e7b6; outline-offset: 4px; }

  .tooltip {
    position: absolute;
    left: 50%;
    bottom: calc(100% + .65rem);
    width: max-content;
    min-width: 11rem;
    max-width: 15rem;
    padding: .65rem .7rem;
    border: 1px solid color-mix(in srgb, var(--marker-color) 45%, #40515a 55%);
    border-radius: .55rem;
    color: #dfe5df;
    background: rgba(8,15,20,.96);
    box-shadow: 0 12px 28px rgba(0,0,0,.45);
    text-align: left;
    opacity: 0;
    visibility: hidden;
    transform: translate(-50%, .3rem);
    transition: opacity .16s ease, transform .16s ease, visibility .16s;
    pointer-events: none;
  }

  .tooltip::after { content: ''; position: absolute; top: 100%; left: 50%; border: .35rem solid transparent; border-top-color: color-mix(in srgb, var(--marker-color) 45%, #40515a 55%); transform: translateX(-50%); }
  .subjective-marker:hover .tooltip, .subjective-marker:focus-visible .tooltip { opacity: 1; visibility: visible; transform: translate(-50%, 0); }
  .tooltip-topline { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  .tooltip-topline strong { font-size: .72rem; font-weight: 650; }
  .tooltip-topline i { color: var(--marker-color); font-size: .56rem; font-style: normal; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
  .location { display: block; margin-top: .25rem; color: #7d8d8a; font-size: .62rem; }
  .temporal-detail { display: block; margin-top: .25rem; color: #a5b1ae; font-size: .58rem; }
  .anomaly-label, .suspicion { display: inline-block; margin-top: .45rem; padding: .15rem .3rem; border-radius: .2rem; color: #e6a06e; background: rgba(119,60,30,.25); font-size: .55rem; text-transform: uppercase; }
  .suspicion { color: #d4b96c; background: rgba(105,88,32,.25); }

  @keyframes presence-pulse {
    0% { opacity: .65; transform: scale(.75); }
    100% { opacity: 0; transform: scale(1.75); }
  }
</style>
