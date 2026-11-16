<script lang="ts">
  import { tick } from 'svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import FightHud from '$lib/components/fighting/FightHud.svelte'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { makeFilm } from './film'
  import { observeFraming } from './framing'
  import { makeLongFilm, sampleLong } from './longFilm'
  import { fightFigureVisible } from '$lib/fighting/fightFigureVisibility'

  const long = new URLSearchParams(location.search).get('version') === 'long'
  const chapters = long ? makeLongFilm() : makeFilm()
  let chapterIndex = $state(0)
  let frameIndex = $state(0)
  let chapter = $derived(chapters[chapterIndex])
  let frame = $derived(
    long
      ? sampleLong(chapter as ReturnType<typeof makeLongFilm>[number], frameIndex)
      : chapter.frames[frameIndex],
  )
  let shownState = $derived('state' in frame ? frame.state : chapter.states[0])
  let caption = $derived(
    long
      ? ('direction' in frame ? frame.direction.detail?.labelFr : '') ||
          'Le combat continue — les deux combattants restent dans la vue principale'
      : 'caption' in frame
        ? frame.caption
        : '',
  )
  let speed = $derived('speed' in frame ? frame.speed : 1)
  let markers = $derived(
    (['player', 'opponent'] as const).filter((side) => !fightFigureVisible(shownState, side)),
  )
  const comfort = { ...defaultFightComfort(), camera: 1, shake: 0.35 }
  const framing = observeFraming(() => ({
    state: shownState,
    frame: frameIndex,
    chapter: chapterIndex,
  }))
  export function framingReport() {
    return framing()
  }
  export async function select(index: number) {
    chapterIndex = index
    frameIndex = 0
    await tick()
  }
  export async function seek(index: number) {
    frameIndex = index
    await tick()
  }
  export function report() {
    return {
      fps: 30,
      width: long ? 1920 : 1280,
      height: long ? 1080 : 720,
      long,
      minimumCloseupSeconds: long ? 3 : undefined,
      continuousWithinChapters: true,
      chapters: chapters.map((c) => ({
        id: c.id,
        name: c.name,
        ability: c.ability,
        note: c.note,
        frames: c.frames.length,
        duration: c.frames.length / 30,
        events: c.events,
        commands: c.commands,
        impacts: c.impacts,
        shots: 'shots' in c ? c.shots : undefined,
        startFrame: c.states[0].frame,
        startPositions: [c.states[0].player.x, c.states[0].opponent.x],
        endFrame: c.states.at(-1)!.frame,
        backwards: c.states.some((s, i) => i > 0 && s.frame < c.states[i - 1].frame),
        finalHealth: {
          player: c.states.at(-1)!.player.health,
          opponent: c.states.at(-1)!.opponent.health,
        },
      })),
    }
  }
  export function snapshot() {
    return shownState
  }
</script>

<main class:long>
  <header>
    <div class="brand">
      <span class="whale">BW</span>
      <div>BLACK WHALE <b>CLASH</b><small>DÉMONSTRATION DES CAMÉRAS DE COMBAT</small></div>
    </div>
    <div class="counter">
      <strong>{String(chapterIndex + 1).padStart(2, '0')}</strong><span>/ 40 PERSONNAGES</span>
    </div>
  </header>
  <section class="scene">
    {#key chapterIndex}
      <FightScene
        state={shownState}
        {comfort}
        language="fr"
        stageId={shownState.environment.stageId}
        viewer="player"
        cameraDirection={'direction' in frame ? frame.direction : undefined}
        presentationSeconds={'seconds' in frame ? frame.seconds : undefined}
        keepCombatantMarkers={long}
      />
    {/key}
    <FightHud state={shownState} language="fr" />
    <div class="chapter"><span>{chapter.name}</span><b>{chapter.ability}</b></div>
    {#if long && markers.length}
      <div class="tracking">
        {markers
          .map(
            (side) =>
              `${shownState[side].id.toUpperCase()} · SILHOUETTE DE SUIVI — ${shownState.catsNameConsumed === side ? 'CORPS ABSORBÉ' : 'EXPULSÉ'}`,
          )
          .join(' / ')}
      </div>
    {/if}
    <div class="continuous">
      <i></i> COMBAT CONTINU · DOUBLE VUE{#if long && speed < 0.99}
        · RALENTI ×{speed.toFixed(2).replace('.', ',')}{/if}
    </div>
  </section>
  <footer>
    <div class="caption">{caption}</div>
    <div class="note">{chapter.note}</div>
    <div class="progress">
      <i style={`width:${(100 * (frameIndex + 1)) / chapter.frames.length}%`}></i>
    </div>
  </footer>
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
    background: #080c13;
    color: #ecf3fa;
    font-family: Arial, Helvetica, sans-serif;
  }
  main {
    height: 100vh;
    display: grid;
    grid-template-rows: 76px 1fr 76px;
    background: #080c13;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 30px;
    border-bottom: 1px solid #253343;
    background: linear-gradient(100deg, #101b29, #080c13);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 13px;
    font-size: 18px;
    letter-spacing: 2px;
  }
  .brand b {
    color: #d9b674;
  }
  .brand small {
    display: block;
    font-size: 8px;
    color: #91a6b9;
    letter-spacing: 2.7px;
    margin-top: 7px;
  }
  .whale {
    border: 1px solid #9c8455;
    color: #dfc38d;
    display: grid;
    place-items: center;
    width: 43px;
    height: 43px;
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 0;
  }
  .counter {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .counter strong {
    font-size: 29px;
    color: #dfc38d;
  }
  .counter span {
    font-size: 10px;
    letter-spacing: 1.5px;
    color: #a6b9c8;
  }
  .scene {
    position: relative;
    overflow: hidden;
    min-height: 0;
  }
  .chapter {
    position: absolute;
    left: 28px;
    bottom: 33px;
    display: grid;
    gap: 6px;
    pointer-events: none;
    text-shadow: 0 2px 6px #000;
  }
  .chapter span {
    font-size: 27px;
    font-weight: 800;
    letter-spacing: 1px;
  }
  .chapter b {
    font-size: 12px;
    color: #edce92;
    font-weight: 500;
    letter-spacing: 0.6px;
  }
  .continuous {
    position: absolute;
    bottom: 16px;
    right: 24px;
    color: #aec2ce;
    font-size: 8px;
    letter-spacing: 1.2px;
    text-shadow: 0 1px 4px #000;
  }
  .continuous i {
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 100%;
    background: #62d9a8;
    margin-right: 5px;
  }
  footer {
    position: relative;
    padding: 15px 30px 12px;
    border-top: 1px solid #273343;
  }
  .caption {
    font-size: 15px;
    color: #f1e5c9;
    letter-spacing: 0.15px;
  }
  .note {
    font-size: 10px;
    color: #92a7bb;
    margin-top: 8px;
  }
  .progress {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: #1d2b3a;
  }
  .progress i {
    display: block;
    height: 100%;
    background: #cba45b;
  }
  .long {
    grid-template-rows: 114px 1fr 114px;
  }
  .long header {
    padding: 0 45px;
  }
  .long .brand {
    font-size: 27px;
    gap: 20px;
  }
  .long .brand small {
    font-size: 12px;
    margin-top: 10px;
  }
  .long .whale {
    width: 65px;
    height: 65px;
    font-size: 24px;
  }
  .long .counter strong {
    font-size: 44px;
  }
  .long .counter span {
    font-size: 15px;
  }
  .long .chapter {
    left: 42px;
    bottom: 50px;
    gap: 9px;
  }
  .long .chapter span {
    font-size: 40px;
  }
  .long .chapter b {
    font-size: 18px;
  }
  .long .continuous {
    bottom: 24px;
    right: 36px;
    font-size: 12px;
  }
  .long footer {
    padding: 23px 45px 18px;
  }
  .long .caption {
    font-size: 23px;
  }
  .long .note {
    font-size: 15px;
    margin-top: 12px;
  }
  .tracking {
    position: absolute;
    left: 42px;
    top: 144px;
    border: 1px solid #87b4d6;
    background: #0c1729dd;
    padding: 9px 14px;
    color: #c0dff4;
    font-size: 13px;
    letter-spacing: 1px;
  }
</style>
