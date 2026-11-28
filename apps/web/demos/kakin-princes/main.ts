import * as THREE from 'three'
import { floorOf, theShip } from '../../src/lib/tour/blueprint'
import { EMPTY_WORLD } from '../../src/lib/tour/cast/worldPieces'
import { createDeckMaterials } from '../../src/lib/tour/deckMaterials'
import { qualityProfile } from '../../src/lib/tour/quality'
import { TierView } from '../../src/lib/tour/TierView'
import { buildActor, buildBeast } from './cast'
import { roomId, shots, type Actor, type Guardian, type Point } from './shots'
import { portraitTitle, titleCard, verticalTitle } from './titles'

const vertical = new URLSearchParams(location.search).has('vertical')
const width = vertical ? 810 : 1440
const height = vertical ? 1440 : 810
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
renderer.setSize(width, height)
renderer.setClearColor(0x171417)
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.23
const output = document.createElement('canvas')
output.width = width
output.height = height
output.style.cssText = 'width:100vw;height:100vh;object-fit:contain'
document.body.append(output)
const ctx = output.getContext('2d', { alpha: false })!
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(42, width / height, 0.065, 65)
const ship = theShip()
const materials = createDeckMaterials(THREE, qualityProfile({ tier: 'low', coarse: false }))
const deck = new TierView(THREE, materials)
const hemi = new THREE.HemisphereLight(0xfff1dc, 0x625566, 1.02)
const key = new THREE.DirectionalLight(0xffead7, 1.23)
const fill = new THREE.DirectionalLight(0xc4d6fa, 0.52)
scene.add(hemi, key, fill, key.target, fill.target)

const withoutYou: Actor = {
  id: 'prince-kacho',
  position: [-1.42, 0.3, 7.32],
  heading: 0.23,
  royalCostume: 'twins-banquet',
  gesture: 'door-reveal',
}
const fugetsuAtTheDoor: Actor = {
  id: 'prince-fugetsu',
  position: vertical ? [-0.72, 0.1, 7.68] : [-0.625, 0.12, 7.86],
  heading: -0.92,
  royalCostume: 'twins-banquet',
}
const mobileActors: Partial<Record<number, Point>> = {
  3: [-3.02, 0, 1.13],
  4: [6.43, 0, 1.96],
}
const mobileGuardians: Partial<Record<number, Pick<Guardian, 'position' | 'size'>>> = {
  2: { position: [2.12, 1.95, -2.61], size: 0.88 },
  3: { position: [-1.11, 0, 0.22], size: 0.86 },
  4: { position: [4.85, 0.92, 1.39], size: 0.89 },
}

let active: ReturnType<typeof stage> | undefined

function stage(index: number, reveal: boolean) {
  const roomIndex = reveal ? 10 : index
  const shot = shots[roomIndex]
  const space = ship.spaces.get(roomId(roomIndex, shot))!
  const plan = ship.plans.get(space.tierId)!
  const floor = floorOf(space, plan.tier)
  const built = deck.build({
    ship,
    world: EMPTY_WORLD,
    tierId: plan.tier.id,
    reveal: false,
    dustScale: 0,
  })
  for (const room of built.rooms) {
    const inFrame = room.spaceId === space.id || room.spaceId.includes(`room-${1001 + roomIndex}-`)
    room.mesh.visible = inFrame
    room.edges.visible = false
    room.seams.visible = false
    room.patterns.visible = inFrame
    room.fittings.visible = inFrame
    if (room.panes) room.panes.visible = inFrame
  }
  if (built.lampAir) built.lampAir.visible = false
  scene.add(built.root)
  const actors = (reveal ? [withoutYou, fugetsuAtTheDoor] : shot.actors).map((actor) => {
    const position = vertical && !reveal ? (mobileActors[index] ?? actor.position) : actor.position
    return buildActor({ ...actor, position }, space.id, floor)
  })
  const beasts = (reveal ? [] : (shot.beasts ?? [])).map((beast) =>
    buildBeast({ ...beast, ...(vertical ? mobileGuardians[index] : undefined) }, space.id, floor),
  )
  const door = reveal
    ? buildBeast(
        {
          kind: 'portal',
          position: [-1.35, 1.27, 7.46],
          size: 1.78,
        },
        space.id,
        floor,
      )
    : null
  const leaf = door?.root.getObjectByName('magical-worm-door-leaf')
  if (leaf) {
    const halfWidth = leaf.position.x
    leaf.position.x = -halfWidth
    for (const part of leaf.children) part.position.x += halfWidth * 2
  }
  const cast = new THREE.Group()
  cast.add(...[...actors, ...beasts].map((item) => item.root))
  if (door) cast.add(door.root)
  scene.add(cast)
  return { index, reveal, floor, built, cast, actors, beasts, leaf }
}

function point([x, y, z]: Point, floor: number) {
  return new THREE.Vector3(x, y + floor, z)
}

function focusPortrait(index: number, from: THREE.Vector3, target: THREE.Vector3) {
  const { actors } = active!
  const first = actors[0]
  const head = first.head.getWorldPosition(new THREE.Vector3())
  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(first.root.quaternion)
  const side = new THREE.Vector3(forward.z, 0, -forward.x)
  const isChild = index === 12
  const isWoble = index === 13
  const distance = isChild ? 1.55 : isWoble ? 2.2 : 1.79
  if (isWoble) head.lerp(actors[1].head.getWorldPosition(new THREE.Vector3()), 0.42)
  from
    .copy(head)
    .addScaledVector(forward, distance)
    .addScaledVector(side, index === 4 ? -0.46 : 0.24)
  from.y += isChild ? 0.59 : 0.05
  target.copy(head)
  target.y -= isChild ? 0.11 : 0.18
  if (index === 7) {
    from.addScaledVector(forward, 0.46).addScaledVector(side, 0.42)
    target.y -= 0.25
  }
  if (index === 10) {
    from.copy(head).addScaledVector(forward, 1.48).addScaledVector(side, 0.45)
    from.y += 0.19
  }
}

function verticalFov(view: {
  index: number
  close: boolean
  guardianKacho: boolean
  wide: number
}) {
  if (view.guardianKacho) return 42
  if (view.index === 2) return 54
  if (view.close) return view.index === 13 ? 49 : 43
  return view.wide + 17
}

function film(index: number, progress: number, seconds: number) {
  if (index === -1) {
    titleCard(ctx, progress)
    return
  }

  const guardianKacho = index === 9 && progress >= 0.55
  if (active?.index !== index || active.reveal !== guardianKacho) {
    if (active) {
      scene.remove(active.cast, active.built.root)
      deck.dispose(active.built)
    }
    active = stage(index, guardianKacho)
  }

  const shot = shots[index]
  const { floor, actors, beasts, leaf } = active
  const from = point(shot.camera, floor)
  const target = point(shot.target, floor)
  const amount = guardianKacho ? (progress - 0.55) / 0.45 : progress
  const direction = target.clone().sub(from)
  from.addScaledVector(direction, 0.072 * amount)
  for (const actor of actors) actor.update(seconds)
  for (const beast of beasts) beast.update(seconds)
  const close = index === 9 ? progress >= 0.34 && !guardianKacho : progress >= 0.59
  if (close) {
    focusPortrait(index, from, target)
    from.lerp(target, Math.max(0, progress - 0.59) * 0.18)
  }
  if (vertical && index === 3 && !close) target.x -= 0.44
  if (vertical && index === 2) {
    target.copy(point([2.88, 1.66, -2.55], floor))
    from.copy(point([6.0, 1.66, -1.3], floor))
    from.lerp(target, 0.05 * progress)
  }
  if (guardianKacho) {
    target.copy(point([-1.23, 1.97, 7.34], floor))
    from.copy(point([-0.71, 1.64, 9.1], floor))
    if (vertical) target.copy(point([-1.15, 1.86, 7.34], floor))
    from.lerp(target, amount * 0.025)
    if (leaf) leaf.rotation.y = (vertical ? -0.59 : -0.71) - 0.11 * Math.min(1, amount * 12)
  }
  camera.position.copy(from)
  camera.lookAt(target)
  camera.fov = guardianKacho ? 23 : close ? 35 : (shot.fov ?? 42)
  if (vertical) camera.fov = verticalFov({ index, close, guardianKacho, wide: shot.fov ?? 42 })
  camera.updateProjectionMatrix()
  key.position.copy(from).add(new THREE.Vector3(-3, 5, 0))
  fill.position.copy(target).add(new THREE.Vector3(4, 3, -3))
  key.target.position.copy(target)
  fill.target.position.copy(target)
  renderer.render(scene, camera)
  ctx.filter = 'saturate(54%) contrast(111%)'
  ctx.drawImage(renderer.domElement, 0, 0)
  ctx.filter = 'none'
  if (vertical) {
    verticalTitle(ctx, { shot, index, guardianKacho, opening: index === 2 && progress < 0.48 })
  } else {
    portraitTitle(ctx, { shot, index, guardianKacho })
  }
  if (index !== shots.length - 1 || progress < 0.86) return
  ctx.fillStyle = `rgba(15,12,15,${Math.min(1, (progress - 0.86) / 0.14)})`
  ctx.fillRect(0, 0, width, height)
}

const lengths = [2.5, 3.7, 3.7, 4.3, 3.7, 3.7, 3.7, 3.7, 3.8, 3.8, 6.2, 4.2, 3.7, 4, 4.5]
Object.assign(window, {
  kakinFilm: {
    lengths,
    render(index: number, progress: number, seconds: number) {
      film(index, progress, seconds)
      return output.toDataURL('image/jpeg', 0.92).split(',')[1]
    },
  },
})

film(-1, 1, 0)
