<script lang="ts">
  import { tick } from 'svelte'
  import * as THREE from 'three'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import FightTrainingOverlay from '$lib/components/fighting/FightTrainingOverlay.svelte'
  import { createFightState } from '$lib/fighting/fightState'
  import { moveForSlot } from '$lib/fighting/movesets'
  import { fightCollisionBoxes } from '$lib/fighting/fightCollisionBoxes'
  import { fightWorldX, fightWorldY } from '$lib/fighting/fightCoordinates'
  import type { FighterId, MoveSlot } from '$lib/fighting/types'
  let state = {
    ...createFightState('kurapika', 'hisoka', { mode: 'training' }),
    phase: 'fighting' as const,
  }
  let renders = 0
  let latest: { renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.Camera } | null =
    null
  // Three installs renderer.render on the instance; Scene's lifecycle callback
  // observes the real production camera without adding hooks to product code.
  THREE.Scene.prototype.onAfterRender = function (renderer, scene, camera) {
    if (scene instanceof THREE.Scene && scene.getObjectByName('fight-collision-boxes')) {
      latest = { renderer, scene, camera }
      renders++
    }
  }
  export async function show(options: {
    id: FighterId
    facing: 1 | -1
    slot?: MoveSlot
    phase?: 'startup' | 'active' | 'recovery'
    x?: number
    jump?: boolean
    crouch?: boolean
    versus?: boolean
  }) {
    const {
      id,
      facing,
      slot,
      phase = 'active',
      x = 44,
      jump = false,
      crouch = false,
      versus = false,
    } = options
    if (id !== state.player.id) latest = null
    const fresh = createFightState(id, id === 'hisoka' ? 'chrollo' : 'hisoka', {
      mode: versus ? 'versus-local' : 'training',
      environment: { stageId: 'heavens-arena' },
    })
    state = {
      ...fresh,
      phase: 'fighting',
      player: {
        ...fresh.player,
        facing,
        x: facing === 1 ? x : 100 - x,
        y: jump ? 6 : 0,
        pose: jump ? 'jump' : 'idle',
        crouching: crouch,
      },
      opponent: {
        ...fresh.opponent,
        x: facing === 1 ? x + 12 : 88 - x,
        facing: facing === 1 ? -1 : 1,
      },
    }
    if (slot) {
      const move = moveForSlot(id, slot)!
      const f = move.tuning
      const frame =
        phase === 'startup'
          ? Math.floor(f.startup * 0.6)
          : phase === 'active'
            ? f.startup
            : f.startup + f.active + Math.floor(f.recovery * 0.5)
      state = {
        ...state,
        player: {
          ...state.player,
          pose: move.kind,
          crouching: move.variant === 'low',
          y: move.variant === 'air' ? 6 : state.player.y,
          attack: {
            moveId: move.id,
            variant: move.variant,
            kind: move.kind,
            frame,
            impacted: false,
            auraCharged: false,
            concealed: false,
            hatsuSource: move.kind === 'special' ? id : null,
            projectileSpawned: false,
            reversal: false,
          },
        },
      }
    }
    await tick()
    for (let frame = 0; !latest && frame < 600; frame++) await new Promise(requestAnimationFrame)
    await settle()
  }
  export async function settle() {
    for (let frame = 0; frame < 8; frame++) await new Promise(requestAnimationFrame)
  }
  export async function settleCamera() {
    let stable = 0
    let previous = latest?.camera.position.clone()
    for (let frame = 0; frame < 120 && stable < 4; frame++) {
      await new Promise(requestAnimationFrame)
      const position = latest?.camera.position
      stable = position && previous && position.distanceTo(previous) < 0.002 ? stable + 1 : 0
      previous = position?.clone()
    }
  }
  export function snapshot() {
    if (!latest) return null
    const { renderer, scene, camera } = latest
    renderer.render(scene, camera)
    const root = scene.getObjectByName('fight-collision-boxes')!
    const canvas = renderer.domElement
    const rect = canvas.getBoundingClientRect()
    const copy = document.createElement('canvas')
    copy.width = canvas.width
    copy.height = canvas.height
    const context = copy.getContext('2d')!
    context.drawImage(canvas, 0, 0)
    const pixels = context.getImageData(0, 0, copy.width, copy.height).data
    const entries = fightCollisionBoxes(state)
    const boxes = root.children
      .filter((item) => item.visible)
      .map((item, index) => {
        const bounds = entries[index].box
        const corner = item.localToWorld(new THREE.Vector3(-0.5, -0.5, 0)).project(camera)
        const expected = new THREE.Vector3(
          fightWorldX(bounds.left),
          fightWorldY(bounds.bottom),
          0,
        ).project(camera)
        const edge = item.localToWorld(new THREE.Vector3(-0.5, 0, 0)).project(camera)
        const cx = Math.round(((edge.x + 1) * canvas.width) / 2)
        const cy = Math.round(((1 - edge.y) * canvas.height) / 2)
        const samples: number[][] = []
        for (let y = cy - 3; y <= cy + 3; y++)
          for (let x = cx - 3; x <= cx + 3; x++) {
            if (x >= 0 && x < copy.width && y >= 0 && y < copy.height) {
              const start = (y * copy.width + x) * 4
              samples.push(Array.from(pixels.slice(start, start + 3)))
            }
          }
        return {
          kind: item.userData.kind,
          side: item.userData.side,
          error: Math.hypot(
            ((corner.x - expected.x) * rect.width) / 2,
            ((corner.y - expected.y) * rect.height) / 2,
          ),
          samples,
          edge: { x: ((edge.x + 1) * rect.width) / 2, y: ((1 - edge.y) * rect.height) / 2 },
        }
      })
    return {
      renders,
      visible: root.visible,
      boxes,
      width: rect.width,
      height: rect.height,
      dpr: renderer.getPixelRatio(),
    }
  }
</script>

<main>
  <p>
    {state.player.id} · {state.player.attack?.moveId ?? state.player.pose} · face {state.player
      .facing}
  </p>
  <div class="arena">
    {#key state.player.id}<FightScene {state} stageId="heavens-arena" />{/key}
    <FightTrainingOverlay {state} language="fr" />
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #081019;
    color: #e8edf7;
    font: 14px system-ui;
  }
  p {
    margin: 0.5rem 1rem;
  }
  .arena {
    position: relative;
    width: 100%;
    height: min(70vh, 680px);
    min-height: 360px;
    overflow: hidden;
  }
</style>
