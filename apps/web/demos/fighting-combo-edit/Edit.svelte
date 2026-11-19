<script lang="ts">
  import { tick } from 'svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { fighterAuraHex } from '$lib/fighting/auraColours'
  import type { FightStageId } from '$lib/fighting/stages'
  import { jCombo, type ComboClip } from './jCombo'
  import { lineup } from './lineup'
  import { buildTimeline, type Shot } from './timeline'
  import Overlay from './Overlay.svelte'

  const STAGES: FightStageId[] = [
    'heavens-arena',
    'banquet-hall',
    'vip-casino',
    'observation-deck',
    'supreme-court',
    'whale-hold',
    'screening-room',
    'princes-burial-chamber',
    'heilly-hideout',
  ]
  const only = new URLSearchParams(location.search).get('only')?.split(',')
  const clips: ComboClip[] = []
  const failures: string[] = []
  for (const { id, ending } of lineup(only)) {
    try {
      clips.push(jCombo(id, ending))
    } catch (error) {
      failures.push(`${id} (${ending}): ${(error as Error).message}`)
    }
  }
  const timeline = buildTimeline(clips)
  const comfort = { ...defaultFightComfort(), graphics: 'quality' as const, camera: 1 as const }

  let index = $state(0)
  let shot: Shot = $derived(timeline.shots[index])
  let clipIndex = $derived(shot.kind === 'clip' ? shot.clip : -1)
  let clip = $derived(clipIndex >= 0 ? clips[clipIndex] : undefined)
  /** The renderer feeds every simulation frame between two captures, as the live game does. */
  let simOverride = $state<number | null>(null)
  let state = $derived(
    clip && shot.kind === 'clip' ? clip.states[Math.floor(simOverride ?? shot.sim)] : undefined,
  )
  let aura = $derived(clip ? `#${fighterAuraHex(clip.id).toString(16).padStart(6, '0')}` : '#d9b674')

  /** Presentation clock per output frame (ms): exactly the simulated time it shows. */
  function presentationClock(shots: Shot[]) {
    return shots.map((s, i) => {
      const prev = shots[i - 1]
      if (s.kind !== 'clip' || !prev || prev.kind !== 'clip' || prev.clip !== s.clip) return 33
      return Math.min(120, Math.max(1, ((s.sim - prev.sim) * 1000) / 60))
    })
  }

  export async function seekSim(frame: number, sim: number) {
    index = frame
    simOverride = sim
    await tick()
  }
  export async function seek(frame: number) {
    simOverride = null
    index = frame
    await tick()
  }
  export function report() {
    return {
      fps: timeline.fps,
      bpm: timeline.bpm,
      beat: timeline.beat,
      frames: timeline.shots.length,
      duration: timeline.shots.length / timeline.fps,
      cues: timeline.cues,
      failures,
      clock: presentationClock(timeline.shots),
      sims: timeline.shots.map((s) => (s.kind === 'clip' ? s.sim : null)),
      cuts: timeline.shots.flatMap((s, i) => (s.kind === 'clip' && s.local === 0 ? [i] : [])),
      clips: clips.map((c, i) => ({
        id: c.id,
        name: c.name,
        ending: c.ending,
        finish: c.finish,
        signature: c.signature,
        koFrames: c.koFrames,
        ryuFrames: c.ryuFrames,
        presses: c.presses.map((p) => p.at),
        damage: c.damage,
        hits: c.hits,
        impacts: c.impacts.length,
        simFrames: c.states.length,
        stage: STAGES[i % STAGES.length],
      })),
    }
  }
</script>

<main style={`--aura:${aura}`}>
  {#if clip && state && shot.kind === 'clip'}
    <div
      class="camera"
      style={`transform: translate(${shot.fx.shakeX}px, ${shot.fx.shakeY}px) rotate(${shot.fx.tilt}deg) scale(${shot.fx.zoom}); filter: contrast(${1.1 + shot.fx.split * 0.1}) saturate(${1.2 + shot.fx.split * 0.25}) brightness(${1 - shot.fx.dark * 0.5});`}
    >
      {#key clipIndex}
        <FightScene
          {state}
          {comfort}
          language="fr"
          stageId={STAGES[clipIndex % STAGES.length]}
          viewer="player"
          keepCombatantMarkers={false}
          hideSecondaryView
        />
      {/key}
    </div>
  {/if}
  <Overlay {shot} {clip} total={clips.length} />
</main>

<style>
  :global(*) {
    box-sizing: border-box;
  }
  :global(html),
  :global(body) {
    margin: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #05070b;
  }
  main {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: #05070b;
  }
  .camera {
    position: absolute;
    inset: -3%;
    transform-origin: 50% 58%;
  }
  .camera :global(.fight-scene) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
</style>
