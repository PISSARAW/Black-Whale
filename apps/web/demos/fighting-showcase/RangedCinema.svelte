<script lang="ts">
  import { tick } from 'svelte'
  import FightScene from '../../src/lib/components/fighting/FightScene.svelte'
  import { createRangedCinemaFilm } from './rangedCinemaFilm'
  import { createRangedCinemaTrack } from './rangedCinemaTrack'
  import { captureRangedCinema } from './rangedCinemaScene'
  import { renderShowcaseAudio } from './audio'
  const film = createRangedCinemaFilm()
  const track = createRangedCinemaTrack(film.states)
  let index = 0
  let state = film.states[0]
  $: age = index - film.combatFrames
  $: fatality = age >= 0
  $: shot = track.shots[Math.min(index, film.combatFrames - 1)]
  $: victoryFrame = fatality ? { ...film.selection, elapsed: age / 60, active: true } : null
  const capture = captureRangedCinema(() => ({
    state,
    shot,
    wide: track.wide[Math.min(index, film.combatFrames - 1)],
    fatality,
  }))
  export const ready = () => capture.ready()
  export const count = () => film.frameCount
  export const report = () => ({
    ...film.director.report(),
    fps: 60,
    duration: film.frameCount / 60,
    combatSeconds: film.combatFrames / 60,
    combatFrames: film.combatFrames,
    frameCount: film.frameCount,
    cinematography: track.report,
    presentation: capture.audit(),
  })
  export const audio = () => renderShowcaseAudio(film.states)
  export async function seek(frame: number) {
    index = Math.max(0, Math.min(film.frameCount - 1, frame))
    state = index < film.combatFrames ? film.states[index] : film.final
    await tick()
  }
</script>

<main class:fatality>
  <FightScene
    {state}
    stageId="princes-burial-chamber"
    keepCombatantMarkers={false}
    hideSecondaryView={true}
    {victoryFrame}
    comfort={{ camera: 1, shake: 0.5, flashes: true, highContrast: false }}
  />
  <div class="vignette"></div>
  {#if !fatality}
    <div class="hud">
      <div>
        <b>LEORIO</b><span
          ><i style={`width:${(100 * state.player.health) / state.player.maxHealth}%`}></i></span
        >
      </div>
      <small>BLACK WHALE <em>CLASH</em></small>
      <div class="right">
        <b>FRANKLIN</b><span
          ><i style={`width:${(100 * state.opponent.health) / state.opponent.maxHealth}%`}
          ></i></span
        >
      </div>
    </div>
    <div class="location">CHAMBRE FUNÉRAIRE DES PRINCES</div>
  {:else if age >= 420}
    <div class="verdict">
      <strong>FATALITY</strong><b>FRANKLIN</b><span>LE SILENCE APRÈS LA RAFALE</span>
    </div>
  {/if}
  <div class="letterbox top"></div>
  <div class="letterbox bottom"></div>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #07090d;
    overflow: hidden;
  }
  :global(*) {
    box-sizing: border-box;
  }
  main {
    position: relative;
    width: 1920px;
    height: 1080px;
    color: #f4eee3;
    font-family: Arial, sans-serif;
  }
  .vignette {
    position: absolute;
    inset: 0;
    pointer-events: none;
    box-shadow: inset 0 0 75px #07090d90;
  }
  .hud {
    position: absolute;
    top: 55px;
    left: 55px;
    right: 55px;
    display: flex;
    gap: 40px;
    align-items: center;
  }
  .hud > div {
    flex: 1;
  }
  .hud b {
    display: block;
    font-size: 17px;
    letter-spacing: 4px;
    margin-bottom: 10px;
    text-shadow: 0 2px 8px #000;
  }
  .hud span {
    display: block;
    height: 5px;
    background: #ffffff25;
  }
  .hud i {
    display: block;
    height: 100%;
    background: #e1c894;
    box-shadow: 0 0 12px #d5b67a50;
  }
  .right {
    text-align: right;
  }
  .right i {
    margin-left: auto;
  }
  .hud small {
    font-size: 14px;
    letter-spacing: 5px;
  }
  .hud em {
    display: block;
    text-align: center;
    font-size: 9px;
    letter-spacing: 10px;
    font-style: normal;
    color: #d0b57d;
    margin-top: 9px;
  }
  .location {
    position: absolute;
    bottom: 57px;
    left: 55px;
    font-size: 10px;
    letter-spacing: 4px;
    color: #ddcba7;
    text-shadow: 0 2px 6px #000;
  }
  .letterbox {
    position: absolute;
    left: 0;
    right: 0;
    height: 30px;
    background: #080a0e;
    pointer-events: none;
  }
  .top {
    top: 0;
  }
  .bottom {
    bottom: 0;
  }
  .verdict {
    position: absolute;
    top: 405px;
    left: 100px;
    display: flex;
    flex-direction: column;
    gap: 22px;
    text-shadow: 0 3px 18px #000;
  }
  .verdict strong {
    color: #ee7136;
    font:
      900 79px Georgia,
      serif;
    letter-spacing: 7px;
  }
  .verdict b {
    font-size: 25px;
    letter-spacing: 10px;
    font-weight: 500;
  }
  .verdict span {
    font-size: 11px;
    letter-spacing: 4px;
    color: #d5bcb0;
  }
</style>
