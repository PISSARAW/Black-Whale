<script lang="ts">
  import { onDestroy } from 'svelte'
  import { Scene } from 'three'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import { createFight } from '$lib/fighting/engine'
  import { defaultAppearance } from '$lib/fighting/career/types'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { introPerformance } from '$lib/fighting/presentation/introPerformances'
  import { humanAnimationRig } from '$lib/tour/humanAnimation'
  import type { IntroFrame } from '$lib/fighting/presentation/introPlayback'
  import type { FighterId, FightSide } from '$lib/fighting/types'

  let state = createFight('hisoka', 'kurapika')
  let side: FightSide = 'player'
  let progress = 0.5
  let ready = false
  let audit: { camera: number[]; rotation: number[]; arms: number[][]; finite: boolean } | null =
    null
  const previous = Scene.prototype.onAfterRender
  Scene.prototype.onAfterRender = function (...args) {
    previous?.apply(this, args)
    if (this.userData.fightView !== 'primary') return
    const camera = args[2]
    const arms: number[][] = []
    let finite = true
    this.traverse((node) => {
      finite = finite && node.position.toArray().every(Number.isFinite)
      const rig = humanAnimationRig(node)
      if (rig) arms.push(...rig.arms.map((arm) => [arm.rotation.x, arm.rotation.y, arm.rotation.z]))
    })
    audit = {
      camera: camera.position.toArray(),
      rotation: camera.quaternion.toArray(),
      arms,
      finite,
    }
  }
  onDestroy(() => {
    Scene.prototype.onAfterRender = previous
  })
  $: frame = {
    elapsed: (side === 'player' ? 0 : 2.4) + progress * 2.4,
    duration: 6.4,
    mode: 'full',
    waiting: false,
  } satisfies IntroFrame
  $: label = introPerformance(state[side].id)?.intention
  Object.assign(window, {
    introDirectionFixture: {
      select: (options: { id: FighterId; side: FightSide; progress: number }) => {
        const before = state
        const other = options.id === 'hisoka' ? 'kurapika' : 'hisoka'
        state =
          options.side === 'player'
            ? createFight(options.id, other)
            : createFight(other, options.id)
        side = options.side
        progress = options.progress
        if (before.player.id !== state.player.id || before.opponent.id !== state.opponent.id)
          ready = false
      },
      seek: (value: number) => {
        progress = value
      },
      snapshot: () => ({ ready, audit, frame, label }),
    },
  })
</script>

<main>
  {#key `${state.player.id}:${state.opponent.id}`}
    <FightScene
      {state}
      introFrame={frame}
      appearance={defaultAppearance()}
      comfort={defaultFightComfort()}
      keepCombatantMarkers={false}
      hideSecondaryView
      onSceneReady={() => {
        ready = true
      }}
    />
  {/key}
  <div class="caption">
    <strong>{state[side].id.toUpperCase()}</strong>
    <p>{label}</p>
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #05070b;
  }
  main {
    position: relative;
    width: 100vw;
    height: 100dvh;
  }
  .caption {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 20px 5%;
    color: white;
    background: linear-gradient(transparent, #05070bf0);
    pointer-events: none;
  }
  strong {
    font: 700 24px var(--font-display, sans-serif);
  }
  p {
    font: 12px/1.4 sans-serif;
    max-width: 600px;
  }
</style>
