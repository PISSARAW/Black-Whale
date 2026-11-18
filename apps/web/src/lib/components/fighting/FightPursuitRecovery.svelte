<script lang="ts">
  import type { Camera, Object3D } from 'three'
  import {
    createPursuitRecoveryCues,
    PURSUIT_RECOVERY_SIDES,
  } from '$lib/fighting/pursuitRecoveryPresentation'
  import type { FightSide, FightState } from '$lib/fighting/types'

  export let state: FightState
  export let language: 'fr' | 'en'
  export let enabled: boolean

  let layer: HTMLDivElement
  const observe = createPursuitRecoveryCues()
  $: cues = observe(state)

  export function locate(camera: Camera, body: (side: FightSide) => Object3D) {
    if (!enabled || !layer) return
    for (const side of PURSUIT_RECOVERY_SIDES) {
      const root = body(side)
      const point = root.getWorldPosition(root.position.clone())
      point.y += 1.92
      point.project(camera)
      const x = Math.min(87, Math.max(13, (point.x + 1) * 50))
      const y = Math.min(90, Math.max(18, (1 - point.y) * 50))
      layer.style.setProperty(`--${side}-x`, `${x}%`)
      layer.style.setProperty(`--${side}-y`, `${y}%`)
    }
  }
</script>

<div class="recovery-cues" bind:this={layer}>
  {#if enabled}
    {#each PURSUIT_RECOVERY_SIDES as side (side)}
      {@const cue = cues[side]}
      {#if cue}
        <span
          class:opponent={side === 'opponent'}
          class:reply={cue.kind === 'reply'}
          data-recovery-cue={cue.kind}
          data-recovery-side={side}
          data-recovery-frame={cue.frame}
        >
          {cue.kind === 'ready'
            ? language === 'fr'
              ? 'Peut agir'
              : 'Can act'
            : language === 'fr'
              ? 'Riposte'
              : 'Reversal'}
        </span>
      {/if}
    {/each}
  {/if}
</div>

<style>
  .recovery-cues {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 2;
  }
  span {
    position: absolute;
    left: var(--player-x, 35%);
    top: var(--player-y, 65%);
    transform: translate(-50%, -125%);
    padding: 0.24em 0.55em;
    border: 1px solid #7ceada;
    border-radius: 0.25em;
    background: #101c23;
    color: #b5fff4;
    white-space: nowrap;
    font: 700 clamp(0.72rem, 1.65vw, 1.05rem)/1.2 var(--font-mono, monospace);
  }
  .opponent {
    left: var(--opponent-x, 65%);
    top: var(--opponent-y, 65%);
  }
  .reply {
    border-color: #ffc478;
    color: #ffe1b3;
  }
</style>
