<script lang="ts">
  import { tick } from 'svelte'
  import { get } from 'svelte/store'
  import FightCombatSchool from '$lib/components/fighting/FightCombatSchool.svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import FightKameoBadge from '$lib/components/fighting/FightKameoBadge.svelte'
  import FightKameoCall from '$lib/components/fighting/FightKameoCall.svelte'
  import { createCombatSchool, advanceCombatSchool } from '$lib/fighting/combatSchool'
  import { createFightMatchRuntime } from '$lib/fighting/fightMatchRuntime'
  import { EMPTY_INPUT, type FightState } from '$lib/fighting/types'
  import { KAMEO_COMBO_LESSONS } from '$lib/fighting/kameos/comboLessons'
  import { runKameoComboScenario } from '$lib/fighting/kameos/comboScenarios'
  const school = createCombatSchool()
  const match = createFightMatchRuntime(undefined, { record: false })
  match.observeFrames(school.observe)
  let state: FightState = school.start('hisoka:kameo-luzurus', true)
  match.begin(state)
  let language: 'fr' | 'en' = 'fr'
  let heldInput = { ...EMPTY_INPUT }
  function launch(next: FightState) {
    state = next
    match.begin(state)
  }
  export async function advance(frames: number, mirrored = false) {
    if (mirrored && state.frame === 0) {
      state = {
        ...state,
        player: { ...state.player, x: 100 - state.player.x, facing: -1 },
        opponent: { ...state.opponent, x: 100 - state.opponent.x, facing: 1 },
      }
      match.begin(state)
    }
    for (let f = 0; f < frames && !get(school)?.complete && !get(school)?.failed; f++)
      state = advanceCombatSchool({
        school,
        match,
        state,
        dt: 1 / 60,
        input: heldInput,
        opponentInput: EMPTY_INPUT,
      })
    await tick()
  }
  export function catalogue() {
    return KAMEO_COMBO_LESSONS.map((route) => ({
      id: route.id,
      fighter: route.fighter,
      title: route.title,
      hits: route.moves.reduce((sum, _, step) => sum + (route.hits?.[step] ?? 1), 0),
    }))
  }
  export function measure(fighter: string) {
    return KAMEO_COMBO_LESSONS.filter((route) => route.fighter === fighter).flatMap((route) =>
      [false, true].flatMap((corner) =>
        [0, 10, 30, 60].flatMap((callDelay) =>
          (['guard', 'jab'] as const).map((response) => {
            const { state: _final, ...result } = runKameoComboScenario(route, {
              corner,
              callDelay,
              response,
            })
            return result
          }),
        ),
      ),
    )
  }
  export function finishWindows(fighter: string) {
    const route = KAMEO_COMBO_LESSONS.find(
      (route) => route.fighter === fighter && route.kameo!.id === 'luzurus',
    )!
    return [false, true].flatMap((corner) =>
      [5, 10, 20, 90].flatMap((finishDelay) =>
        (['guard', 'jab'] as const).map((response) => {
          const { state: _final, ...result } = runKameoComboScenario(route, {
            corner,
            finishDelay,
            response,
          })
          return result
        }),
      ),
    )
  }
  export function snapshot() {
    return { state, progress: get(school) }
  }
  export async function strike() {
    match.enqueue(state, { kind: 'move', side: 'player', action: 'light', input: 0 })
    await tick()
  }
  export async function english() {
    language = 'en'
    await tick()
  }
</script>

<main>
  <div class="arena"><FightScene {state} /></div>
  <FightKameoBadge {state} side="player" {language} />
  <FightKameoCall
    {state}
    {language}
    onControl={(key, held) => {
      heldInput = { ...heldInput, [key]: held }
    }}
  />
  <FightCombatSchool {school} {language} expanded={true} onLaunch={launch} onExit={() => {}} />
</main>

<style>
  :global(body) {
    margin: 0;
    background: #050c12;
    color: #e3edf2;
  }
  main {
    max-width: 1100px;
    margin: auto;
    padding: 1rem;
  }
  .arena {
    height: 450px;
    position: relative;
    overflow: hidden;
  }
  @media (max-width: 600px) {
    .arena {
      height: 380px;
    }
  }
</style>
