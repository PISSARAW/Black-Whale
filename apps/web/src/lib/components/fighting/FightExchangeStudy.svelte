<script lang="ts">
  import {
    EXCHANGE_TRIALS,
    exchangeFighterProfile,
    recordExchangeNote,
    exchangeStudyReport,
    type ExchangeObservation,
    type ExchangeNote,
  } from '$lib/fighting/exchangeStudy'
  import type { FightSide, FightState } from '$lib/fighting/types'
  import type {
    TrainingPosition,
    TrainingResources,
    TrainingSettings,
  } from '$lib/fighting/trainingTypes'
  export let state: FightState
  export let language: 'fr' | 'en'
  export let onReset: (position: TrainingPosition) => void
  export let onDummy: (update: Partial<TrainingSettings['dummy']>) => void
  export let onResources: (side: FightSide, update: Partial<TrainingResources>) => void
  let trialId = 'spacing'
  let observation: ExchangeObservation = 'unclear'
  let comment = ''
  let notes: ExchangeNote[] = []
  $: text = language === 'fr' ? 0 : 1
  $: trial = EXCHANGE_TRIALS.find((entry) => entry.id === trialId)!
  $: profiles = [exchangeFighterProfile(state.player.id), exchangeFighterProfile(state.opponent.id)]
  $: busy = state.training?.recording.recording || state.training?.recording.playing
  function prepare() {
    if (busy) return
    onReset(trial.position)
    onDummy(trial.dummy)
    for (const side of ['player', 'opponent'] as const)
      onResources(side, {
        health: state[side].maxHealth,
        aura: 100,
        infiniteHealth: false,
        infiniteAura: false,
      })
  }
  function record() {
    const note = recordExchangeNote({ state, trial: trialId, observation, comment })
    if (note) notes = [...notes.slice(-39), note]
    comment = ''
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(exchangeStudyReport(notes), null, 2)], { type: 'application/json' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = 'clash-exchange-study.json'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
</script>

<details class="exchange-study">
  <summary
    >{text === 0
      ? 'Essais d’équilibrage · échanges et contre-jeu'
      : 'Balance trials · exchanges and counterplay'}</summary
  >
  <div class="content">
    <p>
      {text === 0
        ? 'Comparer les outils réels des deux personnages, puis consigner une observation. Les relevés restent locaux à cette session.'
        : 'Compare both fighters’ actual tools, then record an observation. Notes stay local to this session.'}
    </p>
    <div class="profiles">
      {#each profiles as profile, index (index)}
        <article>
          <strong>P{index + 1} · {profile.name}</strong>
          <p>{profile.plan[text]}</p>
          <p>
            {text === 0 ? 'Réponse adverse : ' : 'Opponent’s response: '}{profile.counter[text]}
          </p>
          <small
            >{text === 0 ? 'Léger de base' : 'Base jab'}: {profile.jab.startup}f / {profile.jab
              .recovery}f · {text === 0 ? 'portée' : 'reach'}
            {profile.jab.reach.toFixed(1)} · {text === 0 ? 'marche' : 'walk'}
            {profile.walk}/s</small
          >
        </article>
      {/each}
    </div>
    <small
      >{text === 0
        ? 'Startup / récupération et unités du duel, hors effets temporaires. Ces chiffres ne constituent pas un classement de puissance du manga.'
        : 'Startup / recovery and duel units, excluding temporary effects. These values are not a manga power ranking.'}</small
    >
    <label
      >{text === 0 ? 'Situation à tester' : 'Trial situation'}
      <select
        bind:value={trialId}
        aria-label={text === 0 ? 'Situation à tester' : 'Trial situation'}
      >
        {#each EXCHANGE_TRIALS as entry (entry.id)}<option value={entry.id}
            >{entry.title[text]}</option
          >{/each}
      </select>
    </label>
    <p>{trial.instructions[text]}</p>
    <button type="button" disabled={busy} onclick={prepare}
      >{text === 0 ? 'Préparer cet essai' : 'Prepare this trial'}</button
    >
    <small
      >{text === 0
        ? 'Réinitialise la manche, règle le mannequin et restaure PV/aura finis. Les équipements et prérequis restent ceux du scénario choisi. Reprendre le combat si la pause est active.'
        : 'Resets the round, configures the dummy and restores finite HP/aura. Equipment and prerequisites remain those of the selected scenario. Resume the fight if paused.'}</small
    >
    <label
      >{text === 0 ? 'Observation du joueur' : 'Player observation'}
      <select
        bind:value={observation}
        aria-label={text === 0 ? 'Observation du joueur' : 'Player observation'}
      >
        <option value="unclear">{text === 0 ? 'À vérifier en partie' : 'Needs playtesting'}</option>
        <option value="opening"
          >{text === 0 ? 'Une réponse a fonctionné' : 'A response worked'}</option
        >
        <option value="locked">{text === 0 ? 'Aucune réponse trouvée' : 'No response found'}</option
        >
      </select>
    </label>
    <label
      >{text === 0 ? 'Actions tentées et résultat' : 'Actions attempted and result'}
      <textarea
        bind:value={comment}
        maxlength="800"
        rows="3"
        aria-label={text === 0 ? 'Actions tentées et résultat' : 'Actions attempted and result'}
      ></textarea>
    </label>
    <div class="buttons">
      <button type="button" onclick={record}
        >{text === 0 ? 'Consigner cet essai' : 'Record this trial'}</button
      >
      <button type="button" disabled={!notes.length} onclick={download}
        >{text === 0 ? 'Exporter les observations' : 'Export observations'} ({notes.length}/40)</button
      >
    </div>
    <small
      >{text === 0
        ? 'L’export distingue les avis humains des tests automatisés et garde les réglages du mannequin et des ressources. L’avantage du dernier contact n’est inclus que si sa récupération a pu être mesurée.'
        : 'The export separates human observations from automated tests and retains dummy/resource settings. Last-contact advantage is included only when recovery could be measured.'}</small
    >
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
  .content {
    display: grid;
    gap: 0.7rem;
    margin-top: 0.8rem;
  }
  .profiles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
    gap: 0.7rem;
  }
  article {
    border: 1px solid #3c4d58;
    padding: 0.6rem;
    min-width: 0;
  }
  p {
    margin: 0.4rem 0;
  }
  small {
    color: #b8c9d3;
  }
  label {
    display: grid;
    gap: 0.35rem;
  }
  select,
  textarea,
  button {
    background: #14232e;
    color: #e7eef2;
    border: 1px solid #52616a;
    border-radius: 3px;
    padding: 0.5rem;
    font: inherit;
    max-width: 100%;
    min-width: 0;
  }
  textarea {
    box-sizing: border-box;
    width: 100%;
    resize: vertical;
  }
  button {
    min-height: 38px;
  }
  button:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
</style>
