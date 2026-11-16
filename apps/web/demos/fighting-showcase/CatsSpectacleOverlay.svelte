<script lang="ts">
  import type { CatShot } from './catsSpectacle'
  const still = new URLSearchParams(window.location.search).has('still')
  export let shot: CatShot | undefined
  const labels = {
    apparition: 'LE NEN SURVIT À LA MORT',
    capture: 'LA PRISE SE REFERME',
    crush: 'LE PRIX DU MEURTRE',
    resurrection: 'UNE VIE POUR UNE VIE',
    victory: 'CAMILLA RESSUSCITÉE',
  }
  $: flash = shot ? Math.max(0, 1 - Math.abs(shot.progress - 48) / 1.5) * 0.5 : 0
</script>

{#if shot}
  <div class="flash" style={`opacity:${flash}`}></div>
  <aside class="spectacle-overlay" class:still-portrait={still && (shot?.progress ?? 0) >= 112}>
    <span>CAT’S NAME · NEN POST MORTEM</span><b>{labels[shot.kind]}</b><small
      >{shot.kind === 'victory' ? 'LA VIE DE CHROLLO A ÉTÉ ABSORBÉE' : 'GROS PLAN · RALENTI'}</small
    >
  </aside>
{/if}

<style>
  :global(main:has(.still-portrait) .verdict) {
    display: none;
  }
  .still-portrait {
    visibility: hidden;
  }
  :global(main:has(.spectacle-overlay) .verdict) {
    left: auto;
    right: 65px;
    top: 44%;
    transform: none;
    font-size: 50px;
  }

  aside {
    position: absolute;
    z-index: 19;
    left: 56px;
    bottom: 82px;
    padding: 16px 22px;
    border-left: 3px solid #f5d697;
    background: #100d18d9;
  }
  span {
    display: block;
    color: #edcf93;
    letter-spacing: 3px;
    font-size: 14px;
  }
  b {
    display: block;
    font-size: 25px;
    letter-spacing: 3px;
    margin-top: 10px;
  }
  small {
    display: block;
    font-size: 11px;
    letter-spacing: 3px;
    color: #b8afb3;
    margin-top: 12px;
  }
  .flash {
    position: absolute;
    z-index: 18;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(ellipse at 50% 50%, #fff7d5 0%, #e5c98766 48%, transparent 80%);
  }
</style>
