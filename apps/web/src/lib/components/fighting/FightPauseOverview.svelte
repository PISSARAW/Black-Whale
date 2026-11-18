<script lang="ts">
  import { fighterDefinition } from '$lib/fighting/roster'
  import { fightStage } from '$lib/fighting/stages'
  import { fightFormat } from '$lib/fighting/formats'
  import type { FightState } from '$lib/fighting/types'
  export let state: FightState
  export let language: 'fr' | 'en'
  export let canRematch = true
  export let replay = false
  export let onRematch: () => void
  export let onChoose: () => void
  export let onQuit: () => void
  $: fr = language === 'fr'
  $: stage = fightStage(state.environment.stageId)
  $: format = fightFormat(state.formatId)
</script>

<section class="pause-overview">
  <p class="clash-kicker">{fr ? 'LE DUEL EST SUSPENDU' : 'THE FIGHT IS ON HOLD'}</p>
  <div class="pause-matchup">
    <strong>{fighterDefinition(state.player.id).name}</strong><span
      aria-label={fr ? 'contre' : 'versus'}
    ></span><strong>{fighterDefinition(state.opponent.id).name}</strong>
  </div>
  <dl>
    <div>
      <dt>{fr ? 'Terrain' : 'Stage'}</dt>
      <dd>{fr ? stage.nameFr : stage.nameEn}</dd>
    </div>
    <div>
      <dt>{fr ? 'Règles' : 'Rules'}</dt>
      <dd>{fr ? format.titleFr : format.titleEn}</dd>
    </div>
    <div>
      <dt>{fr ? 'Manche' : 'Round'}</dt>
      <dd>
        {String(state.roundNumber).padStart(2, '0')}
        <span>· {state.roundsWon.player} — {state.roundsWon.opponent}</span>
      </dd>
    </div>
  </dl>
  <p class="pause-reassurance">
    {fr
      ? 'Prends ton temps. Le chrono, les coups et les ressources restent figés.'
      : 'Take your time. The clock, attacks and resources stay frozen.'}
  </p>
  <div class="pause-match-actions">
    {#if canRematch && !replay}<button type="button" onclick={onRematch}
        >↻ {fr ? 'Recommencer le duel' : 'Restart match'}</button
      >{/if}<button type="button" onclick={onChoose}
      >{fr ? 'Changer les combattants' : 'Change fighters'} <span>↗</span></button
    ><button type="button" class="quit" onclick={onQuit}
      >{fr ? 'Quitter vers le menu' : 'Exit to main menu'} <span>→</span></button
    >
  </div>
</section>

<style>
  .pause-matchup {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1.3rem;
    padding: 0.7rem 0 1.5rem;
  }
  .pause-matchup strong {
    color: #f8effc;
    font:
      italic 900 clamp(1.4rem, 2.5vw, 2.25rem)/1 Arial,
      sans-serif;
    letter-spacing: -0.045em;
    text-transform: uppercase;
  }
  .pause-matchup > span::before {
    content: 'VS';
    color: #ff9b65;
    font:
      italic 900 1rem Arial,
      sans-serif;
  }
  dl {
    display: grid;
    grid-template-columns: 1.3fr 1fr auto;
    gap: 1rem;
    margin: 0;
    padding: 1rem 0;
    border-block: 1px solid #ffffff1a;
  }
  dt {
    color: #a58bb6;
    margin-bottom: 0.5rem;
    font: 0.6rem var(--font-mono);
  }
  dd {
    margin: 0;
    color: #e7d4f2;
    font: 600 0.75rem/1.5 var(--font-mono);
  }
  dd span {
    color: #9a7fac;
  }
  .pause-reassurance {
    margin: 1.2rem 0;
    color: #aa96b7;
    font-size: 0.75rem;
    line-height: 1.6;
  }
  .pause-match-actions {
    display: grid;
    gap: 0.55rem;
    margin-top: 1.5rem;
  }
  button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    min-height: 44px;
    padding: 0.8rem 1rem;
    border: 1px solid #614972;
    background: #24162e;
    color: #dbc4eb;
    text-align: left;
    font: 600 0.7rem var(--font-mono);
    cursor: pointer;
  }
  button:hover {
    border-color: #b79aff;
  }
  .quit {
    border-color: #774a43;
    color: #e9b3a6;
    background: #a73f3010;
  }
  @media (max-width: 600px) {
    dl {
      grid-template-columns: 1fr 1fr;
    }
    .pause-matchup {
      gap: 0.8rem;
    }
  }
</style>
