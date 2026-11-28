<script lang="ts">
  import { onMount, tick } from 'svelte'
  import FightScene from '../../src/lib/components/fighting/FightScene.svelte'
  import {
    proof, melodyCut, splitDuration, splitWarningAudioStates, splitWarningFrame,
    warningAudioStates, warningDuration, warningFrame, warningStage,
  } from './warningCut'
  import { renderShowcaseAudio } from '../fighting-showcase/audio'
  let seconds = 0
  let ready = false
  let failed = false
  const view = new URLSearchParams(window.location.search).get('split')
  const split = view === 'theta' || view === 'prince'
  const duration = split ? splitDuration : warningDuration
  $: picture = split ? splitWarningFrame(seconds, view === 'theta' ? 'player' : 'opponent') : warningFrame(seconds)
  $: if (picture.settle && !picture.reveal) line = ''
  else line = picture.line ?? ''
  let line = ''

  onMount(() => {
    Object.assign(window, {
      warningFilm: {
        ready: () => ready || failed,
        info: () => ({ ...proof, duration, melodyCut, failed }),
        seek: async (value: number) => {
          seconds = Math.max(0, Math.min(duration - 1 / 60, value))
          await tick()
        },
        audio: () => renderShowcaseAudio(split ? splitWarningAudioStates() : warningAudioStates()),
      },
    })
  })
</script>

<main class:perception={picture.perception} class:split>
  <FightScene
    state={picture.state}
    stageId={warningStage}
    viewer={picture.viewer}
    language="en"
    hideSecondaryView
    keepCombatantMarkers={false}
    cameraFrame={picture.camera}
    presentationSeconds={seconds}
    onSceneReady={() => (ready = true)}
    onSceneFailed={() => (failed = true)}
  />
  {#if picture.shotFlash}<div class="light"></div>{/if}
  {#if picture.kicker}
    <div class="caption">
      <small>{picture.kicker}</small>
      {#if line}<div>{line}</div>{/if}
    </div>
  {/if}
</main>

<style>
  :global(body) { margin: 0; background: #090a0b }
  main { width: 100vw; height: 100vh; overflow: hidden; position: relative }
  .perception :global(canvas) { filter: saturate(.66) contrast(1.07) }
  .split .caption { top: 8%; bottom: auto; left: 7%; font-size: 34px }
  .split small { margin-bottom: 6px; font-size: 27px }
  .caption {
    position: absolute; bottom: 22%; left: 8%; width: 76%;
    color: #fff5de; font: italic 62px/1.08 Georgia, serif;
    text-shadow: 0 3px 8px #080807, 0 0 28px #080807;
  }
  small {
    display: block; margin-bottom: 16px; color: #ebcf9e;
    font: 700 28px Arial, sans-serif; letter-spacing: .16em;
  }
  .light { position: absolute; inset: 0; background: #fcdfad35; pointer-events: none }
</style>
