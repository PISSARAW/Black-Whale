<script lang="ts">
  import { FIGHT_STAGES, fightStage, type FightStageId } from '$lib/fighting/stages'
  import { createFightState } from '$lib/fighting/fightState'
  import { preloadFightStage } from '$lib/fighting/stageScenery'
  import type { FightEnvironment } from '$lib/fighting/fightEnvironment'
  import type { FighterId } from '$lib/fighting/types'
  import FightScene from './FightScene.svelte'
  import FightLsdfSetup from './FightLsdfSetup.svelte'
  import FightSetupFooter from './FightSetupFooter.svelte'
  export let language: 'fr' | 'en'
  export let player: FighterId
  export let opponent: FighterId
  export let environment: FightEnvironment
  export let onEnvironment: (next: FightEnvironment) => void
  export let onContinue: () => void
  let search = ''
  let category = 'all'
  $: fr = language === 'fr'
  $: stage = fightStage(environment.stageId)
  $: preview = createFightState(player, opponent, { environment })
  $: filtered = FIGHT_STAGES.filter(
    (entry) =>
      matchesCategory(entry.id, category) &&
      (fr ? entry.nameFr : entry.nameEn)
        .toLocaleLowerCase()
        .includes(search.trim().toLocaleLowerCase()),
  )
  function matchesCategory(id: string, selected: string) {
    if (selected === 'royal') return id.endsWith('-salon')
    if (selected === 'ship') return !id.endsWith('-salon') && id !== 'heavens-arena'
    return true
  }
  function choose(id: FightStageId) {
    preloadFightStage(id)
    onEnvironment({ ...environment, stageId: id })
  }
  function random() {
    const choices = FIGHT_STAGES.filter((entry) => entry.id !== stage.id)
    choose(choices[Math.floor(Math.random() * choices.length)].id)
  }
</script>

<section class="clash-page" aria-labelledby="stage-title">
  <div class="clash-section-heading">
    <div>
      <p class="clash-kicker">STAGE SELECT</p>
      <h1 class="clash-title" id="stage-title">
        {fr ? 'Le lieu de la rencontre.' : 'Set the scene.'}
      </h1>
      <p class="clash-subtitle">
        {fr
          ? 'Du ring de la Tour Céleste aux profondeurs du Black Whale.'
          : 'From Heavens Arena to the depths of the Black Whale.'}
      </p>
    </div>
    <button class="clash-secondary" type="button" onclick={random}
      >↻ {fr ? 'Terrain aléatoire' : 'Random stage'}</button
    >
  </div>
  <div class="stage-selection-layout">
    <div class="stage-preview-panel">
      <div class="stage-preview" style={`--stage-light:${stage.swatch[1]}`}>
        {#key stage.id}<FightScene state={preview} stageId={stage.id} {language} />{/key}
        <span class="preview-label">{fr ? 'APERÇU DU TERRAIN' : 'STAGE PREVIEW'}</span><span
          class="preview-live">3D / LIVE</span
        >
      </div>
      <div class="stage-preview-copy" aria-live="polite">
        <span>{stage.kind === 'heavens-arena' ? 'HEAVENS ARENA' : 'BLACK WHALE'}</span>
        <h2>{fr ? stage.nameFr : stage.nameEn}</h2>
        <p>{fr ? stage.noteFr : stage.noteEn}</p>
      </div>
    </div>
    <div class="stage-browser">
      <label class="clash-search"
        ><span aria-hidden="true">⌕</span><input
          type="search"
          bind:value={search}
          aria-label={fr ? 'Rechercher un terrain' : 'Search stages'}
          placeholder={fr ? 'Rechercher un terrain…' : 'Search stages…'}
        /></label
      >
      <div class="clash-filter-row" aria-label={fr ? 'Catégorie de terrain' : 'Stage category'}>
        <button type="button" aria-pressed={category === 'all'} onclick={() => (category = 'all')}
          >{fr ? 'Tous' : 'All'} · {FIGHT_STAGES.length}</button
        ><button
          type="button"
          aria-pressed={category === 'ship'}
          onclick={() => (category = 'ship')}>{fr ? 'Le navire' : 'The ship'}</button
        ><button
          type="button"
          aria-pressed={category === 'royal'}
          onclick={() => (category = 'royal')}>{fr ? 'Salons royaux' : 'Royal salons'}</button
        >
      </div>
      <div class="stage-choice-grid" aria-label={fr ? 'Choix du terrain' : 'Stage selection'}>
        {#each filtered as entry, i (entry.id)}
          <button
            type="button"
            aria-pressed={stage.id === entry.id}
            onclick={() => choose(entry.id)}
            style={`--stage-floor:${entry.swatch[0]};--stage-light:${entry.swatch[1]}`}
          >
            <span
              class="stage-miniature"
              class:ring={entry.kind === 'heavens-arena'}
              class:salon={entry.id.endsWith('-salon')}
              aria-hidden="true"
              ><i></i><b>{String(i + 1).padStart(2, '0')}</b>{#if stage.id === entry.id}<em>✓</em
                >{/if}</span
            ><strong>{fr ? entry.nameFr : entry.nameEn}</strong>
          </button>
        {:else}<div class="clash-empty">
            {fr ? 'Aucun terrain trouvé.' : 'No stages found.'}<button
              class="clash-secondary"
              type="button"
              onclick={() => {
                search = ''
                category = 'all'
              }}>{fr ? 'Effacer les filtres' : 'Clear filters'}</button
            >
          </div>{/each}
      </div>
    </div>
  </div>
  {#if stage.id === 'heilly-hideout'}<FightLsdfSetup
      {environment}
      {language}
      onChange={onEnvironment}
    />{/if}
  <FightSetupFooter
    {language}
    {player}
    {opponent}
    back="/fighting/characters"
    nextLabel={fr ? 'Règles du combat' : 'Fight rules'}
    onNext={onContinue}
  />
</section>

<style>
  .stage-selection-layout {
    display: grid;
    grid-template-columns: 1.25fr 1fr;
    gap: 2rem;
  }
  .stage-preview-panel {
    align-self: start;
    border: 1px solid #514158;
    background: #151019;
  }
  .stage-preview {
    position: relative;
    aspect-ratio: 16 / 11;
    overflow: hidden;
    background: radial-gradient(ellipse at 50% 10%, var(--stage-light), #17101d 70%);
  }
  .preview-label,
  .preview-live {
    position: absolute;
    z-index: 2;
    top: 1rem;
    padding: 0.4rem 0.5rem;
    background: #0a070dcc;
    color: #dfd0ea;
    font: 0.5rem var(--font-mono);
    letter-spacing: 0.1em;
  }
  .preview-label {
    left: 1rem;
  }
  .preview-live {
    right: 1rem;
    color: #d8bbff;
  }
  .stage-preview-copy {
    padding: 1.5rem;
    border-top: 1px solid #514158;
  }
  .stage-preview-copy > span {
    color: var(--clash-orange);
    font: 0.55rem var(--font-mono);
    letter-spacing: 0.16em;
  }
  .stage-preview-copy h2 {
    margin: 0.7rem 0;
    color: #f2e8f7;
    font:
      italic 900 clamp(1.6rem, 2.4vw, 2.5rem)/1.1 Arial,
      sans-serif;
    letter-spacing: -0.04em;
    text-transform: uppercase;
  }
  .stage-preview-copy p {
    margin: 0;
    color: #a99bb4;
    font-size: 0.75rem;
    line-height: 1.5;
  }
  .stage-choice-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.6rem;
    max-height: 420px;
    overflow-y: auto;
    padding: 5px;
    margin: -5px;
    scrollbar-color: #8c65ae #1b1422;
    scrollbar-width: thin;
  }
  .stage-choice-grid > button {
    min-width: 0;
    padding: 0;
    border: 1px solid #514158;
    background: #17121d;
    color: #ded0e9;
    text-align: left;
    cursor: pointer;
  }
  .stage-choice-grid > button:hover {
    border-color: #b79aff;
  }
  .stage-choice-grid > button[aria-pressed='true'] {
    border-color: #ff864b;
    box-shadow: 0 0 0 1px #ff864b;
  }
  .stage-miniature {
    position: relative;
    display: block;
    height: 65px;
    overflow: hidden;
    background:
      radial-gradient(
        ellipse at 50% 0%,
        color-mix(in srgb, var(--stage-light) 65%, transparent),
        transparent 70%
      ),
      linear-gradient(#100e16 60%, var(--stage-floor) 61%);
  }
  .stage-miniature i {
    position: absolute;
    inset: 15% 15% 20%;
    border: 1px solid color-mix(in srgb, var(--stage-light) 40%, transparent);
    background: repeating-linear-gradient(90deg, transparent 0 23%, #0005 24% 27%);
    transform: perspective(70px) rotateX(10deg);
  }
  .stage-miniature.ring i {
    inset: 20% 18% 5%;
    transform: perspective(45px) rotateX(35deg);
    background: linear-gradient(130deg, #e8dfc5, #77715e);
    border: 3px double #b7985b;
  }
  .stage-miniature.salon i {
    inset: 15% 30% 20%;
    border: 2px solid var(--stage-light);
    border-radius: 50% 50% 0 0;
    background: #271b25;
  }
  .stage-miniature b {
    position: absolute;
    bottom: 5px;
    left: 6px;
    color: #ffffff90;
    font: 0.5rem var(--font-mono);
  }
  .stage-miniature em {
    position: absolute;
    top: 5px;
    right: 5px;
    color: #ffae7e;
    font: 700 0.65rem var(--font-mono);
  }
  .stage-choice-grid strong {
    display: block;
    min-height: 2.6rem;
    padding: 0.55rem;
    font: 500 0.6rem/1.4 var(--font-mono);
  }
  .clash-empty {
    grid-column: 1 / -1;
    display: grid;
    gap: 1rem;
    justify-items: center;
  }
  @media (max-width: 850px) {
    .stage-selection-layout {
      gap: 1rem;
      grid-template-columns: 1fr 1fr;
    }
    .stage-choice-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 600px) {
    .stage-selection-layout {
      grid-template-columns: 1fr;
    }
    .stage-preview {
      aspect-ratio: 16 / 9;
    }
    .stage-preview-copy {
      padding: 1rem;
    }
    .stage-choice-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      max-height: 320px;
    }
    .preview-label,
    .preview-live {
      top: 0.5rem;
    }
  }
</style>
