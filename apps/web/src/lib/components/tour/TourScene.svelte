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
  import type { Ship, TierPlan } from '$lib/tour/blueprint'
  import { ceilingOf, entrySpace, spaceAt, spawnFacing, spawnPoint } from '$lib/tour/blueprint'
  import {
    EMPTY_WORLD,
    aimedSolid,
    aimedSpace,
    centroid,
    detachedOn,
    doorExit,
    emptiedOn,
    eyeHeightIn,
    heldSolidIds,
    eyesOf,
    linkIsOpen,
    paceOf,
    reachOf,
    shellsFor,
    solidWalls,
    walkedPlan,
    walksThroughWalls,
    wanderOffset,
    type TourWorld,
  } from '$lib/tour/hatsu'
  import { comfort, prefersReducedMotion, type Comfort } from '$lib/tour/comfort'
  import { buildSolidMesh, buildTierMesh } from '$lib/tour/mesh'
  import {
    SPRINT_SPEED,
    STICK_RADIUS,
    STICK_RIM,
    WALK_SPEED,
    bobOf,
    linkUnderfoot,
    resolveMovement,
    stepsIn,
    stickVector,
    walkInput,
    wallsNear,
    wayOutOfInterior,
  } from '$lib/tour/navigation'
  import { SEALED_DENSITY, fogDensityOf, reverbTime, settleDensity } from '$lib/tour/atmosphere'
  import { distanceToBoundary } from '$lib/tour/geometry'
  import {
    enterRoom,
    footstep,
    nearWall,
    setStepsMuffled,
    startSteps,
    stepsPlaying,
    stepsWereSilenced,
    stopSteps,
    toggleSteps,
  } from '$lib/audio/steps'
  import { visibleSpaces } from '$lib/tour/visibility'
  import type { Link, Space, Structure, Vec2 } from '$lib/tour/types'

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
    /**
     * Whether the walk is being driven by touch. Two-way: the scene decides it,
     * from the pointer the browser reports and from the first finger to land,
     * and the page reads it to stop telling a phone to click.
     */
    touch?: boolean
    /** Labels for the on-screen controls a touchscreen gets. */
    touchLabels: { move: string; cast: string }
    /**
     * What the button that silences the walk is called, in both states.
     *
     * The walk makes a noise — its own footsteps, and the room answering them —
     * so it has to be possible to stop it without leaving the page.
     */
    soundLabels: { silence: string; restore: string }
    /**
     * What the door or stairwell within reach is called, worded for a button
     * rather than for a key. `null` when there is nothing to take.
     */
    touchUseLabel?: string | null
    /** Where the visitor stands, for the mini-map. */
    position?: Vec2
    /** Which way they face, in radians, for the mini-map cone. */
    heading?: number
    /**
     * What Nen is currently doing to the ship. The scene is the only thing that
     * draws it; `$lib/tour/hatsu` is the only thing that decides it.
     */
    world?: TourWorld
    /** The colour of the technique holding the ship, for the aura shells. */
    auraColour?: string | null
    /** Whether a technique the walk answers to is active, so aiming is live. */
    aiming?: boolean
    /**
     * Paint the deck in what it is worth as evidence rather than in what its
     * rooms are for: the reveal. It changes nothing about the ship — the same
     * walls, the same solids — only what the surfaces say about themselves.
     */
    reveal?: boolean
    /** The room down the reticle, mirrored out for the read-out. */
    aimedAt?: Space | null
    /** The solid down the reticle, for the techniques that work on solids. */
    aimedSolidAt?: Structure | null
    /** Fired when the visitor casts on what they are facing. */
    onCast?: (spaceId: string | null, solidId: string | null) => void
    /** Fired whenever the visitor sets foot in a different space. */
    onArrive?: (spaceId: string | null) => void
    /**
     * Asked, on the same arrival, where Fugetsu's tunnel comes out — or `null`
     * when the visitor did not step into either of its ends.
     */
    onWorm?: (spaceId: string | null, arrivedFrom: string | null) => string | null
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
    touch = $bindable(false),
    touchLabels,
    soundLabels,
    touchUseLabel = null,
    position = $bindable([0, 0]),
    heading = $bindable(0),
    world = EMPTY_WORLD,
    auraColour = null,
    aiming = false,
    reveal = false,
    aimedAt = $bindable(null),
    aimedSolidAt = $bindable(null),
    onCast,
    onArrive,
    onWorm,
  }: Props = $props()

  const EYE_HEIGHT = 1.7
  /** Radians of yaw per pixel of pointer movement, before the visitor's own multiplier. */
  const LOOK_SENSITIVITY = 0.0022
  const MAX_PITCH = Math.PI / 2 - 0.05

  /**
   * How far the camera sees, in metres.
   *
   * The fog closes to the clear colour at 110 m and the two are the same
   * near-black, so anything past that is already invisible — the far plane was
   * at 600 m, which is four times the length of the ship and cost a depth range
   * spent on geometry nobody can see. Twenty metres of margin over the fog so
   * the plane itself never becomes a visible edge.
   */
  const VIEW_DISTANCE = 130

  /** A finger that moved less than this, in pixels, was a tap and not a drag. */
  const TAP_SLOP = 12

  let canvas = $state<HTMLCanvasElement | null>(null)
  let container = $state<HTMLDivElement | null>(null)
  let ready = $state(false)
  let failure = $state<string | null>(null)

  /**
   * The virtual joystick, as a vector inside the unit circle: `x` to the right,
   * `z` forward. The keyboard's held keys deliberately stay out of Svelte's
   * reactivity; this one cannot, because the knob is drawn from it.
   */
  let stick = $state<Vec2 | null>(null)
  let stickBase = $state<HTMLDivElement | null>(null)
  /** Which finger has the stick, so a second one looking around cannot steal it. */
  let stickFinger: number | null = null

  /** How hard the stick is being pushed, for the ring that says it is running. */
  const push = $derived(stick ? Math.hypot(stick[0], stick[1]) : 0)

  const setStick = (finger: Touch) => {
    const base = stickBase?.getBoundingClientRect()
    if (!base) return
    stick = stickVector(
      finger.clientX - (base.left + base.width / 2),
      finger.clientY - (base.top + base.height / 2),
    )
  }

  const gripStick = (event: TouchEvent) => {
    const finger = event.changedTouches[0]
    if (!finger || stickFinger !== null) return
    stickFinger = finger.identifier
    setStick(finger)
  }

  const dragStick = (event: TouchEvent) => {
    for (const finger of Array.from(event.changedTouches)) {
      if (finger.identifier === stickFinger) setStick(finger)
    }
  }

  const dropStick = (event: TouchEvent) => {
    for (const finger of Array.from(event.changedTouches)) {
      if (finger.identifier !== stickFinger) continue
      stickFinger = null
      stick = null
    }
  }

  onMount(() => {
    // A phone reports a coarse pointer and no hover, so the controls are there
    // before the first tap. Anything the query is unsure about — a hybrid
    // laptop, an old browser — waits for a finger to land instead.
    touch = window.matchMedia?.('(hover: none) and (pointer: coarse)').matches ?? false
  })

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

      // The same query `touch` is settled by, asked again here because the
      // renderer is made before the first finger can land on the glass.
      const coarse = window.matchMedia?.('(hover: none) and (pointer: coarse)').matches ?? false

      let renderer: import('three').WebGLRenderer
      try {
        // Multisampling on a phone is paid for at every one of a lot of pixels,
        // and on a display this dense it is buying an edge nobody can see. The
        // gold outlines are lines rather than geometry, so what it was mostly
        // smoothing is not there to be smoothed.
        renderer = new THREE.WebGLRenderer({ canvas, antialias: !coarse })
      } catch {
        failure = 'webgl'
        return
      }

      // A 3× display was rendering nine times the pixels of a 1× one for a walk
      // whose surfaces are flat colour. Capping at 1.5 costs about a percent of
      // apparent sharpness and 44% of the fragments.
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      renderer.setClearColor(0x050505)
      // The deck colours are true albedos now that `mesh.ts` hands over linear
      // values, and a linear render of them clips the headlamp's hot spot to
      // white while leaving the far end of a corridor as mud. The filmic curve
      // is what holds both ends: it rolls the lamp off instead of clipping it
      // and keeps the shadowed steel above black.
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1

      const scene = new THREE.Scene()
      /**
       * The air, which is a different air in every room.
       *
       * `FogExp2` rather than a near and a far plane: what the reconstruction
       * knows about a room is its size, and a density read off that size says the
       * same thing at every distance instead of drawing a hard band where the
       * linear ramp begins. One setting used to stand for a twelve-square-metre
       * office entrance and a six-thousand-square-metre promenade; now the
       * density comes off the longest chord of the footprint the visitor is
       * standing in, and eases over `SETTLE` when they cross a threshold — see
       * `$lib/tour/atmosphere`. Crossing a doorway is felt: the air opens.
       */
      const fog = new THREE.FogExp2(0x050505, 0.02)
      scene.fog = fog

      // The field of view is the visitor's to set: 72° is a wide-angle lens, and
      // on a laptop held at arm's length it is a fisheye that makes people ill.
      const camera = new THREE.PerspectiveCamera($comfort.fov, 1, 0.1, VIEW_DISTANCE)

      // The decks are unlit steel. Ambient and hemisphere light carry most of
      // the image so surfaces keep the colour they were given, and the lamp on
      // the visitor only picks out what is close — a strong lamp washes every
      // room to the same gold and flattens the walls out of existence.
      //
      // The intensities are set against linear albedos and the filmic curve
      // above; they are not a free parameter. Correcting the vertex colours
      // without touching these darkens the ship by about a stop and a half.
      const AMBIENT = 0.9
      const HEMISPHERE = 1
      const HEADLAMP = 18
      scene.add(new THREE.AmbientLight(0xfffff0, AMBIENT))
      scene.add(new THREE.HemisphereLight(0x9fb4c8, 0x140d0d, HEMISPHERE))
      const headlamp = new THREE.PointLight(0xffd9a0, HEADLAMP, 34, 1.4)
      scene.add(headlamp)
      // A raking light so two walls at right angles never take the same value.
      const raking = new THREE.DirectionalLight(0xfff4e0, 0.7)
      raking.position.set(0.4, 1, 0.25)
      scene.add(raking)

      /**
       * One face per surface, and it is the face that looks at the room.
       *
       * `DoubleSide` was hiding a real defect and paying for it twice. Eight
       * hundred and three pairs of walls on this ship are coplanar — 8 489 of the
       * 29 333 metres of partition, 28,9 % — because `wallSegments` runs per room
       * and two rooms either side of a bulkhead each emit their own face on the
       * same line at the same depth. Drawn both ways round, those two faces fight
       * for the depth buffer, which is the shimmer you get walking a corridor.
       * Culled to the front, the far room's face is simply not drawn: the shimmer
       * cannot happen, and every stretch of partition still has a face on each
       * side, each one lit by its own room. That is the whole reason the bake can
       * make a corridor and the cabin behind it two different places.
       *
       * It also halves the fragments, and it makes an inside-out surface visible
       * as a hole instead of leaving it to pass as ordinary steel — see
       * `MeshBuilder.quad` in `$lib/tour/mesh` for what has to hold for that.
       */
      const material = new THREE.MeshLambertMaterial({
        vertexColors: true,
        side: THREE.FrontSide,
      })

      // The gold outline the deck plans are drawn in, carried into three
      // dimensions: without it the decks read as one unbroken surface.
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0.32,
      })

      /**
       * The seams between the deck plates: dim steel, not the gold of the plans.
       *
       * This is the one thing a bare floor cannot tell the visitor — how fast they
       * are crossing it. A hundred-and-fifty-metre hall drawn as an unbroken sheet
       * reads the same at a walk as at a run, and the courses passing underfoot at
       * `PLATE_PITCH` are what turn the published measurement into something felt.
       * Faint on purpose: it is a texture to walk over, not a grid to read.
       */
      const seamMaterial = new THREE.LineBasicMaterial({
        color: 0x6f6256,
        transparent: true,
        opacity: 0.22,
      })

      /**
       * The decks already extruded, kept so a staircase taken twice does not
       * pay for the same geometry twice.
       *
       * A deck is a couple of hundred kilobytes of buffers and the ship has
       * five, so holding all of them costs about a megabyte — cheap enough that
       * the cache is never evicted. Only the deck being walked is in the scene;
       * the others sit here detached, uploaded to the GPU but not drawn.
       */
      // A plain record rather than a Map: the render loop owns this cache and
      // nothing in the markup reads it, so it must stay out of Svelte's
      // reactivity instead of driving it.

      /**
       * One room of a deck: its slice of the deck's buffers, drawn on its own.
       *
       * The deck is still one upload — every room's mesh points at the same
       * three `BufferAttribute`s and differs only in its draw range — but it is
       * no longer one thing to draw. That is what lets `visibleSpaces` switch
       * rooms off, and what gives the GPU a bounding sphere per room to frustum
       * cull against instead of a 145-metre sphere around the whole deck.
       */
      type Room = {
        spaceId: string
        mesh: import('three').Mesh
        edges: import('three').LineSegments
        /** The deck plating of this room, in its own dim material. */
        seams: import('three').LineSegments
      }
      /** A deck, as one group holding a mesh and an edge run per room. */
      type Built = { root: import('three').Group; rooms: Room[] }

      const decks: Record<string, Built | undefined> = {}
      // The reveal is a second painting of the same geometry, so it is cached
      // apart rather than evicting the deck it was turned on from.
      const revealedDecks: Record<string, Built | undefined> = {}
      let visible: Built | null = null

      /**
       * The remote eye: a second camera parked in a room, and the deck it is
       * looking at, which stays in the scene even when the visitor walks off it.
       * Declared here rather than beside `syncEye` because `loadTier` runs
       * before that block and has to know not to take the eye's deck away.
       */
      let eyeCamera: import('three').PerspectiveCamera | null = null
      let eyeDeck: Built | null = null
      let eyeKey = ''

      /** The plan as Nen leaves it: what is drawn, and what still stops you. */
      let activePlan: TierPlan | null = null
      let activeKey = ''

      /**
       * A deck as Nen currently leaves it. The empty suffix is the deck whole.
       */
      const worldKey = (nextTierId: string) =>
        `${nextTierId}::${emptiedOn(world, nextTierId, ship).sort().join(',')}` +
        `::${heldSolidIds(world).sort().join(',')}::${world.shut.slice().sort().join(',')}` +
        (reveal ? '::reveal' : '')

      /**
       * A deck Nen has taken a room out of, at most one per deck.
       *
       * The untouched decks are cached for the whole visit — five of them, and
       * a staircase taken twice should not pay twice. A deck with a room
       * swallowed out of it is not: every cast makes another one, so the last
       * variant of a deck is disposed as soon as a new one replaces it, or a
       * long enough session would hold a copy of the ship per cast.
       */
      const variants: Record<string, { key: string; built: Built } | undefined> = {}

      /**
       * One deck, extruded once and cut into rooms.
       *
       * The three vertex attributes and the edge attribute are made once and
       * handed to every room's geometry: three.js keys its GPU buffers by the
       * `BufferAttribute` object, so sharing them means one upload for the deck
       * however many rooms it has. Each room then differs only in its draw range
       * and in the bounding sphere `buildTierMesh` measured for it.
       */
      function extrude(nextTierId: string): Built {
        const mesh = buildTierMesh(walkedPlan(ship, world, nextTierId), { reveal })
        const position = new THREE.BufferAttribute(mesh.positions, 3)
        const normal = new THREE.BufferAttribute(mesh.normals, 3)
        const color = new THREE.BufferAttribute(mesh.colors, 3)
        const edgePosition = new THREE.BufferAttribute(mesh.edges, 3)
        const seamPosition = new THREE.BufferAttribute(mesh.seams, 3)

        const root = new THREE.Group()
        const rooms: Room[] = []

        for (const group of mesh.groups) {
          const centre = new THREE.Vector3(group.centre[0], group.centre[1], group.centre[2])

          const geometry = new THREE.BufferGeometry()
          geometry.setAttribute('position', position)
          geometry.setAttribute('normal', normal)
          geometry.setAttribute('color', color)
          geometry.setDrawRange(group.start, group.count)
          // Set by hand: `computeBoundingSphere` reads the whole attribute, so
          // every room would come back with the sphere of the entire deck and
          // nothing would ever be culled.
          geometry.boundingSphere = new THREE.Sphere(centre.clone(), group.radius)

          const edgeGeometry = new THREE.BufferGeometry()
          edgeGeometry.setAttribute('position', edgePosition)
          edgeGeometry.setDrawRange(group.edgeStart, group.edgeCount)
          edgeGeometry.boundingSphere = new THREE.Sphere(centre.clone(), group.radius)

          // The plating shares the room's sphere and its draw range, so it is
          // culled with the room rather than being a deck-wide grid.
          const seamGeometry = new THREE.BufferGeometry()
          seamGeometry.setAttribute('position', seamPosition)
          seamGeometry.setDrawRange(group.seamStart, group.seamCount)
          seamGeometry.boundingSphere = new THREE.Sphere(centre.clone(), group.radius)

          const roomMesh = new THREE.Mesh(geometry, material)
          const roomEdges = new THREE.LineSegments(edgeGeometry, edgeMaterial)
          const roomSeams = new THREE.LineSegments(seamGeometry, seamMaterial)
          root.add(roomMesh)
          root.add(roomEdges)
          root.add(roomSeams)
          rooms.push({
            spaceId: group.spaceId,
            mesh: roomMesh,
            edges: roomEdges,
            seams: roomSeams,
          })
        }

        return { root, rooms }
      }

      const dispose = (built: Built) => {
        for (const room of built.rooms) {
          room.mesh.geometry.dispose()
          room.edges.geometry.dispose()
          room.seams.geometry.dispose()
        }
      }

      /**
       * Variants replaced while they were still being drawn.
       *
       * Whatever is on screen — the deck under the visitor, the deck the eye is
       * watching — cannot be freed on the spot, and it cannot simply be dropped
       * either: `syncEye` rebuilds a deck without first letting go of `visible`,
       * so a cast on the deck the visitor is standing on would leave the old
       * buffers in the driver with nothing left pointing at them. They wait here
       * instead, and `sweepStale` frees them the frame nothing is drawing them.
       */
      const stale: Built[] = []

      function sweepStale() {
        for (let i = stale.length - 1; i >= 0; i--) {
          const built = stale[i]
          if (built === visible || built === eyeDeck) continue
          scene.remove(built.root)
          dispose(built)
          stale.splice(i, 1)
        }
      }

      function buildDeck(nextTierId: string) {
        const key = worldKey(nextTierId)

        if (key === `${nextTierId}::::::${reveal ? '::reveal' : ''}`) {
          const held = reveal ? revealedDecks : decks
          const built = held[nextTierId] ?? extrude(nextTierId)
          held[nextTierId] = built
          return { built, key }
        }

        const held = variants[nextTierId]
        if (held?.key === key) return { built: held.built, key }
        if (held) {
          if (held.built === visible || held.built === eyeDeck) stale.push(held.built)
          else dispose(held.built)
        }

        const built = extrude(nextTierId)
        variants[nextTierId] = { key, built }
        return { built, key }
      }

      /** State the render loop owns; Svelte state is only mirrored out of it. */
      let pointer: Vec2 = [0, 0]
      let yaw = 0
      let pitch = 0
      let currentTierId = ''

      /** How far the visitor has to move or turn before the HUD is told. */
      const REPORT_STEP = 0.25
      const REPORT_TURN = 0.02
      let reported: Vec2 = [0, 0]
      let reportedYaw = 0
      /** The shorter way round from `b` to `a`, so ±π never reads as a full turn. */
      const angleGap = (a: number, b: number) =>
        ((((a - b) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI

      /** Mirrors the visitor out at once, for a step the thresholds would miss. */
      function report() {
        reported = pointer
        reportedYaw = yaw
        position = pointer
        heading = yaw
      }

      // Keys held down. A plain record on purpose: the render loop reads it
      // sixty times a second and nothing in the markup depends on it, so it
      // must stay outside Svelte's reactivity rather than drive it.
      const pressed: Record<string, boolean> = {}
      const holding = (...codes: string[]) => codes.some((code) => pressed[code] === true)

      function loadTier(nextTierId: string, at?: Vec2) {
        const plan = ship.plans.get(nextTierId)
        if (!plan) return

        // The deck the eye is watching stays in the scene whether or not the
        // visitor is still standing on it: that is the whole of the remote feed.
        if (visible && visible !== eyeDeck) scene.remove(visible.root)
        // Off the screen and out of the way, so a variant it was holding open
        // can be freed the moment a new one takes its place.
        visible = null

        const { built, key } = buildDeck(nextTierId)
        scene.add(built.root)
        visible = built
        activeKey = key
        activePlan = walkedPlan(ship, world, nextTierId)

        currentTierId = nextTierId
        const entry = entrySpace(plan)
        pointer = at ?? spawnPoint(entry, plan.structures)
        if (!at) {
          yaw = spawnFacing(entry, pointer)
          pitch = 0
        }
        camera.position.set(pointer[0], plan.tier.elevation + EYE_HEIGHT, pointer[1])
        report()
      }

      /** Moves the visitor to a named space, changing deck if it is elsewhere. */
      function goTo(spaceId: string) {
        const space = ship.spaces.get(spaceId)
        if (!space) return
        const at = spawnPoint(space, ship.plans.get(space.tierId)?.structures ?? [])
        yaw = spawnFacing(space, at)
        pitch = 0
        if (space.tierId !== currentTierId) loadTier(space.tierId, at)
        else {
          pointer = at
          const plan = ship.plans.get(currentTierId)!
          camera.position.set(at[0], plan.tier.elevation + EYE_HEIGHT, at[1])
          report()
        }
        tierId = space.tierId
      }

      loadTier(tierId)

      // ── Nen ──────────────────────────────────────
      // Everything below draws what `$lib/tour/hatsu` decided. No branch here
      // knows what a technique is called: it reads the world and renders it.

      /** The outlines the aura holds open, drawn over the hull rather than in it. */
      const shellMaterial = new THREE.LineBasicMaterial({
        color: 0xd8b85e,
        transparent: true,
        opacity: 0.85,
        depthTest: false,
      })
      let shells: import('three').LineSegments | null = null
      let shellKey = ''

      /**
       * One buffer for every room the aura is holding, wherever it is.
       *
       * Depth testing is off on purpose: a doll four decks down has to keep its
       * outline through four decks of steel, or "no matter where I am" would be
       * a claim the picture contradicts.
       */
      function syncShells() {
        const ids = shellsFor(world, ship)
        const key = `${auraColour ?? ''}|${ids.slice().sort().join(',')}`
        if (key === shellKey) return
        shellKey = key

        if (shells) {
          scene.remove(shells)
          shells.geometry.dispose()
          shells = null
        }
        if (auraColour) shellMaterial.color.set(auraColour)
        if (!ids.length) return

        const points: number[] = []
        for (const id of ids) {
          const space = ship.spaces.get(id)
          const tier = space ? ship.tiers.find((candidate) => candidate.id === space.tierId) : null
          if (!space || !tier) continue
          const floor = tier.elevation + 0.05
          const top = tier.elevation + ceilingOf(space, tier) - 0.05
          const corners = space.footprint
          for (let i = 0; i < corners.length; i++) {
            const a = corners[i]
            const b = corners[(i + 1) % corners.length]
            points.push(a[0], floor, a[1], b[0], floor, b[1])
            points.push(a[0], top, a[1], b[0], top, b[1])
            points.push(a[0], floor, a[1], a[0], top, a[1])
          }
        }

        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3))
        shells = new THREE.LineSegments(geometry, shellMaterial)
        shells.renderOrder = 2
        scene.add(shells)
      }

      /** Parks the eye, or brings it home. It turns on the spot in `tick`. */
      function syncEye() {
        const space = world.eye ? ship.spaces.get(world.eye) : null
        const key = space ? `${space.id}|${worldKey(space.tierId)}` : ''
        if (key === eyeKey) return
        eyeKey = key

        if (eyeDeck) {
          // The deck the eye was watching goes back out of the scene unless the
          // visitor is standing on it.
          if (eyeDeck !== visible) scene.remove(eyeDeck.root)
          eyeDeck = null
        }
        if (!space) {
          eyeCamera = null
          return
        }

        const at = centroid(space)
        eyeCamera = new THREE.PerspectiveCamera(64, 1, 0.1, VIEW_DISTANCE)
        eyeCamera.position.set(at[0], eyeHeightIn(space, ship), at[1])

        const built = buildDeck(space.tierId).built
        if (built !== visible) scene.add(built.root)
        eyeDeck = built
      }

      /**
       * Sight sealed is not a filter over the picture: the lights go out and the
       * fog closes to arm's length, so the ship is still there and you cannot
       * see it, which is what the monkeys take.
       */
      let blinded = false

      function syncSight() {
        // Hearing is sealed one strike after sight, and the deck goes underwater
        // with the theme rather than falling silent: the ship is still making its
        // noises, the visitor has stopped receiving them.
        setStepsMuffled(world.sealed >= 2)

        const sealed = world.sealed >= 1
        if (sealed === blinded) return
        blinded = sealed
        // The density itself is eased in the frame loop, so the air closing to
        // arm's length is felt closing rather than cut to.
        headlamp.intensity = sealed ? 0 : HEADLAMP
        for (const light of scene.children) {
          if ((light as import('three').AmbientLight).isAmbientLight) {
            ;(light as import('three').AmbientLight).intensity = sealed ? 0 : AMBIENT
          }
          if ((light as import('three').HemisphereLight).isHemisphereLight) {
            ;(light as import('three').HemisphereLight).intensity = sealed ? 0 : HEMISPHERE
          }
        }
      }

      /** Rebuilds the deck under the visitor when Nen has changed what is in it. */
      function syncDeck() {
        const key = worldKey(currentTierId)
        if (key === activeKey) return
        const plan = ship.plans.get(currentTierId)
        if (!plan) return

        if (visible && visible !== eyeDeck) scene.remove(visible.root)
        visible = null
        const built = buildDeck(currentTierId).built
        if (built !== eyeDeck) scene.add(built.root)
        visible = built
        activeKey = key
        activePlan = walkedPlan(ship, world, currentTierId)
      }

      /**
       * Portal culling: which rooms of the decks in the scene are drawn.
       *
       * `$lib/tour/visibility` decides it, off the doorways the reconstruction
       * already derives. All this does is switch the meshes.
       *
       * The remote eye complicates it by exactly one case: it is a second camera
       * rendering the same scene from a room the visitor may be nowhere near, so
       * what it can see has to be switched on too. When it happens to be
       * watching the deck underfoot, the two sets are unioned rather than one
       * overwriting the other.
       */
      let shownKey = ''

      function applyVisibility(standingId: string | null) {
        const eyeSpace = world.eye ? ship.spaces.get(world.eye) : null
        const key = `${standingId ?? ''}::${activeKey}::${eyeKey}`
        if (key === shownKey) return
        shownKey = key

        // A list rather than a Map: there are at most two decks in the scene,
        // and the render loop owns this outright — nothing in the markup reads
        // it, so it must stay out of Svelte's reactivity rather than drive it.
        const wanted: { deck: Built; ids: Set<string> }[] = []
        const want = (deck: Built, ids: Set<string>) => {
          const held = wanted.find((entry) => entry.deck === deck)
          if (held) for (const id of ids) held.ids.add(id)
          else wanted.push({ deck, ids: new Set(ids) })
        }

        if (visible && activePlan) want(visible, visibleSpaces(activePlan, standingId))
        if (eyeDeck && eyeSpace) {
          const eyePlan = ship.plans.get(eyeSpace.tierId)
          if (eyePlan) want(eyeDeck, visibleSpaces(eyePlan, eyeSpace.id))
        }

        for (const { deck, ids } of wanted) {
          for (const room of deck.rooms) {
            const on = ids.has(room.spaceId)
            room.mesh.visible = on
            room.edges.visible = on
            room.seams.visible = on
          }
        }
      }

      /**
       * The solids the aura is holding, drawn one by one.
       *
       * They are out of the baked deck — `planWithout` drops them — so a solid
       * that is pushed, crushed or grown costs its own few dozen triangles and
       * not a re-extrusion of the deck it stands on. A solid Biohazard woke up
       * keeps its geometry and is moved by its object position instead, since
       * it changes place sixty times a second.
       */
      const solids: Record<
        string,
        | {
            key: string
            mesh: import('three').Mesh
            edges: import('three').LineSegments
            /** Where its geometry was baked, so it can be offset from there. */
            at: Vec2
          }
        | undefined
      > = {}

      function dropSolid(id: string) {
        const held = solids[id]
        if (!held) return
        scene.remove(held.mesh)
        scene.remove(held.edges)
        held.mesh.geometry.dispose()
        held.edges.geometry.dispose()
        delete solids[id]
      }

      function syncSolids() {
        const plan = ship.plans.get(currentTierId)
        if (!plan) return
        // A plain record rather than a Set: the render loop owns it and nothing
        // in the markup reads it, so it must stay out of Svelte's reactivity.
        const standing: Record<string, true> = {}

        for (const { structure, room } of detachedOn(ship, world, currentTierId)) {
          standing[structure.id] = true
          const key = JSON.stringify(structure)
          if (solids[structure.id]?.key === key) continue
          dropSolid(structure.id)

          const built = buildSolidMesh(structure, room, plan.tier)
          const geometry = new THREE.BufferGeometry()
          geometry.setAttribute('position', new THREE.BufferAttribute(built.positions, 3))
          geometry.setAttribute('normal', new THREE.BufferAttribute(built.normals, 3))
          geometry.setAttribute('color', new THREE.BufferAttribute(built.colors, 3))
          const edgeGeometry = new THREE.BufferGeometry()
          edgeGeometry.setAttribute('position', new THREE.BufferAttribute(built.edges, 3))

          const mesh = new THREE.Mesh(geometry, material)
          const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial)
          scene.add(mesh)
          scene.add(edges)
          solids[structure.id] = { key, mesh, edges, at: structure.at }
        }

        for (const id of Object.keys(solids)) if (!standing[id]) dropSolid(id)
      }

      /**
       * Where a solid is this instant, as against where its geometry was baked.
       *
       * A solid that wanders and one that is being carried both move every
       * frame, and neither is worth re-extruding for it: the same few dozen
       * triangles are drawn at an offset instead. `detachedOn` is the one place
       * that decides where they are, so the picture cannot drift from what the
       * collision test reads.
       */
      function driftSolids(seconds: number) {
        const moving = world.body.passengers.length
          ? new Map(
              detachedOn(ship, world, currentTierId, seconds, pointer).map((held) => [
                held.structure.id,
                held.structure.at,
              ]),
            )
          : null

        for (const [id, held] of Object.entries(solids)) {
          if (!held) continue
          const carried = moving?.get(id)
          const drift = carried
            ? ([carried[0] - held.at[0], carried[1] - held.at[1]] as Vec2)
            : world.solids[id]?.alive
              ? wanderOffset(id, seconds)
              : null
          held.mesh.position.set(drift ? drift[0] : 0, 0, drift ? drift[1] : 0)
          held.edges.position.copy(held.mesh.position)
        }
      }

      /** The room and the solid down the reticle, and the cast that lands on them. */
      const facing = () =>
        activePlan ? aimedSpace(activePlan, pointer, yaw, reachOf(world.body)) : null
      const facingSolid = () => {
        const plan = ship.plans.get(currentTierId)
        return plan ? aimedSolid(ship, world, plan, pointer, yaw, reachOf(world.body) / 2) : null
      }

      function cast() {
        onCast?.(facing()?.id ?? null, facingSolid()?.id ?? null)
      }

      // ── Input ────────────────────────────────────
      /**
       * Whether the key belongs to the page rather than to the walk.
       *
       * The listener is on `window`, so it hears every key pressed anywhere on
       * the page — including the five gangway buttons, the index of rooms and
       * the Hatsu bar. Space is how a focused button is pressed and the arrows
       * are how a list is walked; swallowing them there would leave a keyboard
       * visitor unable to work the page at all.
       */
      const typingElsewhere = (target: EventTarget | null) =>
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.closest('a, button, input, textarea, select, [role="button"], [tabindex]') !==
            null)

      /** One step to the side, in radians, as the visitor has set it. */
      const snapStep = () => ($comfort.snapAngle * Math.PI) / 180

      const onKeyDown = (event: KeyboardEvent) => {
        if (typingElsewhere(event.target)) return
        pressed[event.code] = true
        // Space and the arrows scroll the page underneath an engaged pointer.
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
          event.preventDefault()
        }
        // The arrows turn rather than sidestep: A and D already sidestep, and
        // without this there is no way to look around without a mouse — you
        // would walk the deck facing whichever way you spawned. A snap rather
        // than a glide because a keyboard has no small movement to give, and
        // because a view that jumps is easier on the stomach than one that
        // swings. `repeat` is dropped so a held key does not spin the camera.
        if (!event.repeat && (event.code === 'ArrowLeft' || event.code === 'ArrowRight')) {
          yaw += event.code === 'ArrowLeft' ? snapStep() : -snapStep()
        }
        if (event.code === 'KeyE' || event.code === 'Enter') takeLink()
        if (event.code === 'KeyF' && aiming) cast()
      }
      const onKeyUp = (event: KeyboardEvent) => {
        delete pressed[event.code]
      }

      function takeLink() {
        const found = untrack(() => availableLink)
        if (found) goTo(found.to)
      }

      /**
       * Starts the walk's own sound, once, if the visitor has not silenced it.
       *
       * Kept here rather than in the audio module because the *permission* is the
       * gesture: a browser hands back a suspended context until the visitor has
       * done something, and engaging the walk is that something.
       */
      let soundOffered = false
      function letItSound() {
        if (soundOffered || stepsWereSilenced()) return
        soundOffered = true
        startSteps()
      }

      let dragging = false
      /**
       * Yaw the mouse or the finger has asked for and the snap has not yet paid
       * out. Held across calls so a slow drag still turns: the movement is
       * accumulated and spent a step at a time, rather than each frame's couple
       * of pixels being rounded away to nothing.
       */
      let swung = 0
      const look = (dx: number, dy: number) => {
        const sensitivity = LOOK_SENSITIVITY * $comfort.sensitivity
        // Snap turning is the one thing that reliably settles a stomach: the view
        // is either still or already somewhere else, never swinging.
        if ($comfort.snapTurn) {
          swung -= dx * sensitivity
          const step = snapStep()
          while (Math.abs(swung) >= step) {
            const turn = Math.sign(swung) * step
            yaw += turn
            swung -= turn
          }
        } else {
          yaw -= dx * sensitivity
        }
        pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch - dy * sensitivity))
      }

      /**
       * When a finger was last on the glass. A tap is followed by a synthetic
       * mouse pair, and its movement deltas are undefined — taken as read they
       * would put NaN in the yaw. Timing it rather than reading `touch` keeps
       * the mouse working on a screen that has both.
       */
      let touchedAt = -Infinity
      const behindATap = () => performance.now() - touchedAt < 700

      const onMouseMove = (event: MouseEvent) => {
        if (behindATap() || !Number.isFinite(event.movementX)) return
        if (document.pointerLockElement === canvas) look(event.movementX, event.movementY)
        else if (dragging) look(event.movementX, event.movementY)
      }
      const onMouseDown = () => {
        if (behindATap()) return
        // With the pointer already captured, the click is the cast: the walk is
        // in first person and the reticle is where the aura goes. Before that,
        // the first click still has to be the one that takes the pointer.
        if (aiming && document.pointerLockElement === canvas) {
          cast()
          return
        }
        dragging = true
        canvas?.requestPointerLock?.()
      }
      const onMouseUp = () => {
        dragging = false
      }
      const onPointerLockChange = () => {
        engaged = document.pointerLockElement === canvas
        if (!engaged) for (const code of Object.keys(pressed)) delete pressed[code]
        // Taking the pointer is the visitor's own gesture, which is both the
        // browser's condition for making a sound and the right moment to start:
        // nothing is heard from a page being scrolled past. Unless they have
        // silenced the walk before, in which case it stays silent until asked.
        if (engaged) letItSound()
      }

      // Touch: dragging the view looks around, the stick in the corner walks,
      // and a tap that went nowhere is the cast — a phone has no pointer to
      // lock, so the click-to-cast path is closed to it.
      let lastTouch: { x: number; y: number } | null = null
      /**
       * Which finger is looking around, the way `stickFinger` names the one
       * walking. `touches` is every finger on the glass, so a thumb parked on
       * the stick is `touches[0]` and taking that one would freeze the camera
       * for as long as the visitor is walking — and, having gone nowhere,
       * would read as a tap and cast on its own at the end of it.
       */
      let lookFinger: number | null = null
      const named = (list: TouchList, identifier: number | null) =>
        Array.from(list).find((finger) => finger.identifier === identifier) ?? null
      let travelled = 0
      const onTouchStart = (event: TouchEvent) => {
        // Whatever the browser says about its pointer, a finger settles it.
        touch = true
        touchedAt = performance.now()
        // A phone has no pointer to lock, so the finger is the gesture.
        letItSound()
        if (lookFinger !== null) return
        const finger = Array.from(event.changedTouches).find(
          (candidate) => candidate.identifier !== stickFinger,
        )
        if (!finger) return
        lookFinger = finger.identifier
        lastTouch = { x: finger.clientX, y: finger.clientY }
        travelled = 0
      }
      const onTouchMove = (event: TouchEvent) => {
        touchedAt = performance.now()
        const finger = named(event.changedTouches, lookFinger)
        if (!finger || !lastTouch) return
        const dx = finger.clientX - lastTouch.x
        const dy = finger.clientY - lastTouch.y
        travelled += Math.hypot(dx, dy)
        look(dx * 1.6, dy * 1.6)
        lastTouch = { x: finger.clientX, y: finger.clientY }
      }
      const onTouchEnd = (event: TouchEvent) => {
        touchedAt = performance.now()
        if (!named(event.changedTouches, lookFinger)) return
        if (lastTouch && travelled < TAP_SLOP && aiming) cast()
        lastTouch = null
        lookFinger = null
      }
      /** A finger the system took away never meant to cast. */
      const onTouchCancel = (event: TouchEvent) => {
        if (!named(event.changedTouches, lookFinger)) return
        lastTouch = null
        lookFinger = null
      }

      canvas.addEventListener('mousedown', onMouseDown)
      canvas.addEventListener('touchstart', onTouchStart, { passive: true })
      canvas.addEventListener('touchmove', onTouchMove, { passive: true })
      canvas.addEventListener('touchend', onTouchEnd)
      canvas.addEventListener('touchcancel', onTouchCancel)
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup', onKeyUp)
      document.addEventListener('pointerlockchange', onPointerLockChange)

      /**
       * Resizing is deferred to the next frame.
       *
       * A dragged window edge fires the observer on every pixel, and each call
       * reallocates the drawing buffer — the one thing in this component that
       * makes the driver stall. Collapsing a burst of them into one resize per
       * frame is the whole of it; `pendingResize` is the handle, so a resize
       * still in the queue when the scene is torn down can be dropped.
       */
      let pendingResize = 0
      const applyResize = () => {
        pendingResize = 0
        if (!container) return
        const { clientWidth, clientHeight } = container
        if (!clientWidth || !clientHeight) return
        renderer.setSize(clientWidth, clientHeight, false)
        camera.aspect = clientWidth / clientHeight
        camera.updateProjectionMatrix()
      }
      const resize = new ResizeObserver(() => {
        if (pendingResize) return
        pendingResize = requestAnimationFrame(applyResize)
      })
      resize.observe(container)

      // ── Frame ────────────────────────────────────
      let previous = performance.now()

      /** Reused so the frame loop does not allocate a vector for the viewport. */
      const size = new THREE.Vector2()

      /**
       * How far the visitor has walked, in metres, ever.
       *
       * The gait and the footsteps are both counted off this rather than off the
       * clock, which is what keeps them on the ground: see `bobOf`.
       */
      let travelledOnFoot = 0
      let lastPace = 0
      /**
       * How much of the head's movement this visitor has asked for. Read once, on
       * the system's setting, rather than every frame.
       */
      const gaitAmplitude = prefersReducedMotion() ? 0 : 1

      /**
       * The air the current room wants, and the densities already measured.
       *
       * A plain record rather than a Map, like the rest of the render loop's own
       * state: the loop reads this sixty times a second and nothing in the markup
       * depends on it, so it must stay out of Svelte's reactivity rather than
       * drive it. Measured once per room — the longest chord of a sixty-corner
       * promenade is not worth walking every frame.
       */
      let fogTarget = 0.02
      const airOf: Record<string, number | undefined> = {}

      /** The room the door pair last delivered the visitor to. */
      let arrivedFrom: string | null = null
      /** The end of Fugetsu's tunnel the visitor was last delivered to. */
      let wormFrom: string | null = null
      let lastSpaceId: string | null = null
      let aimedId: string | null = null
      let aimedSolidId: string | null = null
      let sinceAim = 0

      const tick = (now: number) => {
        const delta = Math.min((now - previous) / 1000, 0.1)
        previous = now

        const plan = ship.plans.get(currentTierId)
        if (!plan) return

        syncDeck()
        syncSolids()
        syncShells()
        syncEye()
        syncSight()
        sweepStale()
        driftSolids(now / 1000)
        const walked = activePlan ?? plan
        // What the aura is holding is out of the deck's own wall list, so it
        // has to be put back for the collision test — where the technique left
        // it, and where the drift has it this instant.
        const loose = solidWalls(ship, world, currentTierId, now / 1000)

        // `code` is the physical key, so W A S D covers ZQSD on an AZERTY
        // layout without a second binding. The stick in the corner is added to
        // whatever the keys say rather than replacing it: a tablet with a
        // keyboard attached should not have to choose.
        const { strafe, advance, moving, running } = walkInput(
          {
            forward: holding('KeyW', 'KeyZ', 'ArrowUp'),
            back: holding('KeyS', 'ArrowDown'),
            left: holding('KeyA', 'KeyQ'),
            right: holding('KeyD'),
            sprint: holding('ShiftLeft', 'ShiftRight'),
          },
          stick,
        )
        // Jump-only mode leaves the ship where it is and takes away the moving
        // camera: the plan and the index still put the visitor in any room, and
        // nothing walks them there.
        // A camera at yaw looks along (-sin, -cos) and has (cos, -sin) to its
        // right, which is what three.js does to (0, 0, -1) and (1, 0, 0). Wanted
        // whether or not the visitor is moving: the lamp hangs off the same pair.
        const sin = Math.sin(yaw)
        const cos = Math.cos(yaw)

        if (moving && !$comfort.jumpOnly) {
          const speed = (running ? SPRINT_SPEED : WALK_SPEED) * paceOf(world.body) * delta
          const target: Vec2 = [
            pointer[0] + (advance * -sin + strafe * cos) * speed,
            pointer[1] + (advance * -cos + strafe * -sin) * speed,
          ]
          // Luini walks through the walls rather than around them, so the move
          // is taken whole and the collision pass is simply not run.
          const from = pointer
          pointer = walksThroughWalls(world)
            ? target
            : resolveMovement(pointer, target, wallsNear([...walked.walls, ...loose], pointer, 6))
          // Ground actually covered, which is not what was asked for: a visitor
          // pushing into a bulkhead has stopped walking, and their gait and their
          // footsteps both have to know it.
          travelledOnFoot += Math.hypot(pointer[0] - from[0], pointer[1] - from[1])
        }

        const standing = spaceAt(plan, pointer)
        applyVisibility(standing?.id ?? null)

        /**
         * The head's rise and fall, off the distance walked rather than the clock.
         *
         * A visitor who has asked their system for less movement gets none of it:
         * a view that swings while the body does not is the thing that actually
         * makes people ill, and `$lib/tour/comfort` is where that is argued.
         */
        const bob = bobOf(travelledOnFoot, gaitAmplitude * (running ? 1.5 : 1))
        const eye = plan.tier.elevation + eyesOf(world.body, EYE_HEIGHT) + bob.rise
        camera.position.set(pointer[0], eye, pointer[1])
        camera.rotation.set(0, 0, 0)
        camera.rotateY(yaw)
        camera.rotateX(pitch)
        camera.rotateZ(bob.roll)

        // One pace, one footstep, on the same counter the head is dipping to — so
        // the sound lands with the foot at every speed and never drifts off it.
        const paces = stepsIn(travelledOnFoot)
        if (paces !== lastPace) {
          lastPace = paces
          footstep(paces, { running })
        }

        // The lamp is worn, not held at the eye: thirty centimetres to the left of
        // the visitor's head and thirty below it. At the viewpoint, N·L is N·V on
        // every surface at once — the light lands wherever the eye is already
        // looking, which is the one place it cannot model anything, and every wall
        // came out flat for it. Off to one side, the same wall has a lit edge and a
        // shaded one, and a corridor has corners again.
        headlamp.position.set(pointer[0] - cos * 0.3, eye - 0.3, pointer[1] + sin * 0.3)
        if (standing) headlamp.distance = Math.max(22, ceilingOf(standing, plan.tier) * 4)

        // The air of the room, and the room's answer to a footstep. Both are read
        // off the size of the space the visitor is standing in, both are eased
        // rather than cut, and neither costs a triangle or a byte of new data.
        if (standing) {
          let density = airOf[standing.id]
          if (density === undefined) {
            density = fogDensityOf(standing)
            airOf[standing.id] = density
          }
          fogTarget = density
        }
        fog.density = settleDensity(fog.density, blinded ? SEALED_DENSITY : fogTarget, delta)

        // Mirror the loop's state out for the HUD, without re-rendering on
        // every frame: these only change when they actually change.
        if (standing?.id !== untrack(() => currentSpace)?.id) currentSpace = standing
        // Standing on a stairwell offers it; standing anywhere inside an interior
        // offers the way out of it, because a seven-room apartment does not mark
        // which room the front door is in and a visitor who jumped straight to
        // the bedroom never passed the vestibule.
        const link = linkIsOpen(world, standing?.id ?? null)
          ? (linkUnderfoot(ship.links, standing?.id ?? null, pointer) ??
            (standing ? wayOutOfInterior(ship.links, plan.tier) : null))
          : null
        if (link?.to !== untrack(() => availableLink)?.to) availableLink = link
        // `position` is a fresh array every frame, so assigning it unguarded
        // invalidates whatever reads it — the minimap, which redraws a hull, a
        // few dozen dotted paths and its legends, on the thread that has to get
        // the next frame out. A quarter of a metre and a degree or so is below
        // what the minimap can show anyway, and takes it from 60 Hz to a walking
        // pace of about eight.
        if (Math.hypot(pointer[0] - reported[0], pointer[1] - reported[1]) >= REPORT_STEP) {
          reported = pointer
          position = pointer
          // The reverberation belongs to the room, but the first reflection is a
          // distance: crossing a hall, the near wall goes from arm's length to
          // fifty metres, and the ear hears the room open around it. Moved on the
          // same quarter-metre threshold the minimap is, not every frame.
          if (standing) nearWall(distanceToBoundary(pointer, standing.footprint))
        }
        if (Math.abs(angleGap(yaw, reportedYaw)) >= REPORT_TURN) {
          reportedYaw = yaw
          heading = yaw
        }

        // Setting foot in a room is the event the hideout doors and the paper
        // dolls both wait on. Walking about inside one is not.
        const standingId = standing?.id ?? null
        if (standingId !== lastSpaceId) {
          lastSpaceId = standingId
          // Sabine on the volume the blueprint already gives, crossfaded over the
          // threshold: a cabin rings for half a second and the promenade for four.
          if (standing) {
            enterRoom(
              standing.id,
              reverbTime(standing, plan.tier),
              distanceToBoundary(pointer, standing.footprint),
            )
          }
          const exit = doorExit(world, standingId, arrivedFrom)
          arrivedFrom = exit
          onArrive?.(standingId)
          if (exit) {
            goTo(exit)
            return
          }
          const tunnel = onWorm?.(standingId, wormFrom)
          if (tunnel) {
            wormFrom = tunnel
            goTo(tunnel)
            return
          }
          wormFrom = null
        }

        // The reticle is polled rather than traced every frame: it walks the
        // floor plan, and nothing about it changes in a sixtieth of a second.
        if (aiming && ++sinceAim >= 6) {
          sinceAim = 0
          const faced = facing()
          if ((faced?.id ?? null) !== aimedId) {
            aimedId = faced?.id ?? null
            aimedAt = faced
          }
          const solid = facingSolid()
          if ((solid?.id ?? null) !== aimedSolidId) {
            aimedSolidId = solid?.id ?? null
            aimedSolidAt = solid
          }
        } else if (!aiming && aimedId !== null) {
          aimedId = null
          aimedAt = null
          aimedSolidId = null
          aimedSolidAt = null
        }

        const { width, height } = renderer.getSize(size)
        renderer.setScissorTest(false)
        renderer.setViewport(0, 0, width, height)
        renderer.render(scene, camera)

        // The eye's feed, inset in the corner: the same scene from where the eye
        // was left, however many decks away that is.
        if (eyeCamera) {
          eyeCamera.rotation.set(0, 0, 0)
          eyeCamera.rotateY(now / 6000)
          const feedWidth = Math.round(Math.min(320, width * 0.3))
          const feedHeight = Math.round(feedWidth * 0.62)
          const pad = 12
          const box: [number, number, number, number] = [
            width - feedWidth - pad,
            height - feedHeight - pad,
            feedWidth,
            feedHeight,
          ]
          eyeCamera.aspect = feedWidth / feedHeight
          eyeCamera.updateProjectionMatrix()
          renderer.setViewport(...box)
          renderer.setScissor(...box)
          renderer.setScissorTest(true)
          renderer.autoClear = false
          renderer.clear(true, true, false)
          renderer.render(scene, eyeCamera)
          renderer.autoClear = true
          renderer.setScissorTest(false)
        }
      }

      /**
       * The walk only runs while it is on screen.
       *
       * The scene sits above a page of prose — the index of rooms, the sources,
       * the Hatsu bar — and scrolling past it used to leave a first-person
       * renderer running at sixty frames a second on a canvas nobody was
       * looking at. `setAnimationLoop` rather than a hand-rolled
       * `requestAnimationFrame` chain because it is the one three.js can also
       * hand to a headset, and because stopping it is one call rather than a
       * cancelled handle and a flag.
       */
      const watching = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            // The clock is reset, or the first frame back charges the walk for
            // however long the visitor spent reading further down the page.
            previous = performance.now()
            renderer.setAnimationLoop(tick)
          } else {
            renderer.setAnimationLoop(null)
          }
        },
        { threshold: 0 },
      )
      watching.observe(container)

      renderer.setAnimationLoop(tick)
      ready = true

      cleanup = () => {
        renderer.setAnimationLoop(null)
        watching.disconnect()
        if (pendingResize) cancelAnimationFrame(pendingResize)
        resize.disconnect()
        canvas?.removeEventListener('mousedown', onMouseDown)
        canvas?.removeEventListener('touchstart', onTouchStart)
        canvas?.removeEventListener('touchmove', onTouchMove)
        canvas?.removeEventListener('touchend', onTouchEnd)
        canvas?.removeEventListener('touchcancel', onTouchCancel)
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
        window.removeEventListener('keydown', onKeyDown)
        window.removeEventListener('keyup', onKeyUp)
        document.removeEventListener('pointerlockchange', onPointerLockChange)
        for (const built of Object.values(decks)) if (built) dispose(built)
        for (const held of Object.values(variants)) if (held) dispose(held.built)
        for (const built of stale) dispose(built)
        for (const key of Object.keys(decks)) delete decks[key]
        for (const key of Object.keys(variants)) delete variants[key]
        stale.length = 0
        visible = null
        eyeDeck = null
        eyeCamera = null
        for (const id of Object.keys(solids)) dropSolid(id)
        // The walk is over: no more footsteps, and the audio graph goes with it.
        stopSteps()
        shells?.geometry.dispose()
        shells = null
        shellMaterial.dispose()
        edgeMaterial.dispose()
        seamMaterial.dispose()
        material.dispose()
        renderer.dispose()
        // `dispose` frees what three.js allocated; the drawing buffer and the
        // context itself are the browser's, and a visitor who walks in and out
        // of the tour a few times would otherwise collect one of each until the
        // driver drops the oldest and takes a live canvas down with it.
        renderer.forceContextLoss()
      }

      // The page asks for a jump by setting `jumpTo`; honour it and clear it so
      // asking twice for the same space works.
      jump = (spaceId: string) => goTo(spaceId)
      // The camera is in this closure, so a field of view changed from the panel
      // has to be handed in rather than read out.
      relens = (settings: Comfort) => {
        camera.fov = settings.fov
        camera.updateProjectionMatrix()
      }
      // What E and F do, handed to the buttons a touchscreen gets instead.
      take = takeLink
      castNow = cast
    })()

    return () => {
      disposed = true
      cleanup?.()
    }
  })

  /** Assigned once the scene is live; the effect below waits for it. */
  let jump = $state<((spaceId: string) => void) | null>(null)
  /** The same, for the two things the on-screen buttons stand in for. */
  let take = $state<(() => void) | null>(null)
  let castNow = $state<(() => void) | null>(null)
  /** The same, for the one comfort setting the camera holds rather than reads. */
  let relens = $state<((settings: Comfort) => void) | null>(null)

  $effect(() => {
    relens?.($comfort)
  })

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

  <!-- The walk has a voice — its footsteps, and the room answering them — so it
       needs a way to be quietened without leaving the page. Top left, because the
       remote eye's feed is inset in the top right and the read-outs are along the
       bottom. Nothing sounds before the visitor engages the walk, and this
       remembers their answer for the next visit. -->
  {#if ready && !failure}
    <button
      type="button"
      onclick={() => toggleSteps()}
      aria-pressed={$stepsPlaying}
      title={$stepsPlaying ? soundLabels.silence : soundLabels.restore}
      class="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-[#FFD700]/40 bg-[#050505]/80 text-[#FFD700]/80 transition-colors hover:border-[#FFD700]/80 hover:text-[#FFD700]"
    >
      <span class="sr-only">{$stepsPlaying ? soundLabels.silence : soundLabels.restore}</span>
      <!-- A speaker, with the waves struck through when the walk is silent. -->
      <svg
        viewBox="0 0 24 24"
        class="h-4 w-4"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        aria-hidden="true"
      >
        <path d="M4 9.5h3L11 6v12l-4-3.5H4z" stroke-linejoin="round" />
        {#if $stepsPlaying}
          <path d="M15 9a4 4 0 0 1 0 6M17.5 6.5a7.5 7.5 0 0 1 0 11" stroke-linecap="round" />
        {:else}
          <path d="M15 9.5l5 5M20 9.5l-5 5" stroke-linecap="round" />
        {/if}
      </svg>
    </button>
  {/if}

  <!-- The touchscreen's keyboard: a stick to walk with, and buttons for the two
       keys — E and F — that a phone has no way of pressing. Everything here is
       what the keys already do, routed through the same functions. -->
  {#if touch && ready && !failure}
    <!-- Jump-only mode has nothing for the stick to do, so it is not offered. -->
    {#if !$comfort.jumpOnly}
      <div
        bind:this={stickBase}
        role="application"
        aria-label={touchLabels.move}
        ontouchstart={gripStick}
        ontouchmove={dragStick}
        ontouchend={dropStick}
        ontouchcancel={dropStick}
        class="absolute bottom-4 left-4 h-28 w-28 touch-none rounded-full border bg-[#050505]/40 transition-colors"
        style:border-color={push > STICK_RIM ? 'rgb(255 215 0 / 0.9)' : 'rgb(255 215 0 / 0.35)'}
      >
        <!-- The knob is 44px across, so half of it is the offset that centres it. -->
        <span
          class="pointer-events-none absolute left-1/2 top-1/2 block h-11 w-11 rounded-full border border-[#FFD700]/70 bg-[#FFD700]/25"
          style:transform="translate({(stick?.[0] ?? 0) * STICK_RADIUS - 22}px, {-(
            stick?.[1] ?? 0
          ) *
            STICK_RADIUS -
            22}px)"
        ></span>
      </div>
    {/if}

    <!-- Clear of the page's own read-out, which sits in the bottom corner. -->
    <div class="absolute bottom-14 right-4 flex flex-col items-end gap-2">
      {#if touchUseLabel}
        <button
          type="button"
          onclick={() => take?.()}
          class="max-w-[13rem] touch-none rounded border border-[#FFD700]/60 bg-[#050505]/90 px-3 py-2 text-left text-xs leading-snug text-[#FFD700]"
        >
          {touchUseLabel}
        </button>
      {/if}
      {#if aiming}
        <button
          type="button"
          onclick={() => castNow?.()}
          class="touch-none rounded border bg-[#050505]/90 px-4 py-2 text-xs uppercase tracking-widest"
          style:border-color={auraColour
            ? `color-mix(in srgb, ${auraColour} 70%, transparent)`
            : ''}
          style:color={auraColour ?? '#FFFFF0'}
        >
          {touchLabels.cast}
        </button>
      {/if}
    </div>
  {/if}
</div>
