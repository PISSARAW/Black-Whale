<script lang="ts">
  import { locale } from '$lib/i18n'
  import {
    unmaRoom,
    unmaFixtures,
    unmaDoors,
    queenUnmaPolygon,
  } from '$lib/components/map/projection/queenUnmaPlan'
  let { compact = false }: { compact?: boolean } = $props()
</script>

<svg
  viewBox="0 0 500 1100"
  width={compact ? 135 : '100%'}
  height={compact ? 150 : '100%'}
  preserveAspectRatio={compact ? 'none' : 'xMidYMid meet'}
  aria-label="Queen Unma — reconstructed walked layout"
  class="bg-[#050505]"
  class:compact
>
  {#if !compact}
    <text x="250" y="24" class="title">01 · Unma</text>
    <text x="250" y="45" class="source"
      >{$locale === 'fr'
        ? 'Mobilier : chap. 403 p. 10 · métriques reconstituées'
        : 'Furniture: ch. 403 p. 10 · reconstructed dimensions'}</text
    >
  {/if}
  {#if unmaRoom}<polygon points={queenUnmaPolygon(unmaRoom.footprint)} class="room" />{/if}
  {#each unmaFixtures as item (item.id)}
    <polygon points={item.polygon} class="fixture" class:reconstruction={item.provenance === 'map'}
      ><title>{$locale === 'fr' ? item.nameFr : item.name}</title></polygon
    >
  {/each}
  {#each unmaDoors as door, index (index)}<line
      x1={door.from.x}
      y1={door.from.y}
      x2={door.to.x}
      y2={door.to.y}
      class="door"
    />{/each}
  {#if !compact}
    <text x="250" y="285" class="source"
      >{$locale === 'fr' ? 'Couchage reconstitué' : 'Reconstructed sleeping area'}</text
    >
    <text x="250" y="490" class="source">Nursery</text>
    <text x="250" y="810" class="source">Salon</text>
  {/if}
  {#if !compact}
    <text x="250" y="1080" class="source"
      >{$locale === 'fr'
        ? 'Couchage et cloison : reconstitution'
        : 'Sleeping area and partition: reconstruction'}</text
    >
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
  .source {
    fill: #aaa;
    font: 14px sans-serif;
    text-anchor: middle;
  }
  .room {
    fill: rgba(255, 215, 0, 0.025);
    stroke: #ddd;
    stroke-width: 2;
  }
  .fixture {
    fill: rgba(255, 215, 0, 0.15);
    stroke: #c7ac76;
    stroke-width: 1.5;
  }
  .reconstruction {
    stroke-dasharray: 4 3;
  }
  .door {
    stroke: #ffd700;
    stroke-width: 4;
  }
</style>
