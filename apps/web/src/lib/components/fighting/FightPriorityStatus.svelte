<script lang="ts">
  import { fighterDefinition } from '$lib/fighting/roster'
  import FightDowsingMap from './FightDowsingMap.svelte'
  import type { FightSide, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
</script>

<FightDowsingMap {state} {side} {language} />

{#if state[side].biohazardFootage}
  <details>
    <summary>{language === 'fr' ? 'Enregistrement de la caméra' : 'Camera recording'}</summary>
    {#each state[side].biohazardFootage ?? [] as sample (sample)}
      <p>
        {Math.floor(sample.frame / 60)} s · {sample.appearance} · x {sample.x.toFixed(1)}, y {sample.y.toFixed(
          1,
        )}
      </p>
    {/each}
  </details>
{/if}
{#if state[side].biohazardSignal}
  {@const signal = state[side].biohazardSignal!}
  <p role="status">
    {language === 'fr' ? 'Dernier signal de l’émetteur' : 'Latest transmitter signal'} ·
    {Math.floor(signal.frame / 60)} s · x {signal.x.toFixed(1)}, y {signal.y.toFixed(1)}
  </p>
{/if}

{#if state[side].halkenburgOrigin}
  <p role="status">
    Halkenburg · {language === 'fr' ? 'Corps occupé' : 'Occupied body'} : {fighterDefinition(
      state[side].id,
    ).name}
  </p>
{/if}
{#each (state.rosterGuests ?? []).filter((guest) => guest.owner === side && guest.phase !== 'eliminated') as guest (guest.id)}
  <p role="status">
    {guest.role === 'puppet' ? 'Black Voice' : 'Stealth Dolphin'} ·
    {fighterDefinition(guest.fighter.id).name} · {Math.ceil(guest.fighter.health)} PV ·
    {Math.floor(guest.fighter.aura)} aura · {language === 'fr'
      ? {
          preparing: 'Préparation',
          acting: 'En combat',
          leaving: 'Sortie',
          eliminated: 'Hors combat',
        }[guest.phase]
      : guest.phase}
  </p>
{/each}
{#if state[side].dolphinLoanResult === 'conditions-unmet'}
  <p role="status">
    {language === 'fr'
      ? 'Le tiers ne remplit pas les conditions de cette technique. Elle reste chargée.'
      : 'The ally cannot meet this ability’s conditions. It remains loaded.'}
  </p>
{/if}
{#if state[side].dowsingLocation}
  {@const location = state[side].dowsingLocation!}
  <p role="status">
    Dowsing · {fighterDefinition(location.appearance).name} ·
    {language === 'fr'
      ? { left: 'Vers la gauche', right: 'Vers la droite', here: 'À proximité' }[location.direction]
      : location.direction}
  </p>
{/if}
{#if state[side].judgmentChain?.deadlineFrame !== undefined}
  <p role="status">
    Judgment · {language === 'fr' ? 'Temps pour rendre l’otage' : 'Hostage return time'} :
    {Math.max(0, Math.ceil((state[side].judgmentChain!.deadlineFrame! - state.frame) / 60))} s
  </p>
{/if}
