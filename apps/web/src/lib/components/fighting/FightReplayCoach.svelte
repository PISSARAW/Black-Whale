<script lang="ts">
  import { onDestroy } from 'svelte'
  import { createReplayCoachScan } from '$lib/fighting/replayCoach'
  import type { ReplayCoachReport } from '$lib/fighting/replayCoachTypes'
  import type { FightReplayController } from '$lib/fighting/fightReplayController'
  import type { ReplayReviewActions } from '$lib/fighting/fightReplayReview'
  import type { FightSide } from '$lib/fighting/types'
  export let replays: FightReplayController
  export let actions: ReplayReviewActions
  export let language: 'fr' | 'en'
  let side: FightSide = 'player'
  let result: ReplayCoachReport | null = null
  let scan: ReturnType<typeof createReplayCoachScan> | null = null
  let frame = 0
  let analysed = ''
  $: fr = language === 'fr'
  $: playback = $replays.playback
  $: sourceId = playback?.id ?? $replays.practice?.id ?? ''
  $: entry = $replays.library.find((item) => item.id === sourceId)
  $: if (analysed && analysed !== sourceId) reset()
  const messages = {
    complete: [
      'Analyse vérifiée · repères limités aux faits observés.',
      'Verified analysis · limited to observed facts.',
    ],
    invalid: [
      'Analyse refusée : replay invalide ou divergent. Aucun conseil conservé.',
      'Analysis refused: invalid or divergent replay. No advice retained.',
    ],
    unsupported: [
      'Cette vue privée, spectateur ou simulation ne peut pas être analysée.',
      'This private view, spectator feed or simulation cannot be analysed.',
    ],
    cancelled: ['Analyse annulée.', 'Analysis cancelled.'],
    limit: [
      'Extrait trop long pour ce diagnostic. Enregistre un extrait plus court.',
      'Clip exceeds the diagnostic budget. Record a shorter clip.',
    ],
    running: ['Vérification et analyse en cours…', 'Checking and analysing…'],
  }
  function reset() {
    globalThis.cancelAnimationFrame?.(frame)
    scan?.cancel()
    scan = null
    result = null
    analysed = ''
  }
  function advance() {
    if (!scan) return
    result = scan.step()
    if (result.status === 'running') frame = requestAnimationFrame(advance)
  }
  function start() {
    if (!entry || !playback || playback.error) return
    reset()
    analysed = sourceId
    scan = createReplayCoachScan(entry.replay, side)
    result = scan.current
    if (result.status === 'running') frame = requestAnimationFrame(advance)
  }
  function cancel() {
    globalThis.cancelAnimationFrame?.(frame)
    if (scan) result = scan.cancel()
  }
  onDestroy(reset)
</script>

<details class="replay-coach">
  <summary
    >{fr
      ? 'Comprendre et pratiquer depuis ce replay'
      : 'Understand and practise from this replay'}</summary
  >
  <div class="coach-body">
    <p>
      {fr
        ? 'Diagnostic local : récupérations visibles et attaques réellement punies. Les préparations cachées ne servent pas à conseiller une réponse.'
        : 'Local diagnostics: visible recovery and attacks actually punished. Hidden setups are not used to recommend a response.'}
    </p>
    <label
      >{fr ? 'Point de vue du diagnostic' : 'Diagnostic perspective'}
      <select
        bind:value={side}
        onchange={reset}
        aria-label={fr ? 'Point de vue du diagnostic' : 'Diagnostic perspective'}
      >
        <option value="player">P1</option><option value="opponent">P2</option>
      </select>
    </label>
    <div class="buttons">
      <button
        type="button"
        onclick={start}
        disabled={!entry || !playback || Boolean(playback.error) || result?.status === 'running'}
        >{fr ? 'Analyser ce replay' : 'Analyse this replay'}</button
      >
      {#if result?.status === 'running'}<button type="button" onclick={cancel}
          >{fr ? 'Annuler l’analyse' : 'Cancel analysis'}</button
        >{/if}
    </div>
    {#if result}
      <p role="status">{messages[result.status][fr ? 0 : 1]} · {result.packet}/{result.packets}</p>
      {#if result.status === 'complete' && !result.findings.length}<p>
          {fr
            ? 'Aucun repère fiable trouvé dans ce diagnostic limité. Cela ne signifie pas que la partie était parfaite.'
            : 'No reliable finding in this limited diagnostic. This does not mean the match was perfect.'}
        </p>{/if}
      {#each result.findings as finding (finding.id)}
        <article>
          <strong
            >{finding.kind === 'recovery-opportunity'
              ? fr
                ? 'Récupération à étudier'
                : 'Recovery to study'
              : fr
                ? 'Ton attaque a été punie'
                : 'Your attack was punished'}</strong
          >
          <small
            >{fr ? 'Manche' : 'Round'}
            {finding.round} · F{finding.frame} · {side === 'player' ? 'P1' : 'P2'}</small
          >
          <p>
            {finding.kind === 'recovery-opportunity'
              ? fr
                ? `Un léger a puni en ${finding.responseFrames} frames dans le test sur les éléments perceptibles. L’adversaire n’y effectue aucune nouvelle action : essaie cette réponse, puis compare.`
                : `A light punished in ${finding.responseFrames} frames in the perceived-state test. The opponent takes no new action in that test: try the response, then compare.`
              : fr
                ? 'Un contact réel a atteint ton corps pendant ta récupération. Compare ta distance et ton engagement avant de relancer la même attaque.'
                : 'A real hit reached your body during recovery. Compare spacing and commitment before repeating the attack.'}
          </p>
          <button
            type="button"
            disabled={!playback || playback.seeking || Boolean(playback.error)}
            onclick={() => actions.seek(finding.packet)}
            >{fr ? 'Revoir cette situation' : 'Review this situation'}</button
          >
        </article>
      {/each}
    {/if}
    <p class="hint">
      {fr
        ? 'Après « Revoir cette situation », attends la reconstruction puis utilise « Reprendre le contrôle ». L’essai conserve les corps, engagements et ressources réels. Le diagnostic n’est pas exhaustif et ne promet pas une réponse optimale.'
        : 'After “Review this situation”, wait for reconstruction then use “Take control”. Rehearsal keeps the actual bodies, commitments and resources. Diagnostics are not exhaustive and do not promise an optimal response.'}
    </p>
  </div>
</details>

<style>
  details {
    border: 1px solid #52616a;
    padding: 0.7rem;
    min-width: 0;
  }
  summary,
  button {
    cursor: pointer;
  }
  .coach-body {
    display: grid;
    gap: 0.65rem;
    margin-top: 0.7rem;
  }
  p {
    margin: 0;
    line-height: 1.5;
  }
  .buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  article {
    display: grid;
    gap: 0.5rem;
    border: 1px solid #52616a;
    padding: 0.7rem;
    min-width: 0;
  }
  label {
    display: grid;
    gap: 0.3rem;
  }
  small,
  .hint {
    color: #b8c9d3;
  }
  select,
  button {
    background: #14232e;
    color: #e7eef2;
    border: 1px solid #52616a;
    padding: 0.5rem;
    font: inherit;
    max-width: 100%;
  }
  button {
    min-height: 38px;
  }
  button:disabled {
    opacity: 0.45;
    cursor: default;
  }
</style>
