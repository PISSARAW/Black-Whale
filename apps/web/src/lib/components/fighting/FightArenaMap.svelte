<script lang="ts">
  import type { ArenaMap } from '$lib/fighting/arenaMap'
  export let map: ArenaMap
  export let point: { x: number; y: number } | undefined = undefined
  export let language: 'fr' | 'en'
</script>

<svg
  viewBox="0 0 260 115"
  role="img"
  aria-label={language === 'fr' ? 'Plan papier de l’arène' : 'Paper arena map'}
>
  <rect x="10" y="8" width="240" height="82" fill="#ece2c6" stroke="#504a3e" />
  <path d="M10 90H250M10 8V90M250 8V90" stroke="#554d40" stroke-width="2" fill="none" />
  <path d="M70 8V90M130 8V90M190 8V90M10 49H250" stroke="#b4a98e" fill="none" />
  <text x="10" y="105">{language === 'fr' ? 'Porte gauche' : 'Left gate'} · {map.left}</text>
  <text x="250" y="105" text-anchor="end"
    >{language === 'fr' ? 'Porte droite' : 'Right gate'} · {map.right}</text
  >
  {#if point}
    <circle
      cx={10 + point.x * 240}
      cy={90 - point.y * 82}
      r="5"
      fill="#a63f42"
      stroke="#fff4d8"
      stroke-width="1.5"
    />
  {/if}
</svg>

<style>
  svg {
    width: 100%;
    max-width: 360px;
    height: auto;
  }
  text {
    font: 9px sans-serif;
    fill: #dfd3b6;
  }
</style>
