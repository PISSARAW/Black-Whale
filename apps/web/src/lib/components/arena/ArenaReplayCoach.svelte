<script lang="ts">
  import { coachArenaReplay, type ArenaReplayCoachReport } from '$lib/arena/replay/coach'
  import type { ArenaReplay } from '$lib/arena/replay/types'
  import { moveById } from '$lib/fighting/movesets'

  interface Props {
    replay: ArenaReplay
    locale: 'fr' | 'en'
    onSeek: (tick: number) => void
    onResume?: (tick: number) => void
  }

  let { replay, locale, onSeek, onResume }: Props = $props()
  let report = $state<ArenaReplayCoachReport | null>(null)
  const fr = $derived(locale === 'fr')

  function analyse() {
    report = coachArenaReplay(replay)
  }

  function moveName(moveId: string) {
    const move = moveById(moveId)
    return (fr ? move?.nameFr : move?.nameEn) ?? moveId
  }
</script>

<details class="replay-coach">
  <summary>{fr ? 'Débrief POV et entraînement' : 'POV debrief and practice'}</summary>
  <div class="coach-body">
    <p>
      {fr
        ? 'Le coach relit uniquement ce que votre combattant pouvait percevoir : récupérations visibles et contacts réels.'
        : 'The coach only reviews what your fighter could perceive: visible recovery and actual contact.'}
    </p>
    <button type="button" onclick={analyse}>
      {fr ? 'Analyser mon replay' : 'Analyse my replay'}
    </button>
    {#if report}
      {#if report.findings.length === 0}
        <p role="status">
          {fr
            ? 'Aucun repère fiable dans cette analyse limitée — cela ne signifie pas que le duel était parfait.'
            : 'No reliable finding in this limited analysis — this does not mean the duel was perfect.'}
        </p>
      {:else}
        <p role="status">
          {report.findings.length}
          {fr ? 'moment(s) exploitable(s)' : 'actionable moment(s)'}
        </p>
      {/if}
      {#each report.findings as finding (finding.id)}
        <article>
          <strong>
            {finding.kind === 'recovery-opportunity'
              ? fr
                ? 'Récupération à punir'
                : 'Punishable recovery'
              : fr
                ? 'Votre récupération a été punie'
                : 'Your recovery was punished'}
          </strong>
          <small>
            {(finding.eventTick / replay.tickRate).toFixed(1)}s · {moveName(finding.moveId)}
          </small>
          <p>
            {finding.kind === 'recovery-opportunity'
              ? fr
                ? `Votre léger démarre en ${finding.responseFrames} frames : testez-le avant la fin de cette récupération.`
                : `Your light starts in ${finding.responseFrames} frames: test it before this recovery ends.`
              : fr
                ? 'Un contact réel vous a atteint pendant votre engagement. Rejouez l’entrée et changez votre distance ou votre timing.'
                : 'An actual hit reached you during commitment. Replay the entry and change your spacing or timing.'}
          </p>
          <div class="actions">
            <button type="button" onclick={() => onSeek(finding.eventTick)}>
              {fr ? 'Revoir' : 'Review'}
            </button>
            {#if onResume}
              <button type="button" onclick={() => onResume?.(finding.resumeTick)}>
                {fr ? 'Pratiquer depuis avant' : 'Practise from before'}
              </button>
            {/if}
          </div>
        </article>
      {/each}
      <p class="hint">
        {fr
          ? 'Diagnostic non exhaustif : aucune information cachée ni réponse optimale supposée.'
          : 'Non-exhaustive diagnostic: no hidden information or assumed optimal response.'}
      </p>
    {/if}
  </div>
</details>

<style>
  .replay-coach {
    margin-top: 0.7rem;
    border-top: 1px solid #7bc6d733;
    padding-top: 0.65rem;
  }
  summary,
  button {
    cursor: pointer;
  }
  summary {
    color: #e3c36d;
    font:
      0.62rem 'IBM Plex Mono',
      monospace;
  }
  .coach-body,
  article {
    display: grid;
    gap: 0.55rem;
  }
  .coach-body {
    margin-top: 0.65rem;
  }
  article {
    border: 1px solid #7bc6d733;
    padding: 0.65rem;
  }
  p,
  small {
    margin: 0;
    color: #a9c0c5;
    font:
      0.58rem/1.5 'IBM Plex Mono',
      monospace;
  }
  .actions {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }
  button {
    width: fit-content;
    border: 1px solid #81c9d755;
    background: #0a171c;
    color: #b9ced3;
    padding: 0.35rem 0.55rem;
    font:
      0.55rem 'IBM Plex Mono',
      monospace;
  }
  .hint {
    opacity: 0.75;
  }
</style>
