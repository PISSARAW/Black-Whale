<script lang="ts">
  import { tick } from 'svelte'
  import FightLessons from '$lib/components/fighting/FightLessons.svelte'
  import FightReplayReview from '$lib/components/fighting/FightReplayReview.svelte'
  import { createFightLessons } from '$lib/fighting/fightLessonController'
  import { createFightMatchRuntime } from '$lib/fighting/fightMatchRuntime'
  import { createReplayReviewActions } from '$lib/fighting/fightReplayReviewActions'
  import { performTrainingAction } from '$lib/fighting/trainingAction'
  import { tickFight } from '$lib/fighting/engine'
  import {
    EMPTY_INPUT,
    type FightState,
    type MoveAction,
    type FightInput,
  } from '$lib/fighting/types'
  import { fightReplayHash } from '$lib/fighting/fightReplayHash'
  import { coachFixtureReplay } from './scenarios'
  const lessons = createFightLessons()
  const match = createFightMatchRuntime(undefined, { record: false })
  const replays = match.replays
  let state: FightState | null = null
  let language: 'fr' | 'en' = 'fr'
  const actions = createReplayReviewActions({
    match,
    update: (value) => {
      state = value
    },
    release: () => {},
    onTakeover: () => lessons.exit(),
  })
  function start(id: Parameters<typeof lessons.start>[0]) {
    state = lessons.start(id)
    match.begin(state)
  }
  export async function loadReplay(corrupt = false) {
    const { replay } = coachFixtureReplay()
    if (corrupt) replay.checkpoints[replay.checkpoints.length - 1].hash = '00000000'
    const entry = await replays.import(JSON.stringify(replay))
    if (entry) state = replays.open(entry.id, state)
    await tick()
  }
  export async function advance(count: number, input: Partial<FightInput> = {}) {
    if (!state) return
    for (let i = 0; i < count; i++)
      state = tickFight(
        state,
        { ...EMPTY_INPUT, ...input },
        { dt: 1 / 60, ai: false, onFrame: (_before, after) => lessons.observe(after) },
      )
    await tick()
  }
  export async function move(action: MoveAction) {
    if (state) state = performTrainingAction({ state, side: 'player', action })
    await tick()
  }
  export async function english() {
    language = 'en'
    await tick()
  }
  export function snapshot() {
    return {
      lesson: $lessons,
      practice: $replays.practice,
      playback: $replays.playback,
      state: state
        ? {
            frame: state.frame,
            player: state.player,
            opponent: state.opponent,
            hash: fightReplayHash(state),
          }
        : null,
    }
  }
</script>

<main>
  <h1>Clash · {language === 'fr' ? 'Apprentissage et relecture' : 'Learning and review'}</h1>
  <FightLessons {lessons} {language} onStart={start} onExit={() => lessons.exit()} />
  <FightLessons
    {lessons}
    {language}
    onStart={start}
    onExit={() => lessons.exit()}
    presentation="panel"
  />
  <button type="button" onclick={() => loadReplay()}
    >{language === 'fr' ? 'Charger un extrait vérifié' : 'Load a verified clip'}</button
  >
  {#if $replays.playback || $replays.practice}<FightReplayReview
      {replays}
      {actions}
      {language}
    />{/if}
</main>

<style>
  :global(body) {
    margin: 0;
    background: #07111b;
    color: #e7eef2;
    font:
      14px/1.5 system-ui,
      sans-serif;
  }
  main {
    max-width: 1050px;
    margin: auto;
    padding: 0.8rem;
  }
  button {
    padding: 0.6rem;
    background: #14232e;
    color: #e7eef2;
    border: 1px solid #52616a;
    cursor: pointer;
  }
  h1 {
    font-size: 1.4rem;
  }
</style>
