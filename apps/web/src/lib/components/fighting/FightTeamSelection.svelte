<script lang="ts">
  import { FIGHTING_ROSTER } from '$lib/fighting/roster'
  import { personalEquipment } from '$lib/fighting/preparationWorld'
  import { arenaTechnique } from '$lib/fighting/arenaTechnique'
  import { moveTeamSlot } from '$lib/fighting/teams/draft'
  import type { FighterId, FightSide } from '$lib/fighting/types'
  export let roster: FighterId[]
  export let side: FightSide
  export let language: 'fr' | 'en'
  export let interactive: boolean
  export let onChange: (roster: FighterId[]) => void
  $: fr = language === 'fr'
  $: label = side === 'player' ? 'P1' : 'P2'
  const equipment = {
    flute: ['flûte', 'flute'],
    book: ['livre', 'book'],
    needles: ['aiguilles', 'needles'],
    'tracker-receiver': ['récepteur de l’émetteur', 'transmitter receiver'],
    'blood-infusion': ['perfusion de sang', 'blood infusion'],
  } as const
</script>

<fieldset>
  <legend>{label} · {fr ? 'Ordre des combattants' : 'Fighter order'}</legend>
  {#each roster as id, index (index)}
    {@const fighter = FIGHTING_ROSTER.find((f) => f.id === id)!}
    {@const gear = personalEquipment(id)}
    {@const terrain = arenaTechnique(id)}
    <div class="member">
      <label
        >{label} · {index + 1}
        <select
          value={id}
          aria-label={`${label} · ${fr ? 'Combattant' : 'Fighter'} ${index + 1}`}
          onchange={(event) =>
            onChange(
              roster.map((old, i) =>
                i === index ? (event.currentTarget.value as FighterId) : old,
              ),
            )}
        >
          {#each FIGHTING_ROSTER as entry (entry.id)}<option
              value={entry.id}
              disabled={entry.id !== id && roster.includes(entry.id)}>{entry.name}</option
            >{/each}
        </select>
      </label>
      <div class="order">
        <button
          type="button"
          disabled={index === 0}
          aria-label={`${label} · ${fr ? 'Monter' : 'Move up'} ${fighter.name}`}
          onclick={() => onChange(moveTeamSlot(roster, index, index - 1))}
          >{fr ? 'Monter' : 'Move up'}</button
        >
        <button
          type="button"
          disabled={index === 2}
          aria-label={`${label} · ${fr ? 'Descendre' : 'Move down'} ${fighter.name}`}
          onclick={() => onChange(moveTeamSlot(roster, index, index + 1))}
          >{fr ? 'Descendre' : 'Move down'}</button
        >
      </div>
      <small
        >{fr ? 'Équipement personnel' : 'Personal equipment'} : {gear.length
          ? gear.map((item) => equipment[item][fr ? 0 : 1]).join(', ')
          : fr
            ? 'aucun matériel supplémentaire'
            : 'no additional equipment'}</small
      >
      {#if interactive && terrain}<details>
          <summary>{fr ? 'Terrain' : 'Terrain'} · {terrain.name[fr ? 0 : 1]}</summary>
          <p>{terrain.effect[fr ? 0 : 1]}</p>
          <p>{terrain.condition[fr ? 0 : 1]}</p>
        </details>{/if}
    </div>
  {/each}
</fieldset>

<style>
  fieldset {
    min-width: 0;
    border: 1px solid #6e869e;
    padding: 0.75rem;
  }
  .member {
    padding: 0.7rem 0;
    border-bottom: 1px solid #405366;
    overflow-wrap: anywhere;
  }
  label {
    display: grid;
    gap: 0.3rem;
  }
  .order {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
    margin: 0.4rem 0;
  }
  select,
  button {
    max-width: 100%;
    min-height: 44px;
    padding: 0.5rem;
    font: inherit;
    color: inherit;
    background: #22394a;
    border: 1px solid #6e869e;
  }
  small {
    display: block;
  }
  button:disabled {
    opacity: 0.4;
  }
  summary {
    cursor: pointer;
    padding: 0.4rem 0;
  }
</style>
