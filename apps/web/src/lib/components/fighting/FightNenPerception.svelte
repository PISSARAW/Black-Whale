<script lang="ts">
  import { enContactReadings } from '$lib/fighting/en/contacts'
  import { readAura, AURA_ZONES, ZONE_NAMES } from '$lib/fighting/nenCombat/reading'
  import { bodyGyoZone } from '$lib/fighting/nenCombat/bodyGyo'
  import type { FightState, FightSide } from '$lib/fighting/types'
  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
  $: fr = language === 'fr'
  $: target = state[side === 'player' ? 'opponent' : 'player']
  $: reading = readAura(state[side], target)
  $: contacts = enContactReadings(state, side)
  $: focus = bodyGyoZone(state[side])
  $: moving = contacts.filter((p) => p.dx || p.dy).length
</script>

{#if focus}<span
    >Gyo · {ZONE_NAMES[language][focus]} · {fr
      ? 'renforcé, autres zones exposées ; vision de In perdue'
      : 'reinforced, other zones exposed; In vision lost'}</span
  >{/if}
{#if contacts.length}
  <span
    >{fr ? 'Contours En' : 'En contours'} · {moving}
    {fr ? 'en mouvement' : 'moving'} · {contacts.filter((p) => p.auraReaction).length}
    {fr ? 'réactions d’aura perceptibles' : 'perceptible aura reactions'}</span
  >
  <ul aria-label={fr ? 'Contacts perçus par En' : 'Contacts perceived through En'}>
    {#each contacts.slice(0, 3) as point, index (index)}
      <li>
        {Math.hypot(point.x - state[side].x, point.y - state[side].y).toFixed(1)} u · {point.width &&
        point.height
          ? `${point.width.toFixed(1)} × ${point.height.toFixed(1)} u`
          : fr
            ? 'contact partiel'
            : 'partial contact'} · {point.dx > 0 ? '→' : point.dx < 0 ? '←' : '·'}{point.dy > 0
          ? '↑'
          : point.dy < 0
            ? '↓'
            : ''}
      </li>
    {/each}
  </ul>
{/if}
{#if state[side].gyoLow}<small
    >{fr
      ? 'Gyo faible · In et la répartition fine restent illisibles'
      : 'Low-output Gyo · In and fine allocation remain unreadable'}</small
  >{/if}
{#if reading}
  <span
    >Gyo · {fr ? 'Aura adverse' : 'Opponent aura'} : {reading.output === 'quiet'
      ? fr
        ? 'aucun flux perceptible'
        : 'no perceptible output'
      : reading.output}</span
  >
  {#if reading.shares}
    <div
      class="aura-zones"
      aria-label={fr ? 'Répartition adverse observée' : 'Observed opponent distribution'}
    >
      {#each AURA_ZONES as zone (zone)}<span class:thin={reading.weak.includes(zone)}
          >{ZONE_NAMES[language][zone]} {Math.round((reading.shares[zone] ?? 0) * 100)} %</span
        >{/each}
    </div>
    <small
      >{fr
        ? 'Choisis manuellement une zone peu protégée ; la répartition peut changer.'
        : 'Manually choose a thinly protected zone; the allocation can change.'}</small
    >
  {/if}
{/if}

<style>
  ul {
    margin: 0;
    padding-left: 1.1rem;
    font-variant-numeric: tabular-nums;
  }
  .aura-zones {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem 0.6rem;
  }
  .thin {
    text-decoration: underline;
    color: #f4c999;
  }
</style>
