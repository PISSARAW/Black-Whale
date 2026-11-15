<script lang="ts">
  import { FIGHT_STAGES, type FightStageId } from '$lib/fighting/stages'

  export let selected: FightStageId
  export let language: 'fr' | 'en'
  export let onSelect: (id: FightStageId) => void
</script>

<section
  class="stage-picker"
  aria-label={language === 'fr' ? 'Choix du terrain' : 'Stage selection'}
>
  <p class="stage-label"><span>03</span>{language === 'fr' ? 'Terrain' : 'Stage'}</p>
  <div class="stage-grid">
    {#each FIGHT_STAGES as stage (stage.id)}
      <button
        type="button"
        class:selected={selected === stage.id}
        aria-pressed={selected === stage.id}
        onclick={() => onSelect(stage.id)}
      >
        <span class="swatch" style={`--floor:${stage.swatch[0]};--light:${stage.swatch[1]}`}></span>
        <strong>{language === 'fr' ? stage.nameFr : stage.nameEn}</strong>
        <small>{language === 'fr' ? stage.noteFr : stage.noteEn}</small>
      </button>
    {/each}
  </div>
</section>

<style>
  .stage-picker {
    margin-top: 1.4rem;
  }
  .stage-label {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin: 0 0 0.7rem;
    color: #cad5dc;
    font: 600 0.72rem/1.2 var(--font-mono);
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .stage-label span {
    color: #c7952d;
  }
  .stage-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.6rem;
  }
  button {
    display: grid;
    gap: 0.3rem;
    padding: 0.55rem;
    border: 1px solid #31404c;
    border-radius: 3px;
    background: #0a1016;
    color: #e6edf1;
    text-align: left;
    cursor: pointer;
  }
  button:hover {
    border-color: #6b7f8c;
  }
  button.selected {
    border-color: #c7952d;
    box-shadow: inset 0 0 0 1px #c7952d;
  }
  .swatch {
    display: block;
    height: 46px;
    border-radius: 2px;
    background:
      radial-gradient(ellipse at 50% 12%, var(--light), transparent 62%),
      linear-gradient(#06090c 0 62%, var(--floor) 62%);
    opacity: 0.9;
  }
  strong {
    font: 600 0.78rem/1.2 var(--font-display);
  }
  small {
    color: #86949d;
    font: 500 0.58rem/1.2 var(--font-mono);
  }
</style>
