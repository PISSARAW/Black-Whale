<script lang="ts">
  import { fighterDefinition } from '$lib/fighting/roster'
  import type { FightState } from '$lib/fighting/types'
  export let state: FightState
  export let language: 'fr' | 'en'
  $: bodies = [
    state.player,
    state.opponent,
    ...(state.rosterGuests ?? []).map((guest) => guest.fighter),
  ].filter((body) => body.halkSoul?.linked)
  $: keys = new Set(bodies.map((body) => body.halkSoul!.key))
  $: minds = state.halkSoulMinds?.filter((item) => item.alive && keys.has(item.body)) ?? []
</script>

{#if bodies.length}
  <div class="chain">
    <span
      >{language === 'fr' ? 'Transferts' : 'Transfers'} : {state.halkSoulLinks?.length ?? 0} · {minds.length}
      {language === 'fr' ? 'consciences vivantes' : 'living minds'} · {bodies.length}
      {language === 'fr' ? 'corps' : 'bodies'}</span
    >
    {#each bodies as body (body.halkSoul!.key)}
      <span>
        {body.halkCohortBody
          ? language === 'fr'
            ? 'Partisan'
            : 'Supporter'
          : fighterDefinition(body.id).name}
        · {Math.max(0, body.health)}
        {language === 'fr' ? 'PV' : 'HP'} ·
        {body.health <= 0
          ? language === 'fr'
            ? 'corps mort'
            : 'dead body'
          : body.halkSoulSleep
            ? language === 'fr'
              ? 'endormi'
              : 'asleep'
            : language === 'fr'
              ? 'éveillé'
              : 'awake'}
        {#if body.halkSoul?.mind?.identity}
          · {language === 'fr' ? 'conscience' : 'mind'} : {fighterDefinition(
            body.halkSoul.mind.identity,
          ).name}
        {/if}
      </span>
    {/each}
  </div>
{/if}

<style>
  .chain {
    display: grid;
    gap: 0.2rem;
    padding-block-start: 0.3rem;
    border-top: 1px solid #475569;
  }
</style>
