<script lang="ts">
  import { fighterDefinition } from '$lib/fighting/roster'
  import { displayPose } from '$lib/fighting/engine'
  import type { ArcadeFighter } from '$lib/fighting/types'

  export let fighter: ArcadeFighter
  export let preview = false

  $: definition = fighterDefinition(fighter.id)
  $: pose = preview ? 'idle' : displayPose(fighter)
</script>

<div
  class="avatar"
  class:preview
  class:mirrored={fighter.facing === -1}
  class:airborne={fighter.y > 0}
  data-character={fighter.id}
  data-pose={pose}
  style={`--fighter:${definition.colour};--fighter-accent:${definition.accent}`}
  aria-hidden="true"
>
  <span class="aura"></span>
  <span class="coat"></span>
  <span class="leg leg-back"></span>
  <span class="leg leg-front"></span>
  <span class="torso"></span>
  <span class="arm arm-back"></span>
  <span class="arm arm-front"></span>
  <span class="head"><span class="face-mark"></span></span>
  <span class="effect"></span>
</div>

<style>
  .avatar {
    position: relative;
    width: 88px;
    height: 180px;
    filter: drop-shadow(0 13px 8px rgb(0 0 0 / 45%));
    transform-origin: 50% 100%;
    transition: filter 100ms;
  }
  .avatar.mirrored {
    transform: scaleX(-1);
  }
  .preview {
    transform: scale(0.78);
  }
  .preview.mirrored {
    transform: scale(-0.78, 0.78);
  }
  .avatar > span {
    position: absolute;
    display: block;
  }
  .head {
    top: 7px;
    left: 31px;
    z-index: 4;
    width: 36px;
    height: 42px;
    border: 2px solid rgb(255 255 255 / 25%);
    border-radius: 46% 48% 44% 42%;
    background: color-mix(in srgb, var(--fighter), #d8b69a 42%);
    box-shadow: inset -8px -5px 0 rgb(0 0 0 / 18%);
  }
  .face-mark {
    top: 12px;
    right: 5px;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--fighter-accent);
    box-shadow: 8px 0 var(--fighter-accent);
  }
  .torso {
    top: 46px;
    left: 24px;
    z-index: 3;
    width: 47px;
    height: 70px;
    border: 2px solid rgb(255 255 255 / 20%);
    border-radius: 18px 19px 12px 13px;
    background: linear-gradient(110deg, color-mix(in srgb, var(--fighter), #fff 12%), var(--fighter));
    box-shadow: inset -10px 0 rgb(0 0 0 / 22%);
  }
  .arm,
  .leg {
    z-index: 2;
    width: 18px;
    border: 2px solid rgb(255 255 255 / 18%);
    border-radius: 10px;
    background: var(--fighter);
    transform-origin: 50% 8px;
  }
  .arm {
    top: 54px;
    height: 65px;
  }
  .arm-back {
    left: 17px;
    transform: rotate(18deg);
    filter: brightness(0.72);
  }
  .arm-front {
    left: 63px;
    transform: rotate(-24deg);
  }
  .leg {
    top: 108px;
    height: 70px;
    border-radius: 8px 8px 5px 5px;
  }
  .leg-back {
    left: 31px;
    transform: rotate(9deg);
    filter: brightness(0.72);
  }
  .leg-front {
    left: 51px;
    transform: rotate(-7deg);
  }
  .coat {
    display: none !important;
    top: 48px;
    left: 13px;
    z-index: 1;
    width: 70px;
    height: 106px;
    border-radius: 18px 18px 8px 8px;
    background: linear-gradient(90deg, var(--fighter), rgb(8 11 15 / 92%));
    clip-path: polygon(10% 0, 87% 0, 100% 100%, 55% 82%, 8% 100%, 22% 34%);
  }
  [data-character='chrollo'] .coat,
  [data-character='tserriednich'] .coat {
    display: block !important;
  }
  [data-character='benjamin'] .torso {
    left: 17px;
    width: 62px;
  }
  [data-character='benjamin'] .arm-front {
    left: 71px;
    width: 22px;
  }
  [data-character='hisoka'] .face-mark {
    width: 6px;
    height: 9px;
    border-radius: 0;
    transform: rotate(45deg);
  }
  [data-character='morena'] .head {
    box-shadow: -12px -3px 0 -5px var(--fighter), 12px -3px 0 -5px var(--fighter), inset -8px -5px 0 rgb(0 0 0 / 18%);
  }
  .aura {
    inset: 8px 4px 0;
    z-index: 0;
    border-radius: 48%;
    background: radial-gradient(ellipse at center, transparent 52%, color-mix(in srgb, var(--fighter-accent), transparent 45%) 70%, transparent 74%);
    opacity: 0;
    filter: blur(4px);
  }
  .effect {
    top: 54px;
    left: 70px;
    z-index: 6;
    width: 70px;
    height: 70px;
    border: 4px solid var(--fighter-accent);
    border-radius: 50%;
    opacity: 0;
    box-shadow: 0 0 24px var(--fighter-accent), inset 0 0 18px var(--fighter-accent);
  }
  [data-pose='walk'] .leg-front { animation: step-front 260ms infinite alternate; }
  [data-pose='walk'] .leg-back { animation: step-back 260ms infinite alternate; }
  [data-pose='guard'] .arm-front { transform: translate(-17px, -15px) rotate(-118deg); }
  [data-pose='guard'] .arm-back { transform: translate(20px, -10px) rotate(75deg); }
  [data-pose='light'] .arm-front { animation: jab 190ms ease-out; }
  [data-pose='heavy'] .arm-front { animation: heavy 360ms ease-out; }
  [data-pose='heavy'] .torso { transform: rotate(-7deg); }
  [data-pose='special'] .aura { animation: flare 600ms ease-out; }
  [data-pose='special'] .effect { animation: special 600ms ease-out; }
  [data-pose='hit'] { animation: hit 170ms ease-out; filter: brightness(2) drop-shadow(0 13px 8px rgb(0 0 0 / 45%)); }
  [data-pose='ko'] { transform: rotate(-76deg) translate(-45px, 12px); }
  [data-pose='ko'].mirrored { transform: scaleX(-1) rotate(-76deg) translate(-45px, 12px); }
  @keyframes jab { 50% { transform: translate(37px, -5px) rotate(-84deg) scaleY(1.15); } }
  @keyframes heavy { 45% { transform: translate(30px, -12px) rotate(-105deg) scaleY(1.25); } }
  @keyframes flare { 35% { opacity: 1; transform: scale(1.18); } }
  @keyframes special { 40% { opacity: 1; transform: translateX(40px) scale(1.2); } 100% { opacity: 0; transform: translateX(110px) scale(0.3); } }
  @keyframes hit { 50% { transform: translateX(-8px) rotate(-6deg); } }
  @keyframes step-front { to { transform: translateX(8px) rotate(-19deg); } }
  @keyframes step-back { to { transform: translateX(-7px) rotate(18deg); } }
  @media (max-width: 700px) {
    .avatar:not(.preview) { transform: scale(0.72); }
    .avatar:not(.preview).mirrored { transform: scale(-0.72, 0.72); }
    [data-pose='ko']:not(.preview) { transform: scale(0.72) rotate(-76deg) translate(-45px, 12px); }
    [data-pose='ko'].mirrored:not(.preview) { transform: scale(-0.72, 0.72) rotate(-76deg) translate(-45px, 12px); }
  }
</style>
