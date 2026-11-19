<script lang="ts">
  import { link } from '$lib/i18n'
  import { fighterDefinition } from '$lib/fighting/roster'
  import type { FighterId } from '$lib/fighting/types'
  export let language: 'fr' | 'en'
  export let player: FighterId
  export let opponent: FighterId
  export let back: string
  export let nextLabel: string
  export let onNext: () => void
</script>

<footer class="clash-setup-footer">
  <a class="clash-back" href={$link(back)}>← {language === 'fr' ? 'Retour' : 'Back'}</a>
  <p class="clash-duel-summary">
    <span>P1</span>
    {fighterDefinition(player).name} <b>VS</b> <span>P2</span>
    {fighterDefinition(opponent).name}
  </p>
  <button type="button" class="clash-primary" onclick={onNext}
    >{nextLabel}<span aria-hidden="true">→</span></button
  >
</footer>

<style>
  .clash-setup-footer {
    position: relative;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 2rem;
    padding: 1rem 0;
    border-top: 1px solid #ffffff20;
    background: #0d0c10f5;
    backdrop-filter: blur(16px);
  }
  .clash-back {
    display: flex;
    align-items: center;
    min-height: 44px;
    color: #b9b0c4;
    text-decoration: none;
    font: 500 0.72rem var(--font-mono);
  }
  .clash-duel-summary {
    display: flex;
    gap: 0.7rem;
    align-items: center;
    margin: 0;
    font: 600 0.75rem var(--font-mono);
  }
  .clash-duel-summary span {
    color: var(--clash-orange);
    font-size: 0.6rem;
  }
  .clash-duel-summary span:last-of-type {
    color: var(--clash-violet);
  }
  .clash-duel-summary b {
    color: #74667c;
    font-style: italic;
    margin: 0 0.3rem;
  }
  @media (max-width: 850px) {
    .clash-duel-summary {
      display: none;
    }
  }
  @media (max-width: 400px) {
    .clash-setup-footer {
      gap: 0.5rem;
    }
    .clash-primary {
      font-size: 0.65rem;
    }
  }
</style>
