<script lang="ts">
  import { onMount, setContext } from 'svelte'
  import FightStage from './FightStage.svelte'
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
  import {
    tickTeamFight,
    requestTeamAssist,
    nextTeamRound,
    startTeamFight,
  } from '$lib/fighting/teamMatch'
  import { teamLiving } from '$lib/fighting/teamTypes'
  import { fighterDefinition } from '$lib/fighting/roster'
  import { FIXED_STEP } from '$lib/fighting/fightClock'
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
  let victoryActive = false
  let paused = false,
    message = ''
  let inputs = { player: { ...EMPTY_INPUT }, opponent: { ...EMPTY_INPUT } }
  let pending: ((current: FightState) => FightState)[] = []
  const controls = createFightControls((side, action) =>
    action === 'pause' ? togglePause() : move(side, action),
  )
  setContext(FIGHT_CONTROLS_CONTEXT, controls.bindings)
  const easter = defaultEasterEggPreferences()
  $: fr = language === 'fr'
  function release() {
    inputs = { player: { ...EMPTY_INPUT }, opponent: { ...EMPTY_INPUT } }
    pending = []
    controls.release()
  }
  function togglePause() {
    paused = !paused
    release()
  }
  function queue(action: (current: FightState) => FightState) {
    if (!paused && state.phase === 'fighting' && pending.length < 64) pending.push(action)
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
      const next = requestTeamAssist(current, side, index)
      message =
        next === current
          ? fr
            ? 'Relais refusé : rejoins ton bord, corps libre et Nen au repos, sans manifestation en cours.'
            : 'Relay refused: reach your gate with a free body, resting Nen and no active manifestation.'
          : ''
      return next
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
      if (!paused && state.phase === 'fighting') {
        if (state.frameAccumulator + dt >= FIXED_STEP) {
          const actions = pending
          pending = []
          for (const action of actions) state = action(state)
        }
        state = tickTeamFight(
          state,
          {
            player: controls.combine('player', inputs.player),
            opponent: controls.combine('opponent', inputs.opponent),
          },
          dt,
        )
      }
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
    {#each ['player', 'opponent'] as side (side)}
      {@const seat = state.teamMatch!.seats[side as FightSide]}
      <section aria-label={side === 'player' ? 'P1' : 'P2'}>
        <h2>{side === 'player' ? 'P1' : 'P2'} · {teamLiving(seat)}/3</h2>
        {#each seat.members as member, index (member.id)}<div class:eliminated={member.health <= 0}>
            <strong>{fighterDefinition(member.id).name}</strong>
            {seat.active === index ? (fr ? ' · en scène' : ' · on stage') : ''}
            {#if index !== seat.active && member.health > 0}<button
                type="button"
                disabled={paused || seat.assistUsed || state.phase !== 'fighting'}
                onclick={() => assist(side as FightSide, index)}
                >{fr ? 'Appeler en relais' : 'Call relay'}</button
              >{/if}
          </div>{/each}
        {#if seat.relay}<p>
            {fr
              ? 'Allié en relais · sortie soumise aux engagements et entraves.'
              : 'Ally relay · commitments and restraints can prevent departure.'}
          </p>{/if}
      </section>
    {/each}
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
  <FightHatsuPanels
    {state}
    {language}
    {paused}
    onAction={queue}
    perform={performAuraAttack}
    onEditing={release}
  />
  <FightStage
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
</div>

<style>
  .teams-battle {
    max-width: 100%;
    color: #e5eff9;
  }
  .team-rosters {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }
  section {
    padding: 0.6rem;
    border: 1px solid #586b80;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  section div {
    margin: 0.4rem 0;
  }
  .eliminated {
    opacity: 0.45;
    text-decoration: line-through;
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
