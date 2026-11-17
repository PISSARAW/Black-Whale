<script lang="ts">
  import { onMount } from 'svelte'
  import * as THREE from 'three'
  import { buildFightFigure } from '$lib/fighting/fighterFigure'
  import { createFightState } from '$lib/fighting/fightState'
  import { fightBodyMotion } from '$lib/fighting/fightBodyMotion'
  import {
    trackFightOpponent,
    FIGHTER_FACE_ANGLE,
    FIGHTER_FACING_ANGLE,
  } from '$lib/fighting/fighterFacing'
  import { createFightRenderer } from '$lib/fighting/fightRenderer'
  import { fightPixelRatio, type FightGraphics } from '$lib/fighting/fightGraphics'
  import { FIGHTING_ROSTER } from '$lib/fighting/roster'
  import type { FighterId } from '$lib/fighting/types'
  import type { HumanFigure } from '$lib/tour/humanFigure'
  let canvas: HTMLCanvasElement
  let first: FighterId = 'kurapika'
  let second: FighterId = 'hisoka'
  let original = false
  let portrait = false
  const graphics: FightGraphics = 'quality'
  let report = ''
  let measure = false
  let rebuild = () => {}
  let fit = () => {}
  $: if (first && second && (original || !original)) rebuild()
  $: if (portrait || !portrait) fit()
  $: if (graphics) fit()
  onMount(() => {
    const renderer = createFightRenderer(THREE, canvas)
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x17141f)
    const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 100)
    const pools: Array<[string, THREE.MeshBasicMaterial]> = []
    const glow = (color: number, opacity: number) => {
      const key = `${color}:${opacity}`
      const held = pools.find(([candidate]) => candidate === key)?.[1]
      if (held) return held
      const made = new THREE.MeshBasicMaterial({
        color,
        opacity,
        transparent: opacity < 1,
        depthWrite: opacity >= 1,
      })
      pools.push([key, made])
      return made
    }
    let models: HumanFigure[] = []
    let pair = createFightState(first, second)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), glow(0x292431, 1))
    floor.rotation.x = -Math.PI / 2
    scene.add(floor)
    rebuild = () => {
      for (const model of models) scene.remove(model.root)
      pair = createFightState(first, second)
      models = [pair.player, pair.opponent].map((fighter) =>
        buildFightFigure({ THREE, glow, fighter, readability: !original }),
      )
      models.forEach((model, i) => {
        model.root.position.x = i ? 1.45 : -1.45
        model.root.rotation.y = (i ? -1 : 1) * FIGHTER_FACING_ANGLE
        scene.add(model.root)
      })
      report = ''
      fit()
    }
    fit = () => {
      renderer.setPixelRatio(fightPixelRatio(window.devicePixelRatio, graphics))
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)
      camera.aspect = canvas.clientWidth / canvas.clientHeight
      camera.position.set(
        0,
        portrait ? 1.8 : 2.1,
        portrait ? 1.8 : Math.max(5.6, 3.7 / camera.aspect),
      )
      camera.lookAt(0, portrait ? 1.75 : 1.1, 0)
      if (portrait) camera.position.x = -1.45
      if (portrait) camera.lookAt(-1.45, 1.75, 0)
      camera.updateProjectionMatrix()
    }
    rebuild()
    const resize = new ResizeObserver(fit)
    resize.observe(canvas)
    let handle = 0,
      previous = 0
    let samples: number[] = [],
      intervals: number[] = []
    let measuring = false
    const render = (now: number) => {
      const start = performance.now()
      models.forEach((model, i) => {
        const fighter = i ? pair.opponent : pair.player
        const motion = trackFightOpponent({
          fighter,
          bodyAngle: model.root.rotation.y,
          seconds: now / 1000,
          motion: fightBodyMotion({ fighter, seconds: now / 1000, progress: 0 }),
        })
        model.animate(now / 1000, 'idle', {
          motion: (rig) => {
            motion(rig)
            if (original) rig.head.rotation.y += fighter.facing * (Math.PI / 2 - FIGHTER_FACE_ANGLE)
          },
        })
      })
      renderer.render(scene, camera)
      if (measure && !measuring) {
        samples = []
        intervals = []
        measuring = true
        previous = now
      } else if (measuring) {
        samples.push(performance.now() - start)
        intervals.push(now - previous)
        previous = now
        if (samples.length === 180) {
          const sorted = [...samples].sort((a, b) => a - b)
          report = JSON.stringify(
            {
              version: original ? 'avant' : 'corrigé',
              pair: [first, second],
              viewport: [canvas.clientWidth, canvas.clientHeight],
              profile: graphics,
              frames: samples.length,
              fps: 1000 / (intervals.reduce((a, b) => a + b, 0) / intervals.length),
              cpuMedianMs: sorted[90],
              cpuP95Ms: sorted[171],
              drawCalls: renderer.info.render.calls,
              triangles: renderer.info.render.triangles,
              geometries: renderer.info.memory.geometries,
              textures: renderer.info.memory.textures,
            },
            null,
            2,
          )
          measuring = false
          measure = false
        }
      }
      handle = requestAnimationFrame(render)
    }
    handle = requestAnimationFrame(render)
    return () => {
      cancelAnimationFrame(handle)
      resize.disconnect()
      renderer.dispose()
      renderer.forceContextLoss()
      pools.forEach(([, material]) => material.dispose())
      floor.geometry.dispose()
    }
  })
</script>

<header>
  <label
    >P1 <select bind:value={first}
      >{#each FIGHTING_ROSTER as fighter (fighter.id)}<option value={fighter.id}
          >{fighter.name}</option
        >{/each}</select
    ></label
  >
  <label
    >P2 <select bind:value={second}
      >{#each FIGHTING_ROSTER as fighter (fighter.id)}<option value={fighter.id}
          >{fighter.name}</option
        >{/each}</select
    ></label
  >
  <label><input type="checkbox" bind:checked={original} /> Ancien rendu</label>
  <label><input type="checkbox" bind:checked={portrait} /> Gros plan</label>
  <button
    onclick={() => {
      report = ''
      measure = true
    }}
    disabled={measure}>{measure ? 'Mesure en cours' : 'Mesurer 180 images'}</button
  >
</header>
<canvas bind:this={canvas} aria-label="Comparaison des personnages pendant le combat"></canvas>
{#if report}<pre>{report}</pre>{/if}

<style>
  :global(body) {
    margin: 0;
    background: #17141f;
    color: #eee;
    font: 12px/1.4 system-ui;
  }
  header {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px;
    align-items: center;
  }
  label {
    display: flex;
    gap: 4px;
    align-items: center;
  }
  select,
  button {
    min-height: 32px;
    background: #30253c;
    color: white;
    border: 1px solid #795987;
  }
  canvas {
    display: block;
    width: 100%;
    height: calc(100dvh - 80px);
    min-height: 240px;
  }
  pre {
    position: fixed;
    left: 10px;
    bottom: 8px;
    background: #100c18dd;
    padding: 8px;
    max-height: 35dvh;
    overflow: auto;
    pointer-events: none;
  }
</style>
