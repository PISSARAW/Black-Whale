<script lang="ts">
  import FightIllumiEquipment from './FightIllumiEquipment.svelte'
  import { createFight } from '$lib/fighting/engine'
  import { fightingStyle } from '$lib/fighting/fightStyles'
  import type { FightFormatId } from '$lib/fighting/formats'
  import { FIGHTING_ROSTER, fighterDefinition } from '$lib/fighting/roster'
  import { groupedFightingRoster, randomDuel, randomFighter } from '$lib/fighting/rosterSelection'
  import type { FightEnvironment } from '$lib/fighting/fightEnvironment'
  import type { FightMode, FighterId, FightSide } from '$lib/fighting/types'
  import FighterAvatar from './FighterAvatar.svelte'
  import FightFormatPicker from './FightFormatPicker.svelte'
  import StagePicker from './StagePicker.svelte'
  import './FightSetup.css'

  export let language: 'fr' | 'en'
  export let player: FighterId
  export let opponent: FighterId
  export let environment: FightEnvironment
  export let format: FightFormatId
  export let mode: FightMode
  export let launchLabel: string
  export let playerLabel: string
  export let opponentLabel: string
  export let onPlayer: (id: FighterId) => void
  export let onOpponent: (id: FighterId) => void
  export let onEnvironment: (environment: FightEnvironment) => void
  export let onFormat: (id: FightFormatId) => void
  export let onMode: (mode: FightMode) => void
  export let onLaunch: () => void

  let selecting: FightSide = 'player'
  const groups = groupedFightingRoster(FIGHTING_ROSTER)

  $: gameModes = [
    ['versus-ai', language === 'fr' ? 'Contre l’IA' : 'Versus AI'],
    ['versus-local', language === 'fr' ? 'Versus local' : 'Local versus'],
    ['training', language === 'fr' ? 'Entraînement' : 'Training'],
  ] as Array<[FightMode, string]>

  function previewFighter(id: FighterId) {
    return createFight(id, id).player
  }

  function chooseFighter(id: FighterId) {
    if (selecting === 'player') {
      onPlayer(id)
      selecting = 'opponent'
      return
    }
    onOpponent(id)
  }

  function chooseRandom(side: FightSide) {
    if (side === 'player') onPlayer(randomFighter(FIGHTING_ROSTER, opponent))
    else onOpponent(randomFighter(FIGHTING_ROSTER, player))
    selecting = side
  }

  function chooseRandomDuel() {
    const [nextPlayer, nextOpponent] = randomDuel(FIGHTING_ROSTER)
    onPlayer(nextPlayer)
    onOpponent(nextOpponent)
    selecting = 'player'
  }

  function selectionMark(id: FighterId, playerId: FighterId, opponentId: FighterId): string {
    if (playerId === id && opponentId === id) return '1 · 2'
    if (playerId === id) return '1'
    return opponentId === id ? '2' : ''
  }
</script>

<section
  class="fighter-select"
  aria-label={language === 'fr' ? 'Sélection des combattants' : 'Fighter selection'}
>
  <header class="fighter-select__header">
    <div>
      <p>{language === 'fr' ? 'COMPOSITION DU DUEL' : 'DUEL LINEUP'}</p>
      <h2>{language === 'fr' ? 'Choisis les combattants' : 'Choose the fighters'}</h2>
      <span>
        {language === 'fr'
          ? 'Un seul roster, organisé par appartenance.'
          : 'One roster, organised by affiliation.'}
      </span>
    </div>
    <button type="button" class="random-duel" onclick={chooseRandomDuel}>
      <i aria-hidden="true">↻</i>
      {language === 'fr' ? 'Duel aléatoire' : 'Random duel'}
    </button>
  </header>

  <div class="selection-slots" aria-label={language === 'fr' ? 'Emplacement actif' : 'Active slot'}>
    <button
      type="button"
      class:active={selecting === 'player'}
      aria-pressed={selecting === 'player'}
      onclick={() => (selecting = 'player')}
    >
      <small><b>01</b>{playerLabel}</small>
      <strong>{fighterDefinition(player).name}</strong>
      <span>{language === 'fr' ? 'Cliquer pour modifier' : 'Click to change'}</span>
    </button>
    <b class="slot-versus" aria-hidden="true">VS</b>
    <button
      type="button"
      class:active={selecting === 'opponent'}
      aria-pressed={selecting === 'opponent'}
      onclick={() => (selecting = 'opponent')}
    >
      <small><b>02</b>{opponentLabel}</small>
      <strong>{fighterDefinition(opponent).name}</strong>
      <span>{language === 'fr' ? 'Cliquer pour modifier' : 'Click to change'}</span>
    </button>
  </div>

  <div class="slot-randoms">
    <button type="button" onclick={() => chooseRandom('player')}>
      {language === 'fr' ? '↻ Combattant 1 aléatoire' : '↻ Random fighter 1'}
    </button>
    <button type="button" onclick={() => chooseRandom('opponent')}>
      {language === 'fr' ? '↻ Combattant 2 aléatoire' : '↻ Random fighter 2'}
    </button>
  </div>

  <div class="unified-roster">
    {#each groups as group (group.id)}
      <section class="roster-group" aria-labelledby={`roster-${group.id}`}>
        <header>
          <div>
            <h3 id={`roster-${group.id}`}>{language === 'fr' ? group.nameFr : group.nameEn}</h3>
            <p>{language === 'fr' ? group.descriptionFr : group.descriptionEn}</p>
          </div>
          <span>{group.fighters.length.toString().padStart(2, '0')}</span>
        </header>
        <div class="unified-roster__grid">
          {#each group.fighters as fighter (fighter.id)}
            {@const style = fightingStyle(fighter.id)}
            {@const mark = selectionMark(fighter.id, player, opponent)}
            <button
              type="button"
              class:selected={Boolean(mark)}
              class:player-selected={player === fighter.id}
              class:opponent-selected={opponent === fighter.id}
              aria-pressed={Boolean(mark)}
              aria-label={`${fighter.name}, ${language === 'fr' ? fighter.affiliationFr : fighter.affiliationEn}`}
              title={language === 'fr' ? style.descriptionFr : style.descriptionEn}
              onclick={() => chooseFighter(fighter.id)}
            >
              {#if mark}
                <span class="selection-mark">{mark}</span>
              {/if}
              <span class="fighter-portrait">
                {#if mark}
                  <FighterAvatar fighter={previewFighter(fighter.id)} preview />
                {:else}
                  <span class="fighter-monogram" style={`--fighter:${fighter.colour}`}>
                    {fighter.name.slice(0, 1)}
                  </span>
                {/if}
              </span>
              <small>{language === 'fr' ? fighter.affiliationFr : fighter.affiliationEn}</small>
              <strong>{fighter.name}</strong>
              <em>{language === 'fr' ? style.nameFr : style.nameEn}</em>
            </button>
          {/each}
        </div>
      </section>
    {/each}
  </div>
</section>

  <FightIllumiEquipment {environment} {player} {opponent} {language} {onEnvironment} />
<StagePicker {environment} {language} onSelect={onEnvironment} />
<FightFormatPicker selected={format} {language} onSelect={onFormat} />

<div class="fight-mode-picker" aria-label={language === 'fr' ? 'Mode de jeu' : 'Game mode'}>
  {#each gameModes as option (option[0])}
    <button
      type="button"
      class:selected={mode === option[0]}
      aria-pressed={mode === option[0]}
      onclick={() => onMode(option[0])}>{option[1]}</button
    >
  {/each}
</div>

<div class="selection-summary">
  <div>
    <span style={`--swatch:${fighterDefinition(player).accent}`}></span>
    <strong>{fighterDefinition(player).name}</strong>
  </div>
  <b>VS</b>
  <div>
    <strong>{fighterDefinition(opponent).name}</strong>
    <span style={`--swatch:${fighterDefinition(opponent).accent}`}></span>
  </div>
  <button type="button" onclick={onLaunch}>{launchLabel}</button>
</div>

<style>
  .random-duel,
  .slot-randoms button {
    border: 1px solid #d4aa43;
    background: #161b1e;
    color: #f0d06e;
    font: 700 0.66rem/1 var(--font-mono);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
  }

  .random-duel {
    min-height: 44px;
    padding: 0.75rem 1rem;
  }

  .random-duel i {
    margin-right: 0.45rem;
    font-size: 1rem;
  }

  .selection-slots {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: stretch;
    gap: 0.8rem;
    padding: 1rem 1.4rem 0.5rem;
  }

  .selection-slots button {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.2rem 1rem;
    padding: 0.85rem 1rem;
    border: 1px solid #34424b;
    border-left: 4px solid #667681;
    background: #0b1115;
    color: #fff;
    text-align: left;
    cursor: pointer;
  }

  .selection-slots button:last-child {
    border-right: 4px solid #667681;
    border-left-width: 1px;
    text-align: right;
  }

  .selection-slots button.active {
    border-color: #d5ac42;
    background: linear-gradient(100deg, rgb(163 45 56 / 25%), #0b1115 58%);
    box-shadow: inset 0 0 0 1px rgb(213 172 66 / 18%);
  }

  .selection-slots button:last-child.active {
    background: linear-gradient(260deg, rgb(45 125 160 / 25%), #0b1115 58%);
  }

  .selection-slots small,
  .selection-slots span {
    color: #84929b;
    font: 600 0.58rem/1.2 var(--font-mono);
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }

  .selection-slots small b {
    margin-right: 0.55rem;
    color: #d9b550;
  }

  .selection-slots strong {
    grid-row: 2;
    font: 700 1.15rem/1 var(--font-display);
    text-transform: uppercase;
  }

  .selection-slots span {
    grid-row: 2;
  }

  .slot-versus {
    align-self: center;
    color: #e9edf0;
    font: italic 700 1rem/1 var(--font-display);
    text-shadow: 2px 2px 0 #a32d38;
  }

  .slot-randoms {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 0 1.4rem 1rem;
  }

  .slot-randoms button {
    padding: 0.45rem 0.65rem;
    border-color: #43515a;
    color: #aeb9bf;
    font-size: 0.55rem;
  }

  .unified-roster {
    max-height: min(55rem, 70vh);
    overflow-y: auto;
    padding: 0 1.4rem 1.4rem;
    scrollbar-color: #b88d31 #11181d;
  }

  .roster-group {
    padding-top: 1.25rem;
    border-top: 1px solid #26323a;
  }

  .roster-group + .roster-group {
    margin-top: 1.35rem;
  }

  .roster-group > header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.8rem;
  }

  .roster-group h3 {
    color: #e8edf1;
    font: 700 0.82rem/1 var(--font-mono);
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }

  .roster-group > header > span {
    color: #586973;
    font: 700 0.68rem/1 var(--font-mono);
  }

  .unified-roster__grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 0.65rem;
  }

  .unified-roster__grid > button {
    position: relative;
    overflow: hidden;
    min-width: 0;
    min-height: 170px;
    padding: 0.65rem;
    border: 1px solid #29343c;
    background: linear-gradient(145deg, #141b21, #090d10);
    color: #fff;
    text-align: left;
    cursor: pointer;
    transition:
      border-color 150ms,
      transform 150ms,
      box-shadow 150ms;
  }

  .unified-roster__grid > button:hover {
    border-color: #7e8c95;
    transform: translateY(-2px);
  }

  .unified-roster__grid > button.selected {
    border-color: #e7bd52;
    box-shadow: inset 0 -45px 45px rgb(177 49 60 / 18%);
  }

  .unified-roster__grid > button.opponent-selected {
    box-shadow: inset 0 -45px 45px rgb(37 132 173 / 20%);
  }

  .selection-mark {
    position: absolute;
    z-index: 3;
    top: 0.5rem;
    right: 0.5rem;
    display: grid;
    min-width: 1.7rem;
    height: 1.7rem;
    padding-inline: 0.35rem;
    place-items: center;
    background: #d6aa40;
    color: #080b0d;
    font: 800 0.62rem/1 var(--font-mono);
    clip-path: polygon(5px 0, 100% 0, calc(100% - 5px) 100%, 0 100%);
  }

  .fighter-portrait {
    position: absolute;
    top: -2.1rem;
    left: 50%;
    height: 135px;
    transform: translateX(-50%);
    opacity: 0.9;
    pointer-events: none;
  }

  .opponent-selected .fighter-portrait {
    transform: translateX(-50%) scaleX(-1);
  }

  .fighter-monogram {
    display: grid;
    width: 96px;
    height: 130px;
    place-items: center;
    border-radius: 52% 52% 18% 18%;
    background:
      radial-gradient(circle at 50% 24%, var(--fighter) 0 18%, transparent 19%),
      linear-gradient(
        110deg,
        transparent 20%,
        color-mix(in srgb, var(--fighter) 72%, #111) 21% 79%,
        transparent 80%
      );
    color: rgb(255 255 255 / 64%);
    font: 700 2.1rem/1 var(--font-display);
    text-shadow: 0 2px 12px #000;
    filter: drop-shadow(0 14px 8px rgb(0 0 0 / 52%));
  }

  .opponent-selected .fighter-monogram {
    transform: scaleX(-1);
  }

  .unified-roster__grid small,
  .unified-roster__grid strong,
  .unified-roster__grid em {
    position: relative;
    z-index: 2;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .unified-roster__grid small {
    margin-top: 92px;
    color: #d5ac42;
    font: 700 0.52rem/1 var(--font-mono);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .unified-roster__grid strong {
    margin-top: 0.35rem;
    font: 700 0.88rem/1 var(--font-display);
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  .unified-roster__grid em {
    margin-top: 0.3rem;
    color: #81919a;
    font: normal 500 0.54rem/1.2 var(--font-mono);
  }

  @media (max-width: 1050px) {
    .unified-roster__grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  @media (max-width: 700px) {
    .fighter-select__header {
      align-items: stretch;
      flex-direction: column;
    }
    .selection-slots {
      grid-template-columns: 1fr;
    }
    .slot-versus {
      display: none;
    }
    .selection-slots button:last-child {
      border-right-width: 1px;
      border-left-width: 4px;
      text-align: left;
    }
    .slot-randoms {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
    .unified-roster__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .unified-roster {
      max-height: 65vh;
    }
  }
</style>
