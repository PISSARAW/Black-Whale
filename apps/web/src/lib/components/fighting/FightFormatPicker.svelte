<script lang="ts">
  import { FIGHT_FORMATS, type FightFormatId } from '$lib/fighting/formats'

  export let selected: FightFormatId
  export let language: 'fr' | 'en'
  export let onSelect: (id: FightFormatId) => void
</script>

<section class="format-picker" aria-label={language === 'fr' ? 'Type de combat' : 'Fight type'}>
  <p class="format-label"><span>04</span>{language === 'fr' ? 'Type de combat' : 'Fight type'}</p>
  <div class="format-grid">
    {#each FIGHT_FORMATS as format (format.id)}
      <button
        type="button"
        class:selected={selected === format.id}
        aria-pressed={selected === format.id}
        onclick={() => onSelect(format.id)}
      >
        <strong>{language === 'fr' ? format.titleFr : format.titleEn}</strong>
        <small>{language === 'fr' ? format.descriptionFr : format.descriptionEn}</small>
        <b>
          {#if format.victory === 'points'}10 PTS · 3 KD{:else if format.victory === 'health'}100 {language ===
            'fr'
              ? 'PV'
              : 'HP'}{:else}10 PTS · K.O.{/if}
        </b>
      </button>
    {/each}
  </div>
</section>

<style>
  .format-picker {
    width: min(1380px, 100%);
    margin: 1.4rem auto 0;
  }
  .format-label {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin: 0 0 0.7rem;
    color: #cad5dc;
    font: 600 0.72rem/1.2 var(--font-mono);
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .format-label span {
    color: #c7952d;
  }
  .format-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.6rem;
  }
  button {
    position: relative;
    display: grid;
    min-height: 7.5rem;
    padding: 0.85rem;
    border: 1px solid #31404c;
    border-radius: 3px;
    background: linear-gradient(145deg, #111920, #080c10);
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
  strong {
    font: 700 0.9rem/1.2 var(--font-display);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  small {
    margin-top: 0.45rem;
    color: #94a2ab;
    font: 500 0.63rem/1.5 var(--font-mono);
  }
  b {
    align-self: end;
    margin-top: 0.7rem;
    color: #e3bd55;
    font: 700 0.62rem/1 var(--font-mono);
    letter-spacing: 0.08em;
  }
  @media (max-width: 700px) {
    .format-grid {
      grid-template-columns: 1fr;
    }
    button {
      min-height: 0;
    }
  }
</style>
