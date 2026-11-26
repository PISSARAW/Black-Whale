import type * as Three from 'three'
import { buildTierMeshSteps, type MeshGroup } from './mesh'
import { deckSurfacePlan } from './deckSurfacePlan'
import { finishDeckSteps } from './deckBuildSteps'
import { walkedPlan, type TourWorld } from './hatsu'
import { dustOf, type Dust } from './dust'
import type { Ship } from './blueprint'
import { lampAirOf } from './lampAir'
import { conditionedRoomSurface } from './surfaceCondition'
import { tierAttributesOf, type TierAttributes } from './tierAttributes'
import { bindFittingFlicker } from './fittingFlicker'
import { buildBanquetDetails, disposeBanquetDetails } from './banquetView'
import { buildRoyalSalonDetails } from './royalSalonView'
import { buildDiningHallDetailSteps } from './diningHallView'
import { buildPrisonDetails } from './prisonView'
import { buildCasinoDetails } from './casinoView'
import { buildBurialChamberDetails } from './burialChamberView'
import { buildQueenApartmentDetails } from './queenApartmentView'
import { buildQueenUnmaDetails } from './queenUnmaView'
import { buildBenjaminRoomDetails } from './benjaminRoomView'
import { buildCamillaRoomDetails } from './camillaView'
import { buildTserriednichRoomDetails } from './tserriednichRoomView'
import { buildWobleDetails } from './wobleView'
import { buildMarayamDetails } from './marayamView'
import { buildMomozeDetails } from './momozeView'
import { buildFugetsuDetails } from './fugetsuView'
import { buildKachoDetails } from './kachoView'
import { buildHalkenburgDetails } from './halkenburgView'
import { buildSalesaleDetails } from './salesaleView'
import { buildLuzurusDetails } from './luzurusView'
import { buildTysonDetails } from './tysonView'
import { buildTubeppaDetails } from './tubeppaView'
import { buildZhangLeiDetails } from './zhangLeiView'
import { buildVvipRecreationDetails } from './vvipRecreationView'
import { buildPrincesQuartersDetails } from './princesQuartersView'
import { buildPrinceApartmentEnvelope } from './princeApartmentEnvelope'
import { buildHeillyHideoutDetails } from './heillyHideoutView'
import { buildJusticeBureauDetails } from './justiceBureauView'
import { buildPoliceStationDetails } from './policeStationView'
import { buildChaROfficeDetails } from './chaROfficeView'
import { buildHospitalDetails } from './hospitalView'
import { buildRoyalArmyConferenceDetails } from './royalArmyConferenceView'
import { buildCineplexDetails } from './cineplexView'
import { buildPodCabinDetails } from './podCabinView'
import { buildCorridorWallDetailSteps } from './corridorWallView'
import { buildDoorDetails } from './doorView'
import { buildSupremeCourtDetails } from './supremeCourtView'
import { buildScreeningRoomDetails } from './screeningRoomView'
import { buildHangarEntranceDetails } from './hangarEntranceView'
import { buildWarehouseDetailSteps } from './warehouseView'
import { buildHullSuspensionDetails } from './hullSuspensionView'
import { buildRoom3101Details } from './room3101View'
import { buildSourceBoundInteriorDetails } from './sourceBoundInteriorView'

export interface TierRoomView {
  spaceId: string
  mesh: Three.Mesh
  edges: Three.LineSegments
  seams: Three.LineSegments
  patterns: Three.LineSegments
  fittings: Three.Mesh
  /**
   * The window glass, in the two rooms that have any and nowhere else.
   *
   * `null` for 312 of the 314 spaces rather than an empty mesh: the glass is a
   * handful of triangles in two rooms, and an object per room to draw none of
   * them would be six hundred draw calls a deck to say nothing.
   */
  panes: Three.Mesh | null
  motes: Three.Points | null
  dust: Dust | null
  details: Three.Group | null
  doors: Three.Group | null
}
export interface BuiltTierView {
  root: Three.Group
  rooms: TierRoomView[]
  lampAir: Three.Points | null
}
export interface TierMaterials {
  surface: Three.Material
  edge: Three.Material
  seam: Three.Material
  pattern: Three.Material
  fitting: Three.Material
  /**
   * The glass, whose colour is the hour of the voyage.
   *
   * Shared across every deck the visit builds rather than made per deck, and
   * that is the point: the walk sets one colour on it when the projected event
   * changes, and a deck built five minutes ago in the cache is already showing
   * the right sky when the visitor takes the stairs back onto it.
   */
  pane: Three.Material
  /**
   * The surface material of a room with a window in it: the deck's own Lambert
   * with the daylight pool hung on it — see `$lib/tour/skyPool`.
   *
   * Two rooms of 314 take it. Everything else takes `surface`, which has no
   * `aSky` attribute to read and no program of its own to compile.
   */
  skylit: Three.Material
  dust: Three.PointsMaterial
  lampAir: Three.ShaderMaterial | null
}
interface TierBuild {
  ship: Ship
  world: TourWorld
  tierId: string
  reveal: boolean
  /** Optional room dressing selected by a mode layered over the shared tour. */
  detailMode?: RoomDetailMode
  /**
   * What share of a room's motes to hang, from the quality palier.
   *
   * A share rather than a switch: the dust is the only thing that makes a
   * six-thousand-square-metre hall read as a volume at all, and the screen that
   * needs it most is the small one. See `$lib/tour/quality`.
   */
  dustScale?: number
}
/** The deck a room is being cut out of, for the parts that are not its buffers. */
interface DeckContext {
  ship: Ship
  tierId: string
  reveal: boolean
  dustScale: number
}

export type RoomDetailMode = 'default' | 'morena-game'

interface GeometrySlice {
  position: Three.BufferAttribute
  start: number
  count: number
  centre: Three.Vector3
  radius: number
}

/**
 * The deck's buffers, uploaded once and pointed at by every room of it.
 *
 * three.js keys its GPU buffers by the `BufferAttribute` object, so making
 * these once and handing the same ones to three hundred geometries is what
 * makes a deck one upload rather than three hundred.
 */
export interface RoomDetailOptions {
  THREE: typeof Three
  plan: ReturnType<typeof walkedPlan>
  spaceId: string
  reveal: boolean
  detailMode?: RoomDetailMode
}

type RoomDetailBuilder = (
  options: RoomDetailOptions,
) => Three.Group | null | Generator<void, Three.Group | null>

const DETAIL_BUILDERS: readonly RoomDetailBuilder[] = [
  buildBanquetDetails,
  buildRoyalSalonDetails,
  buildDiningHallDetailSteps,
  buildPrisonDetails,
  buildCasinoDetails,
  buildBurialChamberDetails,
  buildQueenUnmaDetails,
  buildQueenApartmentDetails,
  buildBenjaminRoomDetails,
  buildCamillaRoomDetails,
  buildTserriednichRoomDetails,
  buildZhangLeiDetails,
  buildTubeppaDetails,
  buildTysonDetails,
  buildLuzurusDetails,
  buildSalesaleDetails,
  buildHalkenburgDetails,
  buildKachoDetails,
  buildFugetsuDetails,
  buildMomozeDetails,
  buildMarayamDetails,
  buildWobleDetails,
  buildPrinceApartmentEnvelope,
  buildVvipRecreationDetails,
  buildPrincesQuartersDetails,
  buildHeillyHideoutDetails,
  buildJusticeBureauDetails,
  buildPoliceStationDetails,
  buildChaROfficeDetails,
  buildHospitalDetails,
  buildRoyalArmyConferenceDetails,
  buildCineplexDetails,
  buildPodCabinDetails,
  buildCorridorWallDetailSteps,
  buildSupremeCourtDetails,
  buildScreeningRoomDetails,
  buildHangarEntranceDetails,
  buildWarehouseDetailSteps,
  buildHullSuspensionDetails,
  buildRoom3101Details,
  buildSourceBoundInteriorDetails,
]

/** Builds and disposes the shared-buffer visual representation of a deck. */
function* roomDetails(options: RoomDetailOptions): Generator<void, Three.Group | null> {
  for (const builder of DETAIL_BUILDERS) {
    const prepared = builder(options)
    const group = prepared && 'next' in prepared ? yield* prepared : prepared
    if (group) return group
  }
  return null
}

export class TierView {
  constructor(
    private readonly THREE: typeof Three,
    private readonly materials: TierMaterials,
  ) {}

  build(options: TierBuild): BuiltTierView {
    return finishDeckSteps(this.buildSteps(options))
  }

  *buildSteps({
    ship,
    world,
    tierId,
    reveal,
    detailMode = 'default',
    dustScale = 1,
  }: TierBuild): Generator<void, BuiltTierView> {
    const plan = walkedPlan(ship, world, tierId)
    const detailedPlan = deckSurfacePlan(plan, reveal)
    yield
    const mesh = yield* buildTierMeshSteps(detailedPlan, {
      reveal,
    })
    const shared = yield* tierAttributesOf({
      THREE: this.THREE,
      mesh,
      plan: detailedPlan,
      surface: this.materials.surface,
      fitting: this.materials.fitting,
    })
    const root = new this.THREE.Group()
    const rooms: TierRoomView[] = []

    let complete = false
    try {
      for (const group of mesh.groups) {
        yield
        const room = this.room(group, shared, { ship, tierId, reveal, dustScale })
        rooms.push(room)
        const detailsOptions = {
          THREE: this.THREE,
          plan,
          spaceId: group.spaceId,
          reveal,
          detailMode,
        }
        room.details = yield* roomDetails(detailsOptions)
        if (room.details) room.mesh.add(room.details)
        room.doors = buildDoorDetails(detailsOptions)
        if (room.doors) room.mesh.add(room.doors)
        root.add(room.mesh, room.edges, room.seams, room.patterns, room.fittings)
        if (room.panes) root.add(room.panes)
        if (room.motes) root.add(room.motes)
      }
      yield
      const lampAir = reveal
        ? null
        : lampAirOf({
            THREE: this.THREE,
            mesh,
            plan: detailedPlan,
            material: this.materials.lampAir,
          })
      if (lampAir) root.add(lampAir)
      complete = true
      return { root, rooms, lampAir }
    } finally {
      if (!complete) this.dispose({ root, rooms, lampAir: null })
    }
  }

  /**
   * One room of the deck: a draw range into the shared buffers, plus whatever
   * of the other drawable kinds it happens to hold.
   *
   * The deck is still one upload — every room's geometry points at the same
   * `BufferAttribute`s and differs only in its range and in the bounding sphere
   * `buildTierMesh` measured for it — but it is no longer one thing to draw,
   * which is what lets `visibleSpaces` switch a room off.
   */
  private room(group: MeshGroup, shared: TierAttributes, deck: DeckContext): TierRoomView {
    const { ship, tierId, reveal, dustScale } = deck
    const centre = new this.THREE.Vector3(group.centre[0], group.centre[1], group.centre[2])
    const radius = group.radius
    const slice = (position: Three.BufferAttribute, start: number, count: number) => ({
      position,
      start,
      count,
      centre,
      radius,
    })

    const geometry = this.geometry(slice(shared.position, group.start, group.count))
    geometry.setAttribute('normal', shared.normal)
    geometry.setAttribute('color', shared.color)
    geometry.setAttribute('aSheen', shared.sheen)
    if (shared.traffic) geometry.setAttribute('aTraffic', shared.traffic)
    // A room has a window exactly when it draws glass, so the same test picks
    // the attribute and the patched material — and picks neither under the
    // reveal, where the bake is off and there is no pool to put back.
    const glazed = group.paneCount > 0 && shared.sky !== null
    if (glazed) geometry.setAttribute('aSky', shared.sky!)

    const space = ship.spaces.get(group.spaceId)
    const plan = ship.plans.get(tierId)
    const dust = space && plan && !reveal ? dustOf(space, plan.tier, dustScale) : null

    const surfaceMaterial = glazed ? this.materials.skylit : this.materials.surface
    const roomMesh = conditionedRoomSurface({
      THREE: this.THREE,
      geometry,
      material: surfaceMaterial,
      space,
      plan,
      reveal,
    })

    const fittings = this.lit(
      slice(shared.fitting, group.fittingStart, group.fittingCount),
      shared.fittingColor,
      this.materials.fitting,
    )
    if (shared.fittingFlicker) {
      fittings.geometry.setAttribute('aFlicker', shared.fittingFlicker)
      bindFittingFlicker(fittings, this.materials.fitting)
    }

    return {
      spaceId: group.spaceId,
      mesh: roomMesh,
      edges: new this.THREE.LineSegments(
        this.geometry(slice(shared.edge, group.edgeStart, group.edgeCount)),
        this.materials.edge,
      ),
      seams: new this.THREE.LineSegments(
        this.geometry(slice(shared.seam, group.seamStart, group.seamCount)),
        this.materials.seam,
      ),
      patterns: new this.THREE.LineSegments(
        this.geometry(slice(shared.pattern, group.patternStart, group.patternCount)),
        this.materials.pattern,
      ),
      fittings,
      panes: group.paneCount
        ? this.lit(
            slice(shared.pane, group.paneStart, group.paneCount),
            shared.paneColor,
            this.materials.pane,
          )
        : null,
      motes: this.motes(dust),
      dust,
      details: null,
      doors: null,
    }
  }

  /**
   * One of the two surfaces on the deck that are sources: the ceiling fittings,
   * and the glass. Both carry their value in a colour attribute and neither is
   * allowed to be lit — see the materials in `TourScene`.
   */
  private lit(
    slice: GeometrySlice,
    colour: Three.BufferAttribute,
    material: Three.Material,
  ): Three.Mesh {
    const geometry = this.geometry(slice)
    geometry.setAttribute('color', colour)
    return new this.THREE.Mesh(geometry, material)
  }

  /** The motes of one room, where the room is big enough to hang any. */
  private motes(dust: Dust | null): Three.Points | null {
    if (!dust) return null
    const geometry = new this.THREE.BufferGeometry()
    geometry.setAttribute('position', new this.THREE.BufferAttribute(dust.positions, 3))
    geometry.boundingSphere = new this.THREE.Sphere(
      new this.THREE.Vector3(dust.centre[0], dust.centre[1], dust.centre[2]),
      dust.radius,
    )
    geometry.attributes.position.needsUpdate = true
    return new this.THREE.Points(geometry, this.materials.dust)
  }

  dispose(built: BuiltTierView): void {
    for (const room of built.rooms) {
      room.mesh.geometry.dispose()
      room.edges.geometry.dispose()
      room.seams.geometry.dispose()
      room.patterns.geometry.dispose()
      room.fittings.geometry.dispose()
      room.panes?.geometry.dispose()
      room.motes?.geometry.dispose()
      if (room.details) disposeBanquetDetails(room.details)
      if (room.doors) disposeBanquetDetails(room.doors)
    }
    built.lampAir?.geometry.dispose()
  }

  private geometry({ position, start, count, centre, radius }: GeometrySlice) {
    const geometry = new this.THREE.BufferGeometry()
    geometry.setAttribute('position', position)
    geometry.setDrawRange(start, count)
    geometry.boundingSphere = new this.THREE.Sphere(centre.clone(), radius)
    return geometry
  }
}
