<script lang="ts">
  import type { FollowMode, PerspectiveOption } from './types';

  let {
    options,
    selectedPerspective,
    followMode,
    onPerspectiveSelect,
    onFollowModeSelect
  }: {
    options: PerspectiveOption[];
    selectedPerspective: string;
    followMode: FollowMode;
    onPerspectiveSelect: (id: string) => void;
    onFollowModeSelect: (mode: FollowMode) => void;
  } = $props();

  const followOptions: Array<{ id: FollowMode; label: string }> = [
    { id: 'consciousness', label: 'Suivre la conscience' },
    { id: 'body', label: 'Suivre le corps' },
    { id: 'appearance', label: "Suivre l'apparence publique" }
  ];
</script>

<section class="selector" aria-label="Sélecteur de perspective">
  <div class="perspective-control">
    <label for="perspective-select">Perspective</label>
    <select
      id="perspective-select"
      value={selectedPerspective}
      onchange={(event) => onPerspectiveSelect(event.currentTarget.value)}
    >
      {#each options as option}
        <option value={option.id}>{option.label}</option>
      {/each}
    </select>
  </div>

  <div class="follow-control">
    <h2>Suivi</h2>
    <ul role="radiogroup" aria-label="Choisir le mode de suivi">
      {#each followOptions as option}
        <li>
          <button
            type="button"
            role="radio"
            aria-checked={followMode === option.id}
            class:selected={followMode === option.id}
            onclick={() => onFollowModeSelect(option.id)}
          >
            <span class="dot" aria-hidden="true">{followMode === option.id ? '●' : '○'}</span>
            <span>{option.label}</span>
          </button>
        </li>
      {/each}
    </ul>
  </div>
</section>

<style>
  .selector {
    border: 1px solid var(--line);
    border-radius: 0.72rem;
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--panel) 83%, #0f221f 17%), color-mix(in srgb, var(--panel) 94%, #10171f 6%));
    padding: 0.72rem;
    display: grid;
    grid-template-columns: minmax(12rem, 1fr) minmax(0, 2fr);
    gap: 0.9rem;
    align-items: end;
  }

  h2,
  label {
    display: block;
    margin: 0 0 0.4rem 0;
    font-size: 0.72rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--ink) 66%, #88a6a0 34%);
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 0.34rem;
  }

  li {
    flex: 1 1 7rem;
  }

  select {
    width: 100%;
    min-height: 2.35rem;
    border: 1px solid color-mix(in srgb, var(--line) 78%, #f8f5e8 12%);
    background: color-mix(in srgb, var(--panel) 72%, #15322f 28%);
    border-radius: 0.48rem;
    padding: 0.42rem 2rem 0.42rem 0.58rem;
    color: var(--ink);
    cursor: pointer;
  }

  select:focus-visible {
    outline: 2px solid var(--state-known);
    outline-offset: 2px;
  }

  button {
    width: 100%;
    border: 1px solid transparent;
    background: color-mix(in srgb, var(--panel) 86%, #121923 14%);
    border-radius: 0.48rem;
    padding: 0.42rem 0.5rem;
    color: var(--ink);
    display: flex;
    gap: 0.45rem;
    text-align: left;
    align-items: center;
    cursor: pointer;
    min-height: 2.35rem;
  }

  button.selected {
    border-color: color-mix(in srgb, var(--state-known) 44%, #f8f5e8 15%);
    background: color-mix(in srgb, var(--panel) 72%, #15322f 28%);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--state-known) 35%, transparent);
  }

  button:focus-visible {
    outline: 2px solid var(--state-known);
    outline-offset: 2px;
  }

  .dot {
    font-size: 0.95rem;
    width: 1rem;
  }

  @media (max-width: 800px) {
    .selector {
      grid-template-columns: 1fr;
    }
  }
</style>
