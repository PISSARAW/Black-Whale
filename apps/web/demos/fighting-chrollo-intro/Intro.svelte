<script lang="ts">
  import { tick } from 'svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import FightLiveScene from '$lib/components/fighting/FightLiveScene.svelte'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { nenStatus } from '$lib/fighting/nen'
  import { fighterAuraHex } from '$lib/fighting/auraColours'
  import type { HeroConfig } from './hero'
  import { buildTimeline, type Shot } from './timeline'
  import { TECHNIQUES, techniqueOf } from './techniques'
  import IntroOverlay from './IntroOverlay.svelte'
  import { installPortraitCamera, portraitAudit } from './portraitCamera'
  import { filmAt } from './victoryFilm'
  import { companionAt, companionAudit, installCompanion } from './companion'
  import { bodyVoice, jupiterBeat } from './bodyMusic'

  let { hero }: { hero: HeroConfig } = $props()
  const segments = hero.build()
  const timeline = buildTimeline(segments)
  const comfort = { ...defaultFightComfort(), graphics: 'quality' as const, camera: 1 as const }

  /** Techniques lit so far: everything the engine reported on the hero up to that frame. */
  const lit: number[][] = []
  let carried = 0
  for (const segment of segments) {
    const masks: number[] = []
    let mask = carried
    for (const state of segment.states) {
      for (const status of nenStatus(state.player)) {
        const i = TECHNIQUES.indexOf(techniqueOf(status) as (typeof TECHNIQUES)[number])
        if (i >= 0) mask |= 1 << i
      }
      if (state.player.attack?.kind === 'special' || state.parallelFuture?.owner === 'player')
        mask |= 1 << TECHNIQUES.indexOf('HATSU')
      if (state.player.attack?.variant === 'throw') mask |= 1 << TECHNIQUES.indexOf('THROW')
      if (state.opponent.comboHits >= 3) mask |= 1 << TECHNIQUES.indexOf('COMBO')
      masks.push(mask)
    }
    carried = mask
    lit.push(masks)
  }

  let index = $state(0)
  let shot: Shot = $derived(timeline.shots[index])
  let segmentIndex = $derived(shot.kind === 'clip' ? shot.clip : -1)
  let segment = $derived(segmentIndex >= 0 ? segments[segmentIndex] : undefined)
  /** The renderer feeds every simulation frame between two captures, as the live game does. */
  let simOverride = $state<number | null>(null)
  let state = $derived(
    segment && shot.kind === 'clip'
      ? segment.states[Math.floor(simOverride ?? shot.sim)]
      : undefined,
  )
  /** The hero's own victory cinematic, after a real KO, at the time the shot's keys give. */
  let victoryFrame = $derived(
    segment && shot.kind === 'clip' ? filmAt(segment, simOverride ?? shot.sim) : null,
  )
  /** A twin fight plays in the lower half, frame for frame with the main one. */
  let twinState = $derived(
    segment?.twin && shot.kind === 'clip'
      ? segment.twin.states[Math.min(segment.twin.states.length - 1, Math.floor(simOverride ?? shot.sim))]
      : undefined,
  )
  let twinFilm = $derived(
    segment?.twin && shot.kind === 'clip' ? filmAt(segment.twin, simOverride ?? shot.sim) : null,
  )
  /** The fighters' own entrance animations, on a shot held in the ready phase. */
  let introFrame = $derived(
    segment?.entrance !== undefined && shot.kind === 'clip'
      ? {
          elapsed: Math.min(6.39, segment.entrance + (simOverride ?? shot.sim) / 60),
          duration: 6.4,
          mode: 'full' as const,
          waiting: false,
        }
      : null,
  )
  let mask = $derived(
    shot.kind === 'clip'
      ? lit[shot.clip][Math.floor(shot.sim)]
      : shot.kind === 'outro'
        ? carried
        : 0,
  )

  /** The closing shot pushes in on the hero. */
  let push = $derived(
    // A creature towering over the hero needs the whole frame: no push-in on it.
    shot.kind === 'clip' && shot.clip === segments.length - 1 && !segments[shot.clip].companion
      ? 1 + 0.75 * (1 - Math.pow(1 - Math.min(1, shot.local / (shot.length * 0.45)), 3))
      : 1,
  )

  /** Videos with one hero per scene film whoever the current shot is about. */
  const filmed = () => segment?.hero ?? hero.id
  const Overlay = hero.overlay ?? IntroOverlay
  installPortraitCamera(filmed, () => (shot.kind === 'clip' ? shot.portrait : null))
  installCompanion(hero.id, () =>
    segment && shot.kind === 'clip' ? companionAt(segment, simOverride ?? shot.sim) : null,
  )

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
      portrait: portraitAudit(),
      companion: companionAudit(),
      clock: presentationClock(timeline.shots),
      sims: timeline.shots.map((s) => (s.kind === 'clip' ? s.sim : null)),
      body: timeline.shots.map((s) =>
        s.kind === 'clip' ? bodyVoice(segments[s.clip].states[Math.floor(s.sim)]) : null,
      ),
      jupiter: timeline.shots.map((s) =>
        s.kind === 'clip' ? jupiterBeat(segments[s.clip].states[Math.floor(s.sim)]) : null,
      ),
      cuts: timeline.shots.flatMap((s, i) => (s.kind === 'clip' && s.local === 0 ? [i] : [])),
      lit: TECHNIQUES.filter((_, i) => carried & (1 << i)),
      missing: TECHNIQUES.filter((_, i) => !(carried & (1 << i))),
      failures: segments.filter((s) => s.error).map((s) => `${s.id}: ${s.error}`),
      clips: segments.map((s) => ({
        id: s.id,
        stage: s.stage,
        opponent: s.opponent,
        frames: s.states.length,
        beats: s.beats.map((b) => b.word),
        impacts: s.impacts.length,
        observed: s.observed,
        events: s.events,
        error: s.error,
      })),
    }
  }
</script>

{#snippet view(
  shown: NonNullable<typeof state>,
  stageId: NonNullable<typeof segment>['stage'],
  film: typeof victoryFrame,
)}
  <FightScene
    state={shown}
    {comfort}
    language="en"
    {stageId}
    viewer="player"
    keepCombatantMarkers={false}
    hideSecondaryView
    victoryFrame={film}
    {introFrame}
  />
{/snippet}

<main style={`--aura:#${fighterAuraHex(filmed()).toString(16).padStart(6, '0')}`}>
  {#if segment && state && shot.kind === 'clip'}
    <div
      class="camera"
      style={`transform: translate(${shot.fx.shakeX}px, ${shot.fx.shakeY}px) rotate(${shot.fx.tilt}deg) scale(${shot.fx.zoom * push}); transform-origin: ${push > 1 ? '40% 50%' : '50% 58%'}; filter: contrast(${1.1 + shot.fx.split * 0.1}) saturate(${1.2 + shot.fx.split * 0.25});`}
    >
      {#key segmentIndex}
        {#if segment.twin && twinState}
          <div class="half top">{@render view(state, segment.stage, victoryFrame)}</div>
          <div class="half bottom">
            {@render view(twinState, segment.twin.stage, twinFilm)}
          </div>
        {:else if segment.live}
          <FightLiveScene {state} {comfort} language="en" stageId={segment.stage} viewer="player" />
        {:else}
          {@render view(state, segment.stage, victoryFrame)}
        {/if}
      {/key}
    </div>
  {/if}
  <Overlay {shot} {mask} {hero} {segment} />
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
  .half {
    position: absolute;
    left: 0;
    right: 0;
    height: 50%;
    overflow: hidden;
  }
  .half.top {
    top: 0;
  }
  .half.bottom {
    bottom: 0;
    border-top: 6px solid #d9b674;
  }
  .camera :global(.live-scene) {
    position: absolute;
    inset: 0;
  }
  .camera :global(.fight-scene) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
</style>
