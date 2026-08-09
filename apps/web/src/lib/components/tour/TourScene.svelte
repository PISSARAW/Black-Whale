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
  import {
    createNenTechniqueState,
    isAuraAtRest,
    transitionNen,
    type NenTechnique,
    type NenTechniqueAction,
    type NenTechniqueState,
  } from '@black-whale/nen-engine'
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
    danceOffset,
    detachedOn,
    driftOffset,
    doorExit,
    emptiedOn,
    eyeHeightIn,
    FLOCK_BIRDS,
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
    TENTACLES,
    apparitionsOn,
    coinAt,
    wormMouthAt,
    wormMouths,
    type Apparition,
    type TourFlash,
  } from '$lib/tour/apparitions'
  import { comfort, prefersReducedMotion, setComfort, type Comfort } from '$lib/tour/comfort'
  import { buildSolidMesh } from '$lib/tour/mesh'
  import { animateDealerFace } from '$lib/tour/dealer'
  import { HUMAN_LOD_DISTANCE, humanStateKey } from '$lib/tour/humanFigure'
  import type { HumanPose } from '$lib/tour/humanAnimation'
  import { styleNenCreature } from '$lib/tour/nenCreatureFigure'
  import { cardFaceSvg } from '$lib/tour/cardArt'
  import { EYE_FOV, OWL_FOV, type CardFace, type EyeFeed } from '$lib/tour/morena'
  import {
    SPRINT_SPEED,
    STICK_RADIUS,
    STICK_RIM,
    WALK_SPEED,
    bobOf,
    breathOf,
    glide,
    linkUnderfoot,
    resolveMovement,
    stepsIn,
    stickVector,
    walkInput,
    wallsNear,
    wayOutOfInterior,
  } from '$lib/tour/navigation'
  import { SEALED_DENSITY, fogDensityOf, reverbTime, settleDensity } from '$lib/tour/atmosphere'
  import { disturbDust, driftDust, type Dust } from '$lib/tour/dust'
  import { distanceToBoundary } from '$lib/tour/geometry'
  import { footingOf } from '$lib/tour/footing'
  import {
    enterDeck,
    enterRoom,
    footstep,
    nearWall,
    setStepsAuraQuiet,
    setStepsMuffled,
    startSteps,
    stepsPlaying,
    stepsWereSilenced,
    stopSteps,
    toggleSteps,
  } from '$lib/audio/steps'
  // The roar makes a noise of its own rather than reporting one: it is answered
  // to a keypress, so it does not go through the page's report-to-sound table.
  // The flock's chirp is raised by the page itself, where the arrival happens.
  import { roarLikeADragon } from '$lib/audio/hatsuSounds'
  import { playNenObjectSound, playNenTechniqueSound, sustainNenSound } from '$lib/audio/nenSounds'
  import { NEN_KEYS, nenZoneIndex, ryuDistribution, type NenBodyZone } from '$lib/nen/controls'
  import { visibleSpaces } from '$lib/tour/visibility'
  import { createShaftDecks } from '$lib/tour/shaftDecks'
  import { NO_HOUR, type ShipHour } from '$lib/tour/hour'
  import { TourHourView } from '$lib/tour/hourView'
  import { createDeckMaterials } from '$lib/tour/deckMaterials'
  import { LENS_DEFAULTS, LENS_OFF, applyGrade } from '$lib/tour/postGrade'
  import { refractionAmount, type AuraGlass } from '$lib/tour/auraRefraction'
  import {
    animateVisibleScene,
    createSceneRuntime,
    disposeSceneRuntime,
    observeSceneResize,
    renderSceneInset,
  } from '$lib/tour/TourRenderer'
  import { listenToSceneInput } from '$lib/tour/sceneInput'
  import { PortalRenderer } from '$lib/tour/PortalRenderer'
  import { TierView, type BuiltTierView } from '$lib/tour/TierView'
  import {
    AURA_LIGHT_INTENSITY,
    NIGHT_LIGHT_INTENSITY,
    TourAtmosphereView,
  } from '$lib/tour/TourAtmosphereView'
  import { ApparitionView } from '$lib/tour/ApparitionView'
  import { buildBasicApparition, BIRD_TETHER, BIRD_WINGS } from '$lib/tour/apparitionBasicView'
  import { buildObjectApparition } from '$lib/tour/apparitionObjectView'
  import { buildEmbellishmentApparition } from '$lib/tour/apparitionEmbellishmentView'
  import { buildInsectApparition } from '$lib/tour/apparitionInsectView'
  import { buildSnakeApparition } from '$lib/tour/apparitionSnakeView'
  import { buildGuardianApparition } from '$lib/tour/apparitionGuardianView'
  import { buildMechanicalApparition } from '$lib/tour/apparitionMechanicalView'
  import { buildCrawlingApparition } from '$lib/tour/apparitionCrawlingView'
  import { buildSpriteApparition } from '$lib/tour/apparitionSpriteView'
  import { buildDragonApparition } from '$lib/tour/apparitionDragonView'
  import { buildVowApparition } from '$lib/tour/apparitionVowView'
  import { buildAnimalApparition } from '$lib/tour/apparitionAnimalView'
  import { HatsuSceneEffects } from '$lib/tour/HatsuSceneEffects'
  import { NenSceneAura } from '$lib/tour/NenSceneAura'
  import TourNenControls from './TourNenControls.svelte'
  import type { Link, Space, Structure, Vec2, WallSegment } from '$lib/tour/types'

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
    /** Optional facing for a jump owned by a game rather than a doorway. */
    jumpHeading?: number | null
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
    /** Vertical camera angle, exposed for games whose reticle targets body height. */
    lookPitch?: number
    /**
     * What Nen is currently doing to the ship. The scene is the only thing that
     * draws it; `$lib/tour/hatsu` is the only thing that decides it.
     */
    world?: TourWorld
    /** The colour of the technique holding the ship, for the aura shells. */
    auraColour?: string | null
    /** Standard Nen state of the first-person visitor. */
    nen?: NenTechniqueState
    /** Modes with their own Nen HUD still use the shared renderer without duplicating controls. */
    showNenControls?: boolean
    /** Visible-but-disabled principles for modes that intentionally implement a subset. */
    nenAvailability?: Partial<Record<NenTechnique | 'hatsu' | 'action', boolean | string>>
    /** Controlled modes receive every accepted standard Nen action here. */
    onNenChange?: (action: NenTechniqueAction) => void
    /** Canonical F delegated to a mode when it is not a scene-object action. */
    onPhysicalNenAction?: () => void
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
     * Whether the active technique can be turned on its own user.
     *
     * Black Voice is the reason this exists: the needle goes into a thing or
     * into the visitor, and the reticle is nearly always on something, so
     * aiming at nothing is not a gesture a walk can reliably make. The second
     * place on the wheel is that gesture — cast with an empty reticle,
     * whatever is actually in front.
     */
    selfCastable?: boolean
    /**
     * The two techniques the two keys play, when the aura in hand is two.
     *
     * Double Face is what this is for: the book is open on one page and a
     * ribbon is holding a second, and both are live. F plays the open page and
     * the second of the wheel plays the bookmarked one — which is the only
     * thing the scene has to know about it. Named, because a phone has no keys
     * and the wheel says which place is which. `null` under everything else.
     */
    hands?: { first: string; second: string } | null
    /**
     * The three airs the wheel plays, when what is in hand is an instrument
     * rather than a technique to be aimed.
     *
     * Enchanting Music is the whole of it: the flute is materialized for as
     * long as the aura is up, and which piece is played is chosen at the moment
     * of playing — F for the lively one, and the wheel for the soft and the
     * sharp. Named, for the same reason the two pages are: a phone has no keys,
     * and the wheel has to say which piece each place plays. `null` elsewhere.
     */
    tunes?: { first: string; second: string; third: string } | null
    /**
     * Whether the technique in hand is cast with two hands rather than one.
     *
     * The Sun and Moon is the whole of it: one hand puts the sun on and the
     * other the moon, and which of the two a thing wears decides what it does
     * when it meets another. So the second place on the wheel is the second
     * hand here as well. Unnamed, unlike the book's two pages and the flute's
     * three airs, because the marks themselves are the labels.
     */
    twoHanded?: boolean
    /**
     * What the thing already cast is to be told to do next, named.
     *
     * A double, an owl and an insect are sent out once and then keep taking
     * orders — watch, follow, wander, film — and the order is not a second
     * cast, it is a word to something already standing there. It rides the
     * same wheel all the same: two things in one technique means two places
     * on it, whichever kind of thing the second one is. `null` under
     * everything that is only ever cast.
     */
    orders?: string | null
    /** Give that order. Called instead of a cast when the wheel lands on it. */
    onOrder?: () => void
    /**
     * Paint the deck in what it is worth as evidence rather than in what its
     * rooms are for: the reveal. It changes nothing about the ship — the same
     * walls, the same solids — only what the surfaces say about themselves.
     */
    reveal?: boolean
    /**
     * Where the visitor has sat down, if they have.
     *
     * The walk is a walk, and one thing aboard is not: Morena's game is played
     * sitting at a table opposite the person dealing it. Sat down, the legs
     * stop answering — no keys, no stick, no stairs — and the head keeps
     * looking around, which is the whole of what a seated body still does. The
     * eye drops to `eye` metres above the deck, because a chair is the reason
     * the table is at chin height.
     *
     * `null` everywhere else, and the walk is unchanged by it.
     */
    seated?: { at: Vec2; heading: number; eye: number } | null
    /**
     * Things to draw that the ship is not holding.
     *
     * `apparitionsOn` answers what Nen has left standing, which is the only
     * thing the walk itself puts in a room. A page that owns some other state —
     * a hand of cards on a table — hands its own list in here and gets the same
     * treatment: built once, keyed on `id`, moved rather than rebuilt.
     */
    extras?: Apparition[]
    /** Moving solids supplied by a game layered over the walk. */
    collisionWalls?: WallSegment[]
    /**
     * What a camera the page has put in the room is looking at.
     *
     * The walk already insets a second picture in the corner whenever Little
     * Eye has been sent somewhere — that inset *is* the technique, and an
     * insect flying a room nobody can see through is a fly. The table plays the
     * same technique from a hand's width above the cards, so it hands its own
     * camera in here and gets the same corner: where the eye is, what it is
     * pointed at, and nothing else. `null` when there is no eye at the table.
     */
    feed?: EyeFeed | null
    /**
     * And what a camera the page has already *taken* is showing.
     *
     * The same shape and the opposite tense. `feed` is live — the picture goes
     * when the thing making it goes — and this is a recording, so it takes the
     * corner the walk already keeps for playback: the bird's ten seconds are
     * inset bottom right, and so is this. Whatever is in it was filmed by
     * something that is not filming any more.
     */
    record?: EyeFeed | null
    /**
     * A colour the whole room is standing in, or `null` for the ship's own.
     *
     * Not a light and not an overlay: the ambient *is* the exposure here — the
     * image is baked into the vertices and one flat white constant is what
     * shows it — so colouring that constant colours everything the room is
     * made of at once, which is the only honest way to say "the room is not
     * itself at the moment". The air takes it too, or the far end of a space
     * would stay the ship's own near-black and give the lie away.
     *
     * Parallel Future is what this is for: ten seconds are owed back, and until
     * they are paid the visitor is somewhere everybody else has already been.
     */
    tint?: number | null
    /**
     * The `id` of the extra down the reticle, mirrored out.
     *
     * The room and the solid are found by walking the floor plan, which is what
     * a wall is: a line on a deck. A card is not on the deck plan at all — it is
     * eleven centimetres of table, and the only honest way to ask which one a
     * seated visitor is looking at is to trace the ray at it. So this is the one
     * thing in the walk that is picked rather than computed, and only the things
     * the page marked `pick` are in the running.
     */
    aimedExtra?: string | null
    /**
     * Fired when the visitor takes hold of what is down the reticle.
     *
     * A click, or a tap that went nowhere. What it means is entirely the page's:
     * the scene knows it was card `hand-joker` and nothing whatever about what
     * playing a Joker does.
     */
    onPick?: (id: string) => void
    /**
     * Whether a click with the pointer held is a cast.
     *
     * It is, on the walk: the reticle is where the aura goes and the mouse is
     * the only thing pointing anywhere. At Morena's table it is not — the mouse
     * is how a card is chosen, and a technique spent by a stray click on the
     * wood would be the game playing itself. F still casts in both places.
     */
    castOnClick?: boolean
    /** The room down the reticle, mirrored out for the read-out. */
    aimedAt?: Space | null
    /** The solid down the reticle, for the techniques that work on solids. */
    aimedSolidAt?: Structure | null
    /**
     * Fired when the visitor casts on what they are facing.
     *
     * `hand` is which wheel position cast: a quick H is first, H then 2 is second. What that means
     * is the page's business — a second page of the book, or the second of a
     * technique's two hands — and the scene only reports which was pressed.
     */
    onCast?: (
      spaceId: string | null,
      solidId: string | null,
      hand: 'first' | 'second' | 'third',
    ) => void
    /** Standard H-key entry point, separate from clicks and physical F actions. */
    onHatsu?: (
      spaceId: string | null,
      solidId: string | null,
      hand: 'first' | 'second' | 'third',
    ) => void
    /** Exceptional abilities whose activation condition explicitly requires Zetsu. */
    hatsuAllowedInZetsu?: boolean
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
     * Asked every tenth of a second while The Sun and Moon has anything marked.
     *
     * The marks close on each other and go off when they touch, which is the
     * one thing in the walk that happens between casts rather than on one. The
     * clock is the same one the drift is drawn off — so what is seen touching
     * is what detonates — and `delta` is how much of a second went by, because
     * the tick is not owed by a frame that dropped.
     */
    onPolarity?: (seconds: number, delta: number) => void
    /**
     * Asked every few seconds while Little Eye's insect is out scouting.
     *
     * The bird is the other thing aboard that moves without being cast at: it
     * works its way through the ship a door at a time, on the same clock the
     * fish feed on. Which door it takes is the pure layer's decision.
     */
    onScout?: () => void
    /**
     * Asked every couple of seconds while a Guardian Spirit Beast is working.
     *
     * Three of them keep going after the cast — Tubeppa's melts what is in the
     * room, Luzurus's reels in what it caught and eats it, Salé-salé's fills
     * the room a part at a time — and all three are the same kind of event as
     * the fish feeding: something that happens on the clock rather than on a
     * key. What one step of each takes is the pure layer's decision.
     */
    onBeast?: () => void
    /**
     * Asked when the visitor walks into the coin off Zhang Lei's wheel.
     *
     * The same shape as the tunnel: a thing hanging in a room that is taken by
     * going and standing where it is, rather than by aiming at it. What taking
     * it is worth is the pure layer's.
     */
    onCoin?: (spaceId: string) => void
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
     * Whether the technique in hand pulls its own user along the strand.
     *
     * Bungee Gum's propulsion, and the reason it is not `swings`: the gum aimed
     * at a thing brings the *thing* in, and only the gum aimed at nothing turns
     * round and brings the visitor. So this rides the same arc Machi's thread
     * rides — the ship has one way of carrying a body across a gap and there is
     * no reason to draw a second — but only on the cast with the reticle empty,
     * which is the one the rules answer with `gum-propulsion`.
     */
    propels?: boolean
    /**
     * The body the visitor has a filament on, and where it is standing.
     *
     * Bungee Gum on a person is a hold in `cast/` rather than `TourWorld.gum` —
     * the walk keeps what is done to people apart from what is done to the ship
     * on purpose — so the far end of the strand is handed in rather than looked
     * up. `null` while nobody is stuck, which is most of the walk.
     */
    gumOn?: { spaceId: string; at: Vec2 } | null
    /**
     * Asked, on the same arrival, where Fugetsu's tunnel comes out — or `null`
     * when the visitor did not step into either of its ends.
     */
    onWorm?: (spaceId: string | null, arrivedFrom: string | null) => string | null
    /**
     * What time it is aboard, at the event the walk is projecting.
     *
     * Two windows in three hundred and fourteen spaces read this and nothing
     * else does — an unlit corridor is black at every hour by construction. The
     * hour itself is not worked out here: it is arbitrated on the server, off
     * the same voyage clock `/ship` reads, so the sky behind the bay agrees with
     * the people the same projection put in the rooms. See `$lib/tour/hour`.
     */
    hour?: ShipHour
    /** Shown while three.js and the first deck are being prepared. */
    loadingLabel: string
    /** Shown instead of the walk when the browser cannot give us WebGL. */
    unsupportedLabel: string
    /** Optional bindable for capturing the pure canvas */
    takeScreenshot?: (() => Promise<Blob | null>) | null
  }

  let {
    ship,
    loadingLabel,
    unsupportedLabel,
    takeScreenshot = $bindable(null),
    tierId = $bindable(),
    currentSpace = $bindable(null),
    availableLink = $bindable(null),
    jumpTo = $bindable(null),
    jumpAt = $bindable(null),
    jumpHeading = $bindable(null),
    engaged = $bindable(false),
    touch = $bindable(false),
    touchLabels,
    soundLabels,
    touchUseLabel = null,
    position = $bindable([0, 0]),
    heading = $bindable(0),
    lookPitch = $bindable(0),
    world = EMPTY_WORLD,
    auraColour = null,
    nen,
    onNenChange,
    onPhysicalNenAction,
    showNenControls = true,
    nenAvailability = {},
    flash = null,
    aiming = false,
    selfCastable = false,
    hands = null,
    tunes = null,
    twoHanded = false,
    orders = null,
    onOrder,
    reveal = false,
    seated = null,
    extras = [],
    collisionWalls = [],
    feed = null,
    record = null,
    tint = null,
    aimedAt = $bindable(null),
    aimedSolidAt = $bindable(null),
    aimedExtra = $bindable(null),
    castOnClick = true,
    onPick,
    onCast,
    onHatsu,
    hatsuAllowedInZetsu = false,
    onArrive,
    onWorm,
    onFish,
    onOwl,
    onOwlSecond,
    onPolarity,
    onScout,
    onBeast,
    onCoin,
    swings = false,
    propels = false,
    gumOn = null,
    hour = NO_HOUR,
  }: Props = $props()

  let localNen = $state<NenTechniqueState>(createNenTechniqueState())
  let interactWithNen = $state<(() => void) | null>(null)
  let hatsuWheelOpen = $state(false)
  let hatsuVariantIndex = $state(0)
  let selectedNenZone = $state<NenBodyZone>('hands')
  let lastHatsuVariant = $state(0)
  const hatsuVariants = $derived.by(() => {
    if (tunes) return [tunes.first, tunes.second, tunes.third]
    if (hands) return [hands.first, hands.second]
    if (twoHanded) return ['☀', '☾']
    if (selfCastable) return ['Cible', 'Soi']
    if (orders) return [touchLabels.cast, orders]
    return [touchLabels.cast]
  })
  const effectiveNen = $derived(nen ?? localNen)
  function useNen(action: NenTechniqueAction) {
    const result = transitionNen(effectiveNen, action)
    if (!result.accepted) return
    playNenTechniqueSound(action)
    if (nen === undefined) localNen = result.state
    onNenChange?.(action)
  }

  /**
   * The aura the visitor is *shown*, which is not always the aura they have.
   *
   * Null is "there is nothing to present": a Ten held and used for nothing,
   * from a visitor who has turned the resting aura off. Everything downstream
   * of the senses reads this — the shell around the camera, the swim over the
   * frame, the dust it shoves, the held tone — while everything that decides
   * what is *true* keeps reading `effectiveNen`. The body is still holding Ten:
   * it defends, it is visible to a Gyo across the room, and Zetsu remains the
   * only way to actually put it away. See `Comfort.restingAura`.
   */
  const shownNen = $derived(
    $comfort.restingAura || !isAuraAtRest(effectiveNen) ? effectiveNen : null,
  )

  /**
   * T, twice: raise the Ten, then put it back down.
   *
   * The key used to be one-way — from a Ren or a Zetsu it dropped you into Ten,
   * and from a Ten it did nothing at all, which is a key that stops answering
   * once you have pressed it. So the second press is the way out, and what it
   * puts down is the *showing* of the skin rather than the skin: the visitor
   * goes on holding Ten, because a body that stops holding it is in Zetsu and
   * Zetsu is X. See `Comfort.restingAura` for why that is the honest half to
   * hand a key.
   *
   * Raising always shows again, so the two presses are a true toggle from
   * wherever the aura was. Otherwise a T out of Ren would land on a skin the
   * visitor had put down an hour ago and the next press would do nothing —
   * the same dead key, one state further along.
   */
  function toggleTen() {
    if (isAuraAtRest(effectiveNen) && $comfort.restingAura) {
      setComfort({ restingAura: false })
      return
    }
    setComfort({ restingAura: true })
    useNen({ type: 'TEN' })
  }

  $effect(() => {
    setStepsAuraQuiet(effectiveNen.mode === 'zetsu')
  })

  $effect(() => (shownNen ? sustainNenSound(shownNen) : undefined))

  /**
   * How high the visitor's eye is off the floor.
   *
   * `HORIZON` in `$lib/tour/mesh` is the same number and has to stay it: the sea
   * is cut into the two panes at the height the eye looking through them meets
   * the horizon, and the pane is baked once while this is read every frame.
   */
  const EYE_HEIGHT = 1.7
  /**
   * What the aperture closes to when the monkeys take sight.
   *
   * Not zero: the ship is still there and still lit — the bake is in the
   * vertices and cannot be switched off — and a black frame would say the deck
   * had gone rather than that the eye had. Two per cent leaves the brightest
   * filaments as a suggestion and nothing else.
   */
  const SEALED_EXPOSURE = 0.02
  /** Radians of yaw per pixel of pointer movement, before the visitor's own multiplier. */
  const LOOK_SENSITIVITY = 0.0022
  const MAX_PITCH = Math.PI / 2 - 0.05

  /**
   * How far the camera sees, in metres.
   *
   * Once the air started being read off the room — see `fogDensityOf` — one
   * number stopped being able to do this. A cabin fogs at arm's length and a
   * hall is drawn nearly clear, and at the thinnest air the ship holds a surface
   * 130 m off still shows two fifths of itself: the far plane was cutting the far
   * wall of the largest rooms out of the picture, and the fog was not hiding the
   * cut. It is the biggest room on board that sets this, not the fog — the King's
   * living room is 193 m across, and you can stand at one end of it.
   *
   * The cost of the extra range is depth precision and nothing else: what is
   * drawn is decided by `visibleSpaces`, room by room, not by this plane.
   */
  const VIEW_DISTANCE = 220

  /**
   * How close, in metres.
   *
   * Raised with the far plane rather than left alone. A depth buffer is spread by
   * the *ratio* of the two, so pushing the far plane out at an unchanged near
   * plane is what makes two surfaces a few centimetres apart start fighting —
   * which on this deck is every wall line, every plate seam and every window pane,
   * all of them deliberately offset by three centimetres or less.
   *
   * Fifteen centimetres is closer than anything can be got to: the visitor is
   * stopped `VISITOR_RADIUS` from every wall, which is 40 cm.
   */
  const NEAR_PLANE = 0.15

  /** A finger that moved less than this, in pixels, was a tap and not a drag. */
  const TAP_SLOP = 12

  let canvas = $state<HTMLCanvasElement | null>(null)
  let container = $state<HTMLDivElement | null>(null)
  let ready = $state(false)
  let failure = $state<string | null>(null)
  
  let pendingScreenshot: (() => void) | null = null

  $effect(() => {
    takeScreenshot = async () => {
      if (!canvas || !ready) return null
      return new Promise<Blob | null>((resolve) => {
        pendingScreenshot = () => {
          canvas!.toBlob((blob) => resolve(blob), 'image/png')
        }
      })
    }
  })

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

      let runtime: Awaited<ReturnType<typeof createSceneRuntime>>
      try {
        // Multisampling on a phone is paid for at every one of a lot of pixels,
        // and on a display this dense it is buying an edge nobody can see. The
        // gold outlines are lines rather than geometry, so what it was mostly
        // smoothing is not there to be smoothed.
        runtime = await createSceneRuntime(THREE, canvas, {
          coarse,
          fov: $comfort.fov,
          nearPlane: NEAR_PLANE,
          viewDistance: VIEW_DISTANCE,
          // Read once, at build time, rather than watched: the composer's chain
          // of passes is fixed when it is made. A visitor who changes the palier
          // is told the walk reloads — see `TourComfortPanel` — because tearing
          // a live composer down and rebuilding it mid-frame is a way to lose a
          // WebGL context, and the setting is one people set once.
          quality: $comfort.quality,
        })
      } catch {
        failure = 'webgl'
        return
      }

      // A 3× display was rendering nine times the pixels of a 1× one for a walk
      // whose surfaces are flat colour. Capping at 1.5 costs about a percent of
      // apparent sharpness and 44% of the fragments.
      // The deck colours are true albedos, and the emissive surfaces are written
      // above white on purpose — a fitting at 2,4 and a window pane at 1,28. A
      // linear render clips all of that to flat white and leaves the far end of a
      // corridor as mud. The filmic curve is what holds both ends: it rolls a lamp
      // off instead of clipping it and keeps shadowed steel above black. It is also
      // what `syncSight` closes when the monkeys take sight.
      const {
        renderer,
        scene,
        fog,
        camera,
        composer,
        renderTarget,
        quality,
        shafts,
        refraction,
        grade,
      } = runtime
      const portals = new PortalRenderer(THREE, {
        renderer,
        scene,
        viewDistance: VIEW_DISTANCE,
      })
      const hatsuEffects = new HatsuSceneEffects(THREE, scene)
      const nenAura = new NenSceneAura(THREE, scene)
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
      // The field of view is the visitor's to set: 72° is a wide-angle lens, and
      // on a laptop held at arm's length it is a fisheye that makes people ill.
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
      const atmosphere = new TourAtmosphereView(THREE, scene, $comfort.nightLight)
      const { ambient, nightLight, auraLight, gildLight, haloLight, haloBubble, litLights } =
        atmosphere
      const NIGHT_LIGHT = NIGHT_LIGHT_INTENSITY
      /** The clear colour the air is closing to. Written by `hourView`. */
      const baseFog = atmosphere.baseFog
      // Its reach is the visitor's to set, down to nothing: see `nightLight` in
      // `$lib/tour/comfort` for why that is a setting and not a constant.

      /**
       * The aura as a light, not as an outline.
       *
       * Parked at zero intensity and moved with the visitor: the shells already
       * draw the reach of a technique in its own colour, and this makes that colour
       * fall on the steel. It is the only light on the ship that is not white or a
       * filament, which is the point — Nen is the one thing aboard that is not the
       * ship.
       */
      const AURA_LIGHT = AURA_LIGHT_INTENSITY

      /**
       * What the two Guardian Spirit Beasts that give something back leave on
       * the visitor.
       *
       * Both are carried rather than placed, and both are light rather than a
       * shell, because what they do is the one thing the walk had no way of
       * showing: Zhang Lei's coin is aura and nothing else — it is worth what it
       * has accumulated, and a coin in a pocket has to be visible as something —
       * and Tyson's levy is returned as happiness, which the walk spends as
       * brightness. Gold for the coin, warm white for the wog, and both scale
       * with what has actually been taken, so a tenth coin is plainly a tenth
       * coin.
       */
      /**
       * And the bubble itself, which is the half of the levy you can see from
       * inside it: a shell round the visitor, drawn from the inside, so the
       * whole view warms rather than one wall of it. Carried at the camera and
       * scaled with the halo; invisible while there is none.
       */

      /**
       * A lamp per room an eye-wog has lit, which is the other half of it.
       *
       * A room the blueprint put no window in is lit by whatever the
       * reconstruction hangs in its deckhead, and this is one more light in the
       * middle of it. Kept in a record and synced against `world.lit` the way
       * the solids are synced, so a room that has been blown clear of the levy
       * loses its lamp on the same frame.
       */

      /**
       * The eight materials the deck is drawn with.
       *
       * Every argument behind them — why the structure is front-culled, why the
       * two glazed rooms need a material of their own, why a fitting must not be
       * lit — is in `$lib/tour/deckMaterials`, beside the call it belongs to.
       * What is left here is the fact that this closure owns them and disposes
       * of them.
       */
      const paint = createDeckMaterials(THREE, quality)
      const { surface: material, skylit: skylitMaterial, pool: skyPool } = paint
      const {
        edge: edgeMaterial,
        seam: seamMaterial,
        pattern: patternMaterial,
        fitting: fittingMaterial,
      } = paint
      const { pane: paneMaterial, dust: dustMaterial } = paint

      /**
       * The hour, and everything aboard that answers to it.
       *
       * Every write it makes used to be here, spread across a `syncSky`, an
       * `aimShafts` and the tint branch of the frame loop. It is one object now
       * because the hour stopped being a fact about two windows: see the file
       * comment in `$lib/tour/hourView`, and `$lib/tour/regime` for the ship's
       * own night watch, which is what the other 312 spaces read.
       */
      const hourView = new TourHourView({
        THREE,
        camera,
        renderer,
        fog,
        ambient,
        decks: [material, skylitMaterial],
        fittings: fittingMaterial,
        pane: paneMaterial,
        motes: dustMaterial,
        pool: skyPool,
        shafts,
        windows: createShaftDecks(),
        burning: () => hatsuEffects.burning > 0,
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
      type Built = BuiltTierView

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
       * And the same eye at the table, which needs no deck of its own.
       *
       * The walk's eye is somewhere else on the ship, so half of what `syncEye`
       * does is keeping the room it is watching in the scene. This one is in
       * the room the visitor is sitting in — it is over the cards in front of
       * them — so it is a camera and nothing else, aimed wherever the page says
       * the insect is holding.
       */
      let tableCamera: import('three').PerspectiveCamera | null = null
      /**
       * And the same technique's other half at the same table: the owl's
       * recording, which is a camera that does not move because the thing that
       * made the picture is a bird bolted to a bulkhead an hour ago.
       */
      let recordCamera: import('three').PerspectiveCamera | null = null

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
      const tierView = new TierView(THREE, {
        surface: material,
        edge: edgeMaterial,
        seam: seamMaterial,
        pattern: patternMaterial,
        fitting: fittingMaterial,
        pane: paneMaterial,
        skylit: skylitMaterial,
        dust: dustMaterial,
      })

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
        return tierView.build({
          ship,
          world,
          tierId: nextTierId,
          reveal,
          dustScale: quality.dustScale,
        })
      }

      const dispose = (built: Built) => tierView.dispose(built)

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
      function goTo(spaceId: string, landing?: Vec2, facing?: number) {
        const space = ship.spaces.get(spaceId)
        if (!space) return
        const at = landing ?? spawnPoint(space, ship.plans.get(space.tierId)?.structures ?? [])
        yaw = facing ?? spawnFacing(space, at)
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
        eyeCamera = new THREE.PerspectiveCamera(64, 1, NEAR_PLANE, VIEW_DISTANCE)
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
        // Back to the visitor's own aperture rather than to 1: the seal is a
        // thing that happens to the eye, and lifting it hands the eye back as
        // it was set — see `exposure` in `$lib/tour/comfort`.
        renderer.toneMappingExposure = sealed
          ? SEALED_EXPOSURE
          : $comfort.exposure * hourView.exposure
        // Restored to what the visitor asked for, which may be nothing at all.
        nightLight.intensity = sealed || $comfort.nightLight <= 0 ? 0 : NIGHT_LIGHT
        // The fittings are not lit, so putting the lights out does nothing to
        // them: blinded, the visitor would be left staring at three thousand
        // lamps in a ship they cannot otherwise see. They are hidden instead,
        // which is the same statement — the seal is on the eye, and an eye that
        // takes nothing in takes the lamps in too.
        fittingMaterial.visible = !sealed
        // And the glass with them: it is written above white on the same
        // argument, so a sealed eye left staring at two lit windows would be
        // the one thing the seal is supposed to take.
        paneMaterial.visible = !sealed
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
        // Both surface materials, because the two rooms with a window in them
        // are steel like the rest of the deck: a hull that goes half
        // transparent everywhere except the observation deck would be saying
        // the bay is a different kind of wall, which it is not.
        for (const steel of [material, skylitMaterial]) {
          steel.transparent = phased
          steel.opacity = phased ? 0.42 : 1
          steel.depthWrite = !phased
          steel.needsUpdate = true
        }
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
            room.patterns.visible = on
            room.fittings.visible = on
            if (room.panes) room.panes.visible = on
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

        for (const { structure, room } of detachedOn(ship, world, { tierId: currentTierId })) {
          standing[structure.id] = true
          const key = JSON.stringify(structure)
          if (solids[structure.id]?.key === key) continue
          dropSolid(structure.id)

          // The rest of the room comes with it so the solid keeps the room's
          // light: in the two rooms with a window, that includes the daylight.
          const built = buildSolidMesh(structure, {
            room,
            tier: plan.tier,
            standing: plan.structures.filter((entry) => entry.spaceId === room.id),
          })
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
      /**
       * Where the visitor was when the motes were last moved, so the wake can be
       * a speed rather than a position: dust is displaced by something *going
       * through* it, and a visitor standing still displaces nothing.
       */
      const lastWake = new THREE.Vector3()
      let wakeKnown = false

      function driftMotes(delta: number, seconds: number) {
        const clouds: Dust[] = []
        for (const deck of [visible, eyeDeck]) {
          if (!deck) continue
          for (const room of deck.rooms) {
            if (!room.motes || !room.dust || !room.motes.visible) continue
            driftDust(room.dust, delta, seconds)
            clouds.push(room.dust)
            room.motes.geometry.attributes.position.needsUpdate = true
          }
        }
        if (!clouds.length) {
          wakeKnown = false
          return
        }

        // Camera position from the frame just gone: the eye is not placed until
        // the end of the tick, and one frame of lag in the wake behind someone
        // walking at 1.4 m/s is two centimetres.
        const here = camera.position
        const travelled = wakeKnown ? here.distanceTo(lastWake) : 0
        lastWake.copy(here)
        wakeKnown = true

        // Two shoves, and they are two different claims. The body is a thing
        // moving through air, so its wake is proportional to how fast it is
        // going and reaches about as far as an arm. The aura is not: it is out
        // to its own radius whether the visitor moves or not, and *that* is what
        // makes it worth drawing — the room registering a presence that has not
        // touched anything. See `refractionAmount` for what "out" means here.
        const speed = delta > 0 ? travelled / delta : 0
        const wake = Math.min(0.22, speed * 0.1)
        const aura = calmWalk ? 0 : refractionAmount(shownNen)
        const at: [number, number, number] = [here.x, here.y, here.z]

        for (const dust of clouds) {
          if (wake > 0.002) disturbDust(dust, { at, radius: 1.9, strength: wake })
          if (aura > 0) disturbDust(dust, { at, radius: 4.5, strength: aura * 0.3 })
        }
      }

      function driftSolids(seconds: number) {
        const moving = world.body.passengers.length
          ? new Map(
              detachedOn(ship, world, { tierId: currentTierId, seconds, carrier: pointer }).map(
                (held) => [held.structure.id, held.structure.at],
              ),
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
          // And the lively air on top of whatever else it is doing: a thing
          // Biohazard woke and Enchanting Music got hold of wanders the room
          // and hops as it goes. The hop is the only vertical offset any solid
          // in the walk has, which is what makes it read as dancing.
          const hop = world.solids[id]?.dancing ? danceOffset(id, seconds) : null
          // And Camilla's beast on top of everything else: a thing it has hold
          // of has left its floor, so it climbs, wanders and turns over.
          //
          // The turn is the awkward part. These meshes are baked at the
          // coordinates the room drew them at rather than about their own
          // centre, so spinning the object would swing it round the ship's
          // origin — the correction is to put the group where the centre ends
          // up after the rotation, which is `c - R·c`, and let the geometry
          // follow. The rotation is about Y only, so the height needs none of it.
          const adrift = world.solids[id]?.adrift ? driftOffset(id, seconds) : null
          const spin = adrift ? adrift[3] : 0
          const sin = Math.sin(spin)
          const cos = Math.cos(spin)
          const pivotX = adrift ? held.at[0] - (cos * held.at[0] + sin * held.at[1]) : 0
          const pivotZ = adrift ? held.at[1] - (-sin * held.at[0] + cos * held.at[1]) : 0
          held.mesh.rotation.y = spin
          held.mesh.position.set(
            (drift ? drift[0] : 0) + (hop ? hop[0] : 0) + (adrift ? adrift[0] : 0) + pivotX,
            (hop ? hop[1] : 0) + (adrift ? adrift[1] : 0),
            (drift ? drift[1] : 0) + (hop ? hop[2] : 0) + (adrift ? adrift[2] : 0) + pivotZ,
          )
          held.edges.position.copy(held.mesh.position)
          held.edges.rotation.y = spin
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
        /** What it was built at, in metres: the coil's radius, for the snake. */
        size: number
        /** The deck it is on, for the arm that has to know whether you are on it. */
        tierId: string
        /** The far end, for a mouth of the tunnel. */
        pair: Apparition['pair']
        /** Whether the reticle may take hold of it. See `Apparition.pick`. */
        pick: boolean
        /** The disc the other end is rendered onto. */
        pane: import('three').Mesh | null
        /**
         * The way it was last looking, for the one that can stop looking.
         *
         * Survives a rebuild, which nothing else on a mesh does — see the
         * dealer in `driftApparitions`.
         */
        facing?: number
        /**
         * The middle it is actually working, for the one that is flown there.
         *
         * Everything else in this list is *put* somewhere: a mark goes up over
         * a room and a card is laid on a table, and both are where they are the
         * frame they are given. The insect is not put anywhere — it is sent,
         * and being told to look at something else is an order it has to cross
         * the room to obey. So it chases `at` rather than sitting on it.
         */
        flown?: import('three').Vector3
        /** Near and far representations of a shared human, when this is one. */
        humanLod?: { near: import('three').Group; far: import('three').Group }
        humanAnimate?: (seconds: number, pose?: HumanPose) => void
        humanPose?: HumanPose
        humanHeading?: number
        /** False only until the first authoritative position has been applied. */
        positioned?: boolean
      }

      // A plain record for the same reason the solids are one: the render loop
      // owns it and nothing in the markup reads it.
      const apparitionView = new ApparitionView<Shown>(scene, portals)
      const apparitions = apparitionView.items

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
       * The refractive shell a body's aura wears, shared by strength.
       *
       * `NenSceneAura` gives the visitor a `MeshPhysicalMaterial` for their own
       * aura and the frame a distortion pass on top of it; the cast had neither,
       * so an aura across the room was additive light and nothing else. This is
       * the same statement made about somebody else's body — see `auraGlass` in
       * `$lib/tour/humanAura` and the curve in `$lib/tour/auraRefraction`.
       *
       * `high` only, and for the same reason the fullscreen pass is: a
       * transmissive material makes the renderer resolve the scene into its own
       * buffer for every one of them, which is precisely the cost the `low`
       * palier exists to refuse. On `low` the factory is simply absent and the
       * figure builder draws what it always drew.
       */
      const glassMaterials: Record<string, import('three').Material | undefined> = {}
      const glass = quality.auraDistortion
        ? (worn: AuraGlass) => {
            const key = `${worn.ior}|${worn.thickness}|${worn.roughness}`
            const held = glassMaterials[key]
            if (held) return held
            // Spread whole: `depthWrite: false` is load-bearing and belongs to
            // the shell rather than to this file. See `AuraGlass`.
            const made = new THREE.MeshPhysicalMaterial({
              ...worn,
              transparent: true,
              opacity: 1,
              side: THREE.DoubleSide,
            })
            glassMaterials[key] = made
            return made
          }
        : undefined

      /**
       * The mark on a card, as a material.
       *
       * The panel draws the twelve faces as SVG and the table drew none of
       * them: a card on the wood was a coloured rectangle, which is legible as
       * *a card* and says nothing about which one. That was tolerable while the
       * only thing looking at the table was a visitor who had the panel open
       * beside it, and it stopped being tolerable the moment a camera was put a
       * hand's width above her fan — a feed of seven grey rectangles is not a
       * hand anybody has read.
       *
       * So the same drawing is loaded off `$lib/tour/cardArt` as an image and
       * laid over the card's own colour: ink on a face that is still the colour
       * it always was, which is what the chapters draw. Cached by face and ink,
       * because seven cards of the same suit are one upload.
       */
      const faceTextures: Record<string, import('three').Texture | undefined> = {}
      const faceMaterials: Record<string, import('three').MeshBasicMaterial | undefined> = {}
      const cardFace = (face: CardFace, ink: string) => {
        const key = `${face}|${ink}`
        const held = faceMaterials[key]
        if (held) return held
        const texture = new THREE.TextureLoader().load(cardFaceSvg(face, ink))
        texture.colorSpace = THREE.SRGBColorSpace
        // The bake is flat colour and the drawing is line work at a slant, so
        // the mark is the one thing aboard that wants filtering rather than
        // pixels: without it the thin strokes crawl as the head moves.
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
        faceTextures[key] = texture
        const made = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
        faceMaterials[key] = made
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

      /**
       * How many links the Dowsing Chain is drawn with.
       *
       * Enough that the run from the hand to the ball reads as chain at a
       * glance, and few enough that it is still a handful of rings when the
       * lash puts it across eight metres of promenade.
       */

      /** How long one lash takes: out fast, back slower, and it is over. */
      const LASH_OUT = 0.14
      const LASH_BACK = 0.36

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
        const skin = glow(seen.colour, 0.92)
        let turns: import('three').Object3D | null = null
        let pane: import('three').Mesh | null = null
        let humanLod: Shown['humanLod']
        let humanAnimate: Shown['humanAnimate']

        const basic = buildBasicApparition(seen, {
          THREE,
          glow,
          ...(glass ? { glass } : {}),
          root,
          skin,
          observerGyo: effectiveNen.gyo,
        })
        if (basic) {
          turns = basic.turns
          humanLod = basic.humanLod
          humanAnimate = basic.humanAnimate
        }
        turns = buildObjectApparition(seen, { THREE, glow, root, skin, cardFace }) ?? turns
        turns = buildEmbellishmentApparition(seen, { THREE, glow, root, skin }) ?? turns
        turns = buildInsectApparition(seen, { THREE, glow, root, skin }) ?? turns
        turns = buildSnakeApparition(seen, { THREE, glow, root, skin }) ?? turns
        turns = buildGuardianApparition(seen, { THREE, glow, root, skin }) ?? turns
        turns = buildMechanicalApparition(seen, { THREE, glow, root, skin }) ?? turns
        turns = buildCrawlingApparition(seen, { THREE, glow, root, skin }) ?? turns
        turns = buildSpriteApparition(seen, { THREE, glow, root, skin }) ?? turns
        turns = buildDragonApparition(seen, { THREE, glow, root, skin }) ?? turns
        turns = buildVowApparition(seen, { THREE, glow, root, skin }) ?? turns
        turns = buildAnimalApparition(seen, { THREE, glow, root, skin }) ?? turns

        // ── The Guardian Spirit Beasts ─────────────
        //
        // The first apparitions in the walk with a body. Everything else in
        // this function is a mark or a prop; these are animals, and an animal
        // built out of the same primitives has to earn its silhouette — a bell
        // with tentacles under it, a quadruped with horns, a burning wheel, a
        // toad with spines, an eye with wings. Recognisable across a promenade
        // and nowhere near modelled, which is the rule the whole scene keeps.

        // ── Morena's table ────────────────────────────
        //
        // The two things in the walk that are neither Nen nor ship: the woman
        // dealing the negotiation game, and the cards she deals it with. Built
        // the same way as everything else here — primitives and a colour — so
        // that the one room the walk sits you down in is drawn by the same
        // machinery as the ninety you walk through.

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

        if (seen.kind === 'antenna') {
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, seen.size * 2), skin)
          pole.position.y = seen.size
          root.add(pole)

          const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04), glow(seen.colour, 0.9))
          bulb.position.y = seen.size * 2
          root.add(bulb)

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
            seen.pair ? portals.material(seen.id) : glow(seen.colour, 0.22),
          )
          pane.renderOrder = 1
          root.add(pane)
          turns = root
        }

        styleNenCreature(THREE, root, { kind: seen.kind, size: seen.size })

        return {
          key: '',
          kind: seen.kind,
          root,
          turns,
          y: seen.y,
          at: seen.at,
          stage: seen.stage,
          spread: seen.spread ?? 0,
          size: seen.size,
          tierId: seen.tierId,
          pair: seen.pair,
          pick: seen.pick ?? false,
          pane,
          humanLod,
          humanAnimate,
        }
      }

      function dropApparition(id: string) {
        apparitionView.drop(id)
      }

      /** Puts what the world says is standing into the scene, and takes out the rest. */
      function syncApparitions(seconds: number) {
        const wanted = [
          ...apparitionsOn(ship, world, {
            visitor: {
              at: pointer,
              tierId: currentTierId,
              spaceId: untrack(() => currentSpace)?.id ?? null,
            },
            seconds,
          }),
          ...extras,
        ].filter((seen) => !seen.hidden || effectiveNen.gyo)
        apparitionView.sync(wanted, {
          idOf: (seen) => seen.id,
          keyOf: (seen) =>
            `${seen.kind}|${seen.colour}|${seen.size}|${seen.hidden}|${seen.pair?.spaceId ?? ''}|${seen.climb ?? ''}|${seen.face ?? ''}|${humanStateKey(seen)}|gyo:${effectiveNen.gyo}`,
          build: buildApparition,
          preserve: (held) => ({ facing: held.facing, flown: held.flown }),
          restore: (held, saved) => {
            const previous = saved as Pick<Shown, 'facing' | 'flown'> | undefined
            held.facing = previous?.facing
            held.flown = previous?.flown
          },
          update: (held, seen) => {
            held.y = seen.y
            held.at = seen.at
            held.stage = seen.stage
            held.spread = seen.spread ?? 0
            held.size = seen.size
            held.tierId = seen.tierId
            held.pair = seen.pair
            held.humanPose = seen.human?.pose
            held.humanHeading = seen.heading
            held.pick = seen.pick ?? false
            if (!held.positioned) {
              held.root.position.set(seen.at[0], seen.y, seen.at[1])
              held.positioned = true
            }
          },
          leaving: (held) => held.kind === 'game-card',
          sweep: sweepCard,
        })
      }
      // ── Cards leaving the table ──────────────────
      //
      // Everything else in this scene appears and disappears, because a
      // technique that has ended has left the room. A card has not: somebody
      // took it. The Manipulation is the whole reason this exists — the canon
      // sanction of Morena's game is three cards leaving the guest's hand at
      // once, which is the most violent thing that happens at that table, and
      // it used to happen between two frames with nothing to see.
      //
      // The rule the drift keeps — a card does not move — is kept here too. A
      // card that is *going* is not a card lying on the table, and it is gone
      // in under half a second.

      /** How long a card takes to leave, in seconds. */
      const CARD_EXIT = 0.45
      /** How far it goes before it is let go of, in metres. */
      const CARD_REACH = 0.55

      const leaving: {
        root: import('three').Group
        from: import('three').Vector3
        to: import('three').Vector3
        through: number
        /** Cloned per card: the glow materials are shared by colour, and a card
         *  fading out would otherwise take every card of its colour with it. */
        fades: { material: import('three').MeshBasicMaterial; from: number }[]
      }[] = []

      /**
       * Hand a card to whoever took it.
       *
       * Away from the visitor, because the person on the other side of this
       * table is the only one who takes anything off it — that is true of the
       * card she draws each round and true of the three the Manipulation
       * removes, and it needs no name to be true.
       */
      function sweepCard(held: Shown) {
        const from = held.root.position.clone()
        const away = new THREE.Vector3(from.x - camera.position.x, 0, from.z - camera.position.z)
        if (away.lengthSq() < 1e-6) away.set(0, 0, -1)
        away.normalize().multiplyScalar(CARD_REACH)

        const fades: { material: import('three').MeshBasicMaterial; from: number }[] = []
        held.root.traverse((part) => {
          const mesh = part as import('three').Mesh
          if (!mesh.material) return
          const own = (mesh.material as import('three').MeshBasicMaterial).clone()
          mesh.material = own
          fades.push({ material: own, from: own.opacity })
        })

        leaving.push({
          root: held.root,
          from,
          to: new THREE.Vector3(from.x + away.x, from.y + 0.07, from.z + away.z),
          through: 0,
          fades,
        })
      }

      function driftLeavingCards(delta: number) {
        for (let i = leaving.length - 1; i >= 0; i--) {
          const card = leaving[i]
          card.through += delta / CARD_EXIT
          if (card.through >= 1) {
            dropLeavingCard(i)
            continue
          }
          // Out fast and slowing: a card is pulled, and the hand that pulled it
          // stops. Linear would be a card on a conveyor.
          const eased = 1 - (1 - card.through) * (1 - card.through)
          card.root.position.lerpVectors(card.from, card.to, eased)
          for (const fade of card.fades) fade.material.opacity = fade.from * (1 - card.through)
        }
      }

      function dropLeavingCard(index: number) {
        const card = leaving[index]
        scene.remove(card.root)
        card.root.traverse((part) => {
          const mesh = part as import('three').Mesh
          if (mesh.geometry) mesh.geometry.dispose()
        })
        for (const fade of card.fades) fade.material.dispose()
        leaving.splice(index, 1)
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
        portals.render(
          Object.entries(apparitions).flatMap(([id, held]) =>
            held?.kind === 'portal' && held.pair && held.pane
              ? [{ id, pair: held.pair, pane: held.pane }]
              : [],
          ),
          camera,
        )
      }

      /**
       * The lash being thrown, if one is: where the ball has to reach, and how
       * far through the throw it is. Held here rather than in the world because
       * a blow is over in half a second and the world would still be holding it
       * a minute later — the same reason the punch and the gust are flashes.
       */
      let lashing: { at: Vec2; y: number; through: number } | null = null

      /** One frame of the throw, and it is put away when it has come back. */
      function runLash(delta: number) {
        if (!lashing) return
        lashing.through += delta
        if (lashing.through >= LASH_OUT + LASH_BACK) lashing = null
      }

      /**
       * How many birds the ring is spaced for, and one vector to convert in.
       *
       * The count matches `FLOCK_BIRDS` because the ring is what that number is
       * for; kept as its own constant so the spacing here cannot silently stop
       * agreeing with the flock the rules gathered. The vector is reused across
       * every bird and every frame: twelve allocations a frame, for the life of
       * a walk, to say the same three numbers.
       */
      const BIRD_RING = FLOCK_BIRDS
      const BIRD_WRIST = new THREE.Vector3()

      /**
       * One of Cluck's birds, on its own place in the ring round the visitor.
       *
       * The flock does not stay where it was called: it stays *with* whoever
       * called it, which is the difference between a room full of pigeons and a
       * flock under manipulation. So the ring is worked out from the camera
       * every frame rather than from the point the apparition was placed at,
       * and `stage` — the bird's index — is what keeps twelve orbits from being
       * one orbit drawn twelve times: it sets where in the ring the bird is,
       * how high it flies, and where its wingbeat is in the stroke.
       *
       * The thread is the ability. Its far end is the visitor's wrist, and it is
       * rewritten here because this is the only place both ends are known — but
       * it is only ever *drawn* under Gyo, which is the claim ch. 320 makes:
       * the birds are ordinary and the bundle of threads is not. Twelve birds
       * is twelve threads, and being able to count them is the point.
       */
      function flyTheBird(held: Shown, seconds: number) {
        const index = held.stage
        const radius = held.spread || 1.9
        // The ring turns as one, a revolution every eight seconds or so: what a
        // flock being flown looks like from underneath.
        const around = (index / BIRD_RING) * Math.PI * 2 + seconds * 0.8
        const rise = Math.sin(seconds * 1.3 + index) * 0.22
        held.root.position.set(
          camera.position.x + Math.cos(around) * radius,
          camera.position.y + 0.55 + rise,
          camera.position.z + Math.sin(around) * radius,
        )
        // Facing along the orbit rather than at the visitor: a bird flies the
        // way it is going.
        held.root.rotation.y = -around + Math.PI / 2

        const wings = held.root.getObjectByName(BIRD_WINGS)
        if (wings) wings.rotation.z = Math.sin(seconds * 9 + index * 1.7) * 0.5

        const tether = held.root.getObjectByName(BIRD_TETHER) as import('three').Line | undefined
        if (!tether) return
        tether.visible = effectiveNen.gyo
        if (!tether.visible) return
        // The wrist, brought back through the bird's own turn: the thread is a
        // child of a group that is rotating, and a far end left in world metres
        // would swing round the room once every revolution.
        held.root.updateMatrixWorld()
        const wrist = held.root.worldToLocal(
          BIRD_WRIST.set(camera.position.x, camera.position.y - 0.45, camera.position.z),
        )
        const line = tether.geometry.attributes.position as import('three').BufferAttribute
        line.setXYZ(0, 0, 0, 0)
        line.setXYZ(1, wrist.x, wrist.y, wrist.z)
        line.needsUpdate = true
      }

      /**
       * The Dowsing Chain, hanging off the hand or out at what it just hit.
       *
       * The chain is fixed to the visitor: the group sits at their hand and is
       * never turned, so everything below is worked out in plain metres from
       * there — which is what lets the ball be sent to a point in the room
       * rather than to a point in front of the camera. Hanging, it is a
       * pendulum on two thirds of a metre of chain; struck out, it is the same
       * chain with the ball at the far end of it and the links strung between.
       */
      function swingTheChain(held: Shown, phase: number) {
        const sin = Math.sin(yaw)
        const cos = Math.cos(yaw)
        const hand = new THREE.Vector3(
          camera.position.x + cos * 0.42 - sin * 0.34,
          camera.position.y - 0.5,
          camera.position.z - sin * 0.42 - cos * 0.34,
        )
        held.root.position.copy(hand)
        held.root.rotation.set(0, 0, 0)

        // Where the ball is, in metres from the hand. Idle, it swings.
        const hang = new THREE.Vector3(
          Math.sin(phase * 1.7) * 0.15,
          -0.62,
          Math.cos(phase * 1.1) * 0.09,
        )
        let ball = hang
        if (lashing) {
          const reach = new THREE.Vector3(lashing.at[0], lashing.y, lashing.at[1]).sub(hand)
          // Out fast and back slower: what makes a whip a whip is the return,
          // and the moment it is furthest out is the moment it lands.
          const out =
            lashing.through < LASH_OUT
              ? (lashing.through / LASH_OUT) ** 0.55
              : Math.max(0, 1 - (lashing.through - LASH_OUT) / LASH_BACK) ** 1.4
          ball = hang.clone().lerp(reach, out)
        }

        const [weight, ...links] = held.root.children
        weight.position.copy(ball)

        // Which way the chain runs, for the links to lie along — and straight
        // down for the frame where the ball is in the hand and there is no run.
        const run = ball.clone()
        run.normalize()
        if (!Number.isFinite(run.x) || run.lengthSq() < 0.5) run.set(0, -1, 0)
        const turn = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), run)
        // And the tip lies along it too. The pendulum is a sphere and cannot
        // tell, but the other four have a point on them: a syringe hanging
        // sideways off a chain is a syringe nobody could drive into anything.
        weight.quaternion.copy(turn)
        // A chain thrown across a room is nearly straight; one hanging off a
        // hand is not, so the sag is taken off however far out it has gone.
        const sag = Math.min(0.45, Math.hypot(ball.x, ball.z) * 0.16)

        links.forEach((link, i) => {
          const along = (i + 1) / (links.length + 1)
          link.position.set(
            ball.x * along,
            ball.y * along - Math.sin(along * Math.PI) * sag,
            ball.z * along,
          )
          link.quaternion.copy(turn)
          // The ring's own axis across the run, so the hole faces along the
          // chain, and every other link a quarter turn over from its neighbour.
          link.rotateX(Math.PI / 2)
          if (i % 2) link.rotateOnWorldAxis(run, Math.PI / 2)
        })
      }

      /**
       * The flute, at the lips or at the side.
       *
       * Carried like the book and the chain: the group is put at the visitor's
       * hands every frame and turned with them, so the instrument lies across
       * the player with the head end on their left, which is how a transverse
       * flute is held. `stage` says whether anything is coming out of it —
       * raised, it is up at the mouth and breathing quickly with the playing;
       * down, it hangs at the hip on a slow sway.
       */
      function raiseTheFlute(held: Shown, phase: number) {
        const sin = Math.sin(yaw)
        const cos = Math.cos(yaw)
        const playing = held.stage > 0
        // Forward is (cos, -sin) and the right hand is (-sin, -cos): played, it
        // comes in under the eye and barely in front; down, it is out at the
        // hip and well below it.
        const ahead = playing ? 0.34 : 0.4
        const aside = playing ? 0.12 : 0.42
        const drop = playing ? 0.24 : 0.72
        held.root.position.set(
          camera.position.x + cos * ahead - sin * aside,
          camera.position.y -
            drop +
            Math.sin(phase * (playing ? 7 : 1.5)) * (playing ? 0.006 : 0.02),
          camera.position.z - sin * ahead - cos * aside,
        )
        // A quarter turn off the walk's own yaw puts the tube along the
        // visitor's right, which is where the far end of a flute goes.
        held.root.rotation.set(0, yaw + Math.PI / 2, 0)
        // Level at the lips; angled down and away when it is only being held.
        held.root.rotateZ(playing ? -0.12 : -0.95)
        held.root.rotateX(playing ? 0.06 : 0.3)
      }

      /**
       * The run of a snake, from the shoulder it came out of to the coil.
       *
       * Snake Arm is a limb, not a thing put down in a room: whatever it has
       * hold of, the other end of it is still on the visitor. So the beads are
       * strung between the hand and where the coil starts, every frame, the way
       * the Dowsing Chain's links are strung between the hand and the ball.
       *
       * Which hand is `stage`: nought is the left arm and one the right, which
       * is how two snakes out at once are two arms rather than one arm drawn
       * twice. The run is only drawn on the deck the coil is on — an arm that
       * crossed three decks of hull to reach the hand would be reaching through
       * steel, and off the deck the limb is simply out of sight.
       */
      function strungFromTheArm(held: Shown, phase: number) {
        const run = held.root.getObjectByName('run')
        if (!run) return
        run.visible = held.tierId === currentTierId
        if (!run.visible) return

        // The hand, at the visitor's side and a little in front, on the
        // shoulder this snake belongs to.
        const side = held.stage === 0 ? -1 : 1
        const sin = Math.sin(yaw)
        const cos = Math.cos(yaw)
        // Taken off the coil's own position rather than through `worldToLocal`:
        // the group was put where it stands this frame and is never turned, so
        // the subtraction is exact and does not wait on a matrix.
        const hand = new THREE.Vector3(
          camera.position.x + side * cos * 0.42 - sin * 0.4 - held.root.position.x,
          camera.position.y - 0.5 + Math.sin(phase * 1.6) * 0.02 - held.root.position.y,
          camera.position.z - side * sin * 0.42 - cos * 0.4 - held.root.position.z,
        )
        // Where the coil starts, which is where the run has to arrive: the
        // first point of the helix `buildApparition` wound.
        const coil = new THREE.Vector3(held.size, -0.04, 0)

        const along = new THREE.Vector3().subVectors(coil, hand)
        // The wave runs across the arm rather than along it, so it needs an
        // axis that is not the arm's own: the horizontal normal serves, and it
        // is what makes the limb crawl instead of hanging like a rope.
        const across = new THREE.Vector3(-along.z, 0, along.x)
        if (across.lengthSq() < 1e-6) across.set(1, 0, 0)
        across.normalize()
        const swell = Math.min(0.5, along.length() * 0.12)

        run.children.forEach((bead, i) => {
          const t = (i + 1) / (run.children.length + 1)
          const wave = Math.sin(t * Math.PI * 3 - phase * 2.4) * swell * Math.sin(t * Math.PI)
          bead.position.set(
            hand.x + along.x * t + across.x * wave,
            hand.y + along.y * t - Math.sin(t * Math.PI) * swell * 0.5,
            hand.z + along.z * t + across.z * wave,
          )
        })
      }

      /**
       * What the apparitions do while nobody is casting anything.
       *
       * All of it is a sine: an owl's head turning, a card riding on the air, a
       * sigil rotating, a double breathing. It costs nothing, and without it the
       * technique reads as a prop left in the room rather than as aura.
       */
      /** Where the insect has been told to be, held once rather than per frame. */
      const FLY_TO = new THREE.Vector3()
      const HUMAN_VIEW = new THREE.Frustum()
      const HUMAN_VIEW_PROJECTION = new THREE.Matrix4()
      const HUMAN_VIEW_BOX = new THREE.Box3()

      function driftApparitions(seconds: number, delta: number) {
        camera.updateMatrixWorld()
        HUMAN_VIEW.setFromProjectionMatrix(
          HUMAN_VIEW_PROJECTION.multiplyMatrices(
            camera.projectionMatrix,
            camera.matrixWorldInverse,
          ),
        )
        for (const [id, held] of Object.entries(apparitions)) {
          if (!held) continue
          const phase = seconds + id.length

          if (held.humanLod) {
            const distance = camera.position.distanceTo(held.root.position)
            const near = distance <= HUMAN_LOD_DISTANCE
            held.humanLod.near.visible = near
            held.humanLod.far.visible = !near
            // Position remains authoritative even off-screen; pose animation and
            // orientation work do not run until the figure can be seen again.
            // Game simulations usually publish human positions at 30 Hz while
            // the scene renders at the display rate. Ease toward the latest
            // authoritative point instead of visibly hopping between ticks.
            const moveX = held.at[0] - held.root.position.x
            const moveZ = held.at[1] - held.root.position.z
            const moving = Math.hypot(moveX, moveZ) > 0.002
            if (moving) held.facing = Math.atan2(moveX, moveZ)
            const follow = 1 - Math.exp(-delta * 14)
            held.root.position.x += (held.at[0] - held.root.position.x) * follow
            held.root.position.y += (held.y - held.root.position.y) * follow
            held.root.position.z += (held.at[1] - held.root.position.z) * follow
            held.root.updateMatrixWorld(true)
            // `Frustum.intersectsObject` only accepts renderable objects with
            // their own geometry. Both LODs are groups, so asking it directly
            // throws while reading `geometry.boundingSphere` as soon as a
            // shared human (notably Silent Majority's puppet) is materialized.
            HUMAN_VIEW_BOX.setFromObject(near ? held.humanLod.near : held.humanLod.far)
            const visible = HUMAN_VIEW.intersectsBox(HUMAN_VIEW_BOX)
            if (!visible) continue
            const desiredHeading =
              (moving ? held.facing : (held.humanHeading ?? held.facing)) ??
              Math.atan2(
                camera.position.x - held.root.position.x,
                camera.position.z - held.root.position.z,
              )
            const turn = Math.atan2(
              Math.sin(desiredHeading - held.root.rotation.y),
              Math.cos(desiredHeading - held.root.rotation.y),
            )
            held.root.rotation.y += turn * (1 - Math.exp(-delta * 12))
            if (near) held.humanAnimate?.(seconds, held.humanPose)
            continue
          }

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

          if (held.kind === 'gum') {
            // A trip-line under tension, and the tension is the point: a strand
            // strung across a coursing and left perfectly still reads as a rod
            // laid on the floor. So it breathes along its own length and
            // shivers a centimetre, which is the whole of what a drawn elastic
            // does while it waits. Small on purpose — In is hiding it, and only
            // Gyo is looking at it at all.
            held.root.scale.x = 1 + Math.sin(phase * 1.7) * 0.015
            held.root.position.y = held.y + Math.sin(phase * 5.5) * 0.012
            continue
          }

          if (held.kind === 'bird') {
            flyTheBird(held, seconds)
            continue
          }

          if (held.kind === 'chain') {
            swingTheChain(held, phase)
            continue
          }

          if (held.kind === 'vow-heart') {
            if (held.key === 'vow:self') {
              // Worn at the sternum, a little to the left of it, the way the organ
              // is. Nothing about it is aimed and nothing about it swings: it is
              // carried the way the book and the ball are, and it is the only one
              // of the three that is not in a hand.
              const sin = Math.sin(yaw)
              const cos = Math.cos(yaw)
              held.root.position.set(
                camera.position.x - cos * 0.26 - sin * 0.34,
                camera.position.y - 0.4,
                camera.position.z + sin * 0.26 - cos * 0.34,
              )
            } else {
              // Planted in another person's chest: it stays where the cast
              // landed, at chest height, and faces the visitor.
              held.root.position.set(held.at[0], held.y, held.at[1])
            }
            // Tipped back towards the face, for the same reason the open book
            // is: a thing worn on the chest is looked at from above, and a
            // heart seen from directly overhead is a shape nobody recognises.
            held.root.rotation.set(0, yaw, 0)
            held.root.rotateX(-0.95)
            // And it beats — twice, the way a heart does, a systole and the
            // smaller one behind it. Struck, it does not: `sworn-struck` is the
            // vow being collected, and the one thing the walk can say about that
            // is the thing that was moving stopping. It is the same sentence the
            // woman opposite is drawn with, and it is deliberate.
            if (held.turns) {
              const beat = (seconds * 1.15) % 1
              const thump = (at: number, width: number) => Math.exp(-((beat - at) ** 2) / width)
              const swell =
                held.stage === 2 ? 0 : (thump(0.06, 0.0025) + thump(0.24, 0.004) * 0.55) * 0.085
              held.turns.scale.setScalar(1 + swell)
            }
            continue
          }

          // A card lies where it was put. Nothing else in this list holds
          // perfectly still — everything Nen leaves standing is riding on the
          // air — and that is exactly why a card must: a card that bobbed would
          // be a card nobody had dealt.
          if (held.kind === 'game-card') {
            // Except under a finger. A card the visitor is pointing at stands a
            // centimetre off the wood — which is not the card moving, it is the
            // hand about to take it, and it is the only way a table with no
            // cursor on it can say *this one*. It goes down again the moment the
            // reticle leaves, because nothing was played.
            const lifted = held.pick && id === aimedExtra ? 0.012 : 0
            held.root.position.set(held.at[0], held.y + lifted, held.at[1])
            continue
          }

          // And the contract, which obeys the same rule for the same reason: a
          // signed one lies in the corner and does not move, because a document
          // that drifted would be a document nobody had put down. Unsigned, it
          // is still aura being held up between two people, so it breathes the
          // way everything else in this list does.
          if (held.kind === 'contract') {
            const air = held.stage > 0 ? 0 : Math.sin(phase * 0.7) * 0.008
            held.root.position.set(held.at[0], held.y + air, held.at[1])
            continue
          }

          // And the woman opposite breathes, and looks at whoever sat down.
          //
          // Both of those are hers to lose, and losing one is the only way a
          // body that is already moving and already facing you can be seen to
          // react. Stage 3 is the room having told her something: the one thing
          // in the room that was moving stops, and a reader who was watching the
          // table rather than the transcript learns that they were seen. Stage 4
          // is Three Monkeys: she keeps breathing and stops finding you, which
          // is a different loss and has to read as one.
          if (held.kind === 'dealer') {
            const breath = held.stage === 3 ? 0 : Math.sin(phase * 0.5) * 0.012
            held.root.position.set(held.at[0], held.y + breath, held.at[1])
            if (held.stage !== 4) {
              held.facing = Math.atan2(
                camera.position.x - held.root.position.x,
                camera.position.z - held.root.position.z,
              )
            }
            // Held rather than read back off the mesh: a change of stage rebuilds
            // her, and a rebuilt dealer whose head snapped to due north the
            // instant she was blinded would read as a fault rather than as a
            // woman who has lost you.
            held.root.rotation.y = held.facing ?? 0
            animateDealerFace(held.root, held.stage, phase)
            continue
          }

          // ── The Guardian Spirit Beasts ───────────
          //
          // These are the apparitions that have to look alive rather than
          // merely present: everything above them is a mark riding on the air,
          // and an animal that only bobbed would be a prop of an animal.

          // The enormous crown breathes while the hanging hem moves in slow,
          // separate waves: a living curtain rather than a swimming jellyfish.
          if (held.kind === 'medusa') {
            held.root.position.set(held.at[0], held.y + Math.sin(phase * 0.6) * 0.18, held.at[1])
            const breath = 1 + Math.sin(phase * 0.72) * 0.025
            const canopy = held.root.getObjectByName('camilla-eye-canopy')
            if (canopy) canopy.scale.set(breath, 2 - breath, breath)
            if (!held.turns) continue
            held.turns.children.forEach((lobe, i) => {
              const own = phase * 0.8 + (i * Math.PI * 2) / TENTACLES
              lobe.rotation.z = Math.sin(own) * 0.12
              lobe.position.y = -held.size * 1.72 + Math.sin(own) * held.size * 0.07
            })
            continue
          }

          // Tserriednich's stands where it last touched something, and looks at
          // whoever is in the room with it.
          if (held.kind === 'chimera') {
            held.root.position.set(held.at[0], held.y + Math.sin(phase * 0.5) * 0.03, held.at[1])
            held.root.rotation.y = Math.sin(phase * 0.22) * 0.5
            if (held.turns) {
              held.turns.rotation.y =
                Math.atan2(
                  camera.position.x - held.root.position.x,
                  camera.position.z - held.root.position.z,
                ) - held.root.rotation.y
              held.turns.rotation.z = Math.sin(phase * 0.7) * 0.12
            }
            continue
          }

          // What the third contact left, which does not stay where it was put:
          // whatever this is now, it is not furniture, and furniture is exactly
          // what it would read as if it held still.
          if (held.kind === 'monster') {
            const turn = phase * 0.3
            held.root.position.set(
              held.at[0] + Math.cos(turn) * held.spread,
              held.y + Math.abs(Math.sin(phase * 1.6)) * 0.14,
              held.at[1] + Math.sin(turn * 1.3) * held.spread,
            )
            held.root.rotation.y = turn * 1.7
            continue
          }

          // Tubeppa's sits and breathes. It is the one beast in the walk that
          // does not have to do anything to be doing something — the gas is
          // doing it — so all it does is fill and empty.
          if (held.kind === 'toad') {
            held.root.position.set(held.at[0], held.y, held.at[1])
            const breath = 1 + Math.sin(phase * 0.9) * 0.06
            held.root.scale.set(breath, 2 - breath, breath)
            held.root.rotation.y = Math.sin(phase * 0.2) * 0.35
            continue
          }

          // And the gas it is making: slow, large, going nowhere in particular
          // and swelling as it goes. Three sines that do not divide into each
          // other, so the room never settles into a pattern.
          if (held.kind === 'gas') {
            held.root.position.set(
              held.at[0] + Math.sin(phase * 0.23 + held.stage) * held.spread,
              held.y + Math.sin(phase * 0.31 + held.stage * 1.4) * 0.4,
              held.at[1] + Math.sin(phase * 0.19 + held.stage * 2.1) * held.spread,
            )
            const swell = 1 + Math.sin(phase * 0.4 + held.stage) * 0.22
            held.root.scale.setScalar(swell)
            held.root.rotation.y = phase * 0.12 + held.stage
            continue
          }

          // Zhang Lei's turns, and burns while it turns. The rim and the fire
          // are on separate counts — a corona that rotated with its own wheel
          // would read as a pinwheel rather than as something alight — and the
          // face stays upright, facing whoever is in front of it.
          if (held.kind === 'wheel') {
            held.root.position.set(held.at[0], held.y + Math.sin(phase * 0.5) * 0.1, held.at[1])
            held.root.rotation.y = Math.atan2(
              camera.position.x - held.root.position.x,
              camera.position.z - held.root.position.z,
            )
            const spun = held.root.children[0]
            if (spun) spun.rotation.z = phase * 0.35
            const fire = held.root.getObjectByName('corona')
            if (fire) {
              fire.children.forEach((flame, i) => {
                const lick = 1 + Math.sin(phase * 4 + i * 1.7) * 0.4
                flame.scale.set(1, lick, 1)
              })
            }
            continue
          }

          // The coin at its mouth: turning on the spot, so it is a disc from one
          // side and an edge from the other, which is what a coin hanging in the
          // air does and what tells it from a plate.
          if (held.kind === 'coin') {
            held.root.position.set(held.at[0], held.y + Math.sin(phase * 1.2) * 0.06, held.at[1])
            held.root.rotation.y = phase * 1.6
            continue
          }

          // Luzurus's crawls on the spot and works its jaw: it has hold of
          // things across the room and is pulling them in, so what it has to
          // look like is something eating rather than something waiting.
          if (held.kind === 'centipede') {
            held.root.position.set(held.at[0], held.y, held.at[1])
            held.root.rotation.y = Math.sin(phase * 0.18) * 0.8
            const segments = held.root.getObjectByName('segments')
            if (segments) {
              segments.children.forEach((part, i) => {
                part.position.y = Math.sin(phase * 2.2 - i * 0.5) * held.size * 0.1
              })
            }
            // The jaw only works when it has something to work on, which is
            // what `stage` carries: a mouth chewing at nothing reads as idle.
            if (held.turns) {
              const bite = held.stage ? Math.abs(Math.sin(phase * 2.6)) : 0.1
              held.turns.position.y = -bite * held.size * 0.3
            }
            continue
          }

          // Salé-salé's hangs and breathes out of every mouth at once, until
          // the room is full: then they shut, and that is the one thing about
          // the technique a visitor is meant to be able to see from outside.
          if (held.kind === 'mouths') {
            held.root.position.set(held.at[0], held.y + Math.sin(phase * 0.55) * 0.12, held.at[1])
            held.root.rotation.y = phase * 0.16
            if (held.turns) {
              held.turns.children.forEach((mouth, i) => {
                const open = held.stage ? 0.06 : 0.55 + Math.sin(phase * 1.8 + i) * 0.45
                mouth.scale.set(1, Math.max(0.06, open), 1)
              })
            }
            continue
          }

          if (held.kind === 'fume') {
            held.root.position.set(
              held.at[0] + Math.sin(phase * 0.21 + held.stage) * held.spread,
              held.y + Math.sin(phase * 0.27 + held.stage * 1.3) * 0.45,
              held.at[1] + Math.sin(phase * 0.17 + held.stage * 1.9) * held.spread,
            )
            held.root.scale.setScalar(1 + Math.sin(phase * 0.35 + held.stage) * 0.2)
            continue
          }

          // Marayam's does not move: it is sitting in the way, and a beast that
          // paced would be a beast you could time. It breathes, it follows you
          // round the room with its head, and it opens its jaws when somebody
          // tries the door — `roaring` is the clock the walk sets on that, and
          // it is the only animation in the scene that is triggered rather than
          // ambient.
          if (held.kind === 'dragon') {
            held.root.position.set(held.at[0], held.y, held.at[1])
            held.root.rotation.y = (held.stage * Math.PI) / 180
            if (!held.turns) continue
            // The head turns to whoever is in the room with it, in the group's
            // own frame, and never further than a neck goes.
            const toward =
              Math.atan2(
                camera.position.x - held.root.position.x,
                camera.position.z - held.root.position.z,
              ) - held.root.rotation.y
            const wrapped = Math.atan2(Math.sin(toward), Math.cos(toward))
            held.turns.rotation.y = Math.max(-1.1, Math.min(1.1, wrapped))
            held.turns.rotation.x = Math.sin(phase * 0.6) * 0.05
            const jaw = held.turns.getObjectByName('jaw')
            if (jaw) {
              // Open on the roar, shut the rest of the time. The roar runs
              // itself down, so nothing has to remember to close it.
              const open = roaring > 0 ? Math.sin((1 - roaring / ROAR_SECONDS) * Math.PI) : 0
              jaw.rotation.x = 0.15 + open * 0.7
              jaw.position.y = -held.size * (0.26 + open * 0.18)
            }
            continue
          }

          // Momoze's flock, which is the one thing in the walk that is allowed
          // to leave the room it belongs to: the reach is wider than the water
          // its station was given, so a beast on that arc goes through the
          // bulkhead, spends a moment in whatever is on the other side of it,
          // and comes back. Every one of them is playing — a slow ring, a hop
          // on top of it, a roll and a turn — and no two are on the same count,
          // because the phase is its own number and its number is its own.
          if (held.kind === 'sprite') {
            const own = held.stage
            const turn = phase * (0.2 + (own % 5) * 0.05) + own
            const bob = Math.sin(phase * (1.2 + (own % 3) * 0.5) + own)
            held.root.position.set(
              held.at[0] + Math.cos(turn) * held.spread,
              held.y + bob * (0.3 + (own % 4) * 0.18),
              held.at[1] + Math.sin(turn * 1.3) * held.spread,
            )
            // Nose along the way it is going, and rolling as it plays: they
            // dance and fly, and a creature that stayed upright would be doing
            // neither.
            held.root.rotation.set(
              Math.sin(phase * 0.8 + own) * 0.4,
              -turn + Math.PI / 2,
              Math.sin(phase * 0.6 + own * 2) * 0.5,
            )
            continue
          }

          // Tyson's, which is not in the room: it hangs in front of the reader
          // at eye height, looks straight at them, and beats its wings. Carried
          // like the flute and the book, so the position is the camera's.
          if (held.kind === 'tyson-guardian') {
            const sin = Math.sin(yaw)
            const cos = Math.cos(yaw)
            held.root.position.set(
              camera.position.x + cos * 1.15,
              camera.position.y + 0.08 + Math.sin(phase * 1.1) * 0.05,
              camera.position.z - sin * 1.15,
            )
            // Facing back at the visitor: the eye is built looking down +Z, so
            // it is turned to the camera rather than away with it.
            held.root.rotation.set(0, yaw + Math.PI / 2, 0)
            const wings = held.turns
            if (wings) {
              wings.children.forEach((wing, i) => {
                wing.rotation.z = Math.sin(phase * 5 + i * Math.PI) * 0.5
              })
            }
            continue
          }

          if (held.kind === 'wog') {
            const sin = Math.sin(yaw)
            const cos = Math.cos(yaw)
            held.root.position.set(
              camera.position.x + cos * 0.72,
              camera.position.y - 0.08 + Math.sin(phase * 2.1) * 0.035,
              camera.position.z - sin * 0.72,
            )
            held.root.rotation.set(0, yaw + Math.PI / 2, Math.sin(phase * 1.6) * 0.08)
            if (held.turns) {
              held.turns.children.forEach((limb, i) => {
                if (i < 3 || i > 6) return
                limb.rotation.z = Math.sin(phase * 2.4 + i) * 0.18
              })
            }
            continue
          }

          if (held.kind === 'flute') {
            raiseTheFlute(held, phase)
            continue
          }

          if (held.kind === 'bloom') {
            // Rooted, and swaying from the root: the position is where it grew
            // and never changes, and the whole plant leans on a slow air. Each
            // flower is on its own phase, so a bed of them moves like a bed of
            // them rather than like one flower drawn sixteen times.
            held.root.position.set(held.at[0], held.y, held.at[1])
            held.root.rotation.z = Math.sin(phase * 0.7 + held.stage) * 0.09
            held.root.rotation.x = Math.sin(phase * 0.5 + held.stage * 2) * 0.06
            continue
          }

          if (held.kind === 'note') {
            // Loose in the air and going nowhere in particular: two sines that
            // do not divide into each other, the way the insect drifts, but
            // slow — these were shaken out of an instrument, not flown.
            held.root.position.set(
              held.at[0] + Math.sin(phase * 0.42 + held.stage) * held.spread,
              held.y + Math.sin(phase * 0.65 + held.stage * 1.7) * 0.28,
              held.at[1] + Math.sin(phase * 0.31 + held.stage * 2.3) * held.spread,
            )
            // Face on to whoever is reading them, with a rock of their own:
            // what is written on the air has to be legible from the deck.
            if (held.turns) {
              held.turns.rotation.y = Math.atan2(
                camera.position.x - held.root.position.x,
                camera.position.z - held.root.position.z,
              )
              held.turns.rotation.z = Math.sin(phase * 0.9 + held.stage) * 0.16
            }
            continue
          }

          if (held.kind === 'book') {
            // Held open in front of the visitor at reading distance and a
            // little below the eye, turned with them: it is the one apparition
            // they are looking *at* rather than looking *for*, so it sits under
            // the reticle without covering it, and breathes the way a thing
            // being carried does.
            const sin = Math.sin(yaw)
            const cos = Math.cos(yaw)
            held.root.position.set(
              camera.position.x + cos * 0.52,
              camera.position.y - 0.42 + Math.sin(phase * 1.6) * 0.008,
              camera.position.z - sin * 0.52,
            )
            // A quarter turn off the walk's own yaw, because the book is built
            // with its spine along Z and its pages across X: that puts the left
            // page on the visitor's left. Then it is tipped up towards the face
            // — a book held flat is a book nobody is reading.
            held.root.rotation.set(0, yaw + Math.PI / 2, 0)
            held.root.rotateX(-0.55)
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

          // The arm does not move — it is holding something fast, and an arm
          // that swayed would be an arm that had let go. The head does: it
          // watches whoever comes near the thing, breathes on the neck, and
          // tastes the air the way the animal it is drawn as does.
          if (held.kind === 'snake') {
            held.root.position.set(held.at[0], held.y, held.at[1])
            strungFromTheArm(held, phase)
            if (!held.turns) continue
            held.turns.rotation.y =
              Math.atan2(
                camera.position.x - held.root.position.x,
                camera.position.z - held.root.position.z,
              ) +
              Math.PI +
              Math.sin(phase * 0.7) * 0.22
            held.turns.rotation.z = Math.sin(phase * 0.5) * 0.1
            // Out, held a moment, and back: a flick every two seconds or so,
            // rather than a tongue that is permanently out.
            const tongue = held.turns.getObjectByName('tongue')
            if (tongue) {
              const flick = Math.max(0, Math.sin(phase * 1.5) - 0.62) / 0.38
              tongue.visible = flick > 0
              tongue.scale.setScalar(0.3 + flick * 0.7)
              tongue.rotation.x = Math.sin(phase * 9) * 0.25 * flick
            }
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
            // Where it is working, which is not always where it has been told
            // to work: an order to go and film something else is a flight
            // across the room, and the walk has always shown that flight —
            // over Morena's table it is the whole of what a cast looks like,
            // the camera coming down off the deckhead onto her fan. Two
            // seconds or so to cross, which is a fly crossing a room.
            const told = held.flown ?? new THREE.Vector3(held.at[0], held.y, held.at[1])
            told.lerp(FLY_TO.set(held.at[0], held.y, held.at[1]), 1 - Math.exp(-delta * 1.6))
            held.flown = told
            // Not a ring: a fly does not orbit. Two sines that do not divide
            // into each other, so it never comes back round the same way, and
            // a fast one on the height because that is what reads as wings.
            held.root.position.set(
              told.x + Math.sin(phase * 1.7) * held.spread,
              told.y + Math.sin(phase * 2.6) * 0.18,
              told.z + Math.sin(phase * 1.1 + 1.3) * held.spread,
            )
            // Nose along the way it is going, which for two sines is where it
            // was a breath ago compared with where it is now.
            held.root.rotation.y =
              Math.atan2(Math.cos(phase * 1.7) * 1.7, Math.cos(phase * 1.1 + 1.3) * 1.1) +
              Math.PI / 2
            if (held.turns) {
              held.turns.children.forEach((leg, i) => {
                leg.rotation.y = Math.sin(phase * 8 + i * Math.PI) * 0.24
              })
            }
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
          } else if (
            held.kind === 'double' ||
            held.kind === 'card' ||
            held.kind === 'portal' ||
            held.kind === 'sun-mark' ||
            held.kind === 'moon-mark'
          ) {
            // The ones that are meant to be looked at face whoever is looking:
            // a person turns to you, a card is dealt to you, a door you cannot
            // see through the edge of is a door you can walk into — and a bomb
            // seen edge-on is a bomb nobody reads in time.
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

      // ── The blast and the punch ──────────────────
      /**
       * The two techniques that happen rather than stand.
       *
       * One group, built once and reused: a gust of air blown across the ship,
       * and a fist of aura that comes up out of the deck. `playing` is how far
       * through it is, in seconds, and the whole thing is hidden at the end of
       * it rather than rebuilt every cast.
       */
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
      /** Starts whichever of the two the page has just handed over. */
      function syncFlash() {
        if (!flash || !hatsuEffects.play(flash)) return
        if (flash.kind === 'rewind') hatsuEffects.startRewind()
        if (flash.kind === 'lash') {
          lashing = flash.tierId === currentTierId ? { at: flash.at, y: flash.y, through: 0 } : null
        }
      }
      /** Plays the blast or the punch out, and puts it away when it is over. */
      const facing = () =>
        activePlan
          ? aimedSpace(activePlan, { at: pointer, heading: yaw, range: reachOf(world.body) })
          : null
      const facingSolid = () => {
        const plan = ship.plans.get(currentTierId)
        return plan
          ? aimedSolid({ ship, world }, plan, {
              at: pointer,
              heading: yaw,
              range: Math.max(reachOf(world.body) / 2, effectiveNen.en?.radius ?? 0),
            })
          : null
      }

      interactWithNen = () => {
        if (effectiveNen.mode === 'zetsu') return
        const aimed = aimedSolidAt ?? facingSolid()
        if (!aimed) return
        const target = solidById(ship, world, aimed.id) ?? aimed
        const attackShare = Number(effectiveNen.ryu.hands ?? 0) + Number(effectiveNen.ryu.feet ?? 0)
        const kind =
          effectiveNen.ko || attackShare >= 0.6
            ? 'strike'
            : effectiveNen.on || effectiveNen.mode === 'ren'
              ? 'pressure'
              : effectiveNen.gyo || effectiveNen.en
                ? 'sense'
                : 'channel'
        if (kind === 'channel' && !effectiveNen.shu.includes(target.id)) {
          useNen({ type: 'SHU', objectId: target.id, on: true })
        }
        if (kind !== 'sense') {
          const dx = target.at[0] - pointer[0]
          const dz = target.at[1] - pointer[1]
          const distance = Math.max(0.001, Math.hypot(dx, dz))
          const force =
            kind === 'strike'
              ? 0.9
              : kind === 'pressure'
                ? effectiveNen.on
                  ? 1.25
                  : 0.55
                : effectiveNen.ken
                  ? 0.32
                  : 0.18
          const held = world.solids[target.id] ?? {}
          world.solids[target.id] = {
            ...held,
            at: [target.at[0] + (dx / distance) * force, target.at[1] + (dz / distance) * force],
            rotation: target.rotation + (kind === 'strike' ? 7 : kind === 'pressure' ? 3 : 1),
          }
        }
        playNenObjectSound(kind)
        nenAura.interact(
          {
            id: target.id,
            at: target.at,
            y: ground + target.base,
            size: target.size,
            height: target.height,
          },
          kind,
        )
      }

      // ── What the hand can reach ──────────────────
      //
      // The one thing in the walk that is picked rather than computed. Every
      // other question the reticle asks — which room, which solid — is answered
      // by walking the deck plan, because a room is a polygon on a floor and a
      // ray is a needlessly exact way of asking. A card is not on any plan: it
      // is eleven centimetres of table a metre from a seated eye, and half a
      // degree either way is a different card. So this traces the ray.
      //
      // Only what the page marked `pick` is in the running, which is normally
      // nothing at all: the walk hands nothing over, and the raycaster is handed
      // an empty list and never runs.

      const picker = new THREE.Raycaster()
      /** The middle of the screen, where a held pointer is always looking. */
      const RETICLE = new THREE.Vector2(0, 0)
      /** And where a free cursor is, in clip space, for a page that has one. */
      const cursor = new THREE.Vector2()

      /** The cursor, or a finger, in the clip space the raycaster wants. */
      function aimFrom(clientX: number, clientY: number) {
        const box = canvas?.getBoundingClientRect()
        if (!box || !box.width || !box.height) return cursor
        cursor.set(
          ((clientX - box.left) / box.width) * 2 - 1,
          -((clientY - box.top) / box.height) * 2 + 1,
        )
        return cursor
      }

      /** Whether the pointer is the scene's, which decides where it is pointing. */
      const pointerIsHeld = () => document.pointerLockElement === canvas

      /** The `id` of the pickable thing that ray meets first, if any. */
      function whatIsUnder(aim: import('three').Vector2): string | null {
        const roots: import('three').Object3D[] = []
        const owners: Record<number, string> = {}
        for (const [id, shown] of Object.entries(apparitions)) {
          if (!shown?.pick) continue
          owners[shown.root.id] = id
          roots.push(shown.root)
        }
        if (!roots.length) return null
        picker.setFromCamera(aim, camera)
        for (const hit of picker.intersectObjects(roots, true)) {
          // The hit is on a face or a rim; the card is whichever group above it
          // was handed in. Walked up rather than read off the mesh, because a
          // card is several meshes and only the group has a name.
          let part: import('three').Object3D | null = hit.object
          while (part) {
            const owner = owners[part.id]
            if (owner) return owner
            part = part.parent
          }
        }
        return null
      }

      /** Take hold of what is under a gesture, and say whether anything was. */
      function takeWhatIsUnder(aim: import('three').Vector2): boolean {
        if (!onPick) return false
        const picked = whatIsUnder(aim)
        if (!picked) return false
        aimedExtra = picked
        onPick(picked)
        return true
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

      /**
       * Draws the gum where it is stuck, or takes it off the screen.
       *
       * Two far ends and one strand, because there is one strand: the filament
       * out of the wrist is stuck to a thing or to a person, never both, and
       * ch. 39 draws the same pink line either way. The person wins when both
       * are somehow set, because a body is the one of the two that walks off —
       * a strand left drawn to the cabinet while Machi carried the other end
       * away would be drawing the wrong end of the ability.
       */
      function syncGum(seconds: number) {
        const solid = world.gum ? solidById(ship, world, world.gum.solidId) : null
        const stuck =
          gumOn ??
          (solid
            ? { spaceId: solid.spaceId, at: solidNow(solid, world.solids[solid.id]).at }
            : null)
        const room = stuck ? ship.spaces.get(stuck.spaceId) : null
        const plan = room ? ship.plans.get(room.tierId) : null
        if (!stuck || !room || !plan) {
          gum.visible = false
          return
        }
        const at = stuck.at
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
            : resolveMovement(
                pointer,
                target,
                wallsNear([...walked.walls, ...loose, ...collisionWalls], pointer, 6),
              )
        // Up and over: the rise is what makes it a swing rather than a winch.
        swingRise = Math.sin(arc.through * Math.PI) * 2.2

        const line = threadGeometry.attributes.position as import('three').BufferAttribute
        line.setXYZ(0, camera.position.x, camera.position.y - 0.4, camera.position.z)
        line.setXYZ(1, arc.to[0], arc.height, arc.to[1])
        line.needsUpdate = true
        thread.visible = true

        if (arc.through >= 1) arc = null
      }

      function cast(hand: 'first' | 'second' | 'third' = 'first') {
        onCast?.(facing()?.id ?? null, facingSolid()?.id ?? null, hand)
        if (swings) throwThread()
      }

      /**
       * The same cast with the reticle emptied, which is what turns a technique
       * on its own user.
       *
       * Neither the room nor the solid in front goes with it: the walk already
       * tells the rules which room the visitor is standing in, so an empty
       * reticle costs nothing and says the one thing the second hand is for.
       */
      function useHatsu(hand: 'first' | 'second' | 'third') {
        // The second place on the wheel is a word rather than a cast, under the
        // ones that have something already standing out there to be told.
        if (orders && hand === 'second') {
          onOrder?.()
          return
        }
        if (!onHatsu || (effectiveNen.mode === 'zetsu' && !hatsuAllowedInZetsu)) return
        const self = hand === 'second' && selfCastable && !hands && !tunes && !twoHanded
        onHatsu(
          self ? null : (facing()?.id ?? null),
          self ? null : (facingSolid()?.id ?? null),
          hand,
        )
        // The gum turned on its own user is the one cast that moves the visitor
        // rather than the room, so the arc is thrown here and not in `cast`.
        if (swings || (propels && self)) throwThread()
      }

      const variantHand = (index: number): 'first' | 'second' | 'third' =>
        index === 2 ? 'third' : index === 1 ? 'second' : 'first'
      let hatsuHoldTimer: number | null = null
      let hatsuPressed = false

      function beginHatsu(event: KeyboardEvent) {
        if (!onHatsu || (effectiveNen.mode === 'zetsu' && !hatsuAllowedInZetsu) || event.repeat)
          return false
        hatsuPressed = true
        hatsuVariantIndex = event.shiftKey && hatsuVariants.length > 1 ? 1 : lastHatsuVariant
        hatsuHoldTimer = window.setTimeout(() => {
          if (hatsuPressed && hatsuVariants.length > 1) hatsuWheelOpen = true
        }, 260)
        event.preventDefault()
        return true
      }

      function finishHatsu(event: KeyboardEvent) {
        if (event.code !== NEN_KEYS.hatsu || !hatsuPressed) return false
        hatsuPressed = false
        if (hatsuHoldTimer !== null) window.clearTimeout(hatsuHoldTimer)
        hatsuHoldTimer = null
        const chosen = Math.min(hatsuVariantIndex, hatsuVariants.length - 1)
        lastHatsuVariant = chosen
        hatsuWheelOpen = false
        useHatsu(variantHand(chosen))
        event.preventDefault()
        return true
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
      const isKeyForElsewhere = (event: KeyboardEvent) => {
        const target = event.target
        if (!(target instanceof HTMLElement)) return false
        if (target.isContentEditable || target.closest('input, textarea, select') !== null) {
          return true
        }
        if (target.closest('a, button, [role="button"], [tabindex]') !== null) {
          return ['Space', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(
            event.code,
          )
        }
        return false
      }

      /** One step to the side, in radians, as the visitor has set it. */
      const snapStep = () => ($comfort.snapAngle * Math.PI) / 180

      const useNenShortcut = (event: KeyboardEvent) => {
        if (event.repeat || event.metaKey || event.ctrlKey) return false
        const toggled = (type: 'IN' | 'GYO' | 'KEN', on: boolean) => useNen({ type, on })
        const zoneIndex = nenZoneIndex(event.code)
        const zones = ['head', 'torso', 'hands', 'feet'] as const
        if (zoneIndex !== null) {
          const selected = zones[zoneIndex]
          selectedNenZone = selected
          useNen({ type: 'RYU', distribution: ryuDistribution(selected, 0.55) })
        } else if (event.code === NEN_KEYS.ten) toggleTen()
        else if (event.code === NEN_KEYS.on)
          useNen({
            type: 'ON',
            on: !effectiveNen.on,
            distribution: { hands: 0.45, torso: 0.35, feet: 0.2 },
          })
        else if (event.code === NEN_KEYS.ren) useNen({ type: 'REN' })
        else if (event.code === NEN_KEYS.zetsu) useNen({ type: 'ZETSU' })
        else if (event.code === NEN_KEYS.gyo) toggled('GYO', !effectiveNen.gyo)
        else if (event.code === NEN_KEYS.in) toggled('IN', !effectiveNen.in)
        else if (event.code === NEN_KEYS.en)
          useNen({ type: 'EN', radius: effectiveNen.en ? null : 8 })
        else if (event.code === NEN_KEYS.ken) toggled('KEN', !effectiveNen.ken)
        else if (event.code === NEN_KEYS.ko)
          useNen({ type: 'KO', zone: effectiveNen.ko === selectedNenZone ? null : selectedNenZone })
        else if (event.code === NEN_KEYS.ryuUp)
          useNen({
            type: 'RYU',
            distribution: ryuDistribution(
              selectedNenZone,
              Number(effectiveNen.ryu[selectedNenZone] ?? 0.5) + 0.1,
            ),
          })
        else if (event.code === NEN_KEYS.ryuDown)
          useNen({
            type: 'RYU',
            distribution: ryuDistribution(
              selectedNenZone,
              Number(effectiveNen.ryu[selectedNenZone] ?? 0.5) - 0.1,
            ),
          })
        else if (event.code === NEN_KEYS.shu && aimedSolidAt)
          useNen({
            type: 'SHU',
            objectId: aimedSolidAt.id,
            on: !effectiveNen.shu.includes(aimedSolidAt.id),
          })
        else if (event.code === NEN_KEYS.action) (onPhysicalNenAction ?? interactWithNen)?.()
        else return false
        event.preventDefault()
        return true
      }

      const onKeyDown = (event: KeyboardEvent) => {
        // Giving the pointer back, without giving the screen back with it.
        //
        // Esc releases the pointer, and in full screen it also leaves full
        // screen — the browser answers it before the page does, so a visitor who
        // touched the walk to look around has to drop out of full screen to get
        // a cursor for the panel beside it. Tab is the second way out: it means
        // "hand the keyboard back to the page" everywhere else, it is nothing to
        // the walk while the pointer is held, and full screen is untouched.
        //
        // Ahead of `typingElsewhere` on purpose: a captured pointer belongs to
        // the scene whatever the page last focused, and that is exactly the case
        // where the visitor most needs the way out.
        if (event.code === 'Tab' && document.pointerLockElement === canvas) {
          event.preventDefault()
          document.exitPointerLock()
          return
        }
        if (isKeyForElsewhere(event)) return
        if (event.code === NEN_KEYS.hatsu && beginHatsu(event)) return
        const wheelZone = nenZoneIndex(event.code)
        if (hatsuWheelOpen && wheelZone !== null) {
          if (wheelZone < hatsuVariants.length) hatsuVariantIndex = wheelZone
          event.preventDefault()
          return
        }
        if (useNenShortcut(event)) return
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
        // The Nen vocabulary is one alphabet across the whole ship — the same
        // letters in the walk, in the arena and in the hunt — and every letter
        // in it is spoken for: R is Ren, C is Ko, G is Gyo, F is the physical
        // interaction. So a technique's second and third things do not get
        // letters of their own; H owns every Hatsu variant, held to open the
        // wheel and 1–4 to pick. One key, one meaning, whatever is in hand.
      }
      const onKeyUp = (event: KeyboardEvent) => {
        delete pressed[event.code]
        finishHatsu(event)
      }

      function takeLink() {
        // Sat at a table, E is not a stairwell: nobody gets up mid-hand.
        if (seated) return
        // Marayam's beast is in the doorway, and E is the door: a visitor shut
        // into a room by it does not get told they cannot leave, they get
        // roared at. The refusal is the pure layer's — `arriveInTour` puts
        // anyone who walks out back — and this is the same refusal at the one
        // place the walk offers a way out with a keypress.
        if (world.dragon && untrack(() => currentSpace)?.id === world.dragon) {
          startRoaring()
          return
        }
        const found = untrack(() => availableLink)
        if (found) goTo(found.to)
      }

      /**
       * How long one roar runs, in seconds, and how much of it is left.
       *
       * The only triggered animation in the scene: everything else an
       * apparition does is a sine that was always running. It is a countdown
       * rather than a flag because the jaws have to open and shut again on
       * their own — see the dragon in `driftApparitions` — and because a second
       * try at the door while the first roar is still going should restart it
       * rather than stack a second one on top.
       */
      const ROAR_SECONDS = 1.6
      let roaring = 0
      function startRoaring() {
        roaring = ROAR_SECONDS
        roarLikeADragon()
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
        lookPitch = pitch
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
        // Where a free cursor is, for the table: a pointer that was never taken
        // is still pointing at something, and a visitor who has not clicked into
        // the room should still be able to play a card by clicking it.
        if (!pointerIsHeld()) aimFrom(event.clientX, event.clientY)
        if (document.pointerLockElement === canvas) look(event.movementX, event.movementY)
        else if (dragging) look(event.movementX, event.movementY)
      }
      const onMouseDown = (event: MouseEvent) => {
        if (behindATap()) return
        // A thing that can be taken hold of answers the click before anything
        // else does. This is the table and only the table: on the walk nothing
        // is pickable, the ray is never traced, and the two branches below are
        // the whole of what a click has ever done.
        if (takeWhatIsUnder(pointerIsHeld() ? RETICLE : aimFrom(event.clientX, event.clientY))) {
          return
        }
        // With the pointer already captured, the click is the cast: the walk is
        // in first person and the reticle is where the aura goes. Before that,
        // the first click still has to be the one that takes the pointer.
        if (castOnClick && aiming && document.pointerLockElement === canvas) {
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
        const finger = named(event.changedTouches, lookFinger)
        if (!finger) return
        if (lastTouch && travelled < TAP_SLOP) {
          // A tap on a card is that card, and a tap on the wood is the cast. A
          // phone has no reticle, so where the finger landed is the aim.
          const took = takeWhatIsUnder(aimFrom(finger.clientX, finger.clientY))
          if (!took && aiming) cast()
        }
        lastTouch = null
        lookFinger = null
      }
      /** A finger the system took away never meant to cast. */
      const onTouchCancel = (event: TouchEvent) => {
        if (!named(event.changedTouches, lookFinger)) return
        lastTouch = null
        lookFinger = null
      }

      const stopListening = listenToSceneInput(canvas, {
        mouseDown: onMouseDown,
        mouseMove: onMouseMove,
        mouseUp: onMouseUp,
        touchStart: onTouchStart,
        touchMove: onTouchMove,
        touchEnd: onTouchEnd,
        touchCancel: onTouchCancel,
        keyDown: onKeyDown,
        keyUp: onKeyUp,
        pointerLockChange: onPointerLockChange,
      })

      /**
       * Resizing is deferred to the next frame.
       *
       * A dragged window edge fires the observer on every pixel, and each call
       * reallocates the drawing buffer — the one thing in this component that
       * makes the driver stall. Collapsing a burst of them into one resize per
       * frame is the whole of it; `pendingResize` is the handle, so a resize
       * still in the queue when the scene is torn down can be dropped.
       */
      const resize = observeSceneResize({
        THREE,
        container,
        runtime,
        targets: () => portals.targets(),
      })

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
       * How fast the visitor is actually going, in metres per second.
       *
       * The walk carries a velocity now rather than writing a position: a body
       * has a mass, and leaning into a walk and putting a foot down to stop it
       * are the two cheapest things on the whole list that say so. Kept here with
       * the rest of the loop's own state, because it is a fact about this frame
       * and nothing in the markup reads it.
       */
      let velocity: Vec2 = [0, 0]

      /**
       * How far the field of view has opened up for the run, in degrees.
       *
       * Four degrees, eased in over a quarter of a second. Nobody notices it and
       * everybody feels it: it is the only thing on screen that says running is
       * an effort, and the ship is a place where the reason to run is that it is
       * a quarter of a mile to the other end.
       *
       * Held here rather than in `relens` because it is a fact about this frame,
       * not a setting — the visitor's own field of view is added underneath it,
       * so changing it in the panel mid-sprint does the right thing.
       */
      let fovLift = 0
      const SPRINT_FOV = 4
      const FOV_EASE = 0.25

      /**
       * Whether this visitor has asked their system for less movement.
       *
       * Read once, and it is not the same question as the head-bob setting any
       * more: that one is the visitor's dial and this one gates everything else
       * in the walk that moves by itself.
       */
      const calmWalk = prefersReducedMotion()

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
      /** How long since a Guardian Spirit Beast last took a step, in seconds. */
      let sinceBeast = 0
      /**
       * The beasts work at the fish's pace, and deliberately the same one.
       *
       * A melt, a reel and a room filling are all the same kind of event — a
       * thing you notice has moved on rather than a thing you watch move — and
       * the walk already has a number for that. A second number for the same
       * idea would be a second rule to keep.
       */
      const BEAST_SECONDS = 2.4
      /** The room whose coin the last pickup was made on, held until stepped away from. */
      let takenCoin: string | null = null
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
        if (sinceFilmSample < 0.1) return
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

        filmCamera = new THREE.PerspectiveCamera(64, 1, NEAR_PLANE, VIEW_DISTANCE)
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
      /** The same throttle, for the ray that finds a card. */
      let sincePick = 0

      let puppetId: string | null = null
      let puppeteer: {
        tierId: string
        at: Vec2
        yaw: number
        pitch: number
        ground: number
      } | null = null

      const tick = (now: number) => {
        const delta = Math.min((now - previous) / 1000, 0.1)
        previous = now

        if (world.puppet !== puppetId) {
          if (world.puppet) {
            puppeteer = { tierId: currentTierId, at: pointer, yaw, pitch, ground }
            const hold = world.solids[world.puppet]
            const structure =
              ship.structures.find((s) => s.id === world.puppet) ||
              world.copies.find((c) => c.id === world.puppet)
            if (structure) {
              const nowPos = solidNow(structure, hold)
              const space = ship.spaces.get(structure.spaceId)
              if (space && space.tierId !== currentTierId) {
                loadTier(space.tierId, nowPos.at)
              } else {
                pointer = nowPos.at
                const activePlan = ship.plans.get(currentTierId)
                if (activePlan) {
                  ground = floorOf(
                    spaceAt(activePlan, pointer) ?? entrySpace(activePlan),
                    activePlan.tier,
                  )
                }
              }
            }
          } else if (puppeteer) {
            if (puppeteer.tierId !== currentTierId) {
              loadTier(puppeteer.tierId, puppeteer.at)
            } else {
              pointer = puppeteer.at
            }
            yaw = puppeteer.yaw
            pitch = puppeteer.pitch
            ground = puppeteer.ground
            puppeteer = null
          }
          puppetId = world.puppet
        }

        const plan = ship.plans.get(currentTierId)
        if (!plan) return

        // One clock for everything the walk animates, and it is not the wall's:
        // Parallel Future moves it back ten seconds, and the room does again
        // exactly what it did — see `HatsuRewindEffect`.
        // Read before anything is placed rather than after, because the marks
        // The Sun and Moon leaves are put where their things are *now*, and a
        // thing that wanders is somewhere new every frame.
        const clock = now / 1000 - hatsuEffects.rewindOffset

        syncDeck()
        syncSolids()
        syncShells()
        syncEye()
        syncSight()
        hourView.setHour($comfort.shipHour, hour.hours)
        syncPhasing()
        // The far deck first, so a mouth built this frame already has a room to
        // look at rather than a frame of void.
        syncPortalDecks()
        syncApparitions(clock)
        syncFlash()
        sweepStale()
        driftSolids(clock)
        driftMotes(delta, clock)
        driftApparitions(clock, delta)
        driftLeavingCards(delta)
        hatsuEffects.tickFlash({
          delta,
          camera,
          tierId: currentTierId,
          blinded,
          fog,
          baseFog,
          renderer,
          gyo: effectiveNen.gyo,
        })
        runLash(delta)
        syncGum(clock)
        hatsuEffects.updateRewind({ clock, position: pointer, yaw, ground, delta })

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

        // The roar runs itself down. Nothing else reads it: the jaws do.
        if (roaring > 0) roaring = Math.max(0, roaring - delta)

        // The three Guardian Spirit Beasts that go on working after the cast,
        // all on the fish's own clock and for the fish's own reason: what they
        // do is something you stand and watch happen, and a beast that only
        // acted when a key was pressed would be a beast you could win by
        // standing still. What each step takes is the pure layer's to decide.
        if (world.toad || world.centipede || world.smoke) {
          sinceBeast += delta
          if (sinceBeast >= BEAST_SECONDS) {
            sinceBeast = 0
            onBeast?.()
          }
        } else sinceBeast = 0

        // Zhang Lei's coin is taken by walking into it, the way the tunnel is
        // crossed by walking into its mouth: `takenCoin` is the coin the last
        // pickup was made on, held until the visitor steps away from where the
        // next one hangs, or standing beside the wheel would empty it.
        const reached = coinAt(ship, world, { at: pointer, tierId: currentTierId })
        if (!reached) takenCoin = null
        else if (reached !== takenCoin) {
          takenCoin = reached
          onCoin?.(reached)
        }

        // The marks close on each other on a tenth of a second rather than on
        // the frame: what they do is state, and sixty writes a second to a world
        // the whole page reads is a cost with nothing bought by it. How much of
        // a second actually went by goes with it, so a dropped frame slows
        // nothing down.
        sincePolarity += delta
        if (sincePolarity >= 0.1) {
          onPolarity?.(clock, sincePolarity)
          sincePolarity = 0
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
        const loose = solidWalls(ship, world, {
          tierId: currentTierId,
          seconds: now / 1000 - hatsuEffects.rewindOffset,
        })

        // `code` is the physical key, so W A S D covers ZQSD on an AZERTY
        // layout without a second binding. The stick in the corner is added to
        // whatever the keys say rather than replacing it: a tablet with a
        // keyboard attached should not have to choose.
        let { strafe, advance, moving, running } = walkInput(
          {
            forward: holding('KeyW', 'KeyZ', 'ArrowUp'),
            back: holding('KeyS', 'ArrowDown'),
            left: holding('KeyA', 'KeyQ'),
            right: holding('KeyD'),
            sprint: holding('ShiftLeft', 'ShiftRight'),
          },
          stick,
        )

        // Sat down: the legs stop answering. Whatever the keys and the stick
        // said this frame is dropped on the floor, and the body is put back on
        // its chair — a seat is not a place you drift out of.
        if (seated) {
          moving = false
          advance = 0
          strafe = 0
          running = false
          pointer = seated.at
        }

        if (world.body.autopilotUntil && world.body.autopilotUntil > Date.now()) {
          moving = true
          advance = 1
          strafe = 0
          running = false
          yaw += (Math.random() - 0.5) * 0.1
        }
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

        /**
         * The walk, as a velocity the visitor leans on rather than a position.
         *
         * Run whether or not anything is held down, which is the whole of it:
         * letting go is a target of nothing reached at `FRICTION`, and the frame
         * after the key comes up the visitor is still moving. `paceOf` keeps its
         * meaning exactly — Kurton and the Enhancer multiply the speed being
         * leaned towards, not the position — and so does the visitor's own dial.
         */
        const walking = !arc && !$comfort.jumpOnly
        const pace = (running ? SPRINT_SPEED : WALK_SPEED) * paceOf(world.body) * $comfort.walkPace
        const wanted: Vec2 =
          walking && moving
            ? [(advance * -sin + strafe * cos) * pace, (advance * -cos + strafe * -sin) * pace]
            : [0, 0]
        // Nothing is being carried across a jump or out of jump-only mode: the
        // visitor arrives at a stand, the way anyone put down somewhere does.
        velocity = walking ? glide(velocity, wanted, delta) : [0, 0]

        if (velocity[0] !== 0 || velocity[1] !== 0) {
          const target: Vec2 = [pointer[0] + velocity[0] * delta, pointer[1] + velocity[1] * delta]
          // Luini walks through the walls rather than around them, so the move
          // is taken whole and the collision pass is simply not run.
          const from = pointer
          pointer = walksThroughWalls(world)
            ? target
            : resolveMovement(
                pointer,
                target,
                wallsNear([...walked.walls, ...loose, ...collisionWalls], pointer, 6),
              )
          // Ground actually covered, which is not what was asked for: a visitor
          // pushing into a bulkhead has stopped walking, and their gait and their
          // footsteps both have to know it.
          travelledOnFoot += Math.hypot(pointer[0] - from[0], pointer[1] - from[1])
        }

        if (world.puppet === puppetId && world.puppet && walking) {
          if (!world.solids[world.puppet]) world.solids[world.puppet] = {}
          world.solids[world.puppet].at = pointer
        }

        const standing = spaceAt(plan, pointer)
        applyVisibility(standing?.id ?? null)

        /**
         * The head's rise and fall, off the distance walked rather than the clock.
         *
         * How much of it there is follows the velocity rather than the keys: a
         * visitor easing to a stop has the swing leave their head as the ground
         * stops going by, instead of it being switched off under them. Capped at
         * the half again a run used to get flat.
         *
         * Scaled by what the visitor asked for, which for a visitor who has asked
         * their system for less movement is nothing: a view that swings while the
         * body does not is the thing that actually makes people ill, and
         * `$lib/tour/comfort` is where that is argued.
         */
        const gait = Math.min(1.5, Math.hypot(velocity[0], velocity[1]) / WALK_SPEED)
        const bob = bobOf(travelledOnFoot, $comfort.headBob * gait)
        // And at a stand, the breath under it: the one movement left when the
        // legs have stopped, and what keeps a visitor standing still from being
        // a tripod. Time rather than distance, because breathing is.
        const breath = breathOf(now / 1000, $comfort.headBob * (1 - Math.min(1, gait)))
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
        const eye =
          ground +
          eyesOf(world.body, seated ? seated.eye : EYE_HEIGHT) +
          bob.rise +
          breath +
          swingRise
        // Open on the run, close on the walk. Off the speed actually being made
        // rather than off the sprint key, so a visitor held against a bulkhead
        // is not sprinting and the view says so.
        const lift = velocity[0] || velocity[1] ? Math.min(1, gait / 1.5) ** 2 * SPRINT_FOV : 0
        if (Math.abs(lift - fovLift) > 1e-4) {
          fovLift += (lift - fovLift) * Math.min(1, delta / FOV_EASE)
          camera.fov = $comfort.fov + fovLift
          camera.updateProjectionMatrix()
        }
        camera.position.set(pointer[0], eye, pointer[1])
        camera.rotation.set(0, 0, 0)
        camera.rotateY(yaw)
        camera.rotateX(pitch)
        camera.rotateZ(bob.roll)
        {
          nenAura.update(effectiveNen, camera, {
            ground,
            seconds: now / 1000,
            depthTexture: renderTarget?.depthTexture ?? undefined,
            hideResting: !$comfort.restingAura,
          })
          nenAura.syncShu(
            effectiveNen.shu.flatMap((id) => {
              const solid = solidById(ship, world, id)
              if (!solid) return []
              return [
                {
                  id,
                  at: solid.at,
                  y: ground + solid.base,
                  size: solid.size,
                  height: solid.height,
                },
              ]
            }),
          )
        }
        // Kurton is worn rather than stood in: the chassis goes where the
        // visitor is, facing where they face, every frame.
        hatsuEffects.syncVehicle({ riding: world.body.riding, at: pointer, eye, yaw })
        // And so is the arm, for as long as it is still turning: Ripper
        // Cyclotron's wind-up is the whole of its stated cost, and a cost the
        // ship does not show is a key that appears to do nothing.
        hatsuEffects.syncWinding({ turns: world.windup, at: pointer, eye, yaw, delta })

        // One pace, one footstep, on the same counter the head is dipping to — so
        // the sound lands with the foot at every speed and never drifts off it.
        const paces = stepsIn(travelledOnFoot)
        if (paces !== lastPace) {
          lastPace = paces
          // Timbred by the floor of the room being crossed, which is derived from
          // what the room is for and how high up it is: the walk goes quiet
          // stepping onto the carpet of a stateroom and rattles on the grating
          // over the springs, without either being written down anywhere.
          footstep(paces, {
            running,
            floor: standing ? footingOf(standing.category, plan.tier.elevation) : undefined,
          })
        }

        // Worn, not held at the eye: thirty centimetres to the left of the
        // visitor's head and thirty below it. At the viewpoint, N·L is N·V on every
        // surface at once — the light lands wherever the eye is already looking,
        // which is the one place it cannot model anything. It mattered more when
        // this lamp carried the picture; it is kept because it costs nothing and a
        // stairwell lit from slightly off-axis still has corners.
        nightLight.position.set(pointer[0] - cos * 0.3, eye - 0.3, pointer[1] + sin * 0.3)

        // What the two Guardian Spirit Beasts that give something back have put
        // on the visitor. Both are carried at the head and both are read
        // straight off the world every frame, which is what makes taking a
        // second coin visible as the light going up rather than as a sentence
        // in the read-out.
        const gilded = world.body.gilded
        gildLight.intensity = gilded ? Math.min(4, 1 + Math.log10(gilded)) : 0
        gildLight.position.set(pointer[0], eye, pointer[1])
        const halo = world.body.halo
        haloLight.intensity = halo ? Math.min(4.5, halo * 0.6) : 0
        haloLight.position.set(pointer[0], eye, pointer[1])
        haloBubble.visible = halo > 0
        if (halo > 0) {
          haloBubble.position.set(pointer[0], eye, pointer[1])
          haloBubble.scale.setScalar(Math.min(6, 1.8 + halo * 0.5))
        }
        // And a lamp in every room an eye-wog lit, on the deck being walked.
        // Built the first time the room needs one and dropped when the levy is
        // blown off it, exactly as the solids are.
        for (const spaceId of world.lit) {
          if (litLights[spaceId]) continue
          const space = ship.spaces.get(spaceId)
          const tier = space ? ship.tiers.find((candidate) => candidate.id === space.tierId) : null
          if (!space || !tier) continue
          const middle = centroid(space)
          const lamp = new THREE.PointLight(0xfff1d8, 2.6, 26, 2)
          lamp.position.set(
            middle[0],
            floorOf(space, tier) + ceilingOf(space, tier) * 0.7,
            middle[1],
          )
          scene.add(lamp)
          litLights[spaceId] = lamp
        }
        for (const spaceId of Object.keys(litLights)) {
          if (world.lit.includes(spaceId)) continue
          const lamp = litLights[spaceId]
          if (lamp) scene.remove(lamp)
          delete litLights[spaceId]
        }
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
        // The room's own air, thickened by the hour: a ship on a night regime
        // runs its ventilation down with its lighting. The multiplier is applied
        // to the *target* and not to the density, so it is eased across a
        // threshold like everything else the air does — see `$lib/tour/regime`.
        const air = fogTarget * hourView.density
        fog.density = settleDensity(fog.density, blinded ? SEALED_DENSITY : air, delta)

        // And its colour, when a technique has left the room standing in one.
        // The hour writes the same two things, so both go through one place
        // that knows the order — see `applyAir` in `$lib/tour/hourView`.
        hourView.setTint(tint ?? null)
        baseFog.copy(hourView.air)

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
          const exit = doorExit(world, { spaceId: standingId, arrivedFrom }, { ship })
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
        const mouth = wormMouthAt(ship, world, { at: pointer, tierId: currentTierId })
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
        const nenCanTarget = effectiveNen.mode !== 'zetsu'
        if ((aiming || nenCanTarget) && ++sinceAim >= 6) {
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
        } else if (!aiming && !nenCanTarget && aimedId !== null) {
          aimedId = null
          aimedAt = null
          aimedSolidId = null
          aimedSolidAt = null
        }

        // And the card, on the same slow poll and for the same reason: a hand
        // lying on a table is not going anywhere between two frames. Traced
        // rather than walked — see `whatIsUnder` — and skipped outright where
        // nothing was handed over, which is everywhere but Morena's table.
        if (onPick && ++sincePick >= 6) {
          sincePick = 0
          const picked = whatIsUnder(pointerIsHeld() || touch ? RETICLE : cursor)
          if (picked !== aimedExtra) aimedExtra = picked
        }

        hourView.aim(plan, standing?.id ?? null)

        // The aperture. Written here rather than watched, for the same reason
        // the field of view is: the panel is a store and this loop is outside
        // Svelte's reactivity, and one number a frame is not a cost.
        renderer.toneMappingExposure = blinded
          ? SEALED_EXPOSURE
          : $comfort.exposure * hourView.exposure
        // The grade the hour asks for, and the clock the grain and the corners
        // breathe on. Three numbers and a float: see `applyGrade`.
        applyGrade(grade, {
          grade: hourView.grade,
          clock,
          calm: calmWalk,
          lens: quality.lens ? LENS_DEFAULTS : LENS_OFF,
        })

        // The air bending around the aura. Zero unless there is aura out, and
        // zero outright for a visitor whose system asks for less movement: a
        // swimming picture is movement, whatever it is a picture of.
        if (refraction) {
          refraction.uniforms.uAmount.value = calmWalk ? 0 : refractionAmount(shownNen)
          refraction.uniforms.uTime.value = clock
        }

        const { width, height } = renderer.getSize(size)
        renderer.setScissorTest(false)
        renderer.setViewport(0, 0, width, height)
        // The far ends of the tunnel are drawn into their panes first, from
        // where the visitor's head would be if it were standing at the other one.
        renderPortals()
        composer.render()

        // The eye's feed, inset in the corner: the same scene from where the eye
        // was left, however many decks away that is.
        if (eyeCamera) {
          eyeCamera.rotation.set(0, 0, 0)
          eyeCamera.rotateY(now / 6000)
          renderSceneInset({ runtime, lens: eyeCamera, corner: 'top', measure: size })
        }

        // The table's own eye, which is the same technique doing the same thing
        // a metre away rather than a deck away: Little Eye is over Morena's fan
        // and this is what it is sending back. The walk's eye and this one are
        // never up together — one is sent into a room by the dock, the other is
        // put on the table by the game — so they share the corner.
        else if (feed) {
          if (!tableCamera) tableCamera = new THREE.PerspectiveCamera(EYE_FOV, 1, 0.02, 40)
          tableCamera.position.set(feed.at[0], feed.y, feed.at[1])
          tableCamera.lookAt(feed.look[0], feed.lookY, feed.look[1])
          renderSceneInset({ runtime, lens: tableCamera, corner: 'top', measure: size })
        }

        // The owl's film, inset below the eye's feed: the last ten seconds of
        // a bird that is not there any more, played at the speed it flew them.
        if (filmCamera && showing) {
          renderSceneInset({ runtime, lens: filmCamera, corner: 'bottom', measure: size })
        }
        // And the table's own owl, in the same corner and for the same reason:
        // this is not a feed, it is what a bird already filmed being looked at
        // afterwards. It holds still because a recording does, and it stays up
        // once it is up — the hand can end, and footage does not un-happen.
        else if (record) {
          if (!recordCamera) recordCamera = new THREE.PerspectiveCamera(OWL_FOV, 1, 0.02, 40)
          recordCamera.position.set(record.at[0], record.y, record.at[1])
          recordCamera.lookAt(record.look[0], record.lookY, record.look[1])
          renderSceneInset({ runtime, lens: recordCamera, corner: 'bottom', measure: size })
        }
      }

      if (pendingScreenshot) {
        pendingScreenshot()
        pendingScreenshot = null
      }

      /**
       * A second camera, in a box in the corner of the first.
       *
       * Three things ask for one — the eye's live feed, the table's, and the
       * owl's ten seconds of playback — and they differ in nothing but which
       * corner they take. The scissor dance is fiddly enough (clear the depth,
       * not the colour; put `autoClear` back, or the next frame draws the walk
       * into a stale buffer) that three copies of it was two too many.
       */

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
      const stopAnimating = animateVisibleScene({
        container,
        renderer,
        frame: tick,
        onResume: () => {
          // Do not charge the walk for time spent reading below the canvas.
          previous = performance.now()
        },
      })
      ready = true

      cleanup = () => {
        if (hatsuHoldTimer !== null) window.clearTimeout(hatsuHoldTimer)
        stopAnimating()
        resize.dispose()
        stopListening()
        for (const built of Object.values(decks)) if (built) dispose(built)
        for (const held of Object.values(variants)) if (held) dispose(held.built)
        for (const built of stale) dispose(built)
        for (const key of Object.keys(decks)) delete decks[key]
        for (const key of Object.keys(variants)) delete variants[key]
        stale.length = 0
        visible = null
        eyeDeck = null
        eyeCamera = null
        tableCamera = null
        recordCamera = null
        for (const id of Object.keys(solids)) dropSolid(id)
        for (const id of Object.keys(apparitions)) dropApparition(id)
        while (leaving.length) dropLeavingCard(leaving.length - 1)
        for (const material of Object.values(glowMaterials)) material?.dispose()
        for (const material of Object.values(glassMaterials)) material?.dispose()
        for (const material of Object.values(faceMaterials)) material?.dispose()
        for (const texture of Object.values(faceTextures)) texture?.dispose()
        portalDecks.length = 0
        threadGeometry.dispose()
        threadMaterial.dispose()
        gumGeometry.dispose()
        gumMaterial.dispose()
        portals.dispose()
        atmosphere.dispose()
        hatsuEffects.dispose()
        nenAura.dispose(scene)
        // The walk is over: no more footsteps, and the audio graph goes with it.
        stopSteps()
        shells?.geometry.dispose()
        shells = null
        shellMaterial.dispose()
        edgeMaterial.dispose()
        seamMaterial.dispose()
        patternMaterial.dispose()
        material.dispose()
        skylitMaterial.dispose()
        paneMaterial.dispose()
        disposeSceneRuntime(runtime)
      }

      // The page asks for a jump by setting `jumpTo`; honour it and clear it so
      // asking twice for the same space works.
      jump = (spaceId: string, landing?: Vec2, facing?: number) => goTo(spaceId, landing, facing)
      // Sitting down is a jump with a direction. `goTo` puts the visitor where
      // a room's door would leave them, facing the middle of it; a chair says
      // both, so neither is derived here.
      sitDown = (at: Vec2, facing: number) => {
        const plan = ship.plans.get(currentTierId)
        if (!plan) return
        pointer = at
        const space = spaceAt(plan, at)
        ground = floorOf(space ?? entrySpace(plan), plan.tier)
        yaw = facing
        pitch = 0
        camera.position.set(at[0], ground + (seated?.eye ?? EYE_HEIGHT), at[1])
        applyVisibility(space?.id ?? null)
        report()
      }
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
      hatsuNow = useHatsu
    })()

    return () => {
      disposed = true
      setStepsAuraQuiet(false)
      cleanup?.()
    }
  })

  /** Assigned once the scene is live; the effect below waits for it. */
  let jump = $state<((spaceId: string, landing?: Vec2, facing?: number) => void) | null>(null)
  /** The same, for the one arrival that is a chair rather than a doorway. */
  let sitDown = $state<((at: Vec2, facing: number) => void) | null>(null)
  /** The same, for the two things the on-screen buttons stand in for. */
  let take = $state<(() => void) | null>(null)
  let castNow = $state<((hand?: 'first' | 'second' | 'third') => void) | null>(null)
  let hatsuNow = $state<((hand: 'first' | 'second' | 'third') => void) | null>(null)

  function chooseHatsuVariant(index: number) {
    const chosen = Math.max(0, Math.min(index, hatsuVariants.length - 1))
    hatsuVariantIndex = chosen
    lastHatsuVariant = chosen
    hatsuWheelOpen = false
    hatsuNow?.(chosen === 2 ? 'third' : chosen === 1 ? 'second' : 'first')
  }

  function openOrCastHatsu() {
    if (hatsuVariants.length > 1) {
      hatsuVariantIndex = lastHatsuVariant
      hatsuWheelOpen = true
      return
    }
    chooseHatsuVariant(0)
  }
  /** The same, for the one comfort setting the camera holds rather than reads. */
  let relens = $state<((settings: Comfort) => void) | null>(null)

  $effect(() => {
    relens?.($comfort)
  })

  // Taking a seat, once, when the page says there is one to take.
  $effect(() => {
    if (!seated || !sitDown) return
    sitDown(seated.at, seated.heading)
  })

  $effect(() => {
    const requested = jumpTo
    if (!requested || !jump) return
    jump(requested, jumpAt ?? undefined, jumpHeading ?? undefined)
    jumpTo = null
    jumpAt = null
    jumpHeading = null
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
    {#if showNenControls}
      <TourNenControls
        nenState={effectiveNen}
        selectedZone={selectedNenZone}
        onSelectZone={(zone) => (selectedNenZone = zone)}
        aimedObjectId={aimedSolidAt?.id ?? null}
        availability={nenAvailability}
        {hatsuAllowedInZetsu}
        restingAuraShown={$comfort.restingAura}
        onAction={useNen}
        onTen={toggleTen}
        onInteract={() => interactWithNen?.()}
        onHatsu={openOrCastHatsu}
      />
    {/if}
    {#if hatsuWheelOpen}
      <div
        class="pointer-events-auto absolute left-1/2 top-1/2 z-30 grid -translate-x-1/2 -translate-y-1/2 grid-cols-2 gap-2 rounded-full border border-[#8ecae6]/40 bg-[#02070b]/95 p-6 shadow-[0_0_4rem_rgb(76_185_220_/_0.25)] backdrop-blur"
        role="menu"
        aria-label="Variantes du Hatsu"
      >
        {#each hatsuVariants as variant, index (index)}
          <button
            type="button"
            role="menuitem"
            class:active={hatsuVariantIndex === index}
            class="min-w-28 rounded border border-white/20 px-3 py-2 text-xs text-white/75 transition"
            onclick={() => chooseHatsuVariant(index)}><kbd>{index + 1}</kbd> · {variant}</button
          >
        {/each}
      </div>
    {/if}
  {/if}

  <!-- The touchscreen's keyboard: a stick to walk with, and buttons for the
       actions a phone has no keys for. Everything here is
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
      {#if aiming && hands}
        <!-- Two techniques, so two buttons: a phone has no Hatsu wheel, and
             which of the two pages is being cast is the whole of the ability. -->
        {#each [{ hand: 'first' as const, name: hands.first }, { hand: 'second' as const, name: hands.second }] as page (page.hand)}
          <button
            type="button"
            onclick={() => castNow?.(page.hand)}
            aria-label={`${touchLabels.cast} · ${page.name}`}
            class="max-w-[13rem] touch-none truncate rounded border bg-[#050505]/90 px-3 py-2 text-xs"
            style:border-color={auraColour
              ? `color-mix(in srgb, ${auraColour} 70%, transparent)`
              : ''}
            style:color={auraColour ?? '#FFFFF0'}
          >
            {page.name}
          </button>
        {/each}
      {:else if aiming && tunes}
        <!-- And three, for the instrument: a phone has no Hatsu wheel, so
             the three airs are three buttons in the order the keys play them. -->
        {#each [{ hand: 'first' as const, name: tunes.first }, { hand: 'second' as const, name: tunes.second }, { hand: 'third' as const, name: tunes.third }] as air (air.hand)}
          <button
            type="button"
            onclick={() => castNow?.(air.hand)}
            aria-label={`${touchLabels.cast} · ${air.name}`}
            class="max-w-[13rem] touch-none truncate rounded border bg-[#050505]/90 px-3 py-2 text-xs"
            style:border-color={auraColour
              ? `color-mix(in srgb, ${auraColour} 70%, transparent)`
              : ''}
            style:color={auraColour ?? '#FFFFF0'}
          >
            {air.name}
          </button>
        {/each}
      {:else if aiming && twoHanded}
        <!-- And two for the two hands, which need no names: the marks are what
             the technique puts on, and a phone draws them as the walk draws them
             over the things themselves. -->
        {#each [{ hand: 'first' as const, glyph: '☀' }, { hand: 'second' as const, glyph: '☾' }] as mark (mark.hand)}
          <button
            type="button"
            onclick={() => castNow?.(mark.hand)}
            aria-label={`${touchLabels.cast} · ${mark.glyph}`}
            class="touch-none rounded border bg-[#050505]/90 px-4 py-2 text-sm"
            style:border-color={auraColour
              ? `color-mix(in srgb, ${auraColour} 70%, transparent)`
              : ''}
            style:color={auraColour ?? '#FFFFF0'}
          >
            {mark.glyph}
          </button>
        {/each}
      {:else if aiming}
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
