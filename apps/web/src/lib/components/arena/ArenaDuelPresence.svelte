<script lang="ts">
  import type { ArenaDuelPresence } from '$lib/arena/duelPresence'

  let { presence, french }: { presence: ArenaDuelPresence; french: boolean } = $props()
  const labels = {
    high: { fr: 'PRESSION DU REN', en: 'REN PRESSURE' },
    overwhelming: { fr: 'REN ÉCRASANT', en: 'OVERWHELMING REN' },
  } as const
  let label = $derived(
    presence.pressure === 'high' || presence.pressure === 'overwhelming'
      ? labels[presence.pressure][french ? 'fr' : 'en']
      : null,
  )
  let detail = $derived(
    presence.detail
      ? french
        ? `${presence.detail.stability === 'steady' ? 'STABLE' : 'VACILLANT'} · ${presence.detail.intent === 'hostile' ? 'HOSTILE' : 'CONTENU'}`
        : `${presence.detail.stability === 'steady' ? 'STEADY' : 'WAVERING'} · ${presence.detail.intent === 'hostile' ? 'HOSTILE' : 'GUARDED'}`
      : null,
  )
</script>

<div
  class="duel-presence {presence.pressure}"
  style:--ren-pressure={presence.ren.pressure}
  style:--ren-stability={presence.ren.stability}
  style:--ren-intent={presence.ren.intent}
  aria-hidden={!label}
>
  <i></i><i></i>
  {#if label}<span aria-live="polite">{label}</span>{/if}
  {#if detail}<small>{detail}</small>{/if}
</div>

<style>
  .duel-presence {
    --ren-pressure: 0;
    --ren-stability: 1;
    --ren-intent: 0;
    position: absolute;
    z-index: 7;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }

  i {
    position: absolute;
    inset: -12%;
    border: calc(0.25rem + var(--ren-pressure) * 2.5rem) solid
      rgb(104 63 142 / calc(var(--ren-pressure) * 0.24));
    border-radius: 38%;
    filter: blur(calc(0.6rem + var(--ren-pressure) * 1.2rem));
    transform: scale(calc(1.08 - var(--ren-pressure) * 0.08));
    animation: pressure-breathe calc(1.8s - var(--ren-intent) * 0.65s) ease-in-out infinite;
  }

  i + i {
    border-color: rgb(235 205 255 / calc(var(--ren-pressure) * 0.12));
    transform: scale(calc(1.15 - var(--ren-pressure) * 0.1)) rotate(2deg);
    animation-delay: -0.7s;
  }

  span {
    position: absolute;
    top: 22%;
    left: 50%;
    color: rgb(230 210 242 / calc(0.45 + var(--ren-pressure) * 0.45));
    font:
      600 0.55rem 'IBM Plex Mono',
      monospace;
    letter-spacing: 0.22em;
    text-shadow: 0 0 0.8rem #4f236e;
    transform: translateX(-50%);
  }

  small {
    position: absolute;
    top: calc(22% + 1.1rem);
    left: 50%;
    color: rgb(226 215 235 / 0.72);
    font:
      500 0.48rem 'IBM Plex Mono',
      monospace;
    letter-spacing: 0.15em;
    text-shadow: 0 0 0.65rem #000;
    transform: translateX(-50%);
  }

  @keyframes pressure-breathe {
    50% {
      opacity: calc(0.55 + var(--ren-stability) * 0.45);
      transform: scale(calc(1.04 - var(--ren-pressure) * 0.06));
    }
  }

  @media (prefers-reduced-motion: reduce) {
    i {
      animation: none;
    }
  }
</style>
