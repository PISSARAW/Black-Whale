<script lang="ts">
  import { DEATH_MATCH_CHAPTER_SPECS } from '$lib/fighting/heavensDeathMatch/acts'
  import { historicalOptions } from '$lib/fighting/heavensDeathMatch/historicalSetup'
  import type { DeathMatchOptions } from '$lib/fighting/heavensDeathMatch/scenario'
  import type { FightEnvironment } from '$lib/fighting/fightEnvironment'
  import FightPortrait from './FightPortrait.svelte'
  import FightSetupFooter from './FightSetupFooter.svelte'
  import type { FighterId } from '$lib/fighting/types'

  export let language: 'fr' | 'en'
  export let player: FighterId
  export let opponent: FighterId
  export let environment: FightEnvironment
  export let onOptions: (options: Partial<DeathMatchOptions>) => void
  export let onLaunch: () => void

  $: fr = language === 'fr'
  $: options = historicalOptions(environment)
  $: groups = [
    {
      key: 'chrolloSide' as const,
      label: fr ? 'Ton camp' : 'Your side',
      choices: [
        { value: 'opponent', name: 'Hisoka', hint: fr ? 'Chrollo en P2' : 'Chrollo as P2' },
        { value: 'player', name: 'Chrollo', hint: fr ? 'Hisoka en P2' : 'Hisoka as P2' },
      ],
    },
    {
      key: 'playMode' as const,
      label: fr ? 'Déroulement' : 'Course of events',
      choices: [
        {
          value: 'scripted',
          name: fr ? 'Scripté' : 'Scripted',
          hint: fr ? 'Revoir le combat' : 'Watch it again',
        },
        {
          value: 'semi-free',
          name: fr ? 'Semi-libre' : 'Semi-free',
          hint: fr ? 'Changer certains événements' : 'Change some events',
        },
        { value: 'free', name: fr ? 'Libre' : 'Free', hint: fr ? 'Tout ordre' : 'Any order' },
      ],
    },
    {
      key: 'difficulty' as const,
      label: fr ? 'Difficulté' : 'Difficulty',
      choices: [
        {
          value: 'normal',
          name: fr ? 'Normale' : 'Normal',
          hint: fr ? 'Plus permissive' : 'More forgiving',
        },
        {
          value: 'canonical',
          name: fr ? 'Canonique' : 'Canonical',
          hint: fr ? 'Fidèle' : 'Faithful',
        },
        { value: 'free', name: fr ? 'Libre' : 'Free', hint: fr ? 'Sans contrainte' : 'Unbound' },
      ],
    },
  ]
  function pick(key: 'chrolloSide' | 'playMode' | 'difficulty', value: string) {
    onOptions({ [key]: value } as Partial<DeathMatchOptions>)
  }
</script>

<section class="clash-page" aria-labelledby="historical-title">
  <p class="clash-kicker">
    {fr ? 'COMBAT HISTORIQUE / CHAPITRES 351–357' : 'HISTORICAL FIGHT / CHAPTERS 351–357'}
  </p>
  <h1 class="clash-title" id="historical-title">
    {fr ? 'Hisoka contre Chrollo.' : 'Hisoka versus Chrollo.'}
  </h1>
  <p class="clash-subtitle">
    {fr
      ? 'Un combat à mort au sommet de la Tour Céleste : sans points, sans manche, jusqu’au bout. La foule fait partie du plan.'
      : 'A death match at the top of Heavens Arena: no points, no rounds, to the end. The crowd is part of the plan.'}
  </p>
  <div class="historical-layout">
    <div class="historical-options">
      {#each groups as group (group.key)}
        <fieldset>
          <legend>{group.label}</legend>
          <div class="choices">
            {#each group.choices as choice (choice.value)}
              <button
                type="button"
                class:selected={options[group.key] === choice.value}
                aria-pressed={options[group.key] === choice.value}
                onclick={() => pick(group.key, choice.value)}
                ><strong>{choice.name}</strong><small>{choice.hint}</small></button
              >
            {/each}
          </div>
        </fieldset>
      {/each}
      <label class="assists">
        <input
          type="checkbox"
          checked={options.deductionAssists}
          onchange={(event) => onOptions({ deductionAssists: event.currentTarget.checked })}
        />
        <span
          ><strong>{fr ? 'Déductions d’Hisoka' : 'Hisoka’s deductions'}</strong><small
            >{fr
              ? 'Fragments visuels de ce qu’il a compris.'
              : 'Visual fragments of what he has understood.'}</small
          ></span
        >
      </label>
    </div>
    <aside class="historical-ticket" aria-label={fr ? 'Les chapitres' : 'The chapters'}>
      <div class="ticket-fighters">
        <div><FightPortrait id={player} /></div>
        <div><FightPortrait id={opponent} reverse /></div>
      </div>
      <ol>
        {#each DEATH_MATCH_CHAPTER_SPECS as spec (spec.chapter)}
          <li><b>{spec.chapter}</b><span>{fr ? spec.objectiveFr : spec.objectiveEn}</span></li>
        {/each}
      </ol>
    </aside>
  </div>
  <FightSetupFooter
    {language}
    {player}
    {opponent}
    back="/fighting"
    nextLabel={fr ? 'Entrer dans l’arène' : 'Enter the arena'}
    onNext={onLaunch}
  />
</section>

<style>
  .historical-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(260px, 0.9fr);
    gap: 2rem;
  }
  fieldset {
    border: 0;
    margin: 0 0 1.4rem;
    padding: 0;
  }
  legend {
    color: #e6d7ee;
    font-size: 0.72rem;
    letter-spacing: 0.14em;
    margin-bottom: 0.6rem;
    text-transform: uppercase;
  }
  .choices {
    display: grid;
    gap: 0.6rem;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  .choices button {
    background: #17111e;
    border: 1px solid #5d436e;
    color: #f4ecf7;
    cursor: pointer;
    display: grid;
    gap: 0.2rem;
    padding: 0.85rem 1rem;
    text-align: left;
  }
  .choices button.selected {
    background: #2b1838;
    border-color: #d64b8c;
  }
  small {
    color: #b9a8c4;
    font-size: 0.78rem;
  }
  .assists {
    align-items: start;
    display: flex;
    gap: 0.75rem;
  }
  .assists span {
    display: grid;
  }
  .historical-ticket {
    background: #17111e;
    border: 1px solid #5d436e;
    padding: 1.2rem;
  }
  .ticket-fighters {
    display: grid;
    gap: 0.5rem;
    grid-template-columns: 1fr 1fr;
  }
  ol {
    display: grid;
    gap: 0.55rem;
    list-style: none;
    margin: 1rem 0 0;
    padding: 0;
  }
  li {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: 2.6rem 1fr;
    font-size: 0.85rem;
  }
  li b {
    color: #d64b8c;
  }
  @media (max-width: 760px) {
    .historical-layout {
      grid-template-columns: 1fr;
    }
  }
</style>
