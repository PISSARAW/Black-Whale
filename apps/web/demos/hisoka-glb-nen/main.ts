import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { FIGHT_NEN_ZONES, nenStatus, nenTacticalState } from '../../src/lib/fighting/nen'
import { weaponUsesShu } from '../../src/lib/fighting/nenAdvanced'
import { auraLayersFor, type AuraSight } from '../../src/lib/tour/auraSight'
import { mountSkinnedAura } from './aura'
import { createNenTrial, RYU_SWITCH_SECONDS, TRIALS } from './techniques'

const view = document.querySelector<HTMLElement>('#view')!
const status = document.querySelector<HTMLElement>('#status')!
const controls = document.querySelector<HTMLElement>('#controls')!
const ZONES = { head: 'tête', torso: 'torse', hands: 'mains', feet: 'pieds' }

function makeCard() {
  const root = new THREE.Group()
  const paper = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.135, 0.004),
    new THREE.MeshBasicMaterial({ color: 0xf5ebda }),
  )
  root.add(paper)
  const ink = new THREE.Mesh(
    new THREE.PlaneGeometry(0.035, 0.035).rotateZ(Math.PI / 4),
    new THREE.MeshBasicMaterial({ color: 0xa31749 }),
  )
  ink.position.z = 0.0024
  root.add(ink)
  const border = new THREE.Shape()
  border.moveTo(-0.054, -0.076)
  border.lineTo(0.054, -0.076)
  border.lineTo(0.054, 0.076)
  border.lineTo(-0.054, 0.076)
  border.closePath()
  const opening = new THREE.Path()
  opening.moveTo(-0.043, -0.066)
  opening.lineTo(-0.043, 0.066)
  opening.lineTo(0.043, 0.066)
  opening.lineTo(0.043, -0.066)
  opening.closePath()
  border.holes.push(opening)
  const coat = new THREE.Mesh(
    new THREE.ShapeGeometry(border),
    new THREE.MeshBasicMaterial({ color: 0xdf7aff }),
  )
  coat.position.z = 0.003
  root.add(coat)
  return { root, coat }
}

function aim(bone: THREE.Bone, child: THREE.Bone, target: THREE.Vector3) {
  const origin = bone.getWorldPosition(new THREE.Vector3())
  const from = child.getWorldPosition(new THREE.Vector3()).sub(origin).normalize()
  const to = target.clone().sub(origin).normalize()
  const correction = new THREE.Quaternion().setFromUnitVectors(from, to)
  const world = bone.getWorldQuaternion(new THREE.Quaternion()).premultiply(correction)
  bone.quaternion.copy(
    bone.parent!.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(world),
  )
  bone.updateMatrixWorld(true)
}

async function main() {
  const { scene: actor } = await new GLTFLoader().loadAsync(
    new URL('../../../../Hisoka.glb', import.meta.url).href,
  )
  let body: THREE.SkinnedMesh | undefined
  actor.traverse((node) => {
    if ((node as THREE.SkinnedMesh).isSkinnedMesh) body = node as THREE.SkinnedMesh
  })
  if (!body) throw Error('Le GLB ne contient pas de maillage riggé.')
  const applyAura = mountSkinnedAura(body)
  const bones = body.skeleton.bones
  const joint = (suffix: string) => {
    const bone = bones.find((node) => node.name.endsWith(suffix))
    if (!bone) throw Error(`Joint Mixamo absent : ${suffix}`)
    return bone
  }
  const head = joint('Head')
  const chest = joint('Spine2')
  const hand = joint('RightHand')
  const arms = (['Right', 'Left'] as const).map((side) => ({
    shoulder: joint(`${side}Arm`),
    elbow: joint(`${side}ForeArm`),
    wrist: joint(`${side}Hand`),
    sign: side === 'Right' ? -1 : 1,
  }))
  const rest = bones.map((bone) => bone.quaternion.clone())

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x201c32)
  const key = new THREE.DirectionalLight(0xfff8ee, 2.25)
  key.position.set(-3, 4, 5)
  const fill = new THREE.DirectionalLight(0xbc9bff, 1.3)
  fill.position.set(3, 2, -4)
  scene.add(actor, key, fill, new THREE.HemisphereLight(0xdde2ff, 0x645777, 1.55))
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(1.8, 64),
    new THREE.MeshBasicMaterial({ color: 0x171524 }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.012
  scene.add(floor)

  const card = makeCard()
  scene.add(card.root)
  const eyeMaterial = new THREE.MeshBasicMaterial({
    color: 0xf0aaff,
    opacity: 0.62,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const eyes = [-1, 1].map((side) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 8), eyeMaterial)
    eye.scale.set(0.015, 0.005, 0.008)
    eye.position.set(side * 0.028, 0.113, 0.112)
    head.add(eye)
    return eye
  })

  const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 30)
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
  view.append(renderer.domElement)
  const size = () => {
    camera.aspect = view.clientWidth / view.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(view.clientWidth, view.clientHeight)
  }
  new ResizeObserver(size).observe(view)
  size()
  let selected = 0
  let trial = createNenTrial(selected)
  let started = performance.now()
  let sight: AuraSight = 'sight'
  let automatic = true

  const buttons = TRIALS.map(({ label }, i) => {
    const button = document.createElement('button')
    button.textContent = label
    button.addEventListener('click', () => select(i))
    controls.append(button)
    return button
  })
  const gyoObserver = document.createElement('button')
  gyoObserver.textContent = 'Gyo observateur'
  gyoObserver.setAttribute('aria-pressed', 'false')
  gyoObserver.addEventListener('click', () => observe(sight === 'sight' ? 'gyo' : 'sight'))
  controls.append(gyoObserver)

  function select(i: number) {
    selected = i
    trial = createNenTrial(i)
    started = performance.now()
    buttons.forEach((button, index) => button.setAttribute('aria-pressed', String(i === index)))
  }
  function observe(next: AuraSight) {
    sight = next
    gyoObserver.setAttribute('aria-pressed', String(next === 'gyo'))
  }
  function render(seconds: number) {
    const fighter = trial(seconds)
    const id = TRIALS[selected].id
    const { nen } = fighter
    const close = id === 'shu' || id === 'gyo' || id === 'ko'
    const height = id === 'gyo' ? 1.49 : close ? 1.2 : 0.85
    const range = id === 'gyo' ? 1.06 : close ? 2.05 : 3.48
    const angle = -0.29 + Math.sin(seconds * 0.72) * 0.29
    camera.position.set(range * Math.sin(angle), height + 0.04, range * Math.cos(angle))
    camera.lookAt(0, height, 0)
    bones.forEach((bone, i) => bone.quaternion.copy(rest[i]))
    chest.rotateX(Math.sin(seconds * 2.5) * 0.025)
    head.rotateY(Math.sin(seconds * 1.4) * 0.13)
    actor.updateMatrixWorld(true)
    const guard =
      id === 'ryu-transfer'
        ? 1 - THREE.MathUtils.smoothstep(seconds, RYU_SWITCH_SECONDS, RYU_SWITCH_SECONDS + 0.3)
        : Number(id === 'ken' || id === 'ko' || id === 'ryu-hands')
    arms.forEach(({ shoulder, elbow, wrist, sign }) => {
      const holdsCard = id === 'shu' && sign === -1
      const raised = holdsCard ? 1 : guard
      aim(
        shoulder,
        elbow,
        new THREE.Vector3(sign * 0.27, 0.98 + 0.14 * raised, 0.04 + 0.2 * raised),
      )
      aim(
        elbow,
        wrist,
        new THREE.Vector3(
          sign * (0.22 - 0.03 * raised),
          0.73 + 0.65 * raised,
          0.085 + 0.335 * raised,
        ),
      )
    })
    actor.updateMatrixWorld(true)
    const bodyAura = applyAura(fighter, sight, seconds)
    const visible = auraLayersFor(nen, sight).light
    eyes.forEach((eye) => (eye.visible = nen.gyo && visible))
    card.root.visible = id === 'shu' || (id === 'ren' && weaponUsesShu(fighter))
    card.coat.visible = weaponUsesShu(fighter) && visible
    card.root.position.copy(hand.localToWorld(new THREE.Vector3(0, 0.125, 0)))
    card.root.quaternion.copy(camera.quaternion)
    card.root.rotateZ(Math.sin(seconds * 1.8) * 0.18 - 0.2)
    renderer.render(scene, camera)
    const tactical = nenTacticalState(fighter)
    const distribution = FIGHT_NEN_ZONES.filter((zone) => tactical.distribution[zone] > 0).map(
      (zone) => `${ZONES[zone]} ${Math.round(tactical.distribution[zone] * 100)} %`,
    )
    const line = [
      nenStatus(fighter).join(' · '),
      ...distribution,
      `Réserve ${Math.round(fighter.aura)} %`,
      ...(nen.in ? [visible ? 'visible sous Gyo' : 'aura dissimulée'] : []),
    ].join('  |  ')
    if (status.textContent !== line) status.textContent = line
    return {
      nen,
      tactical,
      visible: bodyAura.visible,
      shares: Array.from(bodyAura.shares),
      card: card.coat.visible,
    }
  }
  select(0)
  Object.assign(window, {
    hisokaNenTrial: {
      frame(index: number, seconds: number, nextSight: AuraSight = 'sight') {
        automatic = false
        if (selected !== index || seconds === 0) select(index)
        observe(nextSight)
        return render(seconds)
      },
    },
  })
  renderer.setAnimationLoop(() => {
    if (automatic) render((performance.now() - started) / 1000)
  })
}

void main().catch((error: unknown) => {
  status.textContent = error instanceof Error ? error.message : String(error)
  console.error(error)
})
