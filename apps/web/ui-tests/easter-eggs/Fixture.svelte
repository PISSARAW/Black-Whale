<script lang="ts">
  import { onMount, tick } from 'svelte'
  import FightStage from '$lib/components/fighting/FightStage.svelte'
  import { beginFight, createFight, tickFight } from '$lib/fighting/engine'
  import { performEasterEgg } from '$lib/fighting/easterEggs'
  import { easterEggPreviewOpponent } from '$lib/fighting/easterEggSecrets'
  import { FIGHTING_ROSTER } from '$lib/fighting/roster'
  import {
    easterEggDefinition,
    type EasterEggFighter,
    type EasterEggSlot,
  } from '$lib/fighting/easterEggCatalogue'
  import {
    defaultEasterEggPreferences,
    readEasterEggPreferences,
    easterEggKeyCommand,
  } from '$lib/fighting/easterEggPreferences'
  import { movementKeys, opponentMovementKeys } from '../../src/routes/fighting/fightingKeys'
  import {
    EMPTY_INPUT,
    type FightInput,
    type FightSide,
    type FightState,
  } from '$lib/fighting/types'

  let state = fresh('hisoka')
  let preferences = defaultEasterEggPreferences()
  let input = { ...EMPTY_INPUT }
  let opponentInput = { ...EMPTY_INPUT }
  let language: 'fr' | 'en' = 'fr'
  let paused = false
  function fresh(id: EasterEggFighter): FightState {
    const base = beginFight(
      createFight(id, easterEggPreviewOpponent({ fighterId: id, opponentId: 'hisoka', slot: 4 }), {
        mode: 'versus-local',
        formatId: 'knockout',
      }),
    )
    return { ...base, player: { ...base.player, x: 36 }, opponent: { ...base.opponent, x: 64 } }
  }
  async function reset(id: EasterEggFighter = 'hisoka') {
    state = fresh(id)
    paused = false
    await tick()
  }
  function play(side: FightSide, slot: EasterEggSlot) {
    if (!paused) state = performEasterEgg(state, side, slot)
  }
  async function advance(count: number) {
    for (let frame = 0; frame < count; frame++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    await tick()
    return current()
  }
  async function showCase(id: EasterEggFighter, slot: EasterEggSlot, locale: 'fr' | 'en' = 'fr') {
    await reset(id)
    language = locale
    state.player = { ...state.player, easterEggSequence: 3, easterEggDiscoveries: 7 }
    state = performEasterEgg(state, 'player', slot)
    await advance(Math.floor(easterEggDefinition(id, slot)!.frames * 0.7))
    return current()
  }
  function current() {
    return {
      fighter: state.player.id,
      opponent: state.opponent.id,
      egg: state.player.easterEgg,
      opponentEgg: state.opponent.easterEgg,
      discoveries: preferences.discoveries,
      keys: preferences.keys,
      health: state.player.health,
    }
  }
  function key(event: KeyboardEvent, active: boolean) {
    if ((event.target as HTMLElement)?.closest('input,select,textarea,summary,[data-fight-scroll]'))
      return
    const command = easterEggKeyCommand(event.key, {
      state,
      keys: preferences.keys,
      input,
      opponentInput,
    })
    if (command) {
      event.preventDefault()
      if (active && !event.repeat) play(command.side, command.slot)
      return
    }
    const opponent = opponentMovementKeys[event.key]
    const player = movementKeys[event.key]
    if (opponent) opponentInput = { ...opponentInput, [opponent]: active }
    else if (player) input = { ...input, [player]: active }
  }
  const ignore = (_key: keyof FightInput, _active: boolean) => {}
  onMount(() => {
    preferences = readEasterEggPreferences()
    Object.assign(window, {
      easterEggFixture: {
        roster: () => FIGHTING_ROSTER.map((fighter) => fighter.id),
        showCase,
        reset,
        advance,
        current,
        pause: (value: boolean) => {
          paused = value
        },
      },
    })
    const down = (event: KeyboardEvent) => key(event, true)
    const up = (event: KeyboardEvent) => key(event, false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  })
</script>

<main>
  <FightStage
    {state}
    {language}
    {paused}
    bind:easterEggPreferences={preferences}
    onEasterEgg={play}
    onAttack={() => {}}
    onThrow={() => {}}
    onCall={() => {}}
    onFinisher={() => {}}
    onControl={ignore}
    showControls={true}
  />
</main>

<style>
  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 12px;
  }
</style>
