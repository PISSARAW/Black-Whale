<script lang="ts">
  import { setContext, tick } from 'svelte'
  import { get, writable } from 'svelte/store'
  import FightCombatSchool from '$lib/components/fighting/FightCombatSchool.svelte'
  import FightTrainingOverlay from '$lib/components/fighting/FightTrainingOverlay.svelte'
  import FightMoveList from '$lib/components/fighting/FightMoveList.svelte'
  import { createCombatSchool, advanceCombatSchool } from '$lib/fighting/combatSchool'
  import { createFightMatchRuntime } from '$lib/fighting/fightMatchRuntime'
  import { createCombatRouteFight } from '$lib/fighting/combatRouteFight'
  import { combatRoute } from '$lib/fighting/combatRoutes'
  import { DUEL_COMBO_FIGHTERS } from '$lib/fighting/duelComboProfiles'
  import { FIGHT_CONTROLS_CONTEXT } from '$lib/fighting/fightControlHints'
  import { defaultBindings } from '$lib/fighting/fightInputBindings'
  import { EMPTY_INPUT, type FightState } from '$lib/fighting/types'

  const school = createCombatSchool()
  const match = createFightMatchRuntime(undefined, { record: false })
  match.observeFrames(school.observe)
  const bindings = writable(defaultBindings())
  setContext(FIGHT_CONTROLS_CONTEXT, bindings)
  let state = createCombatRouteFight(combatRoute('kurapika:confirm'))
  let language: 'fr' | 'en' = 'fr'
  function launch(next: FightState) {
    state = next
    match.begin(state)
  }
  export async function advance(frames: number, untilStep?: number) {
    for (let frame = 0; frame < frames; frame++) {
      if (
        get(school)?.failed ||
        get(school)?.complete ||
        (untilStep !== undefined && get(school)!.step >= untilStep)
      )
        break
      state = advanceCombatSchool({
        school,
        match,
        state,
        dt: 1 / 60,
        input: EMPTY_INPUT,
        opponentInput: EMPTY_INPUT,
      })
    }
    await tick()
  }
  export function snapshot() {
    return { progress: get(school), combo: state.opponent.comboHits, aura: state.player.aura }
  }
  export function fighters() {
    return DUEL_COMBO_FIGHTERS
  }
  export async function translate(next: 'fr' | 'en') {
    language = next
    await tick()
  }
  export async function remap() {
    bindings.update((keys) => ({ ...keys, playerLight: 'x', playerHeavy: 'c' }))
    await tick()
  }
</script>

<main>
  <h1>Clash · {state.player.id}</h1>
  <FightCombatSchool {school} {language} expanded onLaunch={launch} onExit={() => {}} />
  <FightTrainingOverlay {state} {language} />
  <FightMoveList fighterId={state.player.id} {language} />
</main>

<style>
  :global(body) {
    margin: 0;
    background: #081019;
    color: #dce5ea;
  }
  main {
    max-width: 900px;
    margin: auto;
    padding: 1rem;
  }
</style>
