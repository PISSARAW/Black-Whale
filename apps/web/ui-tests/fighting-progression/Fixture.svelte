<script lang="ts">
  import { tick, onMount } from 'svelte'
  import { get } from 'svelte/store'
  import FightPracticeHub from '$lib/components/fighting/FightPracticeHub.svelte'
  import FightLessons from '$lib/components/fighting/FightLessons.svelte'
  import FightReplays from '$lib/components/fighting/FightReplays.svelte'
  import FightStage from '$lib/components/fighting/FightStage.svelte'
  import { createFightMatchRuntime } from '$lib/fighting/fightMatchRuntime'
  import { createClashPractice } from '$lib/fighting/clashPractice'
  import { createFightLessons } from '$lib/fighting/fightLessonController'
  import { finishFight } from '$lib/fighting/combatVerdict'
  import { beginFight, nextRound } from '$lib/fighting/engine'
  import { fightReplayHash } from '$lib/fighting/fightReplayHash'
  import { packReplayInput } from '$lib/fighting/fightReplayInput'
  import {
    EMPTY_INPUT,
    type FightInput,
    type FightState,
    type MoveAction,
  } from '$lib/fighting/types'
  import type { LessonId } from '$lib/fighting/fightLessons'
  const match = createFightMatchRuntime(() => 0)
  const replays = match.replays
  onMount(() => {
    void replays.load()
  })
  const practice = createClashPractice()
  const lessons = createFightLessons()
  match.observeFrames(practice.observe)
  let state: FightState | null = null
  let input = { ...EMPTY_INPUT }
  let language: 'fr' | 'en' = 'fr'
  let paused = false
  function launch(next: FightState | null) {
    state = next
    lessons.exit()
    match.begin(state)
    input = { ...EMPTY_INPUT }
  }
  function startLesson(id: LessonId) {
    practice.exit()
    state = lessons.start(id)
    match.begin(state)
  }
  function attack(action: MoveAction | 'ranged') {
    if (state)
      match.enqueue(state, { kind: 'move', side: 'player', action, input: packReplayInput(input) })
  }
  export async function advance(count: number, partial: Partial<FightInput> = {}) {
    for (let i = 0; state && !paused && i < count; i++) {
      state = match.advance(
        state,
        { ...input, ...partial },
        { dt: 1 / 60, opponentInput: EMPTY_INPUT },
      )
      if (!replays.active) {
        lessons.observe(state)
        practice.observe(state)
      }
    }
    await tick()
  }
  export async function winMatch() {
    if (!state) return
    state = beginFight(nextRound(finishFight(state, 'player', 'knockout')))
    state = finishFight(state, 'player', 'knockout')
    practice.observe(state)
    await tick()
  }
  export async function english() {
    language = 'en'
    await tick()
  }
  export function snapshot() {
    return {
      state,
      practice: get(practice),
      library: get(replays).library.length,
      hash: state ? fightReplayHash(state) : '',
    }
  }
</script>

<main>
  {#if !replays.active}<FightPracticeHub {practice} {state} {language} onLaunch={launch} />{/if}
  <FightLessons {lessons} {language} onStart={startLesson} />
  <FightLessons {lessons} {language} onStart={startLesson} presentation="panel" />
  {#if state}<FightStage
      {state}
      {language}
      onAttack={attack}
      onThrow={() => attack('throw')}
      onFinisher={() => attack('finisher')}
      onCall={() => {}}
      onControl={(key, value) => (input = { ...input, [key]: value })}
    />{/if}
  <FightReplays
    {replays}
    {language}
    onOpen={(id) => (state = replays.open(id, state))}
    onClose={() => (state = replays.close())}
    onRestart={() => (state = replays.restart())}
  />
</main>

<style>
  :global(body) {
    margin: 0;
    background: #050c12;
    color: #dce5ea;
  }
  main {
    max-width: 1100px;
    margin: auto;
    padding: 0.5rem;
  }
</style>
