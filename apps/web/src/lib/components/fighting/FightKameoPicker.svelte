<script lang="ts">
  import { KAMEO_CATALOGUE, KAMEO_IDS } from '$lib/fighting/kameos/catalogue'
  import { chosenKameos, kameoPick } from '$lib/fighting/kameos/selection'
  import type { KameoPicks } from '$lib/fighting/kameos/state'
  import type { FightSide } from '$lib/fighting/types'

  export let language: 'fr' | 'en'
  export let picks: KameoPicks | undefined = undefined
  export let onPick: ((side: FightSide, id: KameoPicks['player']) => void) | undefined = undefined

  const ROLE: Record<string, [string, string]> = {
    soin: ['Soin', 'Healing'],
    defense: ['Défense', 'Defence'],
    boost: ['Boost', 'Boost'],
    attaque: ['Attaque', 'Attack'],
    piege: ['Piège', 'Trap'],
    zone: ['Zone', 'Zone'],
  }
  const seats: Array<[FightSide, string]> = [
    ['player', 'P1'],
    ['opponent', 'P2'],
  ]
  $: lang = language === 'fr' ? 0 : 1

  function choose(side: FightSide, value: string) {
    if (onPick) onPick(side, kameoPick(value))
    else chosenKameos.update((current) => ({ ...current, [side]: kameoPick(value) }))
  }
</script>

<section
  class="kameo-picker"
  aria-label={language === 'fr' ? 'Kaméos de soutien' : 'Support kameos'}
>
  <p class="kameo-label">
    <span>05</span>{language === 'fr' ? 'Kaméo de soutien' : 'Support kameo'}
  </p>
  <div class="kameo-grid">
    {#each seats as [side, seat] (side)}
      <label>
        <strong>{seat}</strong>
        <select
          value={(picks ?? $chosenKameos)[side] ?? ''}
          onchange={(event) => choose(side, event.currentTarget.value)}
        >
          <option value="">{language === 'fr' ? 'Aucun' : 'None'}</option>
          {#each KAMEO_IDS as id (id)}
            <option value={id}
              >{KAMEO_CATALOGUE[id].name} · {ROLE[KAMEO_CATALOGUE[id].role][lang]}</option
            >
          {/each}
        </select>
      </label>
    {/each}
  </div>
</section>

<style>
  .kameo-picker {
    width: min(1380px, 100%);
    margin: 1.4rem auto 0;
  }
  .kameo-label {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin: 0 0 0.7rem;
    color: #cad5dc;
    font: 600 0.72rem/1.2 var(--font-mono);
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .kameo-label span {
    color: #c7952d;
  }
  .kameo-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.6rem;
  }
  label {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 0.7rem;
    padding: 0.7rem 0.85rem;
    border: 1px solid #31404c;
    border-radius: 3px;
    background: linear-gradient(145deg, #111920, #080c10);
    color: #e6edf1;
  }
  strong {
    color: #e3bd55;
    font: 700 0.72rem/1 var(--font-mono);
  }
  select {
    min-width: 0;
    min-height: 44px;
    border: 1px solid #31404c;
    background: #080c10;
    color: #e6edf1;
    font: 500 0.72rem/1.2 var(--font-mono);
  }
  @media (max-width: 700px) {
    .kameo-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
