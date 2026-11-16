<script lang="ts">
  import type { FightReplayController } from '$lib/fighting/fightReplayController'
  import { MAX_REPLAY_BYTES } from '$lib/fighting/fightReplayTypes'
  import type { SavedFightReplay } from '$lib/fighting/fightReplayTypes'
  import { fighterDefinition } from '$lib/fighting/roster'
  export let replays: FightReplayController
  export let language: 'fr' | 'en'
  export let onOpen: (id: string) => void
  export let onClose: () => void
  export let onRestart: () => void
  let file: HTMLInputElement
  let localError = ''
  const messages: Record<string, [string, string]> = {
    divergence: [
      'Ce replay ne correspond plus aux règles actuelles du jeu.',
      'This replay no longer matches the current game rules.',
    ],
    saved: ['Replay ajouté à la bibliothèque.', 'Replay added to the library.'],
    storage: [
      'Stockage local indisponible. Exporte les replays à conserver.',
      'Local storage unavailable. Export replays you want to keep.',
    ],
    empty: ['Pas encore de séquence à enregistrer.', 'No sequence to save yet.'],
    invalid: [
      'Fichier de replay invalide ou trop volumineux.',
      'Invalid or oversized replay file.',
    ],
    version: [
      'Ce replay nécessite une autre version du jeu.',
      'This replay requires another game version.',
    ],
  }
  $: index = language === 'fr' ? 0 : 1
  $: playback = $replays.playback
  $: status = messages[localError || $replays.status]?.[index] ?? ''
  function time(seconds: number) {
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
  }
  function title(entry: SavedFightReplay) {
    return `${fighterDefinition(entry.replay.setup.player).name} / ${fighterDefinition(entry.replay.setup.opponent).name}`
  }
  function download(entry: SavedFightReplay) {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(entry.replay)], { type: 'application/json' }),
    )
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `clash-${entry.id}.bw-replay.json`
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  async function importFile() {
    const selected = file.files?.[0]
    if (!selected) return
    localError = ''
    if (selected.size > MAX_REPLAY_BYTES) localError = 'invalid'
    else {
      try {
        const entry = await replays.import(await selected.text())
        if (entry) onOpen(entry.id)
      } catch {
        localError = 'invalid'
      }
    }
    file.value = ''
  }
</script>

<section
  class="fight-replays"
  aria-label={language === 'fr' ? 'Replays de matchs' : 'Match replays'}
  data-fight-scroll
>
  {#if playback}
    <div class="playback-bar">
      <strong>{language === 'fr' ? 'LECTURE DU REPLAY' : 'REPLAY PLAYBACK'}</strong>
      <span>{time(playback.elapsed)} / {time(playback.duration)}</span>
      <button type="button" onclick={() => replays.toggle()} disabled={playback.finished}
        >{playback.running ? 'Pause' : language === 'fr' ? 'Lire' : 'Play'}</button
      >
      <button type="button" onclick={onRestart}
        >{language === 'fr' ? 'Recommencer le replay' : 'Restart replay'}</button
      >
      <label
        >{language === 'fr' ? 'Vitesse' : 'Speed'}<select
          aria-label={language === 'fr' ? 'Vitesse' : 'Speed'}
          value={playback.speed}
          onchange={(event) => replays.speed(Number(event.currentTarget.value))}
          ><option value={0.5}>0.5×</option><option value={1}>1×</option><option value={2}
            >2×</option
          ></select
        ></label
      >
      <button type="button" onclick={onClose}
        >{language === 'fr' ? 'Quitter le replay' : 'Exit replay'}</button
      >
    </div>
    {#if playback.error}<p role="alert">
        {language === 'fr'
          ? 'Lecture interrompue : les états ne correspondent plus à ce replay.'
          : 'Playback stopped: game states no longer match this replay.'}
      </p>
    {:else if playback.finished}<p role="status">
        {language === 'fr'
          ? 'Fin du replay · états vérifiés.'
          : 'Replay finished · states verified.'}
      </p>{/if}
  {:else if $replays.recording}
    <div class="capture-bar">
      <span
        >{language === 'fr'
          ? 'Replay du duel en cours · capture automatique'
          : 'Current duel replay · automatic capture'}</span
      >
      <button type="button" onclick={() => replays.save()}
        >{language === 'fr' ? 'Enregistrer l’extrait' : 'Save current clip'}</button
      >
    </div>
  {/if}
  {#if $replays.captureIssue}<p role="status">
      {language === 'fr'
        ? 'Capture interrompue : une action non suivie ou une limite a été rencontrée. Le combat continue normalement.'
        : 'Capture stopped: an untracked action or recording limit was encountered. The fight continues normally.'}
    </p>{/if}
  {#if status}<p role="status">{status}</p>{/if}
  <details>
    <summary
      >{language === 'fr' ? 'Bibliothèque de replays' : 'Replay library'} · {$replays.library
        .length}/5</summary
    >
    <p class="explanation">
      {language === 'fr'
        ? 'Duels et entraînements des quarante personnages, avec scénario et commandes des panneaux. Le match complet est enregistré à sa fin ; cinq replays sont conservés localement. Les extraits sont identifiés séparément.'
        : 'Duels and training with all forty fighters, including scenarios and panel commands. Completed matches are saved automatically; five replays are kept locally. Partial clips are labelled separately.'}
    </p>
    <input
      bind:this={file}
      type="file"
      accept=".json,.bw-replay.json,application/json"
      onchange={importFile}
      aria-label={language === 'fr' ? 'Importer un replay' : 'Import replay'}
    />
    <ul>
      {#each $replays.library as entry (entry.id)}<li>
          <div>
            <strong>{title(entry)}</strong> · {time(entry.replay.duration)} · {entry.replay.complete
              ? language === 'fr'
                ? 'Match complet'
                : 'Full match'
              : language === 'fr'
                ? 'Extrait'
                : 'Clip'}
          </div>
          <div class="entry-actions">
            <button type="button" onclick={() => onOpen(entry.id)}
              >{language === 'fr' ? 'Lire ce replay' : 'Play this replay'}</button
            ><button type="button" onclick={() => download(entry)}
              >{language === 'fr' ? 'Exporter' : 'Export'}</button
            ><button type="button" onclick={() => replays.remove(entry.id)}
              >{language === 'fr' ? 'Supprimer' : 'Delete'}</button
            >
          </div>
        </li>{:else}<li>
          {language === 'fr' ? 'Aucun replay enregistré.' : 'No saved replays.'}
        </li>{/each}
    </ul>
  </details>
</section>

<style>
  .fight-replays {
    color: #e2ebf4;
    background: #101b2a;
    border: 1px solid #4b607b;
    border-radius: 0.6rem;
    padding: 0.7rem 1rem;
    margin: 0.6rem 0;
    font: 0.8rem/1.5 var(--font-mono, monospace);
  }
  .playback-bar,
  .capture-bar,
  .entry-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 0.8rem;
  }
  summary {
    color: #f4d27b;
    font-weight: 700;
    cursor: pointer;
    margin-top: 0.4rem;
  }
  label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  button,
  select {
    background: #243750;
    border: 1px solid #758aa8;
    border-radius: 0.3rem;
    color: #fff;
    padding: 0.4rem 0.6rem;
    font: inherit;
  }
  button {
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.45;
    cursor: default;
  }
  p {
    margin: 0.5rem 0;
  }
  .explanation {
    color: #b9c8db;
    max-width: 65rem;
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0.6rem 0 0;
  }
  li {
    border-top: 1px solid #425570;
    padding: 0.65rem 0;
    overflow-wrap: anywhere;
  }
  .entry-actions {
    margin-top: 0.4rem;
  }
  input {
    max-width: 100%;
  }
</style>
