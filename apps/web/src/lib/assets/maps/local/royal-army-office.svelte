<script lang="ts">
  import { locale } from '$lib/i18n'
  import {
    royalArmyConferenceRoom,
    royalArmyConferenceFixtures,
    royalArmyConferencePolygon,
  } from '$lib/components/map/projection/royalArmyConferencePlan'
  const fixtures = [...royalArmyConferenceFixtures].sort(
    (a, b) => Number(b.kind === 'platform') - Number(a.kind === 'platform'),
  )
</script>

<svg
  viewBox="0 0 1000 700"
  class="w-full h-full bg-[#050505] rounded-lg border border-[#333]"
  aria-label={$locale === 'fr'
    ? 'Salle de conférence militaire — chapitre 380'
    : 'Army conference room — chapter 380'}
>
  <text x="500" y="30" class="title"
    >{$locale === 'fr' ? 'Briefing de l’armée royale' : 'Royal Army briefing'}</text
  >
  <text x="500" y="52" class="note"
    >{$locale === 'fr'
      ? 'Chap. 380, p. 1–6 · métriques et effectifs de sièges reconstitués'
      : 'Ch. 380, pp. 1–6 · reconstructed dimensions and seat counts'}</text
  >
  <polygon points={royalArmyConferencePolygon(royalArmyConferenceRoom.footprint)} class="wall" />
  {#each fixtures as item (item.id)}
    <polygon
      points={item.polygon}
      class="fixture"
      class:seat={item.kind === 'seat'}
      class:stage={item.kind === 'platform'}
      class:board={item.kind === 'painting'}
    >
      <title>{$locale === 'fr' ? item.nameFr : item.name}</title>
    </polygon>
  {/each}
  <text x="500" y="235" class="note"
    >{$locale === 'fr' ? 'Estrade · écran blanc · pupitre' : 'Dais · blank screen · lectern'}</text
  >
  <text x="500" y="360" class="note"
    >{$locale === 'fr' ? 'U ouvert vers l’orateur' : 'U opens towards speaker'}</text
  >
  <text x="850" y="600" class="note">{$locale === 'fr' ? 'Public' : 'Audience'}</text>
  <line x1="475" y1="680" x2="525" y2="680" class="door" />
</svg>

<style>
  .title {
    fill: #ffd700;
    font: 23px sans-serif;
    text-anchor: middle;
  }
  .note {
    fill: #aaa;
    font: 14px sans-serif;
    text-anchor: middle;
  }
  .wall {
    stroke: #ddd;
    stroke-width: 3;
    fill: rgba(255, 255, 255, 0.02);
  }
  .fixture {
    fill: #b3ada0;
    stroke: #817b6e;
    stroke-width: 1.5;
  }
  .seat {
    fill: #59594f;
    stroke: #b5b2a4;
  }
  .stage {
    fill: #282823;
    stroke-dasharray: 6 4;
  }
  .board {
    fill: #eeeade;
  }
  .door {
    stroke: #ffd700;
    stroke-width: 4;
  }
</style>
