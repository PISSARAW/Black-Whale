<script lang="ts">
  import { onMount, setContext } from 'svelte'
  import FightStage from './FightStage.svelte'
  import FightTeamRoster from './FightTeamRoster.svelte'
  import { createTeamRuntime } from '$lib/fighting/teams/runtime'
  import { teamAssistBlock, TEAM_ASSIST_LABELS } from '$lib/fighting/teams/availability'
  import FightHatsuPanels from './FightHatsuPanels.svelte'
  import FightInputSettings from './FightInputSettings.svelte'
  import { createFightControls, dispatchFightKey } from '../../../routes/fighting/fightingControls'
  import { listenFightEvents } from '../../../routes/fighting/fightingEvents'
  import { attackKeys } from '../../../routes/fighting/fightingKeys'
  import { battleStageCallbacks, callFightBody } from '../../../routes/fighting/battleCallbacks'
  import { FIGHT_CONTROLS_CONTEXT } from '$lib/fighting/fightControlHints'
  import { defaultEasterEggPreferences } from '$lib/fighting/easterEggPreferences'
  import { applyReplayCommand } from '$lib/fighting/fightReplayCommands'
  import { packReplayInput } from '$lib/fighting/fightReplayInput'
  import { performAuraAttack } from '$lib/fighting/engine'
  import { designateBlinkyTarget, selectBlinkyCommand } from '$lib/fighting/blinky'
  import { requestTeamAssist, nextTeamRound, startTeamFight } from '$lib/fighting/teamMatch'
  import {
    EMPTY_INPUT,
    type FightState,
    type FightSide,
    type FightInput,
    type MoveAction,
  } from '$lib/fighting/types'
  export let state: FightState
  export let language: 'fr' | 'en'
  export let onExit: () => void
  export let animate = true
  export let victoryEnabled = true
  let victoryActive = false
  let paused = false,
    message = ''
  let inputs = { player: { ...EMPTY_INPUT }, opponent: { ...EMPTY_INPUT } }
  const runtime = createTeamRuntime()
  const controls = createFightControls((side, action) =>
    action === 'pause' ? togglePause() : move(side, action),
  )
  setContext(FIGHT_CONTROLS_CONTEXT, controls.bindings)
  const easter = defaultEasterEggPreferences()
  $: fr = language === 'fr'
  function release() {
    inputs = { player: { ...EMPTY_INPUT }, opponent: { ...EMPTY_INPUT } }
    runtime.clear()
    controls.release()
  }
  function togglePause() {
    paused = !paused
    release()
  }
  function queue(action: (current: FightState) => FightState) {
    if (!paused) runtime.queue(state, action)
  }
  function move(side: FightSide, action: MoveAction | 'ranged') {
    const input = packReplayInput(controls.combine(side, inputs[side]))
    queue((current) => applyReplayCommand(current, { kind: 'move', side, action, input }))
  }
  function hold(side: FightSide, key: keyof FightInput, active: boolean) {
    if (!paused) inputs = { ...inputs, [side]: { ...inputs[side], [key]: active } }
  }
  function assist(side: FightSide, index: number) {
    queue((current) => {
      const block = teamAssistBlock(current, side, index)
      message = block ? TEAM_ASSIST_LABELS[block][fr ? 0 : 1] : ''
      return block ? current : requestTeamAssist(current, side, index)
    })
  }
  function handleKey(event: KeyboardEvent, active: boolean) {
    if (event.key === 'p' && active && !event.repeat) {
      event.preventDefault()
      togglePause()
      return
    }
    if (paused || state.phase !== 'fighting') return
    dispatchFightKey(event, active, {
      state,
      keys: easter.keys,
      input: inputs.player,
      opponentInput: inputs.opponent,
      easter: (side, slot) =>
        queue((current) => applyReplayCommand(current, { kind: 'easter', side, slot })),
      control: (key, held) => hold('player', key, held),
      opponentControl: (key, held) => hold('opponent', key, held),
      opponentAttack: (action) => move('opponent', action),
      attack: (action) => move('player', action),
      action: (key) => {
        const action = attackKeys[key] ?? ({ o: 'throw', h: 'finisher' } as const)[key as 'o' | 'h']
        if (action) move('player', action)
      },
    })
  }
  export function advance(dt: number, manual?: Record<FightSide, FightInput>) {
    if (paused || state.phase !== 'fighting') return state
    state = runtime.advance(
      state,
      manual ?? {
        player: controls.combine('player', inputs.player),
        opponent: controls.combine('opponent', inputs.opponent),
      },
      dt,
    )
    return state
  }
  onMount(() => {
    controls.load()
    const stop = listenFightEvents({
      controls,
      handleKey,
      release,
      hidden: () => {
        paused = true
        release()
      },
    })
    let frame = 0,
      last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      controls.poll('versus-local', !paused && state.phase === 'fighting')
      if (animate) advance(dt)
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(frame)
      stop()
      release()
    }
  })
</script>

<div class="teams-battle">
  <header>
    <button type="button" onclick={togglePause}
      >{paused ? (fr ? 'Reprendre' : 'Resume') : 'Pause'}</button
    >
    <button type="button" onclick={onExit}>{fr ? 'Quitter les équipes' : 'Exit teams'}</button>
  </header>
  <div class="team-rosters">
    <FightTeamRoster
      {state}
      side="player"
      {language}
      {paused}
      onAssist={(index) => assist('player', index)}
    />
    <FightTeamRoster
      {state}
      side="opponent"
      {language}
      {paused}
      onAssist={(index) => assist('opponent', index)}
    />
  </div>
  {#if message}<p role="status">{message}</p>{/if}
  {#if state.phase === 'ready'}<button
      type="button"
      onclick={() => {
        release()
        state = startTeamFight(state)
      }}>{fr ? 'Commencer la manche' : 'Start round'}</button
    >{/if}
  {#if state.phase === 'finished' && !victoryActive}
    <p role="status">
      {state.teamMatch?.winner
        ? state.teamMatch.winner === 'draw'
          ? fr
            ? 'Match nul'
            : 'Draw'
          : `${fr ? 'Équipe gagnante' : 'Winning team'} : ${state.teamMatch.winner === 'player' ? 'P1' : 'P2'}`
        : fr
          ? 'Un combattant est éliminé.'
          : 'A fighter is eliminated.'}
    </p>
    {#if !state.teamMatch?.winner}<button
        type="button"
        onclick={() => {
          release()
          state = nextTeamRound(state)
        }}>{fr ? 'Prochain combattant' : 'Next fighter'}</button
      >{/if}
  {/if}
  <FightInputSettings {controls} {language} onEditing={release} />
  {#if state.phase === 'fighting'}
    <details class="team-techniques" ontoggle={release}>
      <summary
        >{fr
          ? 'Techniques et préparations · P1/P2'
          : 'Techniques and preparations · P1/P2'}</summary
      >
      <FightHatsuPanels
        {state}
        {language}
        {paused}
        onAction={queue}
        perform={performAuraAttack}
        onEditing={release}
      />
    </details>
  {/if}
  {#if state.phase !== 'ready'}
    <FightStage
      {victoryEnabled}
      bind:victoryActive
      victoryPaused={paused}
      {state}
      {language}
      {paused}
      showControls
      stageId={state.environment.stageId}
      onAttack={(kind) => move('player', kind)}
      onThrow={() => move('player', 'throw')}
      onFinisher={() => move('player', 'finisher')}
      onCall={() => queue(callFightBody)}
      onEmperor={() =>
        queue((current) => applyReplayCommand(current, { kind: 'emperor', side: 'player' }))}
      onControl={(key, held) => hold('player', key, held)}
      onOpponentControl={(key, held) => hold('opponent', key, held)}
      onBlinkyTarget={(side, target) =>
        queue((current) => designateBlinkyTarget(current, side, target))}
      onBlinkyCommand={(side, command) =>
        queue((current) => selectBlinkyCommand(current, side, command))}
      {...battleStageCallbacks(queue)}
    />
  {/if}
</div>

<style>
  .team-techniques {
    border: 1px solid #586b80;
    padding: 0.6rem;
    margin: 0.6rem 0;
  }
  summary {
    min-height: 44px;
    cursor: pointer;
    display: flex;
    align-items: center;
  }
  .teams-battle {
    max-width: 100%;
    color: #e5eff9;
  }
  .team-rosters {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }
  button {
    padding: 0.5rem;
    margin: 0.2rem;
    color: inherit;
    border: 1px solid #6e869e;
    background: #22394a;
    font: inherit;
  }
  header {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  :global(.teams-battle .rounds) {
    display: none;
  }
  @media (max-width: 450px) {
    .team-rosters {
      grid-template-columns: 1fr;
    }
  }
</style>
