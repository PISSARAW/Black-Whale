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
  import {
    ceilingOf,
    entrySpace,
    floorOf,
    spaceAt,
    spawnFacing,
    spawnPoint,
  } from '$lib/tour/blueprint'
  import {
    EMPTY_WORLD,
    OWL_FILM_SECONDS,
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
    solidById,
    solidNow,
    shellsFor,
    solidWalls,
    walkedPlan,
    walksThroughWalls,
    wanderOffset,
    type TourWorld,
  } from '$lib/tour/hatsu'
  import {
    apparitionsOn,
    wormMouthAt,
    wormMouths,
    type Apparition,
    type TourFlash,
  } from '$lib/tour/apparitions'
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
  import { driftDust, dustOf, type Dust } from '$lib/tour/dust'
  import { distanceToBoundary } from '$lib/tour/geometry'
  import {
    enterDeck,
    enterRoom,
    footstep,
    nearWall,
    setStepsMuffled,
    startSteps,
    stepsPlaying,
    rewindSound,
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
    /**
     * Where in that space to land, for the one arrival that has a point rather
     * than a room: Halkenburg's arrow puts the visitor where it fell.
     */
    jumpAt?: Vec2 | null
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
    /**
     * The one technique that is an event rather than a thing, and the count of
     * how many have been cast.
     *
     * A blast and a punch leave nothing standing, so they are not in the world:
     * the page hands one over, the walk plays it out and forgets it. The
     * sequence number is what makes casting the same blast at the same room
     * twice two events rather than one — the value is otherwise identical, and
     * an unchanged prop is not a second cast.
     */
    flash?: (TourFlash & { seq: number }) | null
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
     * Asked every couple of seconds while Chrollo's fish are loose.
     *
     * They eat what they touch, and what they touch is a matter of how long
     * they have been swimming — which is the scene's clock and nobody else's.
     * What they take is still the pure layer's decision.
     */
    onFish?: () => void
    /**
     * Asked every few seconds while Secret Window's free bird is out.
     *
     * The bird is the other thing aboard that moves without being cast at: it
     * works its way through the ship a door at a time, on the same clock the
     * fish feed on. Which door it takes is the pure layer's decision.
     */
    onOwl?: () => void
    /**
     * Asked once a second while a bird is materialized.
     *
     * Secret Window holds for twenty seconds and then it is gone. The count is
     * the clock's, so the walk says only that a second went by; what that does
     * to the bird, and what it hands back when the twenty are up, is the pure
     * layer's.
     */
    onOwlSecond?: () => void
    /**
     * Asked every tenth of a second for polarity marks to detonate.
     */
    onPolarity?: (seconds: number) => void
    /**
     * Asked every few seconds while Little Eye's insect is out scouting.
     *
     * The bird is the other thing aboard that moves without being cast at: it
     * works its way through the ship a door at a time, on the same clock the
     * fish feed on. Which door it takes is the pure layer's decision.
     */
    onScout?: () => void
    /**
     * Whether the technique in hand is one that throws a thread.
     *
     * Machi's stitches mend, and the walk has nothing torn in it that a visitor
     * can reach on foot — so what the thread is for here is reaching it: it
     * takes hold of whatever is down the reticle and pulls. The cast itself
     * goes through `onCast` exactly as every other one does; this only says
     * that the walk should also swing.
     */
    swings?: boolean
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
    jumpAt = $bindable(null),
    engaged = $bindable(false),
    touch = $bindable(false),
    touchLabels,
    soundLabels,
    touchUseLabel = null,
    position = $bindable([0, 0]),
    heading = $bindable(0),
    world = EMPTY_WORLD,
    auraColour = null,
    flash = null,
    aiming = false,
    reveal = false,
    aimedAt = $bindable(null),
    aimedSolidAt = $bindable(null),
    onCast,
    onArrive,
    onWorm,
    onFish,
    onOwl,
    onOwlSecond,
    onPolarity,
    onScout,
    swings = false,
  }: Props = $props()

  /**
   * How high the visitor's eye is off the floor.
   *
   * `HORIZON` in `$lib/tour/mesh` is the same number and has to stay it: the sea
   * is cut into the two panes at the height the eye looking through them meets
   * the horizon, and the pane is baked once while this is read every frame.
   */
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
      // The deck colours are true albedos, and the emissive surfaces are written
      // above white on purpose — a fitting at 2,4 and a window pane at 1,28. A
      // linear render clips all of that to flat white and leaves the far end of a
      // corridor as mud. The filmic curve is what holds both ends: it rolls a lamp
      // off instead of clipping it and keeps shadowed steel above black. It is also
      // what `syncSight` closes when the monkeys take sight.
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

      /**
       * The ship lights itself now, and the visitor is no longer a lamp.
       *
       * Everything that used to carry the image is gone: an ambient, a hemisphere,
       * a raking directional, and an eighteen-unit point light screwed to the
       * visitor's head. That headlamp was the reason five decks looked like one
       * deck — every room was lit by the same source, which was you, so no room was
       * lit by itself. What replaces it is what `mesh.ts` has been baking into the
       * vertices all along: the fittings of each room, its corners and creases, and
       * the two windows.
       *
       * The single `AmbientLight` that remains is not lighting, it is exposure. A
       * Lambert surface shows `albedo × (ambient + Σ lights)`, so one flat white
       * ambient shows the baked colour multiplied by a constant and nothing else —
       * the bake *is* the image, and the two lights below add to it rather than
       * standing in for it. The material stays Lambert rather than becoming Basic
       * for exactly that reason: Basic takes no lights at all, and both of those
       * have to exist.
       *
       * `AMBIENT` is 2,2 because that is what the four lights it replaces averaged
       * over a surface — 0,9 of ambient, about 1 of hemisphere and about 0,35 of the
       * raking directional. It is deliberately not 1: `RoomLight` in `mesh.ts` was
       * built so its mean shade comes out near unity *against those intensities*, so
       * a unity ambient here would not be a purer statement, it would be the whole
       * ship a stop and a half darker than anything was tuned for. What this change
       * takes away is the visitor as a light source, which is what flattened the five
       * decks into one; what it deliberately does not touch is the exposure.
       *
       * Going darker still — the plan's "black is black" — is a second change and a
       * separate argument: it means lowering `LIGHT.fill`, the floor the bake gives
       * every surface before a single fitting is counted, and that is a number to
       * settle by looking at the ship on a real screen rather than by reasoning.
       *
       * What is left dynamic:
       *
       * - the night-light, a few metres of reach on the visitor, and the visitor's
       *   to turn off entirely from the comfort panel. Not a headlamp: it is the
       *   safety net for a stairwell the plans put no lamp over, and at this
       *   intensity it cannot flatten the room it is standing in.
       * - the Nen aura, when a technique is up: see `syncShells`. It becomes the
       *   only coloured light on the ship, so a technique *lights* the deck rather
       *   than drawing an outline on it.
       */
      const AMBIENT = 2.2
      const NIGHT_LIGHT = 1.2
      scene.add(new THREE.AmbientLight(0xffffff, AMBIENT))
      // Its reach is the visitor's to set, down to nothing: see `nightLight` in
      // `$lib/tour/comfort` for why that is a setting and not a constant.
      const nightLight = new THREE.PointLight(
        0xffd9a0,
        $comfort.nightLight > 0 ? NIGHT_LIGHT : 0,
        $comfort.nightLight,
        2,
      )
      scene.add(nightLight)

      /**
       * The aura as a light, not as an outline.
       *
       * Parked at zero intensity and moved with the visitor: the shells already
       * draw the reach of a technique in its own colour, and this makes that colour
       * fall on the steel. It is the only light on the ship that is not white or a
       * filament, which is the point — Nen is the one thing aboard that is not the
       * ship.
       */
      const AURA_LIGHT = 2.4
      const auraLight = new THREE.PointLight(0xffffff, 0, 14, 2)
      scene.add(auraLight)

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
       * The ceiling fittings: the one surface on the deck that is a light.
       *
       * `MeshBasicMaterial`, because a lamp must not be lit — run through the
       * Lambert material it would take the night-light and the ambient like any other
       * steel and come out as a pale square, which is a vent, not a lamp.
       *
       * What they burn at comes from the buffer rather than from here — see
       * `FITTING_GLOW` and `fittingColors` in `$lib/tour/mesh`, which is also
       * where the values above 1 and the dimming of an invented room's lamps are
       * argued. The material only has to agree not to light them.
       *
       * Fog is left on. A row of fittings running away down a hundred and forty
       * metres of corridor, each one dimmer than the last, is the whole point of
       * drawing them: it is the only thing in the walk that makes the length of
       * this ship countable.
       */
      const fittingMaterial = new THREE.MeshBasicMaterial({
        vertexColors: true,
        side: THREE.FrontSide,
      })

      /**
       * The dust of the ten great voids.
       *
       * Warm grey rather than white, because the only thing lighting it is the
       * ship's own filaments, and additive at a low opacity so a mote is a
       * suggestion of a mote. `sizeAttenuation` is the whole point: the motes near
       * the visitor are specks and the ones fifty metres off are barely there, and
       * that gradient is what says how deep the room is.
       */
      const dustMaterial = new THREE.PointsMaterial({
        color: 0xb9a88f,
        size: 0.07,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
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
        /** The room's ceiling fittings, in the one material that is not lit. */
        fittings: import('three').Mesh
        /** The dust hanging in one of the ten great voids, or nothing. */
        motes: import('three').Points | null
        dust: Dust | null
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

      /**
       * Secret Window's film: where the bird was, and the playback of it.
       *
       * The owl is materialized for twenty seconds and hands back the last
       * ten, so what the walk has to keep is the bird's own path — sampled on
       * the same tenth of a second the visitor's is, and for the same reason:
       * everything else in the scene is a function of the clock and can simply
       * be run again, and this is not. The playback is a third camera walking
       * that path, inset in the corner exactly as the eye's feed is.
       */
      let filmCamera: import('three').PerspectiveCamera | null = null
      let filmDeck: Built | null = null
      const filmTrack: { at: number; where: Vec2; y: number; tierId: string }[] = []
      let showing: { through: number; frames: typeof filmTrack } | null = null
      /** Whether there was a bird last frame, which is how its going is noticed. */
      let owlWasUp = false

      /**
       * The decks the far ends of Fugetsu's tunnel are looking at.
       *
       * The same arrangement as the eye's deck and for the same reason: a mouth
       * of the tunnel shows the room at the other end, and that room has to be
       * in the scene to be rendered, however many decks away it is.
       */
      const portalDecks: Built[] = []

      /**
       * Whether a deck is being drawn by something other than the visitor.
       *
       * The visitor's own deck is taken out of the scene the moment they leave
       * it — unless the eye is watching it, or a tunnel is looking through it,
       * in which case it stays.
       */
      const heldElsewhere = (built: Built | null) =>
        Boolean(built) && (built === eyeDeck || built === filmDeck || portalDecks.includes(built!))

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
        const fittingPosition = new THREE.BufferAttribute(mesh.fittings, 3)
        const fittingColor = new THREE.BufferAttribute(mesh.fittingColors, 3)

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

          // The fittings share the room's sphere and range for the same reason
          // the plating does: a lamp drawn while its room is culled is a light
          // hanging in the void where the room should be.
          const fittingGeometry = new THREE.BufferGeometry()
          fittingGeometry.setAttribute('position', fittingPosition)
          fittingGeometry.setAttribute('color', fittingColor)
          fittingGeometry.setDrawRange(group.fittingStart, group.fittingCount)
          fittingGeometry.boundingSphere = new THREE.Sphere(centre.clone(), group.radius)

          /**
           * The dust of a great void, where the room is one.
           *
           * Its own geometry rather than a slice of the deck's: the positions
           * change every frame, and the deck's buffers are uploaded once and never
           * touched again. Ten rooms on the ship have one — see `dustOf` — and the
           * cloud is only advanced while it is being drawn.
           */
          const space = ship.spaces.get(group.spaceId)
          const deck = ship.plans.get(nextTierId)
          // Not under the reveal, for the reason the lamps are not:
          // there every surface has to say what it is worth as evidence, and dust
          // is derived — it answers nothing about the sources.
          const dust = space && deck && !reveal ? dustOf(space, deck.tier) : null
          let motes: import('three').Points | null = null
          if (dust) {
            const moteGeometry = new THREE.BufferGeometry()
            moteGeometry.setAttribute('position', new THREE.BufferAttribute(dust.positions, 3))
            moteGeometry.boundingSphere = new THREE.Sphere(
              new THREE.Vector3(dust.centre[0], dust.centre[1], dust.centre[2]),
              dust.radius,
            )
            motes = new THREE.Points(moteGeometry, dustMaterial)
            // The cloud is written to every frame it is drawn, so three.js must
            // not be allowed to assume otherwise.
            moteGeometry.attributes.position.needsUpdate = true
          }

          const roomMesh = new THREE.Mesh(geometry, material)
          const roomEdges = new THREE.LineSegments(edgeGeometry, edgeMaterial)
          const roomSeams = new THREE.LineSegments(seamGeometry, seamMaterial)
          const roomFittings = new THREE.Mesh(fittingGeometry, fittingMaterial)
          root.add(roomMesh)
          root.add(roomEdges)
          root.add(roomSeams)
          root.add(roomFittings)
          if (motes) root.add(motes)
          rooms.push({
            spaceId: group.spaceId,
            mesh: roomMesh,
            edges: roomEdges,
            seams: roomSeams,
            fittings: roomFittings,
            motes,
            dust,
          })
        }

        return { root, rooms }
      }

      const dispose = (built: Built) => {
        for (const room of built.rooms) {
          room.mesh.geometry.dispose()
          room.edges.geometry.dispose()
          room.seams.geometry.dispose()
          room.fittings.geometry.dispose()
          room.motes?.geometry.dispose()
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
          if (built === visible || heldElsewhere(built)) continue
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
          if (held.built === visible || heldElsewhere(held.built)) stale.push(held.built)
          else dispose(held.built)
        }

        const built = extrude(nextTierId)
        variants[nextTierId] = { key, built }
        return { built, key }
      }

      /** State the render loop owns; Svelte state is only mirrored out of it. */
      let pointer: Vec2 = [0, 0]
      /** The floor the visitor is standing on, eased between rooms at a step. */
      let ground = 0
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
        if (visible && !heldElsewhere(visible)) scene.remove(visible.root)
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
        ground = floorOf(spaceAt(plan, pointer) ?? entry, plan.tier)
        camera.position.set(pointer[0], ground + EYE_HEIGHT, pointer[1])
        report()
        // How much of the machinery reaches this elevation. An interior carries
        // the elevation of the deck it is inside, so walking into a prince's
        // bathroom does not change what the hull sounds like — taking the stairs
        // down to the hold does, over a couple of seconds.
        enterDeck(plan.tier.elevation)
      }

      /**
       * Moves the visitor to a named space, changing deck if it is elsewhere.
       *
       * `landing` is for the one arrival that is not the room's own door: a
       * tunnel puts you where its far mouth stands, not where the stairs would.
       */
      function goTo(spaceId: string, landing?: Vec2) {
        const space = ship.spaces.get(spaceId)
        if (!space) return
        const at = landing ?? spawnPoint(space, ship.plans.get(space.tierId)?.structures ?? [])
        yaw = spawnFacing(space, at)
        pitch = 0
        if (space.tierId !== currentTierId) loadTier(space.tierId, at)
        else {
          pointer = at
          const plan = ship.plans.get(currentTierId)!
          ground = floorOf(space, plan.tier)
          camera.position.set(at[0], ground + EYE_HEIGHT, at[1])
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
        // The same colour, as light rather than as line. Raised only while a
        // technique is up, and dropped the moment it ends, so the deck goes back to
        // being lit by its own fittings.
        if (auraColour) auraLight.color.set(auraColour)
        auraLight.intensity = ids.length ? AURA_LIGHT : 0
        if (!ids.length) return

        const points: number[] = []
        for (const id of ids) {
          const space = ship.spaces.get(id)
          const tier = space ? ship.tiers.find((candidate) => candidate.id === space.tierId) : null
          if (!space || !tier) continue
          const floor = floorOf(space, tier) + 0.05
          const top = floorOf(space, tier) + ceilingOf(space, tier) - 0.05
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
          if (eyeDeck !== visible && !portalDecks.includes(eyeDeck)) scene.remove(eyeDeck.root)
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
        //
        // The light is taken at the eye rather than at the source: the ship stays
        // lit — the bake is in the vertices and cannot be switched off, which is
        // the honest way round — and the exposure goes to nothing. What the monkeys
        // take is sight, so what closes is the aperture and the air.
        renderer.toneMappingExposure = sealed ? 0.02 : 1
        // Restored to what the visitor asked for, which may be nothing at all.
        nightLight.intensity = sealed || $comfort.nightLight <= 0 ? 0 : NIGHT_LIGHT
        // The fittings are not lit, so putting the lights out does nothing to
        // them: blinded, the visitor would be left staring at three thousand
        // lamps in a ship they cannot otherwise see. They are hidden instead,
        // which is the same statement — the seal is on the eye, and an eye that
        // takes nothing in takes the lamps in too.
        fittingMaterial.visible = !sealed
      }

      /**
       * Luini's walls, which the visitor is about to walk through.
       *
       * Phasing was a collision test that stopped being run: from inside the
       * visitor's own head, the ship looked exactly as it always had until they
       * happened to lean on a bulkhead. The steel goes half-transparent instead
       * — the hull is still drawn, still lit, still there, and it has stopped
       * being a boundary, which is the one thing the technique says.
       */
      let phased = false

      function syncPhasing() {
        if (world.phasing === phased) return
        phased = world.phasing
        material.transparent = phased
        material.opacity = phased ? 0.42 : 1
        material.depthWrite = !phased
        material.needsUpdate = true
        edgeMaterial.opacity = phased ? 0.7 : 0.32
      }

      /** Rebuilds the deck under the visitor when Nen has changed what is in it. */
      function syncDeck() {
        const key = worldKey(currentTierId)
        if (key === activeKey) return
        const plan = ship.plans.get(currentTierId)
        if (!plan) return

        if (visible && !heldElsewhere(visible)) scene.remove(visible.root)
        visible = null
        const built = buildDeck(currentTierId).built
        if (!heldElsewhere(built)) scene.add(built.root)
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
        const mouths = wormMouths(ship, world)
        const key = `${standingId ?? ''}::${activeKey}::${eyeKey}::${mouths
          .map((mouth) => mouth.spaceId)
          .join(',')}`
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
        // What a mouth of the tunnel looks out on: the far room and whatever
        // can be seen from it, on whichever deck that is.
        for (const mouth of mouths) {
          const mouthPlan = ship.plans.get(mouth.tierId)
          const deck =
            portalDecks.find((built) =>
              built.rooms.some((room) => room.spaceId === mouth.spaceId),
            ) ?? null
          if (mouthPlan && deck) want(deck, visibleSpaces(mouthPlan, mouth.spaceId))
        }

        for (const { deck, ids } of wanted) {
          for (const room of deck.rooms) {
            const on = ids.has(room.spaceId)
            room.mesh.visible = on
            room.edges.visible = on
            room.seams.visible = on
            room.fittings.visible = on
            if (room.motes) room.motes.visible = on
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

          // The rest of the room comes with it so the solid keeps the room's
          // light: in the two rooms with a window, that includes the daylight.
          const built = buildSolidMesh(
            structure,
            room,
            plan.tier,
            plan.structures.filter((entry) => entry.spaceId === room.id),
          )
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
      /**
       * Moves the dust of whichever great void is on screen.
       *
       * Only the clouds actually being drawn: `syncVisible` has already switched
       * the rooms the visitor cannot see off, and a cloud nobody is looking at does
       * not need to have drifted while they were away — dust has no state anyone
       * can check. At most a few hundred motes in one room, which is a sine and a
       * cosine each.
       */
      function driftMotes(delta: number, seconds: number) {
        for (const deck of [visible, eyeDeck]) {
          if (!deck) continue
          for (const room of deck.rooms) {
            if (!room.motes || !room.dust || !room.motes.visible) continue
            driftDust(room.dust, delta, seconds)
            room.motes.geometry.attributes.position.needsUpdate = true
          }
        }
      }

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

      // ── What Nen leaves standing ─────────────────
      //
      // `$lib/tour/apparitions` says what is in the ship and where; everything
      // from here to the flash below is how it is made of triangles. The rule
      // the rest of this block keeps is the rule the shells keep: nothing here
      // knows a technique by name — it is handed a kind, a colour and a size.

      /**
       * One apparition on screen: the group it hangs in, and the key it was
       * built from, so a card that turns from blue to red is rebuilt and an
       * owl that has not changed is left alone.
       */
      type Shown = {
        key: string
        kind: Apparition['kind']
        root: import('three').Group
        /** The part that turns: a head, a card, a sigil. */
        turns: import('three').Object3D | null
        /** Where it hangs, before the hover is added to it. */
        y: number
        /** The middle of the room it swims, for the ones that do not stay put. */
        at: Vec2
        /** Its place in the shoal, so seven fish are not one fish drawn seven times. */
        stage: number
        /** How far it may get from `at`, in metres. */
        spread: number
        /** The far end, for a mouth of the tunnel. */
        pair: Apparition['pair']
        /** The disc the other end is rendered onto. */
        pane: import('three').Mesh | null
      }

      // A plain record for the same reason the solids are one: the render loop
      // owns it and nothing in the markup reads it.
      const apparitions: Record<string, Shown | undefined> = {}

      /** Materials are shared by colour: a fleet of stars is one upload. */
      const glowMaterials: Record<string, import('three').MeshBasicMaterial | undefined> = {}
      const glow = (colour: number, opacity: number) => {
        const key = `${colour}|${opacity}`
        const held = glowMaterials[key]
        if (held) return held
        const made = new THREE.MeshBasicMaterial({
          color: colour,
          transparent: true,
          opacity,
          depthWrite: opacity > 0.9,
          side: THREE.DoubleSide,
        })
        glowMaterials[key] = made
        return made
      }

      /**
       * The pane a mouth of the tunnel is filled with.
       *
       * Not a texture mapped onto a disc: the far end is rendered from where
       * the visitor's own head would be if it were standing at the other mouth,
       * so what fills the ring has to be sampled where it lands on the screen
       * rather than where it lands on the geometry. That is the whole of the
       * shader — clip space in, screen space out — and it is what makes the
       * ring read as a hole in the room instead of a picture hung in it.
       */
      const portalShader = (texture: import('three').Texture) =>
        new THREE.ShaderMaterial({
          uniforms: { pane: { value: texture } },
          vertexShader: `
            varying vec4 vClip;
            void main() {
              vClip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              gl_Position = vClip;
            }
          `,
          fragmentShader: `
            uniform sampler2D pane;
            varying vec4 vClip;
            void main() {
              vec2 uv = (vClip.xy / vClip.w) * 0.5 + 0.5;
              gl_FragColor = texture2D(pane, uv);
            }
          `,
          side: THREE.DoubleSide,
        })

      /** The render target each mouth draws the far end into, by apparition. */
      const portalTargets: Record<string, import('three').WebGLRenderTarget | undefined> = {}
      const portalCamera = new THREE.PerspectiveCamera($comfort.fov, 1, 0.1, VIEW_DISTANCE)

      function portalTarget(id: string) {
        const held = portalTargets[id]
        if (held) return held
        const { width, height } = renderer.getSize(new THREE.Vector2())
        // The pane is sampled in screen space, so the target has to be the
        // shape of the screen or the far room comes back stretched.
        const made = new THREE.WebGLRenderTarget(
          Math.max(2, Math.round(width)),
          Math.max(2, Math.round(height)),
        )
        portalTargets[id] = made
        return made
      }

      /** A five-pointed star, flat, in the plane it is drawn facing. */
      function starShape(size: number) {
        const shape = new THREE.Shape()
        for (let i = 0; i < 10; i++) {
          const angle = (Math.PI / 5) * i - Math.PI / 2
          const radius = i % 2 === 0 ? size : size * 0.42
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius
          if (i === 0) shape.moveTo(x, y)
          else shape.lineTo(x, y)
        }
        shape.closePath()
        return new THREE.ShapeGeometry(shape)
      }

      /**
       * One apparition, built out of primitives.
       *
       * Deliberately crude: the ship is flat colour and hard edges, and a
       * modelled owl would be the only thing aboard that was not. What each of
       * these has to do is be recognisable across a promenade at a glance —
       * a bird, a card, a sigil, a star, a person, a door.
       */
      function buildApparition(seen: Apparition): Shown {
        const root = new THREE.Group()
        const skin = glow(seen.colour, seen.hidden ? 0.18 : 0.92)
        let turns: import('three').Object3D | null = null
        let pane: import('three').Mesh | null = null

        if (seen.kind === 'owl') {
          const body = new THREE.Mesh(new THREE.SphereGeometry(seen.size, 10, 8), skin)
          body.scale.set(1, 1.3, 0.85)
          root.add(body)
          // The head turns on its own, which is the one thing everyone knows an
          // owl does, and it is what says the bird is watching rather than sitting.
          const head = new THREE.Group()
          head.position.y = seen.size * 1.35
          const skull = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.62, 10, 8), skin)
          head.add(skull)
          const eyes = glow(0xffe9a8, 1)
          for (const side of [-1, 1]) {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.2, 8, 6), eyes)
            eye.position.set(side * seen.size * 0.26, seen.size * 0.08, -seen.size * 0.5)
            head.add(eye)
            const ear = new THREE.Mesh(
              new THREE.ConeGeometry(seen.size * 0.16, seen.size * 0.4, 4),
              skin,
            )
            ear.position.set(side * seen.size * 0.34, seen.size * 0.55, 0)
            head.add(ear)
          }
          root.add(head)
          turns = head
        }

        if (seen.kind === 'card') {
          // One card per stage, fanned: the blue admission is still on the table
          // when the yellow restraint is laid over it.
          for (let i = 0; i < Math.max(1, seen.stage); i++) {
            const face = new THREE.Mesh(
              new THREE.PlaneGeometry(seen.size, seen.size * 1.5),
              glow([0x4d8ff0, 0xf0c94d, 0xe5484d][Math.min(2, i)], 0.9),
            )
            face.position.set(i * seen.size * 0.28, i * seen.size * 0.12, i * 0.01)
            face.rotation.z = (i - 1) * 0.16
            root.add(face)
          }
          turns = root
        }

        if (seen.kind === 'mark') {
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(seen.size, seen.size * 0.12, 6, 20),
            skin,
          )
          root.add(ring)
          // Three bars across it: a sigil rather than a hoop, and unmistakably
          // something put on the room rather than part of it.
          for (let i = 0; i < 3; i++) {
            const bar = new THREE.Mesh(
              new THREE.BoxGeometry(seen.size * 1.8, seen.size * 0.09, seen.size * 0.09),
              skin,
            )
            bar.rotation.z = (Math.PI / 3) * i
            root.add(bar)
          }
          turns = root
        }

        if (seen.kind === 'star') {
          const star = new THREE.Mesh(starShape(seen.size), skin)
          root.add(star)
          turns = star
        }

        // Bungee Gum's trap is a strand and a blob: the line is what you walk
        // into, and the gum at the middle of it is what makes it obvious the
        // line is not a wire. Nothing about it moves — the point of In is that
        // there is no tell — so the slow turn the group gets is all it does.
        if (seen.kind === 'gum') {
          const strand = new THREE.Mesh(
            new THREE.CylinderGeometry(seen.size * 0.035, seen.size * 0.035, seen.size * 2, 6),
            skin,
          )
          strand.rotation.z = Math.PI / 2
          root.add(strand)
          const blob = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.16, 8, 6), skin)
          blob.scale.set(1, 0.7, 1)
          root.add(blob)
          turns = root
        }

        if (seen.kind === 'double') {
          const body = new THREE.Mesh(
            new THREE.CapsuleGeometry(seen.size * 0.3, seen.size * 1.1, 4, 8),
            glow(seen.colour, 0.42),
          )
          body.position.y = seen.size * 0.15
          root.add(body)
          const head = new THREE.Mesh(
            new THREE.SphereGeometry(seen.size * 0.26, 10, 8),
            glow(seen.colour, 0.42),
          )
          head.position.y = seen.size * 1.05
          root.add(head)
          turns = root
        }

        if (seen.kind === 'insect') {
          // A body the size of a thumbnail and two wings, inside a sphere of
          // aura twice its width: what the technique puts in the room is the
          // sphere, and the animal is only what carries it.
          const shell = glow(seen.colour, 0.3)
          const body = new THREE.Mesh(new THREE.SphereGeometry(seen.size, 8, 6), skin)
          body.scale.set(1.6, 0.8, 0.9)
          root.add(body)
          for (const side of [-1, 1]) {
            const wing = new THREE.Mesh(
              new THREE.PlaneGeometry(seen.size * 1.5, seen.size * 0.9),
              shell,
            )
            wing.position.set(0, seen.size * 0.5, side * seen.size * 0.7)
            wing.rotation.x = Math.PI / 2
            root.add(wing)
          }
          const sphere = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 2.1, 10, 8), shell)
          root.add(sphere)
          turns = root
        }

        if (seen.kind === 'fish') {
          // A body and a tail, and that is a fish: the walk is flat colour and
          // hard edges, and a modelled carp would be the only thing aboard that
          // was not. What it has to be is unmistakably swimming.
          const body = new THREE.Mesh(new THREE.SphereGeometry(seen.size, 8, 6), skin)
          body.scale.set(1.7, 0.75, 0.75)
          root.add(body)
          const tail = new THREE.Mesh(new THREE.ConeGeometry(seen.size * 0.55, seen.size, 4), skin)
          tail.rotation.z = Math.PI / 2
          tail.position.x = seen.size * 1.7
          root.add(tail)
          const eye = new THREE.Mesh(
            new THREE.SphereGeometry(seen.size * 0.16, 6, 5),
            glow(0xfff3d0, 1),
          )
          eye.position.set(-seen.size * 1.1, seen.size * 0.2, seen.size * 0.35)
          root.add(eye)
          turns = root
        }

        if (seen.kind === 'paper') {
          const scrap = new THREE.Mesh(new THREE.PlaneGeometry(seen.size, seen.size * 1.4), skin)
          root.add(scrap)
          // The head and the two arms of a cut-out figure, which is what makes
          // it a doll rather than a stuck note.
          const head = new THREE.Mesh(new THREE.CircleGeometry(seen.size * 0.3, 8), skin)
          head.position.y = seen.size * 0.85
          root.add(head)
          turns = root
        }

        if (seen.kind === 'puppet') {
          // Ink and paper: a black kimono that falls to the floor, sleeves,
          // a bob, and the painted face that is the only pale thing on her.
          const ink = glow(seen.colour, 1)
          const pale = glow(0xefe7dd, 1)

          const kimono = new THREE.Mesh(
            new THREE.CylinderGeometry(seen.size * 0.34, seen.size * 0.62, seen.size * 1.35, 8),
            ink,
          )
          kimono.position.y = seen.size * 0.68
          root.add(kimono)

          // White obi belt
          const obi = new THREE.Mesh(
            new THREE.CylinderGeometry(seen.size * 0.38, seen.size * 0.41, seen.size * 0.22, 10),
            pale,
          )
          obi.position.y = seen.size * 0.85
          root.add(obi)

          // White crossed collar
          for (const side of [-1, 1]) {
            const lapel = new THREE.Mesh(
              new THREE.BoxGeometry(seen.size * 0.1, seen.size * 0.45, seen.size * 0.05),
              pale,
            )
            lapel.rotation.z = side * 0.5
            lapel.position.set(0, seen.size * 1.15, seen.size * (0.31 + side * 0.01))
            root.add(lapel)
          }

          for (const side of [-1, 1]) {
            const sleeve = new THREE.Mesh(
              new THREE.BoxGeometry(seen.size * 0.3, seen.size * 0.62, seen.size * 0.3),
              ink,
            )
            sleeve.position.set(side * seen.size * 0.45, seen.size * 0.95, 0)
            root.add(sleeve)
          }

          const face = new THREE.Mesh(new THREE.SphereGeometry(seen.size * 0.24, 10, 8), pale)
          face.position.y = seen.size * 1.6
          root.add(face)

          // Zipper on the face
          const zipper = new THREE.Mesh(
            new THREE.BoxGeometry(seen.size * 0.03, seen.size * 0.28, seen.size * 0.02),
            ink,
          )
          zipper.position.set(0, seen.size * 1.57, seen.size * 0.235)
          root.add(zipper)

          // Crosses on the cheeks
          for (const side of [-1, 1]) {
            const crossV = new THREE.Mesh(
              new THREE.BoxGeometry(seen.size * 0.03, seen.size * 0.15, seen.size * 0.02),
              ink,
            )
            crossV.position.set(side * seen.size * 0.12, seen.size * 1.58, seen.size * 0.21)
            root.add(crossV)

            const crossH = new THREE.Mesh(
              new THREE.BoxGeometry(seen.size * 0.1, seen.size * 0.03, seen.size * 0.02),
              ink,
            )
            crossH.position.set(side * seen.size * 0.12, seen.size * 1.6, seen.size * 0.21)
            root.add(crossH)
          }

          // The bob: the hair is the silhouette, and the silhouette is how she
          // is recognised across a room she has just appeared in the far side of.
          const hair = new THREE.Mesh(
            new THREE.CylinderGeometry(seen.size * 0.28, seen.size * 0.3, seen.size * 0.42, 10),
            ink,
          )
          hair.position.y = seen.size * 1.68
          root.add(hair)
          turns = root
        }

        if (seen.kind === 'hoover') {
          // A canister, a hose and a nozzle: the one apparition in the walk
          // that is a machine. It is carried rather than placed, so the group
          // is built facing forward and `driftApparitions` puts it at the hip.
          const canister = new THREE.Mesh(
            new THREE.CylinderGeometry(seen.size * 0.55, seen.size * 0.6, seen.size * 1.1, 12),
            glow(seen.colour, 1),
          )
          root.add(canister)
          const hose = new THREE.Mesh(
            new THREE.CylinderGeometry(seen.size * 0.12, seen.size * 0.12, seen.size * 1.6, 6),
            glow(seen.colour, 0.9),
          )
          hose.rotation.z = Math.PI / 2.6
          hose.position.set(seen.size * 0.7, seen.size * 0.5, -seen.size * 0.4)
          root.add(hose)
          const nozzle = new THREE.Mesh(
            new THREE.ConeGeometry(seen.size * 0.34, seen.size * 0.6, 8),
            glow(seen.colour, 1),
          )
          nozzle.rotation.x = -Math.PI / 2
          nozzle.position.set(seen.size * 1.25, seen.size * 0.95, -seen.size * 0.9)
          root.add(nozzle)
          // What is in the bag, as light through the canister: an empty Blinky
          // is dark, and one holding five is lit.
          if (seen.stage) {
            const full = new THREE.Mesh(
              new THREE.SphereGeometry(seen.size * 0.42, 10, 8),
              glow(0x9be8ff, Math.min(0.85, 0.25 + seen.stage * 0.14)),
            )
            root.add(full)
          }
          turns = null
        }

        if (seen.kind === 'cargo') {
          const crate = new THREE.Mesh(
            new THREE.BoxGeometry(seen.size, seen.size, seen.size),
            glow(seen.colour, 0.7),
          )
          root.add(crate)
          const bands = new THREE.Mesh(
            new THREE.TorusGeometry(seen.size * 0.85, seen.size * 0.06, 4, 12),
            glow(seen.colour, 1),
          )
          bands.rotation.x = Math.PI / 2
          root.add(bands)
          turns = root
        }

        if (seen.kind === 'portal') {
          const rim = new THREE.Mesh(
            new THREE.TorusGeometry(seen.size, seen.size * 0.09, 8, 32),
            glow(seen.colour, 1),
          )
          root.add(rim)
          // The far end, or — while only one mouth has been placed — the
          // technique's own colour, so an unpaired door still reads as a door.
          pane = new THREE.Mesh(
            new THREE.CircleGeometry(seen.size, 32),
            seen.pair ? portalShader(portalTarget(seen.id).texture) : glow(seen.colour, 0.22),
          )
          pane.renderOrder = 1
          root.add(pane)
          turns = root
        }

        return {
          key: '',
          kind: seen.kind,
          root,
          turns,
          y: seen.y,
          at: seen.at,
          stage: seen.stage,
          spread: seen.spread ?? 0,
          pair: seen.pair,
          pane,
        }
      }

      function dropApparition(id: string) {
        const held = apparitions[id]
        if (!held) return
        scene.remove(held.root)
        portalTargets[id]?.dispose()
        delete portalTargets[id]
        held.root.traverse((part) => {
          const mesh = part as import('three').Mesh
          if (mesh.geometry) mesh.geometry.dispose()
        })
        delete apparitions[id]
      }

      /** Puts what the world says is standing into the scene, and takes out the rest. */
      function syncApparitions() {
        // Where the walk is, for the one apparition that follows it.
        const wanted = apparitionsOn(ship, world, { at: pointer, tierId: currentTierId })
        const standing: Record<string, true> = {}

        for (const seen of wanted) {
          standing[seen.id] = true
          // Everything the geometry depends on. Position is not in it: a thing
          // that moved is moved, not rebuilt.
          const key = `${seen.kind}|${seen.stage}|${seen.colour}|${seen.size}|${seen.hidden}|${seen.pair?.spaceId ?? ''}`
          let held = apparitions[seen.id]
          if (held && held.key !== key) {
            dropApparition(seen.id)
            held = undefined
          }
          if (!held) {
            held = buildApparition(seen)
            held.key = key
            apparitions[seen.id] = held
            scene.add(held.root)
          }
          held.y = seen.y
          held.at = seen.at
          held.stage = seen.stage
          held.spread = seen.spread ?? 0
          held.pair = seen.pair
          held.root.position.set(seen.at[0], seen.y, seen.at[1])
        }

        for (const id of Object.keys(apparitions)) if (!standing[id]) dropApparition(id)
      }

      /**
       * The decks the far ends of the tunnel are on, kept in the scene.
       *
       * A mouth showing a room five decks down is showing a deck that is not
       * otherwise built, so it is built here and held for as long as the tunnel
       * stands. The visitor's own deck is never added twice.
       */
      let portalDeckKey = ''

      function syncPortalDecks() {
        const mouths = wormMouths(ship, world)
        const key = mouths.map((mouth) => `${mouth.spaceId}:${worldKey(mouth.tierId)}`).join('|')
        if (key === portalDeckKey) return
        portalDeckKey = key

        for (const built of portalDecks) {
          if (built !== visible && built !== eyeDeck) scene.remove(built.root)
        }
        portalDecks.length = 0
        for (const mouth of mouths) {
          const built = buildDeck(mouth.tierId).built
          if (portalDecks.includes(built)) continue
          portalDecks.push(built)
          scene.add(built.root)
        }
        // A deck that has just come into the scene has every room switched off
        // from the last time it was culled; the next pass decides again.
        shownKey = ''
      }

      /**
       * The two mouths, rendered into each other.
       *
       * The camera is put where the visitor's head would be if it were standing
       * at the *other* end, looking the same way: what you see through a door in
       * this room is what you would see standing in that one. The panes are
       * hidden while it runs, because a mirror drawn into a mirror is either an
       * infinite regress or a black disc, and neither is a door.
       */
      function renderPortals() {
        const mouths = Object.entries(apparitions).filter(([, held]) => held?.kind === 'portal')
        if (!mouths.length) return

        for (const [, held] of mouths) if (held?.pane) held.pane.visible = false

        for (const [id, held] of mouths) {
          if (!held?.pair || !held.pane) continue
          const target = portalTarget(id)
          portalCamera.fov = camera.fov
          portalCamera.aspect = camera.aspect
          portalCamera.updateProjectionMatrix()
          portalCamera.position.set(held.pair.at[0], held.pair.y, held.pair.at[1])
          portalCamera.quaternion.copy(camera.quaternion)
          renderer.setRenderTarget(target)
          renderer.clear()
          renderer.render(scene, portalCamera)
          renderer.setRenderTarget(null)
        }

        for (const [, held] of mouths) if (held?.pane) held.pane.visible = true
      }

      /**
       * What the apparitions do while nobody is casting anything.
       *
       * All of it is a sine: an owl's head turning, a card riding on the air, a
       * sigil rotating, a double breathing. It costs nothing, and without it the
       * technique reads as a prop left in the room rather than as aura.
       */
      function driftApparitions(seconds: number) {
        for (const [id, held] of Object.entries(apparitions)) {
          if (!held) continue
          const phase = seconds + id.length

          if (held.kind === 'hoover') {
            // Worn at the hip, on the visitor's right, pointing where they are:
            // it is a thing they are carrying, not a thing in the room.
            const sin = Math.sin(yaw)
            const cos = Math.cos(yaw)
            held.root.position.set(
              camera.position.x + cos * 0.55 - sin * 0.5,
              camera.position.y - 0.85 + Math.sin(phase * 2) * 0.03,
              camera.position.z - sin * 0.55 - cos * 0.5,
            )
            held.root.rotation.y = yaw
            continue
          }

          if (held.kind === 'puppet') {
            // Standing, gone, standing again somewhere else in the same room.
            // The clock is hers: a station is held for a few seconds, and the
            // going and the coming back are the same second of it.
            const beat = 5.5
            const step = Math.floor(phase / beat)
            const through = (phase % beat) / beat
            // Where she is this time round: a fixed wander about her station,
            // inside the water the room gave her, so she never stands in steel.
            const angle = step * 2.399963
            const reach = held.spread * (0.35 + ((step * 7) % 5) * 0.13)
            held.root.position.set(
              held.at[0] + Math.cos(angle) * reach,
              held.y,
              held.at[1] + Math.sin(angle) * reach,
            )
            // Gone for the last fifth of the beat, and back for the first: she
            // is not seen arriving or leaving, which is the whole of her.
            const there = through > 0.08 && through < 0.82
            held.root.visible = there
            // And now and then she turns and looks at you. Every third station,
            // which is often enough to notice and seldom enough to be a look.
            const watching = step % 3 === 0
            held.root.rotation.y = watching
              ? Math.atan2(
                  camera.position.x - held.root.position.x,
                  camera.position.z - held.root.position.z,
                )
              : angle * 1.7
            continue
          }

          if (held.kind === 'fish') {
            // An aquarium: each fish on its own ellipse about the middle of the
            // room, at its own speed and its own depth, nose first.
            const turn = phase * (0.25 + (held.stage % 4) * 0.06) + held.stage
            const reach = held.spread * (0.45 + (held.stage % 3) * 0.22)
            const x = held.at[0] + Math.cos(turn) * reach
            const z = held.at[1] + Math.sin(turn) * reach * 0.7
            held.root.position.set(x, held.y + Math.sin(phase * 0.7 + held.stage) * 0.35, z)
            // Nose along the way it is going: the tail is on +x, so the body
            // points the other way round.
            held.root.rotation.y = -turn + Math.PI / 2
            continue
          }

          if (held.kind === 'insect') {
            // Not a ring: a fly does not orbit. Two sines that do not divide
            // into each other, so it never comes back round the same way, and
            // a fast one on the height because that is what reads as wings.
            held.root.position.set(
              held.at[0] + Math.sin(phase * 1.7) * held.spread,
              held.y + Math.sin(phase * 2.6) * 0.18,
              held.at[1] + Math.sin(phase * 1.1 + 1.3) * held.spread,
            )
            // Nose along the way it is going, which for two sines is where it
            // was a breath ago compared with where it is now.
            held.root.rotation.y =
              Math.atan2(Math.cos(phase * 1.7) * 1.7, Math.cos(phase * 1.1 + 1.3) * 1.1) +
              Math.PI / 2
            continue
          }

          // What was sent somewhere to move about once it got there: the free
          // bird and a double posted to wander. Both keep to the water their
          // room gave them, and the bird takes the wider, faster ring of the
          // two because it is the one with wings.
          if (held.spread && (held.kind === 'owl' || held.kind === 'double')) {
            const flying = held.kind === 'owl'
            const turn = phase * (flying ? 0.32 : 0.16)
            held.root.position.set(
              held.at[0] + Math.cos(turn) * held.spread,
              held.y + Math.sin(phase * (flying ? 0.8 : 0.5)) * (flying ? 0.25 : 0.04),
              held.at[1] + Math.sin(turn) * held.spread * 0.8,
            )
            if (held.turns) held.turns.rotation.y = -turn + Math.PI / 2
            continue
          }

          held.root.position.y = held.y + Math.sin(phase * 0.9) * 0.06
          if (!held.turns) continue

          if (held.kind === 'paper') {
            // Stuck, not floating: it flutters on whatever it is stuck to and
            // keeps its face to the room.
            held.turns.rotation.y =
              Math.atan2(
                camera.position.x - held.root.position.x,
                camera.position.z - held.root.position.z,
              ) +
              Math.sin(phase * 2.4) * 0.25
            continue
          }
          if (held.kind === 'owl') {
            // Not a spin: a head that turns, stops, and turns back.
            held.turns.rotation.y = Math.sin(phase * 0.35) * 1.9
          } else if (held.kind === 'double' || held.kind === 'card' || held.kind === 'portal') {
            // The three that are meant to be looked at face whoever is looking:
            // a person turns to you, a card is dealt to you, and a door you
            // cannot see through the edge of is a door you can walk into.
            held.turns.rotation.y = Math.atan2(
              camera.position.x - held.root.position.x,
              camera.position.z - held.root.position.z,
            )
          } else {
            held.turns.rotation.y = phase * 0.6
            held.turns.rotation.z = Math.sin(phase * 0.4) * 0.3
          }
        }
      }

      // ── Kurton ───────────────────────────────────
      /**
       * The visitor as a vehicle.
       *
       * Riding used to be a number: a pace multiplier and ninety centimetres of
       * extra height, which from inside the visitor's own head is indistinguishable
       * from walking fast on a box. What was missing is the vehicle — so here it
       * is, carried in front of the eye where a bonnet would be, with the two
       * lamps a thing that moves at that speed through a dark ship would need.
       */
      const chassis = new THREE.Group()
      chassis.visible = false
      const chassisSkin = new THREE.MeshLambertMaterial({ color: 0xf2a65a })
      const bonnet = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.35, 2.6), chassisSkin)
      bonnet.position.set(0, -0.95, -1.5)
      chassis.add(bonnet)
      for (const side of [-1, 1]) {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.5, 3.4), chassisSkin)
        wing.position.set(side * 1.05, -0.85, -0.9)
        chassis.add(wing)
        const lamp = new THREE.Mesh(
          new THREE.SphereGeometry(0.22, 10, 8),
          new THREE.MeshBasicMaterial({ color: 0xfff0c0 }),
        )
        lamp.position.set(side * 0.75, -0.85, -2.75)
        chassis.add(lamp)
      }
      scene.add(chassis)
      /** The road the lamps throw, which is the whole reason to be one. */
      const headlamp = new THREE.PointLight(0xffe0a0, 0, 22, 2)
      scene.add(headlamp)

      function syncVehicle(eye: number) {
        const riding = world.body.riding
        chassis.visible = riding
        headlamp.intensity = riding ? 3.2 : 0
        if (!riding) return
        chassis.position.set(pointer[0], eye, pointer[1])
        chassis.rotation.set(0, yaw, 0)
        headlamp.position.set(
          pointer[0] - Math.sin(yaw) * 4,
          eye - 0.8,
          pointer[1] - Math.cos(yaw) * 4,
        )
      }

      // ── The blast and the punch ──────────────────
      /**
       * The two techniques that happen rather than stand.
       *
       * One group, built once and reused: a gust of air blown across the ship,
       * and a fist of aura that comes up out of the deck. `playing` is how far
       * through it is, in seconds, and the whole thing is hidden at the end of
       * it rather than rebuilt every cast.
       */
      const GUST_SECONDS = 1.1
      const PUNCH_SECONDS = 1
      const SUN_SECONDS = 2.4
      const ARROW_SECONDS = 0.9
      let playing = 0
      /** How hard the sun is burning, which the exposure is read off. */
      let burning = 0
      let playedSeq = -1
      let played: (TourFlash & { seq: number }) | null = null

      const gustCount = 90
      const gustPositions = new Float32Array(gustCount * 3)
      const gustGeometry = new THREE.BufferGeometry()
      gustGeometry.setAttribute('position', new THREE.BufferAttribute(gustPositions, 3))
      const gustMaterial = new THREE.PointsMaterial({
        color: 0xc6f1ff,
        size: 0.22,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const gust = new THREE.Points(gustGeometry, gustMaterial)
      gust.visible = false
      gust.frustumCulled = false
      scene.add(gust)

      /** The ring the blast lands in, which is what says it arrived. */
      const gustRingMaterial = new THREE.MeshBasicMaterial({
        color: 0xc6f1ff,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
      const gustRing = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 6, 28), gustRingMaterial)
      gustRing.visible = false
      scene.add(gustRing)

      /**
       * The sun the visitor becomes.
       *
       * Not thrown: Feitan rises inside it, so it is centred on the head and
       * everything the walk can see is inside it while it burns. The sphere is
       * drawn from the inside as well as the outside — the visitor is in it —
       * and the light it casts is the only one on the ship that outshines the
       * fittings.
       */
      const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xf2a63b,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const sun = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 16), sunMaterial)
      sun.visible = false
      scene.add(sun)
      const sunLight = new THREE.PointLight(0xffb14a, 0, 60, 2)
      scene.add(sunLight)

      /**
       * The arrow, which is only ever seen going past.
       *
       * A shaft and a head, flown from where it was loosed to where it fell —
       * the exchange it makes has already happened, so what the walk draws is
       * the trace of it, in the gold of the aura that made it.
       */
      const arrowMaterial = new THREE.MeshBasicMaterial({
        color: 0xf7e27d,
        transparent: true,
        opacity: 0.95,
        depthTest: false,
      })
      const shaft = new THREE.Group()
      const arrowShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6),
        arrowMaterial,
      )
      arrowShaft.rotation.x = Math.PI / 2
      shaft.add(arrowShaft)
      const arrowHead = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.4, 6), arrowMaterial)
      arrowHead.rotation.x = -Math.PI / 2
      arrowHead.position.z = -1
      shaft.add(arrowHead)
      shaft.visible = false
      shaft.frustumCulled = false
      shaft.renderOrder = 3
      scene.add(shaft)

      /** A fist: a block of knuckles, a thumb, and the forearm behind it. */
      const fist = new THREE.Group()
      const fistMaterial = new THREE.MeshBasicMaterial({
        color: 0x55a7ff,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const knuckles = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.75, 0.8), fistMaterial)
      knuckles.position.y = 1.2
      fist.add(knuckles)
      const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.55), fistMaterial)
      thumb.position.set(0.55, 1.15, 0.1)
      fist.add(thumb)
      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 1.6, 10), fistMaterial)
      forearm.position.y = 0.2
      fist.add(forearm)
      fist.visible = false
      scene.add(fist)

      // ── Ten seconds, taken back ──────────────────
      /**
       * What the walk did lately, and what it does with it.
       *
       * Everything the reconstruction animates — the wandering solids, the
       * dust, the shoal, Kalluto — is a function of one clock, so ten seconds
       * can be given back by moving the clock rather than by recording anything
       * about them: run it back ten and they do again, exactly, what they did.
       * That is Tserriednich's vision as the walk can honour it — the room
       * repeats itself and you do not have to.
       *
       * The one thing that is not a function of the clock is the visitor, so
       * that *is* recorded: a sample every tenth of a second, kept for twelve.
       * It is spooled back through the camera when the technique is cast, and
       * then walked forward again by the afterimage — the visitor as they were
       * predicted, going where they were going to go while you go elsewhere.
       */
      const REWIND_SECONDS = 10
      /** How long the spooling itself takes. Fast, but not a cut. */
      const REEL_SECONDS = 1.2
      const TRACK_STEP = 0.1

      const track: { at: number; where: Vec2; yaw: number }[] = []
      let sinceSample = 0

      /** Seconds taken off the clock everything animated is read from. */
      let rewound = 0
      /** The spool, while it is running: how far through, and from where. */
      let reeling: { through: number } | null = null
      /** The afterimage, and the clock it walks its recorded track against. */
      let after: { from: number } | null = null

      /** The visitor as they were, `seconds` ago — interpolated, not snapped. */
      function trackAt(seconds: number) {
        if (!track.length) return null
        const wanted = track[track.length - 1].at - seconds
        if (wanted <= track[0].at) return track[0]
        for (let i = track.length - 1; i > 0; i--) {
          const later = track[i]
          const earlier = track[i - 1]
          if (later.at < wanted) continue
          const span = later.at - earlier.at || 1
          const along = Math.min(1, Math.max(0, (wanted - earlier.at) / span))
          return {
            at: wanted,
            where: [
              earlier.where[0] + (later.where[0] - earlier.where[0]) * along,
              earlier.where[1] + (later.where[1] - earlier.where[1]) * along,
            ] as Vec2,
            yaw: earlier.yaw + angleGap(later.yaw, earlier.yaw) * along,
          }
        }
        return track[track.length - 1]
      }

      /**
       * The afterimage: the visitor as the prediction has them.
       *
       * Pale, and not solid — everyone else goes on perceiving the ten seconds
       * that were foreseen, so what the walk draws is the version of you they
       * are still watching, walking the path you have just been given back.
       */
      const afterMaterial = new THREE.MeshBasicMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
      })
      const afterimage = new THREE.Group()
      const afterBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 1.05, 4, 8), afterMaterial)
      afterBody.position.y = 0.95
      afterimage.add(afterBody)
      const afterHead = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), afterMaterial)
      afterHead.position.y = 1.72
      afterimage.add(afterHead)
      afterimage.visible = false
      scene.add(afterimage)

      /** Takes the ten seconds back: the spool, the clock, and the afterimage. */
      function startRewind() {
        if (!track.length) return
        rewindSound(REEL_SECONDS)
        reeling = { through: 0 }
      }

      /** Runs the spool, and hands the walk back when it has finished. */
      function reelBack(delta: number) {
        if (reeling) {
          reeling.through = Math.min(1, reeling.through + delta / REEL_SECONDS)
          if (reeling.through >= 1) {
            reeling = null
            // The clock goes back without the visitor, so the room does again what
            // it was doing — and the afterimage sets off from where they were.
            rewound += REWIND_SECONDS
            after = { from: 0 }
          }
          return
        }

        if (!after) {
          afterimage.visible = false
          return
        }
        after.from += delta
        if (after.from >= REWIND_SECONDS) {
          after = null
          afterimage.visible = false
          return
        }
        const seen = trackAt(REWIND_SECONDS - after.from)
        if (!seen) return
        afterimage.visible = true
        afterimage.position.set(seen.where[0], ground, seen.where[1])
        afterimage.rotation.y = seen.yaw
        // It fades as the ten seconds it was given run out.
        afterMaterial.opacity = 0.3 * (1 - (after.from / REWIND_SECONDS) ** 2)
      }

      /** Starts whichever of the two the page has just handed over. */
      function syncFlash() {
        if (!flash || flash.seq === playedSeq) return
        playedSeq = flash.seq
        played = flash
        playing = 0

        // The vision is not drawn: it is ten seconds of the walk, given back.
        if (flash.kind === 'rewind') startRewind()

        if (flash.kind === 'gust') {
          const from = flash.from ?? flash.at
          // Every mote gets its own place along the line and its own spread, so
          // the blast reads as air moving rather than as a bead on a string.
          for (let i = 0; i < gustCount; i++) {
            const along = i / gustCount
            gustPositions[i * 3] = from[0] + (flash.at[0] - from[0]) * along
            gustPositions[i * 3 + 1] = flash.y
            gustPositions[i * 3 + 2] = from[1] + (flash.at[1] - from[1]) * along
          }
          gustGeometry.attributes.position.needsUpdate = true
        }
      }

      /** Plays the blast or the punch out, and puts it away when it is over. */
      function driftFlash(delta: number) {
        if (!played) return
        playing += delta
        const span =
          played.kind === 'gust'
            ? GUST_SECONDS
            : played.kind === 'sun'
              ? SUN_SECONDS
              : played.kind === 'arrow'
                ? ARROW_SECONDS
                : PUNCH_SECONDS
        const through = playing / span
        if (through >= 1) {
          gust.visible = false
          gustRing.visible = false
          fist.visible = false
          shaft.visible = false
          sun.visible = false
          sunLight.intensity = 0
          if (burning) {
            burning = 0
            renderer.toneMappingExposure = blinded ? 0.02 : 1
            fog.color.setHex(0x050505)
          }
          played = null
          return
        }

        if (played.kind === 'arrow') {
          // Loosed and gone: a quarter of a second across whatever it crossed,
          // and the shaft points the way it is travelling.
          const from = played.from ?? played.at
          const flown = Math.min(1, through * 3)
          shaft.visible = true
          shaft.position.set(
            from[0] + (played.at[0] - from[0]) * flown,
            played.y + Math.sin(flown * Math.PI) * 1.2,
            from[1] + (played.at[1] - from[1]) * flown,
          )
          shaft.lookAt(played.at[0], played.y, played.at[1])
          arrowMaterial.opacity = 0.95 * (1 - Math.max(0, (through - 0.5) * 2))
          return
        }

        if (played.kind === 'sun') {
          // Out to its full radius in the first third, and burning down for the
          // rest of it. The visitor is inside it the whole time, which is the
          // difference between rising as the sun and throwing one.
          const risen = Math.min(1, through * 3)
          const metres = Math.max(2, played.metres ?? 4)
          sun.visible = true
          sun.position.copy(camera.position)
          sun.scale.setScalar(metres * risen)
          sunMaterial.opacity = 0.34 * (1 - through * through)
          sunLight.position.copy(camera.position)
          sunLight.distance = metres * 2.5
          sunLight.intensity = 26 * risen * (1 - through)
          // And the whole picture burns with it. A sphere the visitor is
          // standing inside is a wash of colour over the room; the exposure and
          // the air are what make it a sun — the deck blows out white the way it
          // does looking into one, and comes back as it goes out.
          burning = risen * (1 - through * through)
          renderer.toneMappingExposure = 1 + burning * 2.6
          fog.color.setHex(0xf2a63b)
          return
        }

        if (played.kind === 'gust') {
          const from = played.from ?? played.at
          const reach = Math.hypot(played.at[0] - from[0], played.at[1] - from[1]) || 1
          gust.visible = true
          for (let i = 0; i < gustCount; i++) {
            // Each mote runs the length of the throw, wraps, and swirls about
            // the line it is running along: a gust has width.
            const along = (i / gustCount + through * 1.6) % 1
            const swirl = (i % 7) - 3
            gustPositions[i * 3] = from[0] + (played.at[0] - from[0]) * along + swirl * 0.12
            gustPositions[i * 3 + 1] = played.y + Math.sin(along * 9 + i) * 0.5
            gustPositions[i * 3 + 2] = from[1] + (played.at[1] - from[1]) * along + swirl * 0.12
          }
          gustGeometry.attributes.position.needsUpdate = true
          gustMaterial.opacity = 0.8 * (1 - through)
          // The ring opens where it lands, once the air has had time to get there.
          const landed = Math.max(0, (through - 0.45) / 0.55)
          gustRing.visible = landed > 0
          gustRing.position.set(played.at[0], played.y, played.at[1])
          gustRing.rotation.set(Math.PI / 2, 0, 0)
          gustRing.scale.setScalar(0.4 + landed * Math.min(6, reach * 0.35))
          gustRingMaterial.opacity = 0.5 * (1 - landed)
          return
        }

        // Out of the deck fast, held for a beat, and back down: the floor is
        // where it comes from, so it is never drawn below where it started.
        const rise = through < 0.25 ? through / 0.25 : Math.max(0, 1 - (through - 0.25) / 0.75)
        fist.visible = true
        fist.position.set(played.at[0], played.y - 2 + rise * 3.1, played.at[1])
        fist.rotation.y = playedSeq
        fistMaterial.opacity = 0.72 * (1 - through * 0.6)
      }

      /** The room and the solid down the reticle, and the cast that lands on them. */
      const facing = () =>
        activePlan ? aimedSpace(activePlan, pointer, yaw, reachOf(world.body)) : null
      const facingSolid = () => {
        const plan = ship.plans.get(currentTierId)
        return plan ? aimedSolid(ship, world, plan, pointer, yaw, reachOf(world.body) / 2) : null
      }

      // ── Machi's thread ───────────────────────────
      /**
       * The thread, and the swing on the end of it.
       *
       * `arc` is where it took hold and how far through the swing the visitor
       * is. The line is drawn from the hand to the anchor for as long as it
       * holds; the walk arcs along it and lets go on arrival. Collisions are not
       * run while it is holding, because a swing that stopped at the first
       * bulkhead would be a rope, not a thread.
       */
      const threadMaterial = new THREE.LineBasicMaterial({
        color: 0xdd77b7,
        transparent: true,
        opacity: 0.9,
        depthTest: false,
      })
      const threadGeometry = new THREE.BufferGeometry()
      threadGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
      const thread = new THREE.Line(threadGeometry, threadMaterial)
      thread.visible = false
      thread.frustumCulled = false
      thread.renderOrder = 3
      scene.add(thread)

      let arc: { to: Vec2; height: number; from: Vec2; span: number; through: number } | null = null

      /**
       * Bungee Gum, which is the one technique that is visibly attached to you.
       *
       * Rubber and gum: what Hisoka sets on a thing stays joined to his hand
       * until he pulls it in, so the walk draws the join — a pink strand out of
       * the visitor to whatever the gum is stuck to, slack, and wobbling the way
       * an elastic does. Twenty segments, because a straight line is a wire.
       */
      const GUM_SEGMENTS = 24
      const gumMaterial = new THREE.LineBasicMaterial({
        color: 0xff7ec8,
        transparent: true,
        opacity: 0.9,
        depthTest: false,
      })
      const gumGeometry = new THREE.BufferGeometry()
      gumGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(GUM_SEGMENTS * 3), 3),
      )
      const gum = new THREE.Line(gumGeometry, gumMaterial)
      gum.visible = false
      gum.frustumCulled = false
      gum.renderOrder = 3
      scene.add(gum)

      /** Draws the gum where it is stuck, or takes it off the screen. */
      function syncGum(seconds: number) {
        const stuck =
          world.holding === 'elastic' && world.pairing
            ? solidById(ship, world, world.pairing)
            : null
        const room = stuck ? ship.spaces.get(stuck.spaceId) : null
        const plan = room ? ship.plans.get(room.tierId) : null
        if (!stuck || !room || !plan) {
          gum.visible = false
          return
        }
        const at = solidNow(stuck, world.solids[stuck.id]).at
        const end = new THREE.Vector3(at[0], floorOf(room, plan.tier) + 0.9, at[1])
        // Out of the hand rather than out of the eye: thirty centimetres down
        // and to the right, the way the night-light is worn.
        const start = new THREE.Vector3(
          camera.position.x + Math.cos(yaw) * 0.35,
          camera.position.y - 0.45,
          camera.position.z - Math.sin(yaw) * 0.35,
        )
        const line = gumGeometry.attributes.position as import('three').BufferAttribute
        const sag = Math.min(1.6, start.distanceTo(end) * 0.12)
        for (let i = 0; i < GUM_SEGMENTS; i++) {
          const along = i / (GUM_SEGMENTS - 1)
          // A catenary to hang it, and a standing wave along it so the strand
          // reads as rubber under tension rather than as a rope.
          const wobble = Math.sin(along * 7 + seconds * 5) * 0.12 * Math.sin(along * Math.PI)
          line.setXYZ(
            i,
            start.x + (end.x - start.x) * along + wobble,
            start.y + (end.y - start.y) * along - Math.sin(along * Math.PI) * sag,
            start.z + (end.z - start.z) * along + wobble,
          )
        }
        line.needsUpdate = true
        gum.visible = true
      }
      /** How much of the arc the visitor is riding, added to the eye this frame. */
      let swingRise = 0

      /**
       * Throws the thread down the reticle and takes hold as far along it as
       * the ship allows.
       *
       * Not at the middle of a room, and not even at the end of the room being
       * looked at: at the last walkable point of the ray, wherever that is and
       * through however many doorways. This is what makes it a way of getting
       * about rather than a single trick — swung to the far end of a room, the
       * next throw goes out through its door and down the corridor, because the
       * ray is followed until the floor under it runs out. A thread that took
       * hold of the room you had just landed in the middle of was a thread with
       * nowhere left to pull you, which is why it only ever worked once.
       */
      function throwThread() {
        // The deck as Nen leaves it, which is the one the thread is thrown
        // across: a room the chain has shut has no doorway to go through.
        const plan = activePlan ?? ship.plans.get(currentTierId)
        if (!plan) return
        const sin = Math.sin(yaw)
        const cos = Math.cos(yaw)

        // Walked along the ray a step at a time, through whatever doorways it
        // passes: the first step standing on no floor at all is the wall the
        // thread would have hit, and the one before it is where it takes hold.
        //
        // What is down the reticle is deliberately not consulted. A thread that
        // took hold of the nearest thing was a thread that, having pulled you to
        // it, had nothing left to pull you to — you landed beside a table, the
        // table was two metres off, and the throw was refused. That, and not the
        // room's middle, was the last of "it only works once".
        let to: Vec2 | null = null
        let landing: Space | null = null

        let reach = reachOf(world.body)
        const unitX = -sin
        const unitY = -cos

        if (!walksThroughWalls(world)) {
          for (const wall of plan.walls) {
            const dx = wall.end[0] - wall.start[0]
            const dy = wall.end[1] - wall.start[1]
            const denominator = unitX * dy - unitY * dx
            if (Math.abs(denominator) < 1e-9) continue

            const ox = wall.start[0] - pointer[0]
            const oy = wall.start[1] - pointer[1]
            const t = (ox * dy - oy * dx) / denominator
            const u = (ox * unitY - oy * unitX) / denominator

            if (t > 0 && t < reach && u >= 0 && u <= 1) {
              reach = t - 0.1
            }
          }
        }

        const step = 1.5
        for (let metres = step; metres <= reach + step; metres += step) {
          const d = Math.min(metres, reach)
          const point: Vec2 = [pointer[0] + unitX * d, pointer[1] + unitY * d]
          const room = spaceAt(plan, point)
          if (!room) break
          to = point
          landing = room
          if (d === reach) break
        }
        if (!to) return

        // How far it actually went, which is not how far it could have: the
        // wall the ray met, or the floor running out, is what settled it.
        const thrown = Math.hypot(to[0] - pointer[0], to[1] - pointer[1])
        // A thread thrown at your own feet is a thread, and nothing else.
        if (thrown < 2) return
        const target = landing ?? spaceAt(plan, to)
        arc = {
          to,
          height: (target ? floorOf(target, plan.tier) : ground) + 1.4,
          from: pointer,
          // A swing is a swing whatever the distance: about sixteen metres a
          // second of ground, which crosses the promenade in a couple of arcs.
          span: Math.max(0.35, thrown / 16),
          through: 0,
        }
      }

      /** Rides the arc, and drops the thread at the end of it. */
      function ridTheThread(delta: number, loose: import('$lib/tour/types').WallSegment[] = []) {
        swingRise = 0
        if (!arc) {
          thread.visible = false
          return
        }
        arc.through = Math.min(1, arc.through + delta / arc.span)
        const eased = 1 - (1 - arc.through) ** 2
        const target: Vec2 = [
          arc.from[0] + (arc.to[0] - arc.from[0]) * eased,
          arc.from[1] + (arc.to[1] - arc.from[1]) * eased,
        ]
        // Ridden through the deck as Nen leaves it, not through it: a swing
        // ending inside a bulkhead was the one thing the thread could do that
        // walking could not.
        const walked = activePlan ?? ship.plans.get(currentTierId)
        pointer =
          walksThroughWalls(world) || !walked
            ? target
            : resolveMovement(pointer, target, wallsNear([...walked.walls, ...loose], pointer, 6))
        // Up and over: the rise is what makes it a swing rather than a winch.
        swingRise = Math.sin(arc.through * Math.PI) * 2.2

        const line = threadGeometry.attributes.position as import('three').BufferAttribute
        line.setXYZ(0, camera.position.x, camera.position.y - 0.4, camera.position.z)
        line.setXYZ(1, arc.to[0], arc.height, arc.to[1])
        line.needsUpdate = true
        thread.visible = true

        if (arc.through >= 1) arc = null
      }

      function cast() {
        onCast?.(facing()?.id ?? null, facingSolid()?.id ?? null)
        if (swings) throwThread()
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
        // The deck was handed to the audio module by `loadTier`, before there was
        // a graph to hear it; `startSteps` reads it back rather than starting the
        // hull at the wrong elevation and correcting it at the next stairwell.
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
        // The panes are sampled in screen space, so they are the size of the
        // screen: a target left at the old size shows the far room stretched.
        const { width, height } = renderer.getSize(new THREE.Vector2())
        for (const target of Object.values(portalTargets)) {
          target?.setSize(Math.max(2, Math.round(width)), Math.max(2, Math.round(height)))
        }
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
      /** How long since the fish last took something, in seconds. */
      let sinceBite = 0
      /** A couple of seconds a mouthful: an aquarium, not a wood chipper. */
      const BITE_SECONDS = 2.4
      /** How long since the free bird last took a door, in seconds. */
      let sinceFlight = 0
      /** Long enough to be seen sitting in a room before it leaves it. */
      const FLIGHT_SECONDS = 6
      /** How long since the insect last took a door, in seconds. */
      let sinceCrawl = 0
      /**
       * An insect covers ground faster than a bird holds still.
       *
       * Sayird's roach is what Kurapika reads a whole deck with — room by room,
       * quickly — where Secret Window's bird is a perch that happens to move.
       */
      const CRAWL_SECONDS = 4
      /** How much of the current second of the bird's twenty has gone by. */
      let sinceOwlSecond = 0
      /** How long since the bird's own path was last sampled, in seconds. */
      let sinceFilmSample = 0
      let sincePolarity = 0

      /**
       * Where the bird is this tenth of a second, kept for the last ten.
       *
       * Read off the apparition rather than off the world, because the world
       * only knows which room it is in: what the film is worth is the flight,
       * and the flight is the drift the scene gives it inside that room.
       */
      function recordTheOwl(clock: number, delta: number) {
        sinceFilmSample += delta
        if (sinceFilmSample < TRACK_STEP) return
        sinceFilmSample = 0
        const bird = apparitions[`owl:${world.owl}`]
        const space = world.owl ? ship.spaces.get(world.owl) : null
        if (!bird || !space) return
        filmTrack.push({
          at: clock,
          where: [bird.root.position.x, bird.root.position.z],
          y: bird.root.position.y,
          tierId: space.tierId,
        })
        while (filmTrack.length && filmTrack[0].at < clock - OWL_FILM_SECONDS) filmTrack.shift()
      }

      /** Takes the film off the bird that has just gone, and starts it running. */
      function startFilm() {
        endFilm()
        if (!filmTrack.length) return
        const frames = [...filmTrack]
        filmTrack.length = 0

        filmCamera = new THREE.PerspectiveCamera(64, 1, 0.1, VIEW_DISTANCE)
        // The deck it was flying over has to be in the scene to be filmed on,
        // however far from the visitor's own it is — the same arrangement the
        // eye's feed uses, and it is taken away again when the film ends.
        const built = buildDeck(frames[frames.length - 1].tierId).built
        if (built !== visible) {
          scene.add(built.root)
          filmDeck = built
        }
        showing = { through: 0, frames }
      }

      /** Puts the film away: the camera, and the deck it was shown against. */
      function endFilm() {
        if (filmDeck) {
          if (filmDeck !== visible && !portalDecks.includes(filmDeck) && filmDeck !== eyeDeck) {
            scene.remove(filmDeck.root)
          }
          filmDeck = null
        }
        filmCamera = null
        showing = null
      }

      /**
       * The playback, walked at the speed it was recorded.
       *
       * Ten seconds, and then the corner goes back to being the corner. The
       * camera looks the way the bird was going, which is the nearest the walk
       * can get to what a bird was looking at.
       */
      function runFilm(delta: number) {
        if (!showing || !filmCamera) return
        showing.through += delta
        if (showing.through >= OWL_FILM_SECONDS) {
          endFilm()
          return
        }
        const frames = showing.frames
        const wanted = frames[0].at + showing.through
        let index = frames.findIndex((frame) => frame.at >= wanted)
        if (index < 0) index = frames.length - 1
        const later = frames[index]
        const earlier = frames[Math.max(0, index - 1)]
        const span = later.at - earlier.at || 1
        const along = Math.min(1, Math.max(0, (wanted - earlier.at) / span))
        const x = earlier.where[0] + (later.where[0] - earlier.where[0]) * along
        const z = earlier.where[1] + (later.where[1] - earlier.where[1]) * along
        filmCamera.position.set(x, earlier.y + (later.y - earlier.y) * along, z)
        // Facing the way it was flying, and facing the room when it was still.
        const ahead = frames[Math.min(frames.length - 1, index + 4)]
        const dx = ahead.where[0] - x
        const dz = ahead.where[1] - z
        filmCamera.rotation.set(0, 0, 0)
        filmCamera.rotateY(Math.hypot(dx, dz) > 0.15 ? Math.atan2(dx, dz) : showing.through * 0.6)
      }

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
        syncPhasing()
        // The far deck first, so a mouth built this frame already has a room to
        // look at rather than a frame of void.
        syncPortalDecks()
        syncApparitions()
        syncFlash()
        sweepStale()
        // One clock for everything the walk animates, and it is not the wall's:
        // Parallel Future moves it back ten seconds, and the room does again
        // exactly what it did — see `startRewind`.
        // During the spooling, the clock is pulled back smoothly.
        const rewinding = reeling ? REWIND_SECONDS * reeling.through : 0
        const clock = now / 1000 - rewound - rewinding
        driftSolids(clock)
        driftMotes(delta, clock)
        driftApparitions(clock)
        driftFlash(delta)
        syncGum(clock)
        reelBack(delta)

        // The last twelve seconds of the visitor's own walk, which is the one
        // thing aboard that is not a function of the clock.
        sinceSample += delta
        if (sinceSample >= TRACK_STEP) {
          sinceSample = 0
          track.push({ at: clock, where: pointer, yaw })
          while (track.length && track[0].at < clock - (REWIND_SECONDS + 2)) track.shift()
        }

        // The fish feed on the clock rather than on a threshold: they are drawn
        // now, and a fish that swims through a coffin and leaves it standing is
        // not eating. What they take is still the pure layer's to decide.
        if (world.devouring.length) {
          sinceBite += delta
          if (sinceBite >= BITE_SECONDS) {
            sinceBite = 0
            onFish?.()
          }
        } else sinceBite = 0

        sincePolarity += delta
        if (sincePolarity >= 0.1) {
          sincePolarity -= 0.1
          onPolarity?.(clock)
        }

        // The free bird on the same clock: it sits in a room for a few seconds
        // and then takes a door out of it. Only that bird — the one on the
        // shoulder travels with the walk, and the third stays thrown.
        if (world.owl && world.owlMode === 'wander') {
          sinceFlight += delta
          if (sinceFlight >= FLIGHT_SECONDS) {
            sinceFlight = 0
            onOwl?.()
          }
        } else sinceFlight = 0

        // And the insect on a clock of its own, which runs only while it is
        // scouting: piloted or filming, it is where the visitor put it and
        // moving it is their business rather than the clock's.
        if (world.eye && world.eyeMode === 'scout') {
          sinceCrawl += delta
          if (sinceCrawl >= CRAWL_SECONDS) {
            sinceCrawl = 0
            onScout?.()
          }
        } else sinceCrawl = 0

        // The twenty seconds, counted where the clock is. What that does to the
        // bird is the pure layer's: the walk only says that a second went by.
        if (world.owl) {
          sinceOwlSecond += delta
          if (sinceOwlSecond >= 1) {
            sinceOwlSecond -= 1
            onOwlSecond?.()
          }
          recordTheOwl(clock, delta)
        } else sinceOwlSecond = 0

        // And when it is not there any more, what it recorded is played back.
        // Any disappearance: called in early or run out, the bird hands over
        // the same ten seconds, so the walk shows them the same way.
        const owlUp = Boolean(world.owl)
        if (owlWasUp && !owlUp) startFilm()
        owlWasUp = owlUp
        runFilm(delta)

        const walked = activePlan ?? plan
        // What the aura is holding is out of the deck's own wall list, so it
        // has to be put back for the collision test — where the technique left
        // it, and where the drift has it this instant.
        const loose = solidWalls(ship, world, currentTierId, now / 1000 - rewound)

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

        // The thread has the visitor: the legs are not what is moving them.
        ridTheThread(delta, loose)

        if (moving && !arc && !$comfort.jumpOnly) {
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
        /**
         * The floor under the visitor, eased onto rather than snapped to.
         *
         * Almost every room on the ship is the deck itself, so this is a constant
         * for all but a handful of steps. Where a panel does draw one — the
         * service end of the banquet hall — a hard cut of half a metre reads as
         * the view jumping, which is the one thing `$lib/tour/comfort` exists to
         * refuse. Ten per cent of the remaining rise per frame at 60 Hz settles
         * it in about a fifth of a second: the length of a stride onto a step.
         */
        const groundTarget = floorOf(standing ?? entrySpace(plan), plan.tier)
        ground += (groundTarget - ground) * Math.min(1, delta * 6)
        const eye = ground + eyesOf(world.body, EYE_HEIGHT) + bob.rise + swingRise
        camera.position.set(pointer[0], eye, pointer[1])
        camera.rotation.set(0, 0, 0)
        camera.rotateY(yaw)
        camera.rotateX(pitch)
        camera.rotateZ(bob.roll)
        // Kurton is worn rather than stood in: the chassis goes where the
        // visitor is, facing where they face, every frame.
        syncVehicle(eye)

        // One pace, one footstep, on the same counter the head is dipping to — so
        // the sound lands with the foot at every speed and never drifts off it.
        const paces = stepsIn(travelledOnFoot)
        if (paces !== lastPace) {
          lastPace = paces
          footstep(paces, { running })
        }

        // Worn, not held at the eye: thirty centimetres to the left of the
        // visitor's head and thirty below it. At the viewpoint, N·L is N·V on every
        // surface at once — the light lands wherever the eye is already looking,
        // which is the one place it cannot model anything. It mattered more when
        // this lamp carried the picture; it is kept because it costs nothing and a
        // stairwell lit from slightly off-axis still has corners.
        nightLight.position.set(pointer[0] - cos * 0.3, eye - 0.3, pointer[1] + sin * 0.3)
        // The aura is carried by the visitor, because the visitor is the one
        // emitting it. Positioned whether or not it is lit: `syncShells` raises the
        // intensity, and a light at the wrong end of the deck the frame a technique
        // goes up would be a flash in another room.
        auraLight.position.copy(nightLight.position)

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
          // The ship is handed in because the doors may be passive: with the
          // aura up and no route prepared, every threshold is one of Voconte's
          // and comes out somewhere in the hideout that is not where you meant.
          const exit = doorExit(world, standingId, arrivedFrom, ship)
          arrivedFrom = exit
          onArrive?.(standingId)
          if (exit) {
            goTo(exit)
            return
          }
        }

        // Fugetsu's tunnel is a door rather than a room: it is crossed by
        // walking into the mouth, not by setting foot on the deck it stands on.
        // `wormFrom` is the end the last crossing put the visitor in, held until
        // they step out of it, or arriving would immediately send them back.
        const mouth = wormMouthAt(ship, world, currentTierId, pointer)
        if (!mouth) wormFrom = null
        else if (mouth !== wormFrom) {
          // Read before the crossing: the third one collapses the pair behind
          // it, and the visitor still has to come out somewhere.
          const ends = wormMouths(ship, world)
          const tunnel = onWorm?.(mouth, wormFrom)
          if (tunnel) {
            wormFrom = tunnel
            // Out of the far mouth rather than at the far room's door: a tunnel
            // whose exit was across the room would be a tunnel you fall out of.
            goTo(tunnel, ends.find((end) => end.spaceId === tunnel)?.at)
            return
          }
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
        // The far ends of the tunnel are drawn into their panes first, from
        // where the visitor's head would be if it were standing at the other one.
        renderPortals()
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

        // The owl's film, inset below the eye's feed: the last ten seconds of
        // a bird that is not there any more, played at the speed it flew them.
        if (filmCamera && showing) {
          const filmWidth = Math.round(Math.min(320, width * 0.3))
          const filmHeight = Math.round(filmWidth * 0.62)
          const pad = 12
          const box: [number, number, number, number] = [
            width - filmWidth - pad,
            pad,
            filmWidth,
            filmHeight,
          ]
          filmCamera.aspect = filmWidth / filmHeight
          filmCamera.updateProjectionMatrix()
          renderer.setViewport(...box)
          renderer.setScissor(...box)
          renderer.setScissorTest(true)
          renderer.autoClear = false
          renderer.clear(true, true, false)
          renderer.render(scene, filmCamera)
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
        for (const id of Object.keys(apparitions)) dropApparition(id)
        for (const material of Object.values(glowMaterials)) material?.dispose()
        portalDecks.length = 0
        gustGeometry.dispose()
        gustMaterial.dispose()
        gustRing.geometry.dispose()
        gustRingMaterial.dispose()
        fist.traverse((part) => {
          const mesh = part as import('three').Mesh
          if (mesh.geometry) mesh.geometry.dispose()
        })
        fistMaterial.dispose()
        sun.geometry.dispose()
        sunMaterial.dispose()
        threadGeometry.dispose()
        threadMaterial.dispose()
        gumGeometry.dispose()
        gumMaterial.dispose()
        afterBody.geometry.dispose()
        afterHead.geometry.dispose()
        afterMaterial.dispose()
        for (const target of Object.values(portalTargets)) target?.dispose()
        chassis.traverse((part) => {
          const mesh = part as import('three').Mesh
          if (mesh.geometry) mesh.geometry.dispose()
        })
        chassisSkin.dispose()
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
      jump = (spaceId: string, landing?: Vec2) => goTo(spaceId, landing)
      // The camera and the lights are in this closure, so anything the panel
      // changes has to be handed in rather than read out.
      relens = (settings: Comfort) => {
        camera.fov = settings.fov
        camera.updateProjectionMatrix()
        // The reach the visitor asked for, unless sight is sealed — in which case
        // it stays out, and comes back at what they asked for when it is restored.
        nightLight.distance = settings.nightLight
        nightLight.intensity = blinded || settings.nightLight <= 0 ? 0 : NIGHT_LIGHT
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
  let jump = $state<((spaceId: string, landing?: Vec2) => void) | null>(null)
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
    jump(requested, jumpAt ?? undefined)
    jumpTo = null
    jumpAt = null
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
