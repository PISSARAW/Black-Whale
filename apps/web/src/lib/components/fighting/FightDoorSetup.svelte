<script lang="ts">
  import {
    DEFAULT_DOOR_PICK,
    DOOR_CAPABLE_FIGHTERS,
    DOOR_MIN_SPAN,
    doorPickSites,
    doorSitesFor,
  } from '$lib/fighting/voconteDoorSites'
  import { fighterDefinition } from '$lib/fighting/roster'
  import type { FightEnvironment } from '$lib/fighting/fightEnvironment'
  import type { FighterId, FightSide } from '$lib/fighting/types'
  import type { DoorFramePick } from '$lib/fighting/voconteDoorTypes'

  export let environment: FightEnvironment
  export let fighters: Record<FightSide, FighterId>
  export let language: 'fr' | 'en'
  export let onChange: (environment: FightEnvironment) => void

  const SIDES: readonly FightSide[] = ['player', 'opponent']
  $: sites = doorSitesFor(environment.stageId)
  $: seats = SIDES.filter((side) => DOOR_CAPABLE_FIGHTERS.includes(fighters[side]))

  function pickOf(side: FightSide): DoorFramePick {
    return environment.doorFrames?.[side] ?? DEFAULT_DOOR_PICK
  }
  function choose(side: FightSide, slot: 0 | 1, id: string) {
    const current = pickOf(side)
    const next: DoorFramePick = slot === 0 ? [id, current[1]] : [current[0], id]
    onChange({ ...environment, doorFrames: { ...environment.doorFrames, [side]: next } })
  }
</script>

{#if seats.length}
  <fieldset class="door-setup">
    <legend
      >{language === 'fr'
        ? 'Door · deux huisseries du niveau, fixées avant la manche'
        : 'Door · two doorframes of this level, fixed before the round'}</legend
    >
    {#each seats as side (side)}
      {@const pick = pickOf(side)}
      {@const valid = doorPickSites(environment.stageId, pick) !== null}
      <div class="seat">
        <strong>P{side === 'player' ? 1 : 2} · {fighterDefinition(fighters[side]).name}</strong>
        {#each [0, 1] as slot (slot)}
          <label
            >{slot === 0
              ? language === 'fr'
                ? 'Cadre 1'
                : 'Frame 1'
              : language === 'fr'
                ? 'Cadre 2'
                : 'Frame 2'}
            <select
              value={pick[slot]}
              onchange={(event) => choose(side, slot as 0 | 1, event.currentTarget.value)}
            >
              {#each sites as entry (entry.id)}
                <option value={entry.id}>{language === 'fr' ? entry.labelFr : entry.labelEn}</option
                >
              {/each}
            </select></label
          >
        {/each}
        {#if !valid}<span class="invalid"
            >{language === 'fr'
              ? `Deux cadres distincts, à ${DOOR_MIN_SPAN} pas d’écart au moins : les cadres par défaut seront utilisés.`
              : `Two distinct frames at least ${DOOR_MIN_SPAN} steps apart: the default frames will be used.`}</span
          >{/if}
      </div>
    {/each}
    <p>
      {language === 'fr'
        ? 'Seuls les corps et les objets matériels qui franchissent un cadre dans son sens passent. L’aura émise ne traverse pas, et les cadres ne bougent pas pendant la manche.'
        : 'Only bodies and physical objects crossing a frame in its direction pass. Emitted aura does not, and the frames never move during the round.'}
    </p>
  </fieldset>
{/if}

<style>
  .door-setup {
    display: grid;
    gap: 0.5rem;
  }
  .seat {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
    align-items: center;
  }
  select {
    min-height: 44px;
    margin-left: 0.4rem;
    border: 1px solid #617582;
    background: #15242d;
    color: inherit;
    font: inherit;
  }
  .invalid {
    color: #e7a07c;
  }
  p {
    margin: 0;
  }
</style>
