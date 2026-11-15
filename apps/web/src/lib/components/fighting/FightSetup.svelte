<script lang="ts">
  import { createFight } from '$lib/fighting/engine'
  import { fightingStyle } from '$lib/fighting/fightStyles'
  import type { FightFormatId } from '$lib/fighting/formats'
  import { FIGHTING_ROSTER, fighterDefinition } from '$lib/fighting/roster'
  import type { FightStageId } from '$lib/fighting/stages'
  import type { FightMode, FighterId } from '$lib/fighting/types'
  import FighterAvatar from './FighterAvatar.svelte'
  import FightFormatPicker from './FightFormatPicker.svelte'
  import StagePicker from './StagePicker.svelte'

  export let language: 'fr' | 'en'
  export let player: FighterId
  export let opponent: FighterId
  export let stage: FightStageId
  export let format: FightFormatId
  export let mode: FightMode
  export let launchLabel: string
  export let playerLabel: string
  export let opponentLabel: string
  export let onPlayer: (id: FighterId) => void
  export let onOpponent: (id: FighterId) => void
  export let onStage: (id: FightStageId) => void
  export let onFormat: (id: FightFormatId) => void
  export let onMode: (mode: FightMode) => void
  export let onLaunch: () => void

  $: gameModes = [
    ['versus-ai', language === 'fr' ? 'Contre l’IA' : 'Versus AI'],
    ['versus-local', language === 'fr' ? 'Versus local' : 'Local versus'],
    ['training', language === 'fr' ? 'Entraînement' : 'Training'],
  ] as Array<[FightMode, string]>

  function previewFighter(id: FighterId) {
    return createFight(id, id).player
  }
</script>

<section
  class="selection-panel"
  aria-label={language === 'fr' ? 'Sélection des combattants' : 'Fighter selection'}
>
  <div class="selection-column">
    <p class="selection-label"><span>01</span>{playerLabel}</p>
    <div class="roster-grid">
      {#each FIGHTING_ROSTER as fighter (fighter.id)}
        {@const style = fightingStyle(fighter.id)}
        <button
          type="button"
          class:selected={player === fighter.id}
          aria-pressed={player === fighter.id}
          title={language === 'fr' ? style.descriptionFr : style.descriptionEn}
          onclick={() => onPlayer(fighter.id)}
        >
          <span class="portrait">
            {#if player === fighter.id}
              <FighterAvatar fighter={previewFighter(fighter.id)} preview />
            {:else}
              <span class="roster-monogram" style={`--fighter:${fighter.colour}`}>
                {fighter.name.slice(0, 1)}
              </span>
            {/if}
          </span>
          <strong>{fighter.name}</strong>
          <small
            >{language === 'fr' ? fighter.titleFr : fighter.titleEn} · {language === 'fr'
              ? style.nameFr
              : style.nameEn}</small
          >
        </button>
      {/each}
    </div>
  </div>

  <div class="versus" aria-hidden="true"><span>V</span><span>S</span></div>

  <div class="selection-column opponent-selection">
    <p class="selection-label"><span>02</span>{opponentLabel}</p>
    <div class="roster-grid">
      {#each FIGHTING_ROSTER as fighter (fighter.id)}
        {@const style = fightingStyle(fighter.id)}
        <button
          type="button"
          class:selected={opponent === fighter.id}
          aria-pressed={opponent === fighter.id}
          title={language === 'fr' ? style.descriptionFr : style.descriptionEn}
          onclick={() => onOpponent(fighter.id)}
        >
          <span class="portrait">
            {#if opponent === fighter.id}
              <FighterAvatar fighter={previewFighter(fighter.id)} preview />
            {:else}
              <span class="roster-monogram" style={`--fighter:${fighter.colour}`}>
                {fighter.name.slice(0, 1)}
              </span>
            {/if}
          </span>
          <strong>{fighter.name}</strong>
          <small
            >{language === 'fr' ? style.nameFr : style.nameEn} · {language === 'fr'
              ? fighter.specialFr
              : fighter.specialEn}</small
          >
        </button>
      {/each}
    </div>
  </div>
</section>

<StagePicker selected={stage} {language} onSelect={onStage} />
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
