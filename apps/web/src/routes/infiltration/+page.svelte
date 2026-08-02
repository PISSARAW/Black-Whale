<script lang="ts">
  import type { PageData } from './$types'
  import { onMount } from 'svelte'
  import { theShip } from '$lib/tour/blueprint'
  import { centroid } from '$lib/tour/hatsu'
  import TourScene from '$lib/components/tour/TourScene.svelte'
  import { t } from '$lib/i18n'
  import type { Apparition } from '$lib/tour/apparitions'
  import type { Vec2 } from '$lib/tour/types'

  let { data }: { data: PageData } = $props()
  
  const ship = theShip()
  
  // Player state
  let tierId = $state('t1')
  let currentSpace = $state(null)
  let position = $state<Vec2>([0, 0])
  let heading = $state(0)
  
  // Game state
  let zetsuActive = $state(false)
  let detectionLevel = $state(0) // 0 to 100
  let gameOver = $state(false)
  let lastTime = 0
  let gameLoopHandle: number

  // Guards
  // We place 5 guards in deck 1
  interface Guard {
    id: string
    position: Vec2
    heading: number
    speed: number
    room: string
    targetPos?: Vec2
  }

  let guards = $state<Guard[]>([])

  function randomPointInRoom(spaceId: string): Vec2 {
    const space = ship.spaces.get(spaceId)
    const center = space ? centroid(space) : [0, 0]
    // Add small random offset around center
    return [
      center[0] + (Math.random() - 0.5) * 5,
      center[1] + (Math.random() - 0.5) * 5
    ] as Vec2
  }

  function initGuards() {
    const rooms = ['1001', '1005', '1010', '1015', '1020'] // sample rooms on deck 1
    guards = rooms.map((roomId, i) => {
      const space = ship.spaces.get(roomId)
      const pos = space ? centroid(space) : [0, 0]
      return {
        id: `guard-${i}`,
        position: [pos[0], pos[1]] as Vec2,
        heading: Math.random() * Math.PI * 2,
        speed: 1.5, // m/s
        room: roomId,
        targetPos: randomPointInRoom(roomId)
      }
    })
  }

  function restartGame() {
    gameOver = false
    detectionLevel = 0
    zetsuActive = false
    initGuards()
    // Reset player position by jumping to a specific room
    jumpTo = '1000'
  }

  let jumpTo = $state<string | null>('1000') // start room

  // Utility math
  function vec2Distance(a: Vec2, b: Vec2) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2))
  }

  function gameLoop(timestamp: number) {
    if (gameOver) return
    if (!lastTime) lastTime = timestamp
    const dt = (timestamp - lastTime) / 1000
    lastTime = timestamp

    let playerDetectedThisFrame = false

    // Update guards
    for (let i = 0; i < guards.length; i++) {
      const guard = guards[i]
      if (guard.targetPos) {
        const dist = vec2Distance(guard.position, guard.targetPos)
        if (dist < 0.5) {
          guard.targetPos = randomPointInRoom(guard.room)
        } else {
          // Move towards target
          const dx = guard.targetPos[0] - guard.position[0]
          const dz = guard.targetPos[1] - guard.position[1]
          const targetHeading = Math.atan2(dx, dz)
          
          // Smooth rotation (simplified)
          guard.heading = targetHeading
          
          guard.position = [
            guard.position[0] + Math.sin(guard.heading) * guard.speed * dt,
            guard.position[1] + Math.cos(guard.heading) * guard.speed * dt
          ] as Vec2
        }
      }

      // Detection Logic (Simple)
      // Only detect if on same deck. We assume guards are on t1.
      if (tierId === 't1') {
        const distToPlayer = vec2Distance(guard.position, position)
        
        // 1. Visual Detection: distance < 15m and angle < 45deg
        // Calculate angle between guard's heading and player
        const dx = position[0] - guard.position[0]
        const dz = position[1] - guard.position[1]
        const angleToPlayer = Math.atan2(dx, dz)
        let angleDiff = Math.abs(angleToPlayer - guard.heading)
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff
        
        const inVisionCone = angleDiff < Math.PI / 4 // 45 degrees
        
        if (distToPlayer < 15 && inVisionCone) {
          playerDetectedThisFrame = true
          detectionLevel += 10 * dt * (15 - distToPlayer) // Faster detection if closer
        }

        // 2. Acoustic Detection (simplified)
        // Assume player makes constant noise if moving (we don't track velocity accurately here, 
        // so we just check if distance is very close). Zetsu halves the acoustic radius.
        const acousticRadius = zetsuActive ? 4 : 8
        if (distToPlayer < acousticRadius) {
          playerDetectedThisFrame = true
          detectionLevel += 5 * dt
        }
      }
    }

    if (!playerDetectedThisFrame) {
      detectionLevel = Math.max(0, detectionLevel - 5 * dt)
    }

    if (detectionLevel >= 100) {
      gameOver = true
      detectionLevel = 100
    }

    gameLoopHandle = requestAnimationFrame(gameLoop)
  }

  onMount(() => {
    initGuards()
    gameLoopHandle = requestAnimationFrame(gameLoop)
    return () => cancelAnimationFrame(gameLoopHandle)
  })

  // Build extras (Apparitions) to render
  let extras = $derived.by(() => {
    const list: Apparition[] = []
    for (const guard of guards) {
      // The guard body
      list.push({
        id: guard.id,
        kind: 'avatar',
        colour: 0xff4444, // Red
        size: 0.4,
        y: 0,
        at: guard.position,
        tierId: 't1',
        spaceId: guard.room,
        stage: 0,
        hidden: false
      })

      // The guard's En (Aura field)
      // If player is in Zetsu, they cannot perceive the aura field.
      if (!zetsuActive) {
        list.push({
          id: `${guard.id}-en`,
          kind: 'avatar',
          colour: 0xffaa00, // Orange
          size: 4, // 4 meters En radius
          y: -0.9, // flat on floor
          at: guard.position,
          tierId: 't1',
          spaceId: guard.room,
          stage: 0,
          hidden: true // renders faint
        })
      }
    }
    return list
  })

</script>

<div class="relative h-screen w-full overflow-hidden bg-black">
  <div class="absolute inset-0" style={zetsuActive ? 'filter: grayscale(100%) contrast(1.2);' : ''}>
    <TourScene
      {ship}
      bind:tierId
      bind:currentSpace
      bind:position
      bind:heading
      bind:jumpTo
      {extras}
      touchLabels={{ move: $t.tour.touch.move, cast: $t.tour.touch.cast }}
      soundLabels={{ silence: $t.tour.sound.silence, restore: $t.tour.sound.restore }}
      loadingLabel={$t.tour.loading}
      unsupportedLabel={$t.tour.unsupported}
    />
  </div>

  <!-- HUD -->
  <div class="pointer-events-none absolute top-0 left-0 right-0 p-6 z-10 flex justify-between items-start">
    <div class="w-64">
      <p class="text-white font-bold mb-2 uppercase tracking-widest text-sm drop-shadow-md">Niveau de Détection</p>
      <div class="h-4 w-full bg-black/50 rounded-full border border-white/20 overflow-hidden">
        <div 
          class="h-full transition-all duration-100 {detectionLevel > 75 ? 'bg-red-500' : detectionLevel > 40 ? 'bg-yellow-500' : 'bg-green-500'}"
          style="width: {detectionLevel}%"
        ></div>
      </div>
    </div>

    <button 
      class="pointer-events-auto px-6 py-2 rounded-full border-2 font-bold transition-all shadow-lg backdrop-blur-sm
             {zetsuActive ? 'bg-black text-white border-white' : 'bg-white/10 text-white border-white/30 hover:bg-white/20'}"
      onclick={() => zetsuActive = !zetsuActive}
    >
      {zetsuActive ? 'Zetsu Actif' : 'Activer Zetsu'}
    </button>
  </div>

  {#if gameOver}
    <div class="absolute inset-0 z-50 flex items-center justify-center bg-red-950/90 backdrop-blur-md">
      <div class="text-center">
        <h1 class="text-6xl font-black text-red-500 mb-4 tracking-widest uppercase drop-shadow-lg">Repéré</h1>
        <p class="text-white/70 mb-8 text-xl">Vous avez été découvert par la sécurité.</p>
        <button 
          onclick={restartGame}
          class="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded shadow-lg transition-transform hover:scale-105"
        >
          Recommencer
        </button>
      </div>
    </div>
  {/if}
</div>
