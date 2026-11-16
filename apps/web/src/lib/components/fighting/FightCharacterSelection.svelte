<script lang="ts">
  import { FIGHTING_ROSTER, fighterDefinition } from '$lib/fighting/roster'
  import { groupedFightingRoster, randomFighter } from '$lib/fighting/rosterSelection'
  import { fightingStyle } from '$lib/fighting/fightStyles'
  import type { FighterId, FightSide } from '$lib/fighting/types'
  import FightPortrait from './FightPortrait.svelte'
  import FightRosterPortrait from './FightRosterPortrait.svelte'
  import FightFighterDossier from './FightFighterDossier.svelte'
  import FightSetupFooter from './FightSetupFooter.svelte'
  export let language: 'fr' | 'en'
  export let player: FighterId
  export let opponent: FighterId
  export let onPlayer: (id: FighterId) => void
  export let onOpponent: (id: FighterId) => void
  export let onContinue: () => void
  let selecting: FightSide = 'player'
  let search = ''
  let group = 'all'
  const groups = groupedFightingRoster(FIGHTING_ROSTER)
  const roster = groups.flatMap((entry) =>
    entry.fighters.map((fighter) => ({ ...fighter, group: entry.id })),
  )
  $: fr = language === 'fr'
  $: active = selecting === 'player' ? player : opponent
  $: definition = fighterDefinition(active)
  $: style = fightingStyle(active)
  $: filtered = roster.filter(
    (fighter) =>
      (group === 'all' || fighter.group === group) &&
      fighter.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  )
  function choose(id: FighterId) {
    if (selecting === 'player') onPlayer(id)
    else onOpponent(id)
  }
  function next() {
    if (selecting === 'opponent') return onContinue()
    selecting = 'opponent'
    search = ''
  }
</script>

<section class="clash-page" aria-labelledby="character-title">
  <div class="clash-section-heading">
    <div>
      <p class="clash-kicker">CHARACTER SELECT</p>
      <h1 class="clash-title" id="character-title">
        {fr ? 'Choisis ton combattant.' : 'Choose your fighter.'}
      </h1>
      <p class="clash-subtitle">
        {fr
          ? 'Deux styles. Un seul vainqueur. À toi de composer le duel.'
          : 'Two styles. One winner. Build your matchup.'}
      </p>
    </div>
    <span class="roster-total">{FIGHTING_ROSTER.length} {fr ? 'COMBATTANTS' : 'FIGHTERS'}</span>
  </div>
  <div class="character-layout">
    <aside
      class="character-showcase"
      style={`--character-accent:${definition.accent}`}
      aria-label={fr ? 'Aperçu du combattant' : 'Fighter preview'}
    >
      <div class="showcase-meta">
        <span>{selecting === 'player' ? 'PLAYER 01' : 'PLAYER 02'}</span><span
          >● {fr ? 'SÉLECTION' : 'SELECTING'}</span
        >
      </div>
      <div class="showcase-portrait">
        <span class="showcase-initial" aria-hidden="true">{definition.name.slice(0, 1)}</span
        ><FightPortrait id={active} reverse={selecting === 'opponent'} />
      </div>
      <div class="showcase-description" aria-live="polite">
        <h2>{definition.name}</h2>
        <p class="style-name">{fr ? style.nameFr : style.nameEn}</p>
        <p>{fr ? style.descriptionFr : style.descriptionEn}</p>
        <FightFighterDossier fighterId={active} {language} />
      </div>
    </aside>
    <div class="character-browser">
      <div class="character-slots" aria-label={fr ? 'Combattant à modifier' : 'Fighter to edit'}>
        <button
          type="button"
          class:active={selecting === 'player'}
          aria-pressed={selecting === 'player'}
          onclick={() => (selecting = 'player')}
          ><small>P1 · {fr ? 'TON PERSONNAGE' : 'YOUR FIGHTER'}</small><strong
            >{fighterDefinition(player).name}</strong
          ><span>{fr ? 'Modifier' : 'Edit'} ↗</span></button
        >
        <span class="slots-vs" aria-hidden="true"></span>
        <button
          type="button"
          class:active={selecting === 'opponent'}
          aria-pressed={selecting === 'opponent'}
          onclick={() => (selecting = 'opponent')}
          ><small>P2 · {fr ? 'ADVERSAIRE' : 'OPPONENT'}</small><strong
            >{fighterDefinition(opponent).name}</strong
          ><span>{fr ? 'Modifier' : 'Edit'} ↗</span></button
        >
      </div>
      <div class="roster-tools">
        <label class="clash-search"
          ><span aria-hidden="true">⌕</span><input
            type="search"
            bind:value={search}
            aria-label={fr ? 'Rechercher un combattant' : 'Search fighters'}
            placeholder={fr ? 'Rechercher un combattant…' : 'Search fighters…'}
          /></label
        ><button
          class="clash-secondary"
          type="button"
          onclick={() => choose(randomFighter(FIGHTING_ROSTER, active))}
          >↻ {fr ? 'Aléatoire' : 'Random'}</button
        >
      </div>
      <div class="clash-filter-row" aria-label={fr ? 'Filtrer par faction' : 'Filter by faction'}>
        <button type="button" aria-pressed={group === 'all'} onclick={() => (group = 'all')}
          >{fr ? 'Tous' : 'All'}</button
        >
        {#each groups as entry (entry.id)}<button
            type="button"
            aria-pressed={group === entry.id}
            onclick={() => (group = entry.id)}>{fr ? entry.nameFr : entry.nameEn}</button
          >{/each}
      </div>
      <p class="selection-instruction" role="status">
        {selecting === 'player'
          ? fr
            ? '01 / Sélectionne ton personnage, puis confirme P1.'
            : '01 / Select your fighter, then confirm P1.'
          : fr
            ? '02 / Choisis ton adversaire, puis passe au terrain.'
            : '02 / Choose your opponent, then select a stage.'}
      </p>
      <div class="character-grid" aria-label={fr ? 'Liste des combattants' : 'Fighter roster'}>
        {#each filtered as fighter (fighter.id)}
          <button
            type="button"
            style={`--tile-accent:${fighter.accent}`}
            aria-pressed={active === fighter.id}
            aria-label={`${fighter.name}, ${fr ? fighter.affiliationFr : fighter.affiliationEn}`}
            onclick={() => choose(fighter.id)}
            class:is-player={player === fighter.id}
            class:is-opponent={opponent === fighter.id}
          >
            <span class="tile-symbol" aria-hidden="true">{fighter.name.slice(0, 2)}</span>
            <FightRosterPortrait id={fighter.id} />
            <span class="tile-marks"
              >{#if player === fighter.id}<b>P1</b>{/if}{#if opponent === fighter.id}<b>P2</b
                >{/if}</span
            >
            <strong>{fighter.name}</strong>
          </button>
        {:else}<div class="clash-empty">
            {fr ? 'Aucun combattant trouvé.' : 'No fighters found.'}<button
              class="clash-secondary"
              type="button"
              onclick={() => {
                search = ''
                group = 'all'
              }}>{fr ? 'Effacer les filtres' : 'Clear filters'}</button
            >
          </div>{/each}
      </div>
    </div>
  </div>
  <FightSetupFooter
    {language}
    {player}
    {opponent}
    back="/fighting"
    nextLabel={selecting === 'player'
      ? fr
        ? 'Confirmer P1'
        : 'Confirm P1'
      : fr
        ? 'Choisir le terrain'
        : 'Choose stage'}
    onNext={next}
  />
</section>

<style>
  .roster-total {
    padding-top: 0.5rem;
    white-space: nowrap;
    color: #8e829a;
    font: 0.6rem var(--font-mono);
  }
  .character-layout {
    display: grid;
    grid-template-columns: minmax(240px, 0.7fr) minmax(0, 1.5fr);
    gap: 2rem;
  }
  .character-showcase {
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    align-self: start;
    min-height: 485px;
    border: 1px solid #514057;
    background: radial-gradient(
      ellipse at 50% 35%,
      color-mix(in srgb, var(--character-accent) 15%, #19121c),
      #120f16 75%
    );
  }
  .showcase-meta {
    display: flex;
    justify-content: space-between;
    padding: 1rem;
    color: #d5c5e1;
    font: 500 0.55rem var(--font-mono);
    letter-spacing: 0.08em;
  }
  .showcase-meta span:last-child {
    color: var(--clash-orange);
  }
  .showcase-portrait {
    position: relative;
    height: 290px;
  }
  .showcase-initial {
    position: absolute;
    left: 5%;
    top: 0;
    color: transparent;
    -webkit-text-stroke: 1px #ffffff12;
    font:
      italic 900 19rem/0.9 Arial,
      sans-serif;
  }
  .showcase-description {
    position: relative;
    padding: 1.25rem;
    border-top: 1px solid #ffffff15;
    background: #130f17cc;
  }
  .showcase-description h2 {
    margin: 0;
    font:
      italic 900 clamp(1.8rem, 2.8vw, 3rem)/1 Arial,
      sans-serif;
    text-transform: uppercase;
    letter-spacing: -0.05em;
    overflow-wrap: anywhere;
  }
  .showcase-description p {
    margin: 0.75rem 0 0;
    color: #b0a2bc;
    font-size: 0.75rem;
    line-height: 1.6;
  }
  .showcase-description .style-name {
    color: var(--clash-orange);
    font: 600 0.65rem var(--font-mono);
  }
  .character-slots {
    display: grid;
    grid-template-columns: 1fr 36px 1fr;
    align-items: center;
    gap: 0.5rem;
  }
  .character-slots button {
    display: grid;
    gap: 0.4rem;
    position: relative;
    min-width: 0;
    min-height: 85px;
    padding: 0.8rem 1rem;
    background: #17121d;
    border: 1px solid #4a3d53;
    color: #d4c7df;
    text-align: left;
    cursor: pointer;
  }
  .character-slots button.active {
    border-color: var(--clash-orange);
    background: #ff864b0c;
    box-shadow: inset 3px 0 var(--clash-orange);
  }
  .character-slots button:last-child.active {
    border-color: var(--clash-violet);
    background: #b79aff0c;
    box-shadow: inset 3px 0 var(--clash-violet);
  }
  .character-slots small {
    color: #b9a3c9;
    font: 0.55rem var(--font-mono);
  }
  .character-slots strong {
    font:
      800 1.1rem Arial,
      sans-serif;
    text-transform: uppercase;
  }
  .character-slots button > span {
    position: absolute;
    right: 0.65rem;
    bottom: 0.65rem;
    color: #9884a8;
    font: 0.5rem var(--font-mono);
  }
  .slots-vs {
    text-align: center;
    font:
      italic 900 1.1rem Arial,
      sans-serif;
    color: #9e7bae;
  }
  .slots-vs::before {
    content: 'VS';
  }
  .roster-tools {
    display: flex;
    gap: 0.6rem;
    margin-top: 1rem;
  }
  .roster-tools .clash-search {
    flex: 1;
  }
  .selection-instruction {
    margin: 0.8rem 0;
    color: #cbb6dc;
    font: 0.65rem/1.5 var(--font-mono);
  }
  .character-grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 0.45rem;
    max-height: 350px;
    overflow-y: auto;
    padding: 5px;
    margin: -5px;
    scrollbar-color: #8c65ae #1b1422;
    scrollbar-width: thin;
  }
  .character-grid > button {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    min-width: 0;
    min-height: 88px;
    overflow: hidden;
    padding: 0.55rem 0.4rem;
    border: 1px solid #51405b;
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--tile-accent) 16%, #1e1624),
      #17101e
    );
    color: #f1e6fa;
    cursor: pointer;
  }
  .character-grid > button:hover {
    border-color: #d1b7ee;
    background: #4c2f5e;
  }
  .character-grid > button[aria-pressed='true'] {
    border-color: #ff9a64;
    box-shadow: inset 0 0 0 1px #ff9a64;
  }
  .character-grid > button.is-opponent[aria-pressed='true'] {
    border-color: #c2a0ff;
    box-shadow: inset 0 0 0 1px #c2a0ff;
  }
  .tile-symbol {
    position: absolute;
    top: 4px;
    left: 8px;
    color: color-mix(in srgb, var(--tile-accent) 55%, #bdb1cb);
    font:
      italic 900 2.3rem Arial,
      sans-serif;
    text-transform: uppercase;
    letter-spacing: -0.12em;
    opacity: 0.6;
  }
  .tile-marks {
    position: absolute;
    right: 3px;
    top: 3px;
    display: flex;
    gap: 2px;
  }
  .tile-marks b {
    padding: 3px;
    background: #ff864b;
    color: #1b0b04;
    font: 700 0.45rem var(--font-mono);
  }
  .is-opponent .tile-marks b:last-child {
    background: #b79aff;
  }
  .character-grid strong {
    position: relative;
    margin: -0.55rem -0.4rem;
    padding: 0.55rem 0.4rem;
    background: linear-gradient(transparent, #160c21e8 40%);
    font: 600 0.57rem/1.2 var(--font-mono);
    overflow-wrap: anywhere;
  }
  .tile-marks {
    z-index: 2;
  }
  .clash-empty {
    grid-column: 1 / -1;
    display: grid;
    gap: 1rem;
    justify-items: center;
  }
  @media (max-width: 1050px) {
    .character-layout {
      gap: 1rem;
      grid-template-columns: minmax(210px, 0.65fr) minmax(0, 1.35fr);
    }
    .character-grid {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }
  }
  @media (max-width: 700px) {
    .character-layout {
      grid-template-columns: 1fr;
    }
    .character-showcase {
      min-height: 0;
      display: grid;
      grid-template-columns: 115px 1fr;
    }
    .showcase-meta {
      grid-column: 1 / -1;
      padding: 0.6rem 0.8rem;
    }
    .showcase-portrait {
      height: 140px;
      overflow: hidden;
    }
    .showcase-portrait :global(.clash-portrait),
    .showcase-portrait :global(.fighter-model) {
      min-height: 140px;
    }
    .showcase-initial {
      font-size: 8rem;
    }
    .showcase-description {
      padding: 0.6rem 0.8rem;
      border: 0;
    }
    .showcase-description h2 {
      font-size: 1.6rem;
    }
    .showcase-description p {
      font-size: 0.65rem;
      margin-top: 0.4rem;
    }
    .character-grid {
      max-height: 380px;
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    .roster-total {
      display: none;
    }
    .character-slots {
      grid-template-columns: 1fr 24px 1fr;
    }
    .character-slots button {
      padding: 0.65rem;
    }
    .character-slots strong {
      font-size: 0.95rem;
    }
    .roster-tools .clash-secondary {
      font-size: 0.6rem;
      padding: 0.5rem;
    }
  }
</style>
