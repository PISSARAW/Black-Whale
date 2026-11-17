<script lang="ts">
  import FightMatchOverlays from '$lib/components/fighting/FightMatchOverlays.svelte'
  import { createFight, beginFight } from '$lib/fighting/engine'
  import type { FightState } from '$lib/fighting/types'
  let language: 'fr' | 'en' = 'fr'
  let scenario = 'victory'
  let action = ''
  let state: FightState
  function showResult() {
    const base = createFight('kurapika', 'hisoka', {
      mode: scenario === 'local' ? 'versus-local' : 'versus-ai',
    })
    const winner =
      scenario === 'draw' ? 'draw' : ['defeat', 'local'].includes(scenario) ? 'opponent' : 'player'
    state = {
      ...base,
      phase: 'finished',
      winner,
      matchWinner: ['round', 'draw'].includes(scenario) ? null : winner === 'draw' ? null : winner,
      roundNumber: scenario === 'round' ? 1 : 3,
      roundsWon:
        scenario === 'round'
          ? { player: 1, opponent: 0 }
          : { player: winner === 'player' ? 2 : 1, opponent: winner === 'opponent' ? 2 : 1 },
      finishReason: scenario === 'draw' ? 'time' : 'knockout',
    }
    action = ''
  }
  function choose(next: string) {
    action = next
  }
  function restart() {
    state = beginFight(createFight(state.player.id, state.opponent.id, { mode: state.mode }))
    action = 'Duel relancé'
  }
  showResult()
</script>

<header class="fixture-controls">
  <label
    >Scénario <select bind:value={scenario} onchange={showResult}
      ><option value="victory">Victoire</option><option value="defeat">Défaite</option><option
        value="local">Victoire P2</option
      ><option value="round">Fin de manche</option><option value="draw">Égalité</option></select
    ></label
  >
  <label
    >Langue <select bind:value={language}
      ><option value="fr">Français</option><option value="en">English</option></select
    ></label
  >
  <button type="button" onclick={showResult}>Afficher le résultat</button>
  <output aria-live="polite">{action}</output>
</header>
<main class="clash-battle fixture-battle">
  <FightMatchOverlays
    {state}
    {language}
    startFight={() => {}}
    rematch={restart}
    continueMatch={() => choose('Manche suivante')}
    chooseAgain={() => choose('Sélection des personnages')}
    quitFight={() => choose('Menu principal')}
  />
</main>

<style>
  :global(body) {
    margin: 0;
    background: #100b18;
    color: #eee4f3;
  }
  :global(#app) {
    display: flex;
    flex-direction: column;
    height: 100dvh;
  }
  .fixture-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    font: 12px monospace;
  }
  select,
  button {
    min-height: 32px;
    background: #271a35;
    border: 1px solid #80628d;
    color: #eee4f3;
  }
  .fixture-battle {
    position: relative;
    flex: 1;
    min-height: 0;
  }
</style>
