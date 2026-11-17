<script lang="ts">
  import { clashCareer } from '$lib/fighting/career/profile'
  import FightCeremony from '$lib/components/fighting/FightCeremony.svelte'
  import { mountPvpDuelLoop } from '$lib/fighting/pvp/duelLoop'
  import { FIGHT_VISUAL_PREDICTION } from '$lib/fighting/fightVisualPrediction'
  import { onMount, setContext } from 'svelte'
  import FightStage from '$lib/components/fighting/FightStage.svelte'
  import FightPvpPanels from '$lib/components/fighting/FightPvpPanels.svelte'
  import FightPvpStatus from '$lib/components/fighting/FightPvpStatus.svelte'
  import FightInputSettings from '$lib/components/fighting/FightInputSettings.svelte'
  import FightControlsManual from '$lib/components/fighting/FightControlsManual.svelte'
  import { createFightControls, dispatchFightKey } from '../fightingControls'
  import { listenFightEvents } from '../fightingEvents'
  import { attackKeys } from '../fightingKeys'
  import { FIGHT_CONTROLS_CONTEXT } from '$lib/fighting/fightControlHints'
  import { defaultEasterEggPreferences } from '$lib/fighting/easterEggPreferences'
  import { packReplayInput } from '$lib/fighting/fightReplayInput'
  import { EMPTY_INPUT, type FightInput, type MoveAction } from '$lib/fighting/types'
  import type { PvpClient } from '$lib/fighting/pvp/client'
  import type { PvpCommand } from '$lib/fighting/pvp/types'
  export let client: PvpClient
  export let language: 'fr' | 'en'
  export let invite = ''
  export let watchInvite = ''
  export let autoConnect = false
  let victoryActive = false
  let input = { ...EMPTY_INPUT }
  let joined = autoConnect
  let editing = false
  const controls = createFightControls((side, action) => {
    if (side === 'player' && action !== 'pause') move(action)
  })
  setContext(FIGHT_CONTROLS_CONTEXT, controls.bindings)
  setContext(FIGHT_VISUAL_PREDICTION, () => client.visualPrediction)
  $: state = $client.state
  $: enabled = $client.connection === 'connected' && $client.view?.status === 'playing'
  $: if (!enabled) release()
  function release() {
    input = { ...EMPTY_INPUT }
    controls.release()
    client.release()
  }
  function emit(command: PvpCommand) {
    if (enabled) client.queue(command)
  }
  function move(action: MoveAction | 'ranged') {
    emit({ kind: 'move', action, input: packReplayInput(controls.combine('player', input)) })
  }
  function control(key: keyof FightInput, active: boolean) {
    if (enabled) input = { ...input, [key]: active }
  }
  function key(event: KeyboardEvent, active: boolean) {
    if (!state || !enabled) return
    dispatchFightKey(event, active, {
      state,
      keys: defaultEasterEggPreferences().keys,
      input,
      opponentInput: EMPTY_INPUT,
      easter: (side, slot) => {
        if (side === 'player') emit({ kind: 'easter', slot })
      },
      control,
      opponentControl: () => {},
      opponentAttack: () => {},
      attack: move,
      action: (value) => {
        if (value === 'o') move('throw')
        else if (value === 'h') move('finisher')
        else if (attackKeys[value]) move(attackKeys[value])
      },
    })
  }
  async function join() {
    joined = true
    await client.join()
  }
  onMount(() => {
    clashCareer.load()
    controls.load()
    const unlisten = listenFightEvents({ controls, handleKey: key, release, hidden: release })
    const stopLoop = mountPvpDuelLoop({
      client,
      joined: () => joined,
      input: () =>
        document.hidden || editing ? 0 : packReplayInput(controls.combine('player', input)),
      poll: () => controls.poll('versus-ai', enabled && !editing),
    })
    if (autoConnect) void client.join()
    return () => {
      stopLoop()
      unlisten()
      release()
      client.stop()
    }
  })
</script>

<FightPvpStatus {client} {language} {invite} {watchInvite} />
{#if !joined}<button type="button" class="join" onclick={join}
    >{language === 'fr' ? 'Rejoindre ce duel privé' : 'Join this private duel'}</button
  >{/if}
{#if state}
  {#if !victoryActive && (state.phase === 'ready' || state.phase === 'finished')}<FightCeremony
      {state}
      {language}
    />{/if}
  <FightInputSettings {controls} {language} onEditing={release} />
  <FightPvpPanels {state} {language} paused={!enabled} onCommand={emit} onEditing={release} />
  <FightStage
    bind:victoryActive
    {state}
    {language}
    stageId={state.environment.stageId}
    showControls
    paused={!enabled}
    onAttack={move}
    onThrow={() => move('throw')}
    onCall={() => emit({ kind: 'call' })}
    onFinisher={() => move('finisher')}
    onEmperor={() => emit({ kind: 'emperor' })}
    onControl={control}
    onTalk={(side) => {
      if (side === 'player') emit({ kind: 'talk', words: '' })
    }}
    onBattleAction={(side, moveId) => {
      if (side === 'player') emit({ kind: 'battle', moveId })
    }}
    onBlinkyTarget={(side, target) => {
      if (side === 'player') emit({ kind: 'blinky-target', target })
    }}
    onBlinkyCommand={(side, command) => {
      if (side === 'player') emit({ kind: 'blinky-command', command })
    }}
    onEasterEgg={(side, slot) => {
      if (side === 'player') emit({ kind: 'easter', slot })
    }}
  />
  <details
    ontoggle={(event) => {
      editing = event.currentTarget.open
      release()
    }}
  >
    <summary>{language === 'fr' ? 'Commandes et techniques' : 'Controls and techniques'}</summary>
    <FightControlsManual
      {language}
      fighterId={state.player.id}
      mode="versus-ai"
      title="Clash PvP"
    />
  </details>
{/if}

<style>
  .join {
    padding: 0.7rem 1rem;
    min-height: 44px;
    color: white;
    background: #29465a;
    border: 1px solid #9fb5c5;
  }
  details {
    margin: 1rem 0;
  }
  summary {
    min-height: 44px;
    cursor: pointer;
  }
</style>
