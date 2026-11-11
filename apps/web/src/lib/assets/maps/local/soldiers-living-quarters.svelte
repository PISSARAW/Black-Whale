<script lang="ts">
  import { locale } from '$lib/i18n'
  import {
    soldiersQuartersBeds,
    soldiersQuartersRooms,
  } from '$lib/components/map/projection/soldiersQuartersPlan'
</script>

<svg
  viewBox="0 0 1000 600"
  class="w-full h-full bg-[#050505] rounded-lg border border-[#333]"
  aria-label={$locale === 'fr'
    ? 'Quartiers des soldats — reconstruction /ship'
    : 'Soldiers’ quarters — /ship reconstruction'}
>
  <text x="500" y="35" class="title"
    >{$locale === 'fr'
      ? 'Quartiers des soldats et associés'
      : 'Soldiers and associates’ quarters'}</text
  >
  <text x="500" y="62" class="note"
    >{$locale === 'fr'
      ? 'Chap. 363 : accès nommé, intérieur non dessiné'
      : 'Ch. 363: access named, interior not drawn'}</text
  >
  <text x="500" y="85" class="note"
    >{$locale === 'fr'
      ? '8 salles et 96 couchettes : programme du plan /ship, métriques reconstituées'
      : '8 rooms and 96 beds: /ship map programme, reconstructed dimensions'}</text
  >
  {#each soldiersQuartersRooms as room (room.id)}
    <polygon points={room.polygon} class="wall">
      <title>{$locale === 'fr' ? room.nameFr : room.name}</title>
    </polygon>
  {/each}
  {#each soldiersQuartersBeds as bed (bed.id)}
    <polygon points={bed.polygon} class="bed">
      <title>{$locale === 'fr' ? bed.nameFr : bed.name}</title>
    </polygon>
  {/each}
  <text x="500" y="115" class="note">{$locale === 'fr' ? 'Armée royale' : 'Royal Army'}</text>
  <text x="500" y="335" class="note"
    >{$locale === 'fr'
      ? 'Passage reconstitué vers les ponts inférieurs'
      : 'Reconstructed passage towards the lower decks'}</text
  >
  <text x="500" y="565" class="note"
    >{$locale === 'fr' ? 'Hunters provisoires' : 'Provisional Hunters'}</text
  >
</svg>

<style>
  .title {
    fill: #e4dfca;
    font: 23px sans-serif;
    text-anchor: middle;
  }
  .note {
    fill: #aaa;
    font: 14px sans-serif;
    text-anchor: middle;
  }
  .wall {
    fill: #131714;
    stroke: #babbb2;
    stroke-width: 2;
  }
  .bed {
    fill: #777e7a;
    stroke: #c8c7bd;
    stroke-width: 1;
  }
</style>
