<script lang="ts">
  import {
    FUTURE_PREPARATION_FRAMES,
    FUTURE_WINDOW_FRAMES,
  } from '$lib/fighting/parallelFutureTypes'
  import { fighterDefinition } from '$lib/fighting/roster'
  import { showFuturePanel } from '$lib/fighting/futurePerception'
  import type { FightSide, FightState } from '$lib/fighting/types'

  export let state: FightState
  export let language: 'fr' | 'en'
  export let viewer: FightSide = 'player'
  export let onOpenEyes: () => void

  export let scrub: number | null = null
  $: future = state.parallelFuture
  $: ownView = future?.owner === viewer
  $: if (future?.phase !== 'vision') scrub = null
  $: lastAvailable = Math.max(0, (future?.frames.length ?? 0) - 1)
  $: index = Math.min(lastAvailable, scrub ?? future?.previewCursor ?? 0)
  $: sample = future?.frames[index]
  $: echo = future?.frames[Math.max(0, future.cursor - 1)]
  $: active = Boolean(future)
  $: show =
    showFuturePanel(state, viewer) &&
    (active || state.player.id === 'tserriednich' || state.opponent.id === 'tserriednich')
  $: ownerPath =
    future?.frames
      .filter((_, i) => i % 6 === 0)
      .map((frame, i) => `${i * 6},${150 - frame[future!.owner].x * 1.3}`)
      .join(' ') ?? ''
  $: otherPath =
    future?.frames
      .filter((_, i) => i % 6 === 0)
      .map(
        (frame, i) =>
          `${i * 6},${150 - frame[future!.owner === 'player' ? 'opponent' : 'player'].x * 1.3}`,
      )
      .join(' ') ?? ''
</script>

{#if show}
  <section class="parallel-panel" aria-label="Laplace Devil">
    <header>
      <strong>Laplace Devil</strong>
      {#if future}<span
          >{future.owner === 'player' ? 'P1' : 'P2'} · {language === 'fr'
            ? 'futur parallèle'
            : 'parallel future'}</span
        >{/if}
      {#if state.mode === 'versus-local' && future}
        <div
          class="perspectives"
          aria-label={language === 'fr' ? 'Point de vue affiché' : 'Displayed perspective'}
        >
          <button
            type="button"
            aria-pressed={viewer === 'player'}
            onclick={() => (viewer = 'player')}>{language === 'fr' ? 'Vue P1' : 'P1 view'}</button
          >
          <button
            type="button"
            aria-pressed={viewer === 'opponent'}
            onclick={() => (viewer = 'opponent')}>{language === 'fr' ? 'Vue P2' : 'P2 view'}</button
          >
        </div>
      {/if}
    </header>
    {#if !future}
      <p>
        {language === 'fr'
          ? 'L : Zetsu, yeux fermés → vision +10 s → L ou H : ouvrir les yeux et diverger.'
          : 'L: Zetsu, eyes closed → +10 s vision → L or H: open the eyes and diverge.'}
      </p>
    {:else if future.phase === 'preparing'}
      <p class="warning">
        {language === 'fr'
          ? 'Zetsu · Yeux fermés · Sans garde : un coup interrompt la préparation.'
          : 'Zetsu · Eyes closed · Unguarded: a hit interrupts preparation.'}
      </p>
      <progress
        max={FUTURE_PREPARATION_FRAMES}
        value={future.preparation}
        aria-label={language === 'fr' ? 'Préparation du Zetsu' : 'Zetsu preparation'}
      ></progress>
    {:else if future.phase === 'vision'}
      <p>
        {language === 'fr'
          ? 'Vision des dix prochaines secondes · Le duel réel est suspendu.'
          : 'Vision of the next ten seconds · The real duel is suspended.'}
      </p>
      {#if ownView && sample}
        <svg
          viewBox="0 0 600 170"
          role="img"
          aria-label={language === 'fr'
            ? 'Positions prédites sur dix secondes'
            : 'Predicted positions over ten seconds'}
        >
          <rect width="600" height="160" fill="#0a1822"></rect>
          {#each [0, 120, 240, 360, 480, 599] as frame (frame)}
            <line x1={frame} y1="0" x2={frame} y2="150" stroke="#304450"></line>
            <text x={Math.min(frame + 3, 575)} y="165" fill="#adc3ce"
              >{Math.round(frame / 60)}s</text
            >
          {/each}
          <polyline points={otherPath} fill="none" stroke="#e8b98b" stroke-width="2"></polyline>
          <polyline points={ownerPath} fill="none" stroke="#7dd3fc" stroke-width="3"></polyline>
          <line x1={index} y1="0" x2={index} y2="150" stroke="#f7f4de"></line>
          <circle cx={index} cy={150 - sample[future.owner].x * 1.3} r="5" fill="#7dd3fc"></circle>
        </svg>
        <label class="scrubber"
          >{language === 'fr' ? 'Inspecter le futur' : 'Inspect the future'} · +{(
            (index + 1) /
            60
          ).toFixed(1)} s
          <input
            type="range"
            min="0"
            max={lastAvailable}
            value={index}
            oninput={(event) => (scrub = Number(event.currentTarget.value))}
          />
        </label>
        <div class="preview-readout">
          <span
            >{fighterDefinition(sample[future.owner].id).name} · {Math.ceil(
              sample[future.owner].health,
            )}
            {language === 'fr' ? 'PV prédits' : 'predicted HP'}</span
          >
          <span
            >{language === 'fr' ? 'Position prédite' : 'Predicted position'} · {sample[
              future.owner
            ].x.toFixed(1)}</span
          >
          {#if sample.phase === 'finished'}<strong
              >{language === 'fr'
                ? 'Issue prédite, pas encore réelle'
                : 'Predicted outcome, not yet real'}</strong
            >{/if}
        </div>
      {/if}
      {#if future.owner === 'player'}
        <button class="open-eyes" type="button" onclick={onOpenEyes}
          >{language === 'fr'
            ? 'Ouvrir les yeux et diverger · L / H'
            : 'Open the eyes and diverge · L / H'}</button
        >
      {:else if state.mode === 'versus-local'}
        <p>
          {language === 'fr' ? 'P2 : , ou B pour ouvrir les yeux.' : 'P2: , or B to open the eyes.'}
        </p>
      {/if}
    {:else if echo}
      <p>
        {language === 'fr' ? 'Divergence' : 'Divergence'} · {(
          (FUTURE_WINDOW_FRAMES - future.cursor) /
          60
        ).toFixed(1)} s · {ownView
          ? language === 'fr'
            ? 'Réalité dans la vue principale ; image prédite dans l’encadré.'
            : 'Reality in the main view; predicted image in the inset.'
          : language === 'fr'
            ? state.mode === 'versus-local'
              ? 'La vue principale compare la réalité à l’image prédite dans l’encadré.'
              : 'Vous percevez le déroulement prédit.'
            : state.mode === 'versus-local'
              ? 'The main view compares reality with the predicted image in the inset.'
              : 'You perceive the predicted sequence.'}
      </p>
      {#if ownView}
        <div class="perceptions">
          <span
            >{language === 'fr' ? 'Réalité' : 'Reality'} · x {state[future.owner].x.toFixed(1)} · {Math.ceil(
              state[future.owner].health,
            )}
            {language === 'fr' ? 'PV' : 'HP'}</span
          >
          <span
            >{language === 'fr'
              ? 'Image perçue par l’adversaire'
              : 'Afterimage perceived by the opponent'} · x {echo[future.owner].x.toFixed(1)} · {Math.ceil(
              echo[future.owner].health,
            )}
            {language === 'fr' ? 'PV' : 'HP'}</span
          >
        </div>
      {/if}
      <p class="warning">
        {language === 'fr'
          ? 'Déplacez-vous réellement : aucune invulnérabilité ne remplace l’esquive.'
          : 'Move out of danger: no invulnerability replaces physical evasion.'}
      </p>
    {/if}
    {#if future && state.mode === 'versus-local'}
      <small
        >{language === 'fr'
          ? 'Adaptation locale : les commandes adverses présentes sont prolongées puis rejouées pendant la fenêtre. Les décisions humaines futures ne sont pas connues.'
          : 'Local adaptation: current opponent inputs are extrapolated, then replayed during the window. Future human decisions are not known.'}</small
      >
    {/if}
  </section>
{/if}

<style>
  .parallel-panel {
    padding: 0.85rem 1rem;
    background: #0b1720;
    border-top: 1px solid #496879;
    color: #dceaf0;
    font: 600 0.76rem/1.5 var(--font-mono);
    overflow-wrap: anywhere;
  }
  header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
  }
  strong {
    color: #7dd3fc;
  }
  p {
    margin: 0.5rem 0;
  }
  .warning {
    color: #f3caa6;
  }
  progress {
    width: 100%;
    accent-color: #7dd3fc;
  }
  svg {
    display: block;
    width: 100%;
    max-height: 170px;
    margin: 0.5rem 0;
  }
  text {
    font-size: 11px;
  }
  .scrubber {
    display: grid;
    gap: 0.3rem;
  }
  input {
    width: 100%;
    accent-color: #7dd3fc;
  }
  .preview-readout,
  .perceptions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1.5rem;
  }
  button {
    padding: 0.45rem 0.7rem;
    color: #e8f3f7;
    background: #173444;
    border: 1px solid #7dd3fc;
    border-radius: 4px;
    cursor: pointer;
    font: inherit;
  }
  .open-eyes {
    margin-top: 0.7rem;
  }
  .perspectives {
    display: flex;
    gap: 0.4rem;
  }
  button[aria-pressed='true'] {
    background: #285a70;
  }
  small {
    display: block;
    margin-top: 0.6rem;
    color: #b4c6d0;
  }
</style>
