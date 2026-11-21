<script lang="ts">
  import { grudgeGauge } from '$lib/fighting/onCopy'
  import type { ArcadeFighter } from '$lib/fighting/types'

  export let fighter: ArcadeFighter
  export let language: 'fr' | 'en'

  $: gauge = grudgeGauge(fighter, language)
</script>

<div
  class="grudge"
  class:ready={gauge.ready}
  class:burning={gauge.burning}
  class:sealed={gauge.sealed}
  class:rage={gauge.rage}
>
  <div class="bar"><span style={`width:${gauge.share * 100}%`}></span></div>
  <small>{gauge.label}</small>
</div>

<style>
  .grudge {
    display: grid;
    gap: 0.15rem;
    margin-top: 0.2rem;
  }
  .bar {
    height: 6px;
    overflow: hidden;
    border: 1px solid rgb(120 40 70 / 55%);
    background: rgb(12 4 8 / 80%);
  }
  .bar span {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #3b0c22, #8f1d4a);
    transition: width 120ms linear;
  }
  small {
    color: #b9879b;
    font: 600 var(--hud-font, 0.75rem)/1.35 var(--font-mono);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .ready .bar span {
    background: linear-gradient(90deg, #6b1236, #d23a74);
    box-shadow: 0 0 8px rgb(210 58 116 / 60%);
  }
  .ready small {
    color: #f08ab1;
  }
  .burning .bar {
    border-color: #2a0614;
  }
  .burning .bar span {
    background: linear-gradient(90deg, #120208, #5c0b2c 60%, #a0154d);
    animation: smoulder 0.9s ease-in-out infinite alternate;
  }
  .burning small,
  .sealed small {
    color: #ff6f9f;
  }
  .rage .bar {
    border-color: #ffb020;
    box-shadow: 0 0 9px rgb(255 98 32 / 75%);
  }
  .rage .bar span {
    background: linear-gradient(90deg, #6b0715, #e32f2f 62%, #ffb020);
  }
  .rage small {
    color: #ffd37a;
  }
  @keyframes smoulder {
    from {
      opacity: 0.7;
    }
    to {
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .bar span {
      transition: none;
      animation: none;
    }
  }
</style>
