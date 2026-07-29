<script lang="ts">
  /**
   * The first-person walk through the reconstruction.
   *
   * All this component does is drive a camera: the geometry comes from
   * `$lib/tour/mesh`, the collisions from `$lib/tour/navigation`, and the ship
   * itself from `data/ship/blueprint.json`. Nothing here knows about the
   * timeline, and nothing here touches the `/ship` map — the two views share the
   * catalogue and nothing else.
   *
   * three.js is pulled in on mount rather than imported at the top of the
   * module so the server never has to evaluate a WebGL library to render a page.
   */
  import { onMount, untrack } from 'svelte'
  import type { Ship } from '$lib/tour/blueprint'
  import { ceilingOf, entrySpace, spaceAt, spawnFacing, spawnPoint } from '$lib/tour/blueprint'
  import { buildTierMesh } from '$lib/tour/mesh'
  import { linkUnderfoot, resolveMovement, wallsNear } from '$lib/tour/navigation'
  import type { Link, Space, Vec2 } from '$lib/tour/types'

  interface Props {
    ship: Ship
    /** The deck being walked. Two-way: stairs change it from inside. */
    tierId: string
    /** The space the visitor currently stands in. */
    currentSpace?: Space | null
    /** The stairwell within reach, if any. */
    availableLink?: { link: Link; to: string } | null
    /** Set to jump the visitor somewhere; cleared once honoured. */
    jumpTo?: string | null
    /** Whether the pointer is captured, so the page can say how to get out. */
    engaged?: boolean
    /** Where the visitor stands, for the mini-map. */
    position?: Vec2
    /** Which way they face, in radians, for the mini-map cone. */
    heading?: number
    /** Shown while three.js and the first deck are being prepared. */
    loadingLabel: string
    /** Shown instead of the walk when the browser cannot give us WebGL. */
    unsupportedLabel: string
  }

  let {
    ship,
    loadingLabel,
    unsupportedLabel,
    tierId = $bindable(),
    currentSpace = $bindable(null),
    availableLink = $bindable(null),
    jumpTo = $bindable(null),
    engaged = $bindable(false),
    position = $bindable([0, 0]),
    heading = $bindable(0),
  }: Props = $props()

  const EYE_HEIGHT = 1.7
  const WALK_SPEED = 6
  const SPRINT_SPEED = 16
  const LOOK_SENSITIVITY = 0.0022
  const MAX_PITCH = Math.PI / 2 - 0.05

  let canvas = $state<HTMLCanvasElement | null>(null)
  let container = $state<HTMLDivElement | null>(null)
  let ready = $state(false)
  let failure = $state<string | null>(null)

  onMount(() => {
    let disposed = false
    let cleanup: (() => void) | null = null

    ;(async () => {
      let THREE: typeof import('three')
      try {
        THREE = await import('three')
      } catch {
        failure = 'webgl'
        return
      }
      if (disposed || !canvas || !container) return

      let renderer: import('three').WebGLRenderer
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
      } catch {
        failure = 'webgl'
        return
      }

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x050505)

      const scene = new THREE.Scene()
      scene.fog = new THREE.Fog(0x050505, 6, 110)

      const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 600)

      // The decks are unlit steel. Ambient and hemisphere light carry most of
      // the image so surfaces keep the colour they were given, and the lamp on
      // the visitor only picks out what is close — a strong lamp washes every
      // room to the same gold and flattens the walls out of existence.
      scene.add(new THREE.AmbientLight(0xfffff0, 0.75))
      scene.add(new THREE.HemisphereLight(0x9fb4c8, 0x140d0d, 0.85))
      const headlamp = new THREE.PointLight(0xffd9a0, 14, 34, 1.4)
      scene.add(headlamp)
      // A raking light so two walls at right angles never take the same value.
      const raking = new THREE.DirectionalLight(0xfff4e0, 0.55)
      raking.position.set(0.4, 1, 0.25)
      scene.add(raking)

      const material = new THREE.MeshLambertMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
      })
      let deck: import('three').Mesh | null = null

      // The gold outline the deck plans are drawn in, carried into three
      // dimensions: without it the decks read as one unbroken surface.
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0.32,
      })
      let deckEdges: import('three').LineSegments | null = null

      /** State the render loop owns; Svelte state is only mirrored out of it. */
      let pointer: Vec2 = [0, 0]
      let yaw = 0
      let pitch = 0
      let currentTierId = ''

      // Keys held down. A plain record on purpose: the render loop reads it
      // sixty times a second and nothing in the markup depends on it, so it
      // must stay outside Svelte's reactivity rather than drive it.
      const pressed: Record<string, boolean> = {}
      const holding = (...codes: string[]) => codes.some((code) => pressed[code] === true)

      function loadTier(nextTierId: string, at?: Vec2) {
        const plan = ship.plans.get(nextTierId)
        if (!plan) return

        if (deck) {
          scene.remove(deck)
          deck.geometry.dispose()
        }
        if (deckEdges) {
          scene.remove(deckEdges)
          deckEdges.geometry.dispose()
        }

        const mesh = buildTierMesh(plan)
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(mesh.positions, 3))
        geometry.setAttribute('normal', new THREE.BufferAttribute(mesh.normals, 3))
        geometry.setAttribute('color', new THREE.BufferAttribute(mesh.colors, 3))
        deck = new THREE.Mesh(geometry, material)
        scene.add(deck)

        const edgeGeometry = new THREE.BufferGeometry()
        edgeGeometry.setAttribute('position', new THREE.BufferAttribute(mesh.edges, 3))
        deckEdges = new THREE.LineSegments(edgeGeometry, edgeMaterial)
        scene.add(deckEdges)

        currentTierId = nextTierId
        const entry = entrySpace(plan)
        pointer = at ?? spawnPoint(entry)
        if (!at) {
          yaw = spawnFacing(entry, pointer)
          pitch = 0
        }
        camera.position.set(pointer[0], plan.tier.elevation + EYE_HEIGHT, pointer[1])
      }

      /** Moves the visitor to a named space, changing deck if it is elsewhere. */
      function goTo(spaceId: string) {
        const space = ship.spaces.get(spaceId)
        if (!space) return
        const at = spawnPoint(space)
        yaw = spawnFacing(space, at)
        pitch = 0
        if (space.tierId !== currentTierId) loadTier(space.tierId, at)
        else {
          pointer = at
          const plan = ship.plans.get(currentTierId)!
          camera.position.set(at[0], plan.tier.elevation + EYE_HEIGHT, at[1])
        }
        tierId = space.tierId
      }

      loadTier(tierId)

      // ── Input ────────────────────────────────────
      const onKeyDown = (event: KeyboardEvent) => {
        pressed[event.code] = true
        // Space and the arrows scroll the page underneath an engaged pointer.
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
          event.preventDefault()
        }
        if (event.code === 'KeyE' || event.code === 'Enter') takeLink()
      }
      const onKeyUp = (event: KeyboardEvent) => {
        delete pressed[event.code]
      }

      function takeLink() {
        const found = untrack(() => availableLink)
        if (found) goTo(found.to)
      }

      let dragging = false
      const look = (dx: number, dy: number) => {
        yaw -= dx * LOOK_SENSITIVITY
        pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch - dy * LOOK_SENSITIVITY))
      }

      const onMouseMove = (event: MouseEvent) => {
        if (document.pointerLockElement === canvas) look(event.movementX, event.movementY)
        else if (dragging) look(event.movementX, event.movementY)
      }
      const onMouseDown = () => {
        dragging = true
        canvas?.requestPointerLock?.()
      }
      const onMouseUp = () => {
        dragging = false
      }
      const onPointerLockChange = () => {
        engaged = document.pointerLockElement === canvas
        if (!engaged) for (const code of Object.keys(pressed)) delete pressed[code]
      }

      // Touch: dragging looks around. Walking is keyboard-only for now, so a
      // touchscreen visitor turns on the spot and travels through the space
      // index in the sidebar rather than on foot.
      let lastTouch: { x: number; y: number } | null = null
      const onTouchStart = (event: TouchEvent) => {
        const touch = event.touches[0]
        lastTouch = { x: touch.clientX, y: touch.clientY }
      }
      const onTouchMove = (event: TouchEvent) => {
        const touch = event.touches[0]
        if (!lastTouch) return
        look((touch.clientX - lastTouch.x) * 1.6, (touch.clientY - lastTouch.y) * 1.6)
        lastTouch = { x: touch.clientX, y: touch.clientY }
      }
      const onTouchEnd = () => {
        lastTouch = null
      }

      canvas.addEventListener('mousedown', onMouseDown)
      canvas.addEventListener('touchstart', onTouchStart, { passive: true })
      canvas.addEventListener('touchmove', onTouchMove, { passive: true })
      canvas.addEventListener('touchend', onTouchEnd)
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup', onKeyUp)
      document.addEventListener('pointerlockchange', onPointerLockChange)

      const resize = new ResizeObserver(() => {
        if (!container) return
        const { clientWidth, clientHeight } = container
        if (!clientWidth || !clientHeight) return
        renderer.setSize(clientWidth, clientHeight, false)
        camera.aspect = clientWidth / clientHeight
        camera.updateProjectionMatrix()
      })
      resize.observe(container)

      // ── Frame ────────────────────────────────────
      let previous = performance.now()
      let frame = 0

      const tick = (now: number) => {
        frame = requestAnimationFrame(tick)
        const delta = Math.min((now - previous) / 1000, 0.1)
        previous = now

        const plan = ship.plans.get(currentTierId)
        if (!plan) return

        // `code` is the physical key, so W A S D covers ZQSD on an AZERTY
        // layout without a second binding.
        const forward = Number(holding('KeyW', 'KeyZ', 'ArrowUp'))
        const back = Number(holding('KeyS', 'ArrowDown'))
        const left = Number(holding('KeyA', 'KeyQ', 'ArrowLeft'))
        const right = Number(holding('KeyD', 'ArrowRight'))

        let strafe = right - left
        let advance = forward - back
        const magnitude = Math.hypot(strafe, advance)
        if (magnitude > 0) {
          strafe /= magnitude
          advance /= magnitude
          const speed =
            (holding('ShiftLeft', 'ShiftRight') ? SPRINT_SPEED : WALK_SPEED) *
            delta
          // A camera at yaw looks along (-sin, -cos) and has (cos, -sin) to its
          // right, which is what three.js does to (0, 0, -1) and (1, 0, 0).
          const sin = Math.sin(yaw)
          const cos = Math.cos(yaw)
          const target: Vec2 = [
            pointer[0] + (advance * -sin + strafe * cos) * speed,
            pointer[1] + (advance * -cos + strafe * -sin) * speed,
          ]
          pointer = resolveMovement(pointer, target, wallsNear(plan.walls, pointer, 6))
        }

        const standing = spaceAt(plan, pointer)
        const eye = plan.tier.elevation + EYE_HEIGHT
        camera.position.set(pointer[0], eye, pointer[1])
        camera.rotation.set(0, 0, 0)
        camera.rotateY(yaw)
        camera.rotateX(pitch)

        headlamp.position.set(pointer[0], eye + 0.4, pointer[1])
        if (standing) headlamp.distance = Math.max(22, ceilingOf(standing, plan.tier) * 4)

        // Mirror the loop's state out for the HUD, without re-rendering on
        // every frame: these only change when they actually change.
        if (standing?.id !== untrack(() => currentSpace)?.id) currentSpace = standing
        const link = linkUnderfoot(ship.links, standing?.id ?? null, pointer)
        if (link?.to !== untrack(() => availableLink)?.to) availableLink = link
        position = pointer
        heading = yaw

        renderer.render(scene, camera)
      }

      frame = requestAnimationFrame(tick)
      ready = true

      cleanup = () => {
        cancelAnimationFrame(frame)
        resize.disconnect()
        canvas?.removeEventListener('mousedown', onMouseDown)
        canvas?.removeEventListener('touchstart', onTouchStart)
        canvas?.removeEventListener('touchmove', onTouchMove)
        canvas?.removeEventListener('touchend', onTouchEnd)
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
        window.removeEventListener('keydown', onKeyDown)
        window.removeEventListener('keyup', onKeyUp)
        document.removeEventListener('pointerlockchange', onPointerLockChange)
        deck?.geometry.dispose()
        deckEdges?.geometry.dispose()
        edgeMaterial.dispose()
        material.dispose()
        renderer.dispose()
      }

      // The page asks for a jump by setting `jumpTo`; honour it and clear it so
      // asking twice for the same space works.
      jump = (spaceId: string) => goTo(spaceId)
    })()

    return () => {
      disposed = true
      cleanup?.()
    }
  })

  /** Assigned once the scene is live; the effect below waits for it. */
  let jump = $state<((spaceId: string) => void) | null>(null)

  $effect(() => {
    const requested = jumpTo
    if (!requested || !jump) return
    jump(requested)
    jumpTo = null
  })
</script>

<div class="relative h-full w-full bg-[#050505]" bind:this={container}>
  <canvas bind:this={canvas} class="block h-full w-full cursor-crosshair touch-none"></canvas>

  {#if !ready && !failure}
    <div class="absolute inset-0 grid place-items-center text-sm text-[#FFFFF0]/60">
      {loadingLabel}
    </div>
  {/if}

  {#if failure}
    <div class="absolute inset-0 grid place-items-center p-8 text-center text-[#FFFFF0]/70">
      {unsupportedLabel}
    </div>
  {/if}
</div>
