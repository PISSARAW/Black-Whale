<script lang="ts">
  import type { BasicApparitionContext } from '$lib/tour/apparitionBasicView'
  import type { Apparition } from '$lib/tour/apparitions'
  import { styleNenCreature } from '$lib/tour/nenCreatureFigure'
  import { SvelteMap } from 'svelte/reactivity'
  import * as THREE from 'three'
  import { buildTechniqueAnimation, updateTechniqueAnimation } from './NenTechniqueAnimation'
  import type { NenArchiveKind } from './archive'
  import { attachArchiveCanvas } from './archive-canvas'
  import { CANONICAL_MODELS } from './archive-models'

  export let kind: NenArchiveKind
  export let color = '#8fe1ca'
  export let techniqueSignal = 0
  export let crySignal = 0
  export let label = 'Nen specimen'
  export let loadingLabel = 'Loading model…'

  let canvasHost: HTMLSpanElement
  let host: HTMLButtonElement
  let mounted = false
  let activeKind: NenArchiveKind | null = null
  let activeTechniqueSignal = 0
  let activeCrySignal = 0

  let scene: THREE.Scene
  let camera: THREE.PerspectiveCamera
  let renderer: THREE.WebGLRenderer
  let specimen: THREE.Group
  let techniqueRig: THREE.Group | null = null
  let environment: THREE.Group
  let frame = 0
  let resizeObserver: ResizeObserver
  let dragging = false
  let pointerX = 0
  let pointerY = 0
  let targetRotationX = -0.08
  let targetRotationY = 0.5
  let techniqueUntil = 0
  let techniqueStartedAt = 0
  let cryUntil = 0
  let modelMeshCount = 0

  const materials: THREE.MeshStandardMaterial[] = []
  const glowMaterials: THREE.MeshBasicMaterial[] = []
  const tourMaterials: THREE.MeshBasicMaterial[] = []
  const TECHNIQUE_DURATION = 3600

  const material = (hex: string, roughness = 0.55, metalness = 0.12) => {
    const value = new THREE.MeshStandardMaterial({
      color: hex,
      roughness,
      metalness,
      emissive: new THREE.Color(hex).multiplyScalar(0.05),
    })
    materials.push(value)
    return value
  }

  function mesh(
    geometry: THREE.BufferGeometry,
    surface: THREE.Material,
    position: [number, number, number] = [0, 0, 0],
  ) {
    const value = new THREE.Mesh(geometry, surface)
    value.position.set(...position)
    value.castShadow = true
    value.receiveShadow = true
    return value
  }

  function canonicalModel() {
    const config = CANONICAL_MODELS[kind]
    const root = new THREE.Group()
    root.name = `canonical-${config.apparitionKind}`
    const cached = new SvelteMap<string, THREE.MeshBasicMaterial>()
    const tourGlow = (colour: number, opacity: number) => {
      const key = `${colour}|${opacity}`
      const held = cached.get(key)
      if (held) return held
      const value = new THREE.MeshBasicMaterial({
        color: colour,
        opacity,
        transparent: opacity < 1,
        side: THREE.DoubleSide,
      })
      value.userData.baseOpacity = opacity
      cached.set(key, value)
      tourMaterials.push(value)
      return value
    }
    const seen: Apparition = {
      id: `nendex-${config.apparitionKind}`,
      kind: config.apparitionKind,
      at: [0, 0],
      y: 0,
      size: config.size,
      colour: config.colour,
      stage: config.stage,
      spaceId: 'nendex-vault',
      tierId: 'archive',
      hidden: false,
    }
    const context: BasicApparitionContext = {
      THREE,
      root,
      glow: tourGlow,
      skin: tourGlow(config.colour, 1),
    }
    config.build(seen, context)
    if (config.creature) {
      styleNenCreature(THREE, root, {
        kind: config.apparitionKind,
        size: config.size,
        shadow: false,
      })
    }
    if (kind === 'skill-book') {
      root.children
        .filter((child): child is THREE.Group => child instanceof THREE.Group)
        .forEach((leaf, index) => {
          leaf.name = index === 0 ? 'book-leaf-left' : 'book-leaf-right'
          leaf.userData.restZ = leaf.rotation.z
        })
    }
    root.traverse((part) => {
      const model = part as THREE.Mesh
      if (!model.isMesh) return
      model.castShadow = true
      model.receiveShadow = true
    })
    modelMeshCount = 0
    root.traverse((part) => {
      if ((part as THREE.Mesh).isMesh) modelMeshCount += 1
    })
    if (config.rotation) root.rotation.set(...config.rotation)

    // The archive mixes hand-held props, wide royal beasts and tall humanoid
    // constructs. Frame the actual geometry instead of relying on the room
    // offsets used by the tour, so every specimen stays visible at any aspect.
    const bounds = new THREE.Box3().setFromObject(root)
    if (!bounds.isEmpty()) {
      const centre = bounds.getCenter(new THREE.Vector3())
      const dimensions = bounds.getSize(new THREE.Vector3())
      const largest = Math.max(dimensions.x, dimensions.y, dimensions.z, 0.001)
      const fittedScale = (3.4 / largest) * config.scale
      root.scale.setScalar(fittedScale)
      root.position.set(
        -centre.x * fittedScale,
        -centre.y * fittedScale + 0.08,
        -centre.z * fittedScale,
      )
    }
    const presentation = new THREE.Group()
    presentation.name = `nendex-${config.apparitionKind}`
    presentation.add(root)
    techniqueRig = buildTechniqueAnimation(kind, config.colour)
    presentation.add(techniqueRig)
    return presentation
  }
  function buildEnvironment() {
    environment = new THREE.Group()
    const floor = mesh(new THREE.CircleGeometry(4.6, 72), material('#0b1416', 0.96), [0, -1.55, 0])
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    environment.add(floor)

    const particles = new THREE.BufferGeometry()
    const positions = new Float32Array(150 * 3)
    for (let index = 0; index < 150; index += 1) {
      const radius = 2.2 + Math.random() * 3.6
      const angle = Math.random() * Math.PI * 2
      positions[index * 3] = Math.cos(angle) * radius
      positions[index * 3 + 1] = -1.1 + Math.random() * 5.4
      positions[index * 3 + 2] = Math.sin(angle) * radius
    }
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    environment.add(
      new THREE.Points(
        particles,
        new THREE.PointsMaterial({ color, size: 0.035, transparent: true, opacity: 0.55 }),
      ),
    )
    scene.add(environment)
  }

  function disposeGroup(group: THREE.Group | undefined) {
    if (!group) return
    group.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Points) {
        child.geometry?.dispose()
        if (Array.isArray(child.material)) child.material.forEach((value) => value.dispose())
        else child.material?.dispose()
      }
    })
    scene.remove(group)
  }

  function rebuild() {
    if (!mounted) return
    disposeGroup(specimen)
    disposeGroup(environment)
    materials.length = 0
    glowMaterials.length = 0
    tourMaterials.length = 0
    buildEnvironment()
    specimen = canonicalModel()
    scene.add(specimen)
    targetRotationX = -0.08
    targetRotationY = 0.5
    activeKind = kind
  }

  function activateTechnique() {
    techniqueStartedAt = performance.now()
    techniqueUntil = techniqueStartedAt + TECHNIQUE_DURATION
  }

  function reactToCry() {
    cryUntil = performance.now() + 720
  }

  function resize() {
    if (!renderer || !host) return
    const width = Math.max(host.clientWidth, 1)
    const height = Math.max(host.clientHeight, 1)
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  function pointerDown(event: PointerEvent) {
    dragging = true
    pointerX = event.clientX
    pointerY = event.clientY
    host.setPointerCapture(event.pointerId)
  }

  function pointerMove(event: PointerEvent) {
    if (!dragging) return
    targetRotationY += (event.clientX - pointerX) * 0.009
    targetRotationX = THREE.MathUtils.clamp(
      targetRotationX + (event.clientY - pointerY) * 0.006,
      -0.55,
      0.42,
    )
    pointerX = event.clientX
    pointerY = event.clientY
  }

  function pointerUp(event: PointerEvent) {
    dragging = false
    if (host.hasPointerCapture(event.pointerId)) host.releasePointerCapture(event.pointerId)
  }

  function keyboard(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') targetRotationY -= 0.18
    else if (event.key === 'ArrowRight') targetRotationY += 0.18
    else if (event.key === 'ArrowUp') targetRotationX = Math.max(-0.55, targetRotationX - 0.12)
    else if (event.key === 'ArrowDown') targetRotationX = Math.min(0.42, targetRotationX + 0.12)
    else return
    event.preventDefault()
  }

  function animateDetails(time: number, techniqueActive: boolean, techniqueProgress: number) {
    for (const name of ['book-leaf-left', 'book-leaf-right']) {
      const leaf = specimen.getObjectByName(name)
      if (!leaf) continue
      const rest = Number(leaf.userData.restZ ?? 0)
      const direction = name.endsWith('left') ? -1 : 1
      const spread = techniqueActive ? direction * (0.16 + Math.sin(time * 0.016) * 0.07) : 0
      leaf.rotation.z += (rest + spread - leaf.rotation.z) * 0.1
    }
    const antenna = specimen.getObjectByName('phone-antenna')
    if (antenna) antenna.rotation.z = techniqueActive ? Math.sin(time * 0.035) * 0.16 : 0

    updateTechniqueAnimation(techniqueRig, techniqueProgress, {
      time: time,
      active: techniqueActive,
    })
  }

  function animate(time: number) {
    frame = requestAnimationFrame(animate)
    if (!dragging) targetRotationY += 0.0018
    if (specimen) {
      specimen.rotation.y += (targetRotationY - specimen.rotation.y) * 0.08
      specimen.rotation.x += (targetRotationX - specimen.rotation.x) * 0.08
      specimen.position.y += (Math.sin(time * 0.0014) * 0.075 - specimen.position.y) * 0.04

      const techniqueActive = time < techniqueUntil
      const techniqueProgress = techniqueActive
        ? THREE.MathUtils.clamp((time - techniqueStartedAt) / TECHNIQUE_DURATION, 0, 1)
        : 1
      const cryActive = time < cryUntil
      const techniquePulse = techniqueActive ? 1 + Math.sin(time * 0.018) * 0.025 : 1
      const cryPulse = cryActive ? 1 + Math.sin(time * 0.045) * 0.035 : 1
      specimen.scale.setScalar(techniquePulse * cryPulse)

      animateDetails(time, techniqueActive, techniqueProgress)

      materials.forEach((value) => {
        value.emissiveIntensity = techniqueActive ? 0.85 + Math.sin(time * 0.02) * 0.3 : 0.12
      })
      glowMaterials.forEach((value) => {
        value.opacity = techniqueActive ? 0.78 + Math.sin(time * 0.02) * 0.18 : 0.52
      })
      tourMaterials.forEach((value) => {
        const base = Number(value.userData.baseOpacity ?? 1)
        value.opacity = techniqueActive
          ? Math.min(1, base + 0.12 + Math.sin(time * 0.02) * 0.08)
          : base
      })
    }
    if (environment) environment.rotation.y = time * 0.000035
    renderer.render(scene, camera)
  }

  $: if (mounted && kind !== activeKind) rebuild()
  $: if (mounted && techniqueSignal !== activeTechniqueSignal) {
    activeTechniqueSignal = techniqueSignal
    activateTechnique()
  }
  $: if (mounted && crySignal !== activeCrySignal) {
    activeCrySignal = crySignal
    reactToCry()
  }

  function mountCanvas(node: HTMLSpanElement) {
    canvasHost = node
    scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2('#071012', 0.075)
    camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.set(0, 0.65, 7.5)
    camera.lookAt(0, 0.2, 0)

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.domElement.setAttribute('aria-hidden', 'true')
    attachArchiveCanvas(canvasHost, renderer.domElement)

    scene.add(new THREE.HemisphereLight('#bce8df', '#081116', 2.1))
    const key = new THREE.SpotLight('#fff1ca', 62, 18, Math.PI / 5, 0.55, 1.3)
    key.position.set(4.5, 6.5, 5)
    key.castShadow = true
    scene.add(key)
    const rim = new THREE.PointLight(color, 34, 14)
    rim.position.set(-4, 1, -3)
    scene.add(rim)

    mounted = true
    activeTechniqueSignal = techniqueSignal
    activeCrySignal = crySignal
    rebuild()
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvasHost)
    resize()
    frame = requestAnimationFrame(animate)

    return {
      destroy() {
        mounted = false
        cancelAnimationFrame(frame)
        resizeObserver?.disconnect()
        disposeGroup(specimen)
        disposeGroup(environment)
        renderer.dispose()
        renderer.domElement.remove()
      },
    }
  }
</script>

<button
  bind:this={host}
  type="button"
  class="scene"
  aria-label={label}
  onpointerdown={pointerDown}
  onpointermove={pointerMove}
  onpointerup={pointerUp}
  onpointercancel={pointerUp}
  onkeydown={keyboard}
>
  <span use:mountCanvas class="canvas-host"></span>
  {#if modelMeshCount === 0}
    <div class="model-loading" aria-hidden="true">
      <i></i>
      <span>{loadingLabel}</span>
    </div>
  {/if}
  <div class="drag-hint" aria-hidden="true">360°</div>
</button>

<style>
  .canvas-host {
    position: absolute;
    inset: 0;
    display: block;
  }
  .scene {
    position: absolute;
    inset: 0;
    overflow: hidden;
    cursor: grab;
    padding: 0;
    border: 0;
    background: transparent;
    outline: none;
    touch-action: none;
  }
  .scene:active {
    cursor: grabbing;
  }
  .scene:focus-visible {
    outline: 1px solid color-mix(in srgb, var(--specimen-color, #8fe1ca) 70%, white);
    outline-offset: -3px;
  }
  .scene :global(canvas) {
    display: block;
    width: 100%;
    height: 100%;
  }
  .model-loading {
    position: absolute;
    z-index: 2;
    inset: 0;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 0.8rem;
    color: rgba(255, 255, 255, 0.52);
    font-family: var(--font-mono);
    font-size: 0.62rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .model-loading i {
    width: 1.25rem;
    height: 1.25rem;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-top-color: var(--specimen-color, #8fe1ca);
    border-radius: 50%;
    animation: loading-spin 0.8s linear infinite;
  }
  @keyframes loading-spin {
    to {
      transform: rotate(1turn);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .model-loading i {
      animation: none;
    }
  }
  .drag-hint {
    position: absolute;
    right: 1rem;
    bottom: 1rem;
    display: grid;
    width: 2.75rem;
    height: 2.75rem;
    place-items: center;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 0.25rem;
    color: rgba(255, 255, 255, 0.64);
    font-family: var(--font-mono);
    font-size: 0.65rem;
    letter-spacing: 0.04em;
  }
</style>
