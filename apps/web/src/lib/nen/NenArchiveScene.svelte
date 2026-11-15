<script lang="ts">
  import { onMount } from 'svelte'
  import * as THREE from 'three'
  import { buildAnimalApparition } from '$lib/tour/apparitionAnimalView'
  import { buildBasicApparition } from '$lib/tour/apparitionBasicView'
  import { buildBiohazardApparition } from '$lib/tour/apparitionBiohazardView'
  import { buildCrawlingApparition } from '$lib/tour/apparitionCrawlingView'
  import { buildDragonApparition } from '$lib/tour/apparitionDragonView'
  import { buildGuardianApparition } from '$lib/tour/apparitionGuardianView'
  import { buildMangaPropApparition } from '$lib/tour/apparitionMangaPropView'
  import { buildMechanicalApparition } from '$lib/tour/apparitionMechanicalView'
  import { buildLsdfApparition } from '$lib/tour/apparitionLsdfView'
  import { buildObjectApparition } from '$lib/tour/apparitionObjectView'
  import { buildWormPortal } from '$lib/tour/apparitionPortalView'
  import { buildRoyalBeastApparition } from '$lib/tour/apparitionRoyalBeastView'
  import { buildSpriteApparition } from '$lib/tour/apparitionSpriteView'
  import { buildSupportBeastApparition } from '$lib/tour/apparitionSupportBeastView'
  import { buildVowApparition } from '$lib/tour/apparitionVowView'
  import type { BasicApparitionContext } from '$lib/tour/apparitionBasicView'
  import type { Apparition, ApparitionKind } from '$lib/tour/apparitions'
  import { styleNenCreature } from '$lib/tour/nenCreatureFigure'
  import { buildTechniqueAnimation, updateTechniqueAnimation } from './NenTechniqueAnimation'
  import type { NenArchiveKind } from './archive'

  export let kind: NenArchiveKind
  export let color = '#8fe1ca'
  export let techniqueSignal = 0
  export let crySignal = 0
  export let label = 'Nen specimen'
  export let loadingLabel = 'Loading model…'

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

  const glow = (hex: string, opacity = 0.7) => {
    const value = new THREE.MeshBasicMaterial({
      color: hex,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    glowMaterials.push(value)
    return value
  }

  function mesh(
    geometry: THREE.BufferGeometry,
    surface: THREE.Material,
    position: [number, number, number] = [0, 0, 0],
    scale: [number, number, number] = [1, 1, 1],
  ) {
    const value = new THREE.Mesh(geometry, surface)
    value.position.set(...position)
    value.scale.set(...scale)
    value.castShadow = true
    value.receiveShadow = true
    return value
  }

  type CanonicalConfig = {
    apparitionKind: ApparitionKind
    build: (seen: Apparition, context: BasicApparitionContext) => unknown
    size: number
    colour: number
    stage: number
    scale: number
    position: [number, number, number]
    rotation?: [number, number, number]
    creature?: boolean
  }

  const CANONICAL_MODELS: Record<NenArchiveKind, CanonicalConfig> = {
    guardian: {
      apparitionKind: 'nasubi-guardian',
      build: buildRoyalBeastApparition,
      size: 0.95,
      colour: 0xc7bcb0,
      stage: 0,
      scale: 0.82,
      position: [0, -1.5, 0],
      creature: true,
    },
    'skill-book': {
      apparitionKind: 'book',
      build: buildObjectApparition,
      size: 1.25,
      colour: 0x9c7ac4,
      stage: 1,
      scale: 1.15,
      position: [0, 0.1, 0],
      rotation: [Math.PI / 2.35, 0, 0],
    },
    'black-voice': {
      apparitionKind: 'phone',
      build: buildMangaPropApparition,
      size: 1.35,
      colour: 0x9ebaa8,
      stage: 0,
      scale: 1.18,
      position: [0, -0.1, 0],
      rotation: [0, -0.18, 0],
    },
    ghostwriter: {
      apparitionKind: 'ghost',
      build: buildObjectApparition,
      size: 1.05,
      colour: 0xdca4cf,
      stage: 1,
      scale: 0.95,
      position: [0, 0.7, 0],
      rotation: [0, Math.PI, 0],
      creature: true,
    },
    predator: {
      apparitionKind: 'predator-salesale',
      build: buildSupportBeastApparition,
      size: 1.25,
      colour: 0xb7ada3,
      stage: 0,
      scale: 1.12,
      position: [0, 0, 0],
      creature: true,
    },
    'benjamin-guardian': {
      apparitionKind: 'benjamin-guardian',
      build: buildRoyalBeastApparition,
      size: 0.9,
      colour: 0xc9b8a2,
      stage: 0,
      scale: 0.84,
      position: [0, -1.48, 0],
      creature: true,
    },
    'halkenburg-guardian': {
      apparitionKind: 'halkenburg-guardian',
      build: buildRoyalBeastApparition,
      size: 0.9,
      colour: 0xd8d0c4,
      stage: 0,
      scale: 0.82,
      position: [0, -1.48, 0],
      creature: true,
    },
    'tserriednich-guardian': {
      apparitionKind: 'chimera',
      build: buildGuardianApparition,
      size: 0.95,
      colour: 0x9e6d89,
      stage: 0,
      scale: 0.95,
      position: [0, -1.35, 0],
      creature: true,
    },
    'tserriednich-second': {
      apparitionKind: 'tserriednich-second',
      build: buildRoyalBeastApparition,
      size: 0.9,
      colour: 0xb79f8e,
      stage: 0,
      scale: 0.92,
      position: [0, -1.35, 0],
      creature: true,
    },
    'camilla-guardian': {
      apparitionKind: 'medusa',
      build: buildGuardianApparition,
      size: 1.05,
      colour: 0xb7879f,
      stage: 0,
      scale: 0.86,
      position: [0, -0.3, 0],
      creature: true,
    },
    'tubeppa-guardian': {
      apparitionKind: 'toad',
      build: buildGuardianApparition,
      size: 1.1,
      colour: 0x8ca58f,
      stage: 0,
      scale: 0.9,
      position: [0, -1.35, 0],
      creature: true,
    },
    'zhang-lei-guardian': {
      apparitionKind: 'wheel',
      build: buildMechanicalApparition,
      size: 1.1,
      colour: 0xc79f4b,
      stage: 4,
      scale: 0.88,
      position: [0, -0.1, 0],
      creature: true,
    },
    'tyson-guardian': {
      apparitionKind: 'tyson-guardian',
      build: buildMechanicalApparition,
      size: 0.95,
      colour: 0xcf7898,
      stage: 1,
      scale: 1.05,
      position: [0, 0, 0],
      creature: true,
    },
    'luzurus-guardian': {
      apparitionKind: 'centipede',
      build: buildCrawlingApparition,
      size: 1.05,
      colour: 0x85704f,
      stage: 1,
      scale: 0.86,
      position: [0, -1.3, 0],
      creature: true,
    },
    'sale-sale-guardian': {
      apparitionKind: 'mouths',
      build: buildCrawlingApparition,
      size: 1,
      colour: 0xc99a78,
      stage: 0,
      scale: 0.9,
      position: [0, -0.25, 0],
      creature: true,
    },
    'momoze-guardian': {
      apparitionKind: 'sprite',
      build: buildSpriteApparition,
      size: 1,
      colour: 0xd3c9c3,
      stage: 0,
      scale: 0.92,
      position: [0, -1.35, 0],
      creature: true,
    },
    'marayam-guardian': {
      apparitionKind: 'dragon',
      build: buildDragonApparition,
      size: 1,
      colour: 0xb88662,
      stage: 0,
      scale: 0.84,
      position: [0, -1.42, 0],
      creature: true,
    },
    'cats-name': {
      apparitionKind: 'cat',
      build: buildAnimalApparition,
      size: 1.05,
      colour: 0xff8fab,
      stage: 2,
      scale: 0.88,
      position: [0, -1.4, 0],
      creature: true,
    },
    'stealth-dolphin': {
      apparitionKind: 'dolphin',
      build: buildSupportBeastApparition,
      size: 1,
      colour: 0x63d8ef,
      stage: 0,
      scale: 1,
      position: [0, -0.15, 0],
      creature: true,
    },
    'cookie-chan': {
      apparitionKind: 'cookie',
      build: buildSupportBeastApparition,
      size: 0.95,
      colour: 0xf0c7b2,
      stage: 0,
      scale: 0.86,
      position: [0, -1.45, 0],
      creature: true,
    },
    'blood-snakes': {
      apparitionKind: 'blood-snake',
      build: buildSupportBeastApparition,
      size: 1.2,
      colour: 0xeee9dd,
      stage: 2,
      scale: 1,
      position: [0, -0.4, 0],
      creature: true,
    },
    'nen-spider': {
      apparitionKind: 'nen-spider',
      build: buildSupportBeastApparition,
      size: 1.25,
      colour: 0xeee9dd,
      stage: 0,
      scale: 1,
      position: [0, -0.25, 0],
      creature: true,
    },
    blinky: {
      apparitionKind: 'hoover',
      build: buildObjectApparition,
      size: 1.25,
      colour: 0x9e91b7,
      stage: 0,
      scale: 1,
      position: [0, -0.75, 0],
      creature: true,
    },
    'dowsing-chain': {
      apparitionKind: 'chain',
      build: buildObjectApparition,
      size: 1.1,
      colour: 0xb9e9ff,
      stage: 0,
      scale: 1.2,
      position: [0, 0.25, 0],
    },
    'judgment-chain': {
      apparitionKind: 'vow-heart',
      build: buildVowApparition,
      size: 1,
      colour: 0xa9475b,
      stage: 1,
      scale: 0.92,
      position: [0, 0.1, 0],
    },
    'melody-flute': {
      apparitionKind: 'flute',
      build: buildObjectApparition,
      size: 1.25,
      colour: 0xd9c49a,
      stage: 0,
      scale: 1.1,
      position: [0, 0, 0],
      rotation: [0, 0, Math.PI / 3],
    },
    'moonlight-contract': {
      apparitionKind: 'contract',
      build: buildObjectApparition,
      size: 1.65,
      colour: 0xe8e1ca,
      stage: 1,
      scale: 1.05,
      position: [0, 0.1, 0],
    },
    'magical-worm': {
      apparitionKind: 'portal',
      build: buildWormPortal,
      size: 1.2,
      colour: 0x82cad0,
      stage: 0,
      scale: 1.05,
      position: [0, -0.05, 0],
      rotation: [0, 0, 0],
    },
    'fun-fun-cloth': {
      apparitionKind: 'cloth',
      build: buildMangaPropApparition,
      size: 1.25,
      colour: 0xb28bbf,
      stage: 0,
      scale: 1.05,
      position: [0, -0.2, 0],
    },
    'pain-packer': {
      apparitionKind: 'pain-armour',
      build: buildMangaPropApparition,
      size: 0.95,
      colour: 0x7d5a52,
      stage: 0,
      scale: 0.84,
      position: [0, -1.42, 0],
    },
    jupiter: {
      apparitionKind: 'jupiter',
      build: buildMangaPropApparition,
      size: 1.15,
      colour: 0xd5a86d,
      stage: 0,
      scale: 1,
      position: [0, 0, 0],
    },
    'indoor-fish': {
      apparitionKind: 'fish',
      build: buildObjectApparition,
      size: 1.2,
      colour: 0x76b8c8,
      stage: 0,
      scale: 1.08,
      position: [0, -0.1, 0],
      creature: true,
    },
    'secret-window': {
      apparitionKind: 'owl',
      build: buildBasicApparition,
      size: 1.15,
      colour: 0xa8b7d8,
      stage: 0,
      scale: 1.05,
      position: [0, -0.2, 0],
      creature: true,
    },
    'without-you': {
      apparitionKind: 'double',
      build: buildBasicApparition,
      size: 1,
      colour: 0xf6b8d1,
      stage: 0,
      scale: 1.1,
      position: [0, -1.45, 0],
    },
    biohazard: {
      apparitionKind: 'animal-object',
      build: buildBiohazardApparition,
      size: 1,
      colour: 0xd4cec6,
      stage: 0,
      scale: 1,
      position: [0, -1.2, 0],
      creature: true,
    },
    'lsdf-guards': {
      apparitionKind: 'lsdf-guard',
      build: buildLsdfApparition,
      size: 1,
      colour: 0xd8d5c8,
      stage: 5,
      scale: 0.92,
      position: [0, -0.15, 0],
    },
  }

  function canonicalModel() {
    const config = CANONICAL_MODELS[kind]
    const root = new THREE.Group()
    root.name = `canonical-${config.apparitionKind}`
    const cached = new Map<string, THREE.MeshBasicMaterial>()
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

      updateTechniqueAnimation(techniqueRig, techniqueProgress, time, techniqueActive)

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

  onMount(() => {
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
    host.appendChild(renderer.domElement)

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
    resizeObserver.observe(host)
    resize()
    frame = requestAnimationFrame(animate)

    return () => {
      mounted = false
      cancelAnimationFrame(frame)
      resizeObserver?.disconnect()
      disposeGroup(specimen)
      disposeGroup(environment)
      renderer.dispose()
      renderer.domElement.remove()
    }
  })
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
  {#if modelMeshCount === 0}
    <div class="model-loading" aria-hidden="true">
      <i></i>
      <span>{loadingLabel}</span>
    </div>
  {/if}
  <div class="drag-hint" aria-hidden="true">360°</div>
</button>

<style>
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
