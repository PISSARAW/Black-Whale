<script lang="ts">
  import { tick } from 'svelte'
  import FightScene from '../../src/lib/components/fighting/FightScene.svelte'
  import { createLastContactFilm } from './lastContactFilm'
  import { createLastContactTrack } from './lastContactTrack'
  import { captureLastContact } from './lastContactScene'
  import { createLastContactEmotions } from './lastContactEmotions'
  import { renderShowcaseAudio } from './audio'
  const film = createLastContactFilm()
  const track = createLastContactTrack(film.states)
  const emotions = createLastContactEmotions(film.states)
  let portraitSide: 'player' | 'opponent' | null = null
  let index = 0
  let state = film.states[0]
  $: frame = film.director.frames[Math.min(index, film.combatFrames - 1)]
  $: final = state.phase === 'finished'
  $: ending = index >= film.koFrame + 48
  $: shot = portraitSide
    ? { kind: 'face' as const, side: portraitSide, age: 8 }
    : track.shots[Math.min(index, film.combatFrames - 1)]
  const capture = captureLastContact(() => ({
    state,
    shot,
    faces: emotions.frames[Math.min(index, film.combatFrames - 1)],
    wide: track.wide[Math.min(index, film.combatFrames - 1)],
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
    expressions: emotions.report,
    presentation: capture.audit(),
  })
  export const audio = () => renderShowcaseAudio(film.states)
  export async function portrait(side: 'player' | 'opponent') {
    portraitSide = side
    await tick()
  }
  export async function seek(frame: number) {
    portraitSide = null
    index = Math.max(0, Math.min(film.frameCount - 1, frame))
    state = index < film.combatFrames ? film.states[index] : film.final
    await tick()
  }
</script>

<main>
  <FightScene
    {state}
    stageId="heavens-arena"
    keepCombatantMarkers={false}
    hideSecondaryView={true}
    comfort={{ camera: 1, shake: 0.5, flashes: true, highContrast: false }}
  />
  <div class="vignette"></div>
  {#if !final}
    <div class="hud">
      <div>
        <b>HISOKA</b><span
          ><i style={`width:${(100 * state.player.health) / state.player.maxHealth}%`}></i></span
        >
      </div>
      <small>BLACK WHALE <em>CLASH</em></small>
      <div class="right">
        <b>CHROLLO</b><span
          ><i style={`width:${(100 * state.opponent.health) / state.opponent.maxHealth}%`}
          ></i></span
        >
      </div>
    </div>
  {/if}
  <div class="location">TOUR CÉLESTE <span>LE DERNIER CONTACT</span></div>
  <div class="beat"><b>{frame.title}</b><span>{frame.subtitle}</span></div>
  {#if state.player.nen.on}<div class="variant">ON · VARIANTE CLASH / THE LAST MISSION</div>{/if}
  {#if ending}<div class="winner">CHROLLO <span>VICTOIRE</span></div>{/if}
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
  .location span {
    margin-left: 25px;
    color: #aaa;
  }
  .beat {
    position: absolute;
    bottom: 78px;
    left: 55px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    text-shadow: 0 2px 8px #000;
  }
  .beat b {
    font-size: 23px;
    font-weight: 500;
    letter-spacing: 1px;
  }
  .beat span {
    font-size: 15px;
    color: #d4c9b6;
  }
  .variant {
    position: absolute;
    right: 55px;
    bottom: 55px;
    font-size: 12px;
    letter-spacing: 2px;
    color: #da8b71;
  }
  .winner {
    position: absolute;
    right: 80px;
    top: 300px;
    font-size: 44px;
    letter-spacing: 8px;
  }
  .winner span {
    display: block;
    font-size: 14px;
    letter-spacing: 6px;
    margin-top: 20px;
    color: #d0b57d;
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
</style>
