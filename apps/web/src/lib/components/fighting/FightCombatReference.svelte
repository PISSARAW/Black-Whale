<script lang="ts">
  import {
    BASELINE_FIGHTERS,
    BASELINE_SITUATIONS,
    createBaselineSituation,
    type BaselineFighter,
    type BaselineSituation,
    type BaselineTerrain,
  } from '$lib/fighting/combatBaseline'
  import { EXCHANGE_TRIALS } from '$lib/fighting/exchangeStudy'
  import { fighterDefinition } from '$lib/fighting/roster'
  import type { FightState } from '$lib/fighting/types'
  export let language: 'fr' | 'en'
  export let onLaunch: (state: FightState) => void
  let fighter: BaselineFighter = 'kurapika'
  let situation: BaselineSituation = 'spacing'
  let terrain: BaselineTerrain = 'neutral'
  $: text = language === 'fr' ? 0 : 1
  $: trial = EXCHANGE_TRIALS.find((entry) => entry.id === situation)!
</script>

<details class="combat-reference">
  <summary>{text === 0 ? 'Référence · six combattants' : 'Reference · six fighters'}</summary>
  <div class="reference-fields">
    <p>
      {text === 0
        ? 'Repartir d’une situation fixe avec 300 PV et 100 aura finis. Chaque lancement reconstruit les corps, le terrain et les conditions ordinaires des pouvoirs.'
        : 'Start from a fixed situation with finite 300 HP and 100 aura. Each launch rebuilds bodies, terrain and ordinary ability conditions.'}
    </p>
    <label
      >{text === 0 ? 'Combattant de référence' : 'Reference fighter'}
      <select bind:value={fighter}>
        {#each BASELINE_FIGHTERS as id (id)}<option value={id}>{fighterDefinition(id).name}</option
          >{/each}
      </select>
    </label>
    <label
      >{text === 0 ? 'Situation de référence' : 'Reference situation'}
      <select bind:value={situation}>
        {#each BASELINE_SITUATIONS as id (id)}<option value={id}
            >{EXCHANGE_TRIALS.find((entry) => entry.id === id)!.title[text]}</option
          >{/each}
      </select>
    </label>
    <label
      >{text === 0 ? 'Terrain de référence' : 'Reference terrain'}
      <select bind:value={terrain}>
        <option value="neutral"
          >{text === 0
            ? 'Tour Céleste · sans interactions'
            : 'Heavens Arena · no interactions'}</option
        >
        <option value="interactive"
          >{text === 0 ? 'Soute · couverts destructibles' : 'Hold · destructible cover'}</option
        >
      </select>
    </label>
    <p>{trial.instructions[text]}</p>
    <p>
      {text === 0 ? 'Partenaire P2 : ' : 'P2 partner: '}{situation === 'projectiles'
        ? 'Franklin'
        : 'Benjamin'}.
      {text === 0
        ? ' P2 est manuel ; pour la relevée, le mannequin garde puis riposte avec son léger. Les autres séquences se jouent à deux.'
        : ' P2 is manual; for wakeup, the dummy guards then responds with its jab. Play the other sequences with two players.'}
    </p>
    <button
      type="button"
      onclick={() => onLaunch(createBaselineSituation({ fighter, situation, terrain }))}
    >
      {text === 0 ? 'Lancer la situation de référence' : 'Launch reference situation'}
    </button>
    <small
      >{text === 0
        ? 'Remplace l’entraînement courant. Les observations humaines restent à consigner dans les essais d’équilibrage.'
        : 'Replaces the current training session. Record human observations in the balance trials.'}</small
    >
  </div>
</details>

<style>
  .combat-reference {
    border: 1px solid #52616a;
    padding: 0.7rem;
    min-width: 0;
  }
  summary {
    cursor: pointer;
  }
  .reference-fields,
  label {
    display: grid;
    gap: 0.5rem;
  }
  .reference-fields {
    margin-top: 0.7rem;
  }
  p {
    margin: 0;
  }
  select,
  button {
    min-height: 44px;
    max-width: 100%;
    min-width: 0;
    padding: 0.5rem;
    background: #14232e;
    color: #e7eef2;
    border: 1px solid #52616a;
    font: inherit;
  }
  small {
    color: #b8c9d3;
  }
</style>
