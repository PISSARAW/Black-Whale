<script lang="ts">
  import { tick } from 'svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import { renderShowcaseAudio } from '../../demos/fighting-showcase/audio'
  import { buildTikTok } from './tiktok'

  const edit = buildTikTok()
  let index = $state(0)
  let shot = $derived(edit.frames[index])
  let presentation = $derived({ ...shot.state, mode: 'versus-local' as const })
  let pulse = $derived(Math.max(0, 1 - shot.impactAge / 13))
  let gap = $derived(Math.abs(shot.state.player.x - shot.state.opponent.x))
  let zoom = $derived(
    1.035 + Math.max(0, 1 - gap / 22) * (shot.section === 3 ? 0.23 : 0.12) + pulse * 0.1,
  )
  const comfort = {
    graphics: 'quality' as const,
    camera: 1 as const,
    shake: 0.3 as const,
    flashes: true,
    highContrast: false,
  }

  export async function seek(frame: number) {
    index = frame
    await tick()
  }
  export function report() {
    return {
      frames: edit.frames.length,
      cuts: edit.cuts,
      cues: edit.cues,
      fps: 60,
      bpm: 154,
      comboHits: edit.comboHits,
      signatureFrames: edit.signatureFrames,
    }
  }
  export const audio = () => renderShowcaseAudio(edit.frames.map(({ state }) => state))
</script>

<main>
  <div
    class="camera"
    style:transform={`translateX(${Math.sin(shot.impactAge * 2) * pulse * 6}px) scale(${zoom})`}
  >
    <FightScene
      state={presentation}
      stageId="royal-salon"
      viewer={shot.section === 1 ? 'opponent' : 'player'}
      {comfort}
      hideSecondaryView
      keepCombatantMarkers={false}
      presentationSeconds={shot.age / 60}
    />
  </div>
  <div class="shade"></div>
  <div class="brand">BLACK WHALE <b>CLASH</b></div>
  {#if index < 54}
    <div class="hook"><strong>HISOKA</strong><small>CONTRE MACHI</small></div>
  {/if}
  <div class="caption" class:final={shot.final}>
    {#if shot.state.impact && shot.state.impact.comboHits > 1 && shot.impactAge < 22}
      <b>{shot.state.impact.comboHits} COUPS</b>
    {/if}
    <strong>{shot.title}</strong>
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #09060e;
    overflow: hidden;
  }
  main {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    color: #fff8f4;
    font-family: system-ui;
  }
  .camera {
    position: absolute;
    inset: 0;
    transform-origin: 50% 56%;
    filter: contrast(1.12) saturate(1.16);
  }
  .shade {
    position: absolute;
    inset: 0;
    background: linear-gradient(#130723de, transparent 25%, transparent 68%, #12071fe8);
    pointer-events: none;
  }
  .brand {
    position: absolute;
    top: 10%;
    left: 9%;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 0.25em;
  }
  b {
    color: #ff8fcb;
  }
  .hook {
    position: absolute;
    left: 8%;
    top: 16%;
    display: grid;
  }
  .hook strong {
    font: italic 1000 clamp(70px, 17vw, 160px)/0.86 system-ui;
    text-shadow: 0.045em 0.035em #831848;
    letter-spacing: -0.08em;
  }
  .hook small {
    margin-top: 12px;
    letter-spacing: 0.25em;
    font-weight: 850;
  }
  .caption {
    position: absolute;
    left: 9%;
    right: 18%;
    bottom: 17%;
    display: grid;
    gap: 6px;
    text-transform: uppercase;
    filter: drop-shadow(0 3px 5px #1b081b);
  }
  .caption b {
    font-size: clamp(16px, 5vw, 40px);
    font-weight: 950;
    font-style: italic;
  }
  .caption strong {
    font-size: clamp(24px, 7vw, 58px);
    line-height: 1;
    font-weight: 950;
    font-style: italic;
    border-left: 5px solid #ff66b6;
    padding-left: 0.35em;
  }
  .caption.final strong {
    color: #ffd1e9;
    text-shadow: 2px 2px #801c4f;
  }
</style>
