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
  import { packReplayInput } from '$lib/fighting/fightReplayInput'
  import { performAuraAttack } from '$lib/fighting/engine'
  import { designateBlinkyTarget, selectBlinkyCommand } from '$lib/fighting/blinky'
  import { EMPTY_INPUT, type FightInput, type MoveAction } from '$lib/fighting/types'
  import type { SoloController } from '$lib/fighting/solo/controller'
  export let controller: SoloController
  export let language: 'fr' | 'en'
  export let animate = true
  let input = { ...EMPTY_INPUT }
  const controls = createFightControls((side, action) => {
    if (side !== 'player') return
    if (action === 'pause') togglePause()
    else move(action)
  })
  setContext(FIGHT_CONTROLS_CONTEXT, controls.bindings)
  const callbacks = battleStageCallbacks((action) => controller.queue(action))
  const easter = defaultEasterEggPreferences()
  $: state = $controller.session?.state
  $: paused = $controller.paused
  $: fr = language === 'fr'
  function release() {
    input = { ...EMPTY_INPUT }
    controls.release()
  }
  function togglePause() {
    controller.pause(!paused)
    release()
  }
  function move(action: MoveAction | 'ranged') {
    controller.enqueue({
      kind: 'move',
      side: 'player',
      action,
      input: packReplayInput(controls.combine('player', input)),
    })
  }
  function hold(key: keyof FightInput, held: boolean) {
    if (!paused) input = { ...input, [key]: held }
  }
  function key(event: KeyboardEvent, active: boolean) {
    if (event.key === 'p' && active && !event.repeat) {
      event.preventDefault()
      togglePause()
      return
    }
    if (!state || paused) return
    dispatchFightKey(event, active, {
      state,
      keys: easter.keys,
      input,
      opponentInput: EMPTY_INPUT,
      easter: (side, slot) => {
        if (side === 'player') controller.enqueue({ kind: 'easter', side, slot })
      },
      control: hold,
      opponentControl: () => {},
      opponentAttack: () => {},
      attack: move,
      action: (value) => {
        const action =
          attackKeys[value] ?? ({ o: 'throw', h: 'finisher' } as const)[value as 'o' | 'h']
        if (action) move(action)
      },
    })
  }
  onMount(() => {
    controls.load()
    const stop = listenFightEvents({
      controls,
      handleKey: key,
      release,
      hidden: () => {
        controller.pause(true)
        release()
      },
    })
    let frame = 0,
      last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      controls.poll('versus-ai', !paused)
      if (animate && !paused) controller.tick(dt, controls.combine('player', input))
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

{#if state}<div class="solo-battle">
    <div class="actions">
      <button type="button" onclick={togglePause}
        >{paused ? (fr ? 'Reprendre' : 'Resume') : 'Pause'}</button
      >
      <button type="button" onclick={() => controller.leave()}
        >{fr ? 'Retour aux parcours' : 'Back to routes'}</button
      >
    </div>
    {#if paused}<p role="status">
        {fr
          ? 'Partie en pause. Le temps de session ne progresse pas.'
          : 'Paused. Session time does not advance.'}
      </p>{/if}
    <FightInputSettings {controls} {language} onEditing={release} />
    <FightHatsuPanels
      {state}
      {language}
      {paused}
      onAction={(action) => controller.queue(action)}
      perform={performAuraAttack}
      onEditing={release}
    />
    <FightStage
      {state}
      {language}
      {paused}
      victoryEnabled={false}
      stageId={state.environment.stageId}
      showControls
      onAttack={move}
      onThrow={() => move('throw')}
      onFinisher={() => move('finisher')}
      onCall={() => controller.queue(callFightBody)}
      onEmperor={() => controller.enqueue({ kind: 'emperor', side: 'player' })}
      onControl={hold}
      onTalk={(side) => {
        if (side === 'player') callbacks.onTalk(side)
      }}
      onBattleAction={(side, moveId) => {
        if (side === 'player') callbacks.onBattleAction(side, moveId)
      }}
      onBlinkyTarget={(side, target) => {
        if (side === 'player')
          controller.queue((current) => designateBlinkyTarget(current, side, target))
      }}
      onBlinkyCommand={(side, command) => {
        if (side === 'player')
          controller.queue((current) => selectBlinkyCommand(current, side, command))
      }}
    />
  </div>{/if}

<style>
  .solo-battle {
    min-width: 0;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
  }
  button {
    min-height: 44px;
    padding: 0.6rem;
    font: inherit;
    background: #193449;
    color: #edf4f8;
    border: 1px solid #7892a4;
    cursor: pointer;
  }
  p {
    line-height: 1.5;
  }
</style>
