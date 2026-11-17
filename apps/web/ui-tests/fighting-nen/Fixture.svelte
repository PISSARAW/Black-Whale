<script lang="ts">
  import { tick } from 'svelte'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import FightResources from '$lib/components/fighting/FightResources.svelte'
  import { beginFight, createFight, tickFight } from '$lib/fighting/engine'
  import { toggleEmperorTime } from '$lib/fighting/kurapikaActions'
  import { movementKeys, opponentMovementKeys } from '../../src/routes/fighting/fightingKeys'
  import { EMPTY_INPUT, type FightInput, type FighterId } from '$lib/fighting/types'

  let state = fresh('hinrigh')
  let input = { ...EMPTY_INPUT }
  let opponentInput = { ...EMPTY_INPUT }
  let language: 'fr' | 'en' = 'fr'

  function fresh(player: FighterId) {
    const next = beginFight(createFight(player, 'hinrigh', { mode: 'versus-local' }))
    return {
      ...next,
      player: { ...next.player, x: 40, aura: 100 },
      opponent: { ...next.opponent, x: 55 },
    }
  }

  function step() {
    state = tickFight(state, input, { dt: 1 / 60, opponentInput })
  }
  function control(key: keyof FightInput, active: boolean) {
    input = { ...input, [key]: active }
    step()
  }
  function keyboard(event: KeyboardEvent, active: boolean) {
    const key = event.key.toLowerCase()
    if (movementKeys[key]) {
      event.preventDefault()
      control(movementKeys[key], active)
    } else if (opponentMovementKeys[key]) {
      event.preventDefault()
      opponentInput = { ...opponentInput, [opponentMovementKeys[key]]: active }
      step()
    }
  }

  export async function renderCase(player: FighterId, locale: 'fr' | 'en' = 'fr') {
    state = fresh(player)
    input = { ...EMPTY_INPUT }
    opponentInput = { ...EMPTY_INPUT }
    language = locale
    await tick()
  }
  export async function advance(frames: number) {
    for (let frame = 0; frame < frames; frame++) step()
    await tick()
  }
  export function snapshot() {
    return { nen: state.player.nen, opponentNen: state.opponent.nen, aura: state.player.aura }
  }
</script>

<svelte:window
  onkeydown={(event) => keyboard(event, true)}
  onkeyup={(event) => keyboard(event, false)}
/>
<main>
  <div class="arena">
    <FightScene
      {state}
      stageId="heavens-arena"
      comfort={{ ...defaultFightComfort(), graphics: 'performance' }}
    />
  </div>
  <FightResources
    {state}
    {language}
    detailed
    showControls
    onControl={control}
    onAura={(active) => control('aura', active)}
    onEmperor={() => {
      state = toggleEmperorTime(state, 'player')
    }}
  />
</main>

<style>
  :global(body) {
    margin: 0;
    background: #080b12;
    color: #e8f5fc;
  }
  main {
    max-width: 1200px;
    margin: auto;
  }
  .arena {
    height: 420px;
    position: relative;
  }
</style>
