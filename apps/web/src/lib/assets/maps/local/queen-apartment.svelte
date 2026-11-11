<script lang="ts">
  import { locale, link } from '$lib/i18n'
  import { queenApartmentLayout } from '$lib/components/map/projection/queenApartmentPlan'
  import { QUEEN_DUAZUL_ROOM } from '$lib/tour/queenApartmentProgramme'
  let { compact = false, roomId }: { compact?: boolean; roomId: string } = $props()
  const layout = $derived(queenApartmentLayout(roomId))
  const number = $derived(roomId.slice(-2))
  const isDuazul = $derived(roomId === QUEEN_DUAZUL_ROOM)
</script>

<svg
  viewBox="0 0 500 1100"
  width={compact ? 135 : '100%'}
  height={compact ? 150 : '100%'}
  preserveAspectRatio={compact ? 'none' : 'xMidYMid meet'}
  aria-label={$locale === 'fr'
    ? `Chambre de reine ${number} — plan reconstitué`
    : `Queen’s Room ${number} — reconstructed plan`}
  class="bg-[#050505]"
  class:compact
>
  {#if !compact}
    <text x="250" y="24" class="title">{number}{isDuazul ? ' · Duazul' : ''}</text>
    <text x="250" y="45" class="note"
      >{$locale === 'fr'
        ? 'Socle commun extrapolé d’Unma · reconstitution'
        : 'Common programme extrapolated from Unma · reconstruction'}</text
    >
  {/if}
  {#if layout}
    <polygon points={layout.outline} class="room" />
    {#each layout.fixtures as item (item.id)}
      <polygon points={item.polygon} class="fixture"
        ><title>{$locale === 'fr' ? item.nameFr : item.name}</title></polygon
      >
    {/each}
    {#each layout.doors as door, index (index)}
      <line x1={door.from.x} y1={door.from.y} x2={door.to.x} y2={door.to.y} class="door" />
    {/each}
    {#if !compact}
      <text x="250" y={number < '05' ? 280 : 870} class="note"
        >{$locale === 'fr' ? 'Couchage et rangement' : 'Sleeping area and storage'}</text
      >
      <text x="250" y={number < '05' ? 810 : 285} class="note"
        >{$locale === 'fr' ? 'Salon · téléphone · thé' : 'Salon · telephone · tea'}</text
      >
    {/if}
  {/if}
  {#if !compact}
    <text x="250" y="1050" class="note"
      >{$locale === 'fr'
        ? 'Mobilier, cloison et métriques reconstitués'
        : 'Reconstructed furniture, partition and dimensions'}</text
    >
    {#if isDuazul}
      <a href={$link('/tour?mangaView=camilla-duazul-dining')}>
        <text x="250" y="1080" class="reference"
          >{$locale === 'fr'
            ? 'Voir le repas de Duazul chez Camilla (chap. 366)'
            : 'View Duazul’s meal at Camilla’s (ch. 366)'}</text
        >
      </a>
    {/if}
  {/if}
</svg>

<style>
  .compact {
    pointer-events: none;
  }
  .title {
    fill: #ffd700;
    font: 28px sans-serif;
    text-anchor: middle;
  }
  .note {
    fill: #aaa;
    font: 14px sans-serif;
    text-anchor: middle;
  }
  .reference {
    fill: #ffd700;
    font: 14px sans-serif;
    text-anchor: middle;
    text-decoration: underline;
  }
  .room {
    fill: rgba(255, 215, 0, 0.025);
    stroke: #ddd;
    stroke-width: 2;
    stroke-dasharray: 8 4;
  }
  .fixture {
    fill: rgba(255, 215, 0, 0.1);
    stroke: #c7ac76;
    stroke-width: 1.5;
    stroke-dasharray: 4 3;
  }
  .door {
    stroke: #ffd700;
    stroke-width: 4;
  }
</style>
